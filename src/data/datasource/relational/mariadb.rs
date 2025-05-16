use std::any::Any;
use std::collections::HashMap;
use std::error::Error;
use sqlx::{MySql, Pool, Row};
use sqlx::mysql::{MySqlRow, MySqlPoolOptions};
use tokio::runtime::Runtime;
use serde_json::Value;
use crate::api::common::api_entity::ApiEntity;
use crate::config::specific::database_config::DatabaseConfig;
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::base::{DataSource, DatabaseCommon, DataSourceError};
use crate::data::datasource::relational::base::{RelationalSource, TableMapping, create_table_mapping};
use serde::{Serialize, de::DeserializeOwned};

/// MariaDB datasource implementation
pub struct MariaDbDatasource {
    pub config: DatabaseConfig,
    pool: Option<Pool<MySql>>,
    entity_mappings: HashMap<String, TableMapping>,
    runtime: Runtime,
}

impl MariaDbDatasource {
    /// Creates a new MariaDbDatasource instance
    pub fn new(config: &DatabaseConfig) -> Self {
        MariaDbDatasource {
            config: config.clone(),
            pool: None,
            entity_mappings: HashMap::new(),
            runtime: Runtime::new().unwrap(),
        }
    }
    
    /// Normalize entity name to ensure consistent lookup across all operations
    fn normalize_entity_name(&self, name: &str) -> String {
        // Normalize by converting to lowercase and trimming whitespace
        name.to_lowercase().trim().to_string()
    }
    
    /// Find mapping with flexible lookup strategy
    /// This is the centralized method to look up entity mappings with fallback options
    fn find_entity_mapping(&self, entity_name: &str) -> Option<&TableMapping> {
        // Always normalize the input name
        let normalized = self.normalize_entity_name(entity_name);
        
        // Print debug info for difficult cases
        if entity_name == "generic" || entity_name == "JsonValue" {
            println!("Warning: Looking up entity with generic name '{}'. Available entities: {:?}", 
                      entity_name, 
                      self.entity_mappings.keys().collect::<Vec<_>>());
        }
        
        // Try normalized name first (most efficient path)
        let result = self.entity_mappings.get(&normalized)
            // Then try original name (for backward compatibility)
            .or_else(|| self.entity_mappings.get(entity_name))
            // Then try as table name (additional fallback)
            .or_else(|| {
                // Check all mappings to see if any table_name matches
                self.entity_mappings.values()
                    .find(|m| self.normalize_entity_name(&m.table_name) == normalized)
            });
        
        // Log the result for troubleshooting
        if result.is_none() {
            println!("Entity mapping not found for '{}' (normalized: '{}'). Available mappings: {:?}", 
                      entity_name, normalized, self.entity_mappings.keys().collect::<Vec<_>>());
        }
        
        result
    }

    /// Configures the mappings between entities and tables
    pub fn configure_entity_mappings(&mut self, entities: &[Entity]) -> Result<(), Box<dyn Error>> {
        println!("Configuring entity mappings for {} entities", entities.len());
        
        // Initialize database connection first
        if self.pool.is_none() {
            println!("Initializing database connection...");
            self.initialize_connection()?;
            println!("Database connection initialized successfully");
        }
        
        // Process each entity
        for entity in entities {
            println!("Processing entity: {}", entity.name);
            let normalized_name = self.normalize_entity_name(&entity.name);
            let mapping = create_table_mapping(entity);
            println!("Created mapping for entity {}: table={}, fields={}", 
                    entity.name, 
                    mapping.table_name,
                    mapping.fields.len());
            // Store the mapping with the entity name from the configuration
            self.entity_mappings.insert(normalized_name.clone(), mapping.clone());

            // Store the mapping with the entity name as a fallback (for backward compatibility)
            self.entity_mappings.insert(entity.name.clone(), mapping.clone());

            // Also store it with the table name as a fallback (for backward compatibility)
            if entity.name != mapping.table_name {
                self.entity_mappings.insert(mapping.table_name.clone(), mapping);
            }
        }
        
        println!("Entity mappings configured successfully. Total mappings: {}", self.entity_mappings.len());
        for (name, mapping) in &self.entity_mappings {
            println!("  - Entity: {}, Table: {}, Fields: {}", 
                    name, 
                    mapping.table_name,
                    mapping.fields.len());
        }
        
        Ok(())
    }
    
    /// Initializes the database connection
    fn initialize_connection(&mut self) -> Result<(), Box<dyn Error>> {
        let connection_url = self.config.make_url();
        println!("Connecting to database with URL: {}", connection_url);
        
        // Connect to database using tokio runtime
        let pool = self.runtime.block_on(async {
            println!("Creating connection pool...");
            MySqlPoolOptions::new()
                .max_connections(self.config.max_connections.unwrap_or(5))
                .connect(&connection_url)
                .await
                .map_err(|e| {
                    eprintln!("Failed to connect to database: {}", e);
                    DataSourceError::ConnectionError(format!("Error connecting to MariaDB: {}", e))
                })
        })?;
        
        println!("Connection pool created successfully");
        self.pool = Some(pool);
        Ok(())
    }

    /// Generates a SELECT SQL query 
    fn generate_select_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| {
                // Log available mappings to help diagnose the issue
                let available = self.entity_mappings.keys()
                    .map(|k| k.as_str())
                    .collect::<Vec<_>>()
                    .join(", ");
                
                eprintln!("ERROR: No mapping found for '{}'. Available: {}", entity_name, available);
                DataSourceError::NotFound(format!("No mapping found for entity '{}'", entity_name))
            })?;
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        Ok(format!("SELECT {} FROM `{}`", columns.join(", "), mapping.table_name))
    }
    
    /// Generates a SELECT SQL query by ID
    fn generate_select_by_id_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        Ok(format!("SELECT {} FROM `{}` WHERE `{}` = ?", 
            columns.join(", "), 
            mapping.table_name, 
            mapping.primary_key))
    }
    
    /// Generates an INSERT SQL query
    fn generate_insert_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
        
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        let placeholders: Vec<String> = (0..mapping.fields.len())
            .map(|_| "?".to_string())
            .collect();
            
        Ok(format!("INSERT INTO `{}` ({}) VALUES ({})", 
            mapping.table_name, 
            columns.join(", "), 
            placeholders.join(", ")))
    }
    
    /// Generates an UPDATE SQL query
    fn generate_update_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
            
        let set_clauses: Vec<String> = mapping.fields.iter()
            .filter(|field| field.field_name != mapping.primary_key)
            .map(|field| format!("`{}` = ?", field.column_name))
            .collect();
            
        Ok(format!("UPDATE `{}` SET {} WHERE `{}` = ?", 
            mapping.table_name, 
            set_clauses.join(", "), 
            mapping.primary_key))
    }
    
    /// Generates a DELETE SQL query
    fn generate_delete_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
            
        Ok(format!("DELETE FROM `{}` WHERE `{}` = ?", 
            mapping.table_name, 
            mapping.primary_key))
    }
    
    /// Maps a MySQL row to an entity
    fn map_row_to_entity<T: ApiEntity + DeserializeOwned>(&self, row: MySqlRow, entity_name: &str) -> Result<T, Box<dyn Error>> {
        // Get the entity mapping
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
        
        // Create a JSON object representing our entity
        let mut json_object = serde_json::Map::new();
        
        // Extract data from each column according to the mapping and convert to JSON format
        for field in &mapping.fields {
            let column_name = field.column_name.as_str();
            let value: Option<Value> = match field.field_type.as_str() {
                "string" => {
                    let val: Option<String> = row.try_get(column_name).unwrap_or(None);
                    val.map(Value::String)
                },
                "integer" => {
                    if let Ok(val) = row.try_get::<i64, _>(column_name) {
                        Some(Value::Number(val.into()))
                    } else {
                        None
                    }
                },
                "float" => {
                    if let Ok(val) = row.try_get::<f64, _>(column_name) {
                        // Converting f64 to serde_json::Number requires an extra step
                        serde_json::Number::from_f64(val).map(Value::Number)
                    } else {
                        None
                    }
                },
                "boolean" => {
                    let val: Option<bool> = row.try_get(column_name).unwrap_or(None);
                    val.map(Value::Bool)
                },
                _ => {
                    // For unknown types, try as string
                    let val: Option<String> = row.try_get(column_name).unwrap_or(None);
                    val.map(Value::String)
                }
            };
            
            if let Some(v) = value {
                json_object.insert(field.field_name.clone(), v);
            }
        }
        
        // Convert the JSON object to our entity
        match serde_json::from_value(Value::Object(json_object.clone())) {
            Ok(entity) => Ok(entity),
            Err(e) => {
                // Convert keys to strings before joining
                let keys: Vec<String> = json_object.keys().cloned().collect();
                let error_msg = format!(
                    "Error deserializing entity '{}': {}. Fields available: {}", 
                    entity_name, 
                    e,
                    keys.join(", ")
                );
                eprintln!("Deserialization error: {}", error_msg);
                Err(Box::new(DataSourceError::MappingError(error_msg)))
            }
        }
    }
    
    /// Converts an entity to values for a parameterized query
    fn entity_to_query_values<T: ApiEntity + Serialize>(&self, item: &T, entity_name: &str) -> Result<Vec<Value>, Box<dyn Error>> {
        // Serialize the entity to JSON Value
        let entity_json = serde_json::to_value(item)?;
        
        // Get the mapping for the entity
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
        
        // Extract values in the order they appear in the mapping
        let mut values = Vec::new();
        if let Value::Object(map) = entity_json {
            for field in &mapping.fields {
                if let Some(value) = map.get(&field.field_name) {
                    values.push(value.clone());
                } else {
                    // If the field is missing in the entity, use null
                    values.push(Value::Null);
                }
            }
        } else {
            return Err(Box::new(DataSourceError::SerializationError(
                "The entity could not be serialized as a JSON object".to_string()
            )));
        }
        
        Ok(values)
    }
    
    /// Validates an entity against its mapping before CRUD operations
    fn validate_entity<T: ApiEntity + Serialize>(&self, item: &T, entity_name: &str) -> Result<(), Box<dyn Error>> {
        // Get the mapping
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(
                format!("No mapping found for entity {}", entity_name)
            ))?;
        
        // Convert entity to JSON
        let entity_json = serde_json::to_value(item)?;
        
        // Ensure the entity is an object
        if let Value::Object(map) = &entity_json {
            // Check that primary key is not missing for update operations
            if !map.contains_key(&mapping.primary_key) {
                eprintln!("Warning: Primary key '{}' missing from entity", mapping.primary_key);
                // Not returning error, as it might be an insert operation
            }
            
            // Check that all fields have valid types
            for field in &mapping.fields {
                if let Some(value) = map.get(&field.field_name) {
                    match (field.field_type.as_str(), value) {
                        ("string", Value::String(_)) => {},
                        ("integer", Value::Number(n)) if n.is_i64() => {},
                        ("float", Value::Number(_)) => {},
                        ("boolean", Value::Bool(_)) => {},
                        // For null values we're lenient
                        (_, Value::Null) => {},
                        // For mismatches, log but don't stop - might coerce later
                        (expected, actual) => {
                            eprintln!("Warning: Field '{}' expected type {}, but got {:?}", 
                                    field.field_name, expected, actual);
                        }
                    }
                }
            }
            Ok(())
        } else {
            Err(Box::new(DataSourceError::ValidationError(
                "Entity must be an object".to_string()
            )))
        }
    }

    /// Extracts the ID from an entity
    #[allow(dead_code)]
    fn get_entity_id<T: ApiEntity + Serialize>(&self, item: &T, entity_name: &str) -> Result<String, Box<dyn Error>> {
        // Get the mapping for the entity
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| 
                DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name))
            )?;
        
        // Serialize the entity to JSON
        let entity_json = serde_json::to_value(item)?;
        
        // Extract the value of the ID field
        if let Value::Object(map) = entity_json {
            if let Some(id_value) = map.get(&mapping.primary_key) {
                // Convert the value to String
                match id_value {
                    Value::String(s) => Ok(s.clone()),
                    Value::Number(n) => Ok(n.to_string()),
                    _ => Err(Box::new(DataSourceError::ValidationError(
                        format!("The ID value is not a valid type: {:?}", id_value)
                    )))
                }
            } else {
                Err(Box::new(DataSourceError::ValidationError(
                    format!("The ID field '{}' was not found in the entity", mapping.primary_key)
                )))
            }
        } else {
            Err(Box::new(DataSourceError::SerializationError(
                "The entity could not be serialized as a JSON object".to_string()
            )))
        }
    }
}

impl DatabaseCommon for MariaDbDatasource {
    fn get_connection(&self) -> Result<Box<dyn Any>, Box<dyn Error>> {
        match &self.pool {
            Some(pool) => Ok(Box::new(pool.clone())),
            None => Err(Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string()
            )))
        }
    }

    fn connect(&self) -> Result<(), Box<dyn Error>> {
        // The actual connection is handled in initialize_connection
        Ok(())
    }

    fn disconnect(&self) -> Result<(), Box<dyn Error>> {
        // No need to explicitly disconnect with sqlx
        Ok(())
    }
}

// Implement Clone for MariaDbDatasource
impl Clone for MariaDbDatasource {
    fn clone(&self) -> Self {
        MariaDbDatasource {
            config: self.config.clone(),
            pool: self.pool.clone(),
            entity_mappings: self.entity_mappings.clone(),
            runtime: Runtime::new().unwrap(),
        }
    }
}

impl<T> RelationalSource<T> for MariaDbDatasource 
where 
    T: ApiEntity + DeserializeOwned + Serialize + Send + Sync + 'static
{
    fn get_db_structure(&self) -> &dyn Any {
        self
    }
}

// Modificar todos los métodos CRUD para que acepten un parámetro de nombre de entidad
impl<T> DataSource<T> for MariaDbDatasource 
where 
    T: ApiEntity + DeserializeOwned + Serialize + Send + Sync + 'static
{
    fn get_all(&self, entity_name_override: Option<&str>) -> Result<Vec<T>, Box<dyn Error>> {
        // Usar el nombre proporcionado o caer en el nombre genérico como fallback
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        
        // Verify that we have a connection
        let pool = match &self.pool {
            Some(p) => p,
            None => return Err(Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string()
            )))
        };

        // Generate the SQL query
        let query = self.generate_select_query(&entity_name)?;
        
        // Execute the query and map the results
        let results = self.runtime.block_on(async {
            let rows = sqlx::query(&query)
                .fetch_all(pool)
                .await
                .map_err(|e| DataSourceError::QueryError(
                    format!("Error executing SELECT query: {}", e)
                ))?;
            
            let mut entities = Vec::with_capacity(rows.len());
            for row in rows {
                match self.map_row_to_entity::<T>(row, &entity_name) {
                    Ok(entity) => entities.push(entity),
                    Err(e) => return Err(e)
                }
            }
            
            Ok::<Vec<T>, Box<dyn Error>>(entities)
        })?;
        
        Ok(results)
    }

    fn get_by_id(&self, id: &str, entity_name_override: Option<&str>) -> Result<Option<T>, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        // Verify that we have a connection
        let pool = match &self.pool {
            Some(p) => p,
            None => return Err(Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string()
            )))
        };

        // Generate the SQL query
        let query = self.generate_select_by_id_query(&entity_name)?;
        
        // Execute the query and map the result
        let result = self.runtime.block_on(async {
            let row = sqlx::query(&query)
                .bind(id)
                .fetch_optional(pool)
                .await
                .map_err(|e| DataSourceError::QueryError(
                    format!("Error executing SELECT by ID query: {}", e)
                ))?;
            
            match row {
                Some(r) => match self.map_row_to_entity::<T>(r, &entity_name) {
                    Ok(entity) => Ok(Some(entity)),
                    Err(e) => Err(e)
                },
                None => Ok(None)
            }
        })?;
        
        Ok(result)
    }

    fn create(&self, item: T, entity_name_override: Option<&str>) -> Result<T, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        
        // Validate the entity first
        self.validate_entity(&item, &entity_name)?;
        
        // Verify that we have a connection
        let pool = match &self.pool {
            Some(p) => p,
            None => return Err(Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string()
            )))
        };

        // Generate the SQL query
        let query = self.generate_insert_query(&entity_name)?;
        
        // Convert entity to values for the query
        let values = self.entity_to_query_values(&item, &entity_name)?;
        
        // Execute the query
        let item_clone = item.clone();
        self.runtime.block_on(async {
            let mut query_builder = sqlx::query(&query);
            
            // Add all parameters to the query
            for value in values {
                match value {
                    Value::String(s) => { query_builder = query_builder.bind(s); },
                    Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            query_builder = query_builder.bind(i);
                        } else if let Some(f) = n.as_f64() {
                            query_builder = query_builder.bind(f);
                        }
                    },
                    Value::Bool(b) => { query_builder = query_builder.bind(b); },
                    Value::Null => { query_builder = query_builder.bind::<Option<String>>(None); },
                    _ => {
                        return Err(Box::new(DataSourceError::ValidationError(
                            format!("Unsupported value type: {:?}", value)
                        )))
                    }
                }
            }
            
            // Execute the query
            query_builder.execute(pool).await
                .map_err(|e| DataSourceError::QueryError(
                    format!("Error executing INSERT query: {}", e)
                ))?;
            Ok::<(), Box<DataSourceError>>(())
        })?;
        
        // Return the created entity
        Ok(item_clone)
    }

    fn update(&self, id: &str, item: T, entity_name_override: Option<&str>) -> Result<T, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        // Verify that we have a connection
        let pool = match &self.pool {
            Some(p) => p,
            None => return Err(Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string()
            )))
        };

        // Generate the SQL query
        let query = self.generate_update_query(&entity_name)?;
        
        // Get the mapping for the entity
        let mapping = self.find_entity_mapping(&entity_name)
            .ok_or_else(|| DataSourceError::NotFound(
                format!("No mapping found for entity {}", entity_name)
            ))?;
        
        // Convert entity to values for the query
        let entity_json = serde_json::to_value(&item)?;
        
        // Execute the query
        let item_clone = item.clone();
        self.runtime.block_on(async {
            let mut query_builder = sqlx::query(&query);
            
            // Add all fields except the primary key
            if let Value::Object(map) = entity_json {
                for field in &mapping.fields {
                    if field.field_name != mapping.primary_key {
                        if let Some(value) = map.get(&field.field_name).cloned() {
                            match value {
                                Value::String(s) => { query_builder = query_builder.bind(s); },
                                Value::Number(n) => {
                                    if let Some(i) = n.as_i64() {
                                        query_builder = query_builder.bind(i);
                                    } else if let Some(f) = n.as_f64() {
                                        query_builder = query_builder.bind(f);
                                    }
                                },
                                Value::Bool(b) => { query_builder = query_builder.bind(b); },
                                Value::Null => { query_builder = query_builder.bind::<Option<String>>(None); },
                                _ => {
                                    return Err(Box::new(DataSourceError::ValidationError(
                                        format!("Unsupported value type: {:?}", value)
                                    )))
                                }
                            }
                        } else {
                            // If the field is not present, use NULL
                            query_builder = query_builder.bind::<Option<String>>(None);
                        }
                    }
                }
            } else {
                return Err(Box::new(DataSourceError::SerializationError(
                    "The entity could not be serialized as a JSON object".to_string()
                )))
            }
            
            // Add the ID as the last parameter for the WHERE condition
            query_builder = query_builder.bind(id);
            
            // Execute the query
            let _ = query_builder.execute(pool).await
                .map_err(|e| DataSourceError::QueryError(
                    format!("Error executing UPDATE query: {}", e)
                ))?;
            
            Ok::<(), Box<DataSourceError>>(())
        })?;
        
        // Return the updated entity
        Ok(item_clone)
    }

    fn delete(&self, id: &str, entity_name_override: Option<&str>) -> Result<bool, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        // Verify that we have a connection
        let pool = match &self.pool {
            Some(p) => p,
            None => return Err(Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string()
            )))
        };

        // Generate the SQL query
        let query = self.generate_delete_query(&entity_name)?;
        
        // Execute the query
        let result = self.runtime.block_on(async {
            let result = sqlx::query(&query)
                .bind(id)
                .execute(pool)
                .await
                .map_err(|e| DataSourceError::QueryError(
                    format!("Error executing DELETE query: {}", e)
                ))?;
            
            // If at least one row was affected, consider the deletion successful
            Ok::<bool, Box<dyn Error>>(result.rows_affected() > 0)
        })?;
        
        Ok(result)
    }
    
    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        Box::new(self.clone())
    }
}