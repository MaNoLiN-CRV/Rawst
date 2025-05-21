use std::any::Any;
use std::collections::HashMap;
use std::error::Error;
use sqlx::{MySql, Pool, Row, MySqlExecutor};
use sqlx::mysql::{MySqlRow, MySqlPoolOptions, MySqlArguments};
use tokio::runtime::Runtime;
use serde_json::Value;
use crate::api::common::api_entity::ApiEntity;
use crate::config::specific::database_config::DatabaseConfig;
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::base::{DataSource, DatabaseCommon, DataSourceError};
use crate::data::datasource::relational::base::{RelationalSource, TableMapping, create_table_mapping};
use serde::{Serialize, de::DeserializeOwned};

const DEFAULT_QUERY_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(10);

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
    
    fn normalize_entity_name(&self, name: &str) -> String {
        name.to_lowercase().trim().to_string()
    }
    
    fn find_entity_mapping(&self, entity_name: &str) -> Option<&TableMapping> {
        let normalized = self.normalize_entity_name(entity_name);
        
        let result = self.entity_mappings.get(&normalized)
            .or_else(|| self.entity_mappings.get(entity_name))
            .or_else(|| {
                self.entity_mappings.values()
                    .find(|m| self.normalize_entity_name(&m.table_name) == normalized)
            });
        
        if result.is_none() {
            eprintln!("Entity mapping not found for '{}' (normalized: '{}'). Available mappings: {:?}", 
                      entity_name, normalized, self.entity_mappings.keys().collect::<Vec<_>>());
        }
        
        result
    }

    pub fn configure_entity_mappings(&mut self, entities: &[Entity]) -> Result<(), Box<dyn Error>> {
        if self.pool.is_none() {
            self.initialize_connection()?;
        }
        
        for entity in entities {
            let normalized_name = self.normalize_entity_name(&entity.name);
            let mapping = create_table_mapping(entity);
            
            self.entity_mappings.insert(normalized_name.clone(), mapping.clone());
            if entity.name != normalized_name { // Store original if different from normalized
                self.entity_mappings.insert(entity.name.clone(), mapping.clone());
            }
            if mapping.table_name != normalized_name && mapping.table_name != entity.name { // Store by table name if different
                self.entity_mappings.insert(mapping.table_name.clone(), mapping);
            }
        }
        
        println!("Entity mappings configured. Total distinct entities registered: {}", self.entity_mappings.len());
        Ok(())
    }
    
    fn initialize_connection(&mut self) -> Result<(), Box<dyn Error>> {
        let connection_url = self.config.make_url();
        
        let pool = self.runtime.block_on(async {
            MySqlPoolOptions::new()
                .max_connections(self.config.max_connections.unwrap_or(5))
                .connect(&connection_url)
                .await
                .map_err(|e| {
                    eprintln!("Failed to connect to database: {}", e);
                    DataSourceError::ConnectionError(format!("Error connecting to MariaDB: {}", e))
                })
        })?;
        
        self.pool = Some(pool);
        Ok(())
    }

    fn get_pool_or_err(&self) -> Result<&Pool<MySql>, Box<dyn Error>> {
        self.pool.as_ref().ok_or_else(|| {
            Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string(),
            )) as Box<dyn Error>
        })
    }

    fn bind_sqlx_value<'q>(
        mut query_builder: sqlx::query::Query<'q, MySql, MySqlArguments>,
        value: Value,
    ) -> Result<sqlx::query::Query<'q, MySql, MySqlArguments>, Box<dyn Error>>
    {
        match value {
            Value::String(s) => query_builder = query_builder.bind(s),
            Value::Number(n) => {
                if let Some(i) = n.as_i64() {
                    query_builder = query_builder.bind(i);
                } else if let Some(f) = n.as_f64() {
                    query_builder = query_builder.bind(f);
                } else {
                    return Err(Box::new(DataSourceError::ValidationError(format!(
                        "Unsupported number type in value: {:?}", n
                    ))));
                }
            }
            Value::Bool(b) => query_builder = query_builder.bind(b),
            Value::Null => query_builder = query_builder.bind::<Option<String>>(None), // Explicit type for NULL
            _ => {
                return Err(Box::new(DataSourceError::ValidationError(format!(
                    "Unsupported value type for binding: {:?}", value
                ))));
            }
        }
        Ok(query_builder)
    }

    async fn run_query_async<'e, Executor>(
        executor: Executor,
        query_str: &str,
        params: Vec<Value>,
    ) -> Result<Vec<MySqlRow>, Box<dyn Error>>
    where
        Executor: MySqlExecutor<'e>,
    {
        let mut sqlx_query = sqlx::query(query_str);
        for p_value in params {
            sqlx_query = Self::bind_sqlx_value(sqlx_query, p_value)?;
        }

        match tokio::time::timeout(DEFAULT_QUERY_TIMEOUT, sqlx_query.fetch_all(executor)).await {
            Ok(Ok(rows)) => Ok(rows),
            Ok(Err(e)) => Err(Box::new(DataSourceError::QueryError(format!("Error executing query: {}", e)))),
            Err(_) => Err(Box::new(DataSourceError::QueryError(format!("Query timed out after {} seconds", DEFAULT_QUERY_TIMEOUT.as_secs())))),
        }
    }
    
    async fn run_query_optional_async<'e, Executor>(
        executor: Executor,
        query_str: &str,
        params: Vec<Value>,
    ) -> Result<Option<MySqlRow>, Box<dyn Error>>
    where
        Executor: MySqlExecutor<'e>,
    {
        let mut sqlx_query = sqlx::query(query_str);
        for p_value in params {
            sqlx_query = Self::bind_sqlx_value(sqlx_query, p_value)?;
        }
    
        match tokio::time::timeout(DEFAULT_QUERY_TIMEOUT, sqlx_query.fetch_optional(executor)).await {
            Ok(Ok(row_opt)) => Ok(row_opt),
            Ok(Err(e)) => Err(Box::new(DataSourceError::QueryError(format!("Error executing query: {}", e)))),
            Err(_) => Err(Box::new(DataSourceError::QueryError(format!("Query timed out after {} seconds", DEFAULT_QUERY_TIMEOUT.as_secs())))),
        }
    }

    async fn run_execute_async<'e, Executor>(
        executor: Executor,
        query_str: &str,
        params: Vec<Value>,
    ) -> Result<u64, Box<dyn Error>>
    where
        Executor: MySqlExecutor<'e>,
    {
        let mut sqlx_query = sqlx::query(query_str);
        for p_value in params {
            sqlx_query = Self::bind_sqlx_value(sqlx_query, p_value)?;
        }

        match tokio::time::timeout(DEFAULT_QUERY_TIMEOUT, sqlx_query.execute(executor)).await {
            Ok(Ok(result)) => Ok(result.rows_affected()),
            Ok(Err(e)) => Err(Box::new(DataSourceError::QueryError(format!("Error executing query: {}", e)))),
            Err(_) => Err(Box::new(DataSourceError::QueryError(format!("Query timed out after {} seconds", DEFAULT_QUERY_TIMEOUT.as_secs())))),
        }
    }

    fn generate_select_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| {
                let available = self.entity_mappings.keys().map(|k| k.as_str()).collect::<Vec<_>>().join(", ");
                eprintln!("ERROR: No mapping found for '{}'. Available: {}", entity_name, available);
                DataSourceError::NotFound(format!("No mapping found for entity '{}'", entity_name))
            })?;
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        Ok(format!("SELECT {} FROM `{}`", columns.join(", "), mapping.table_name))
    }
    
    fn generate_select_by_id_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        Ok(format!("SELECT {} FROM `{}` WHERE `{}` = ?", 
            columns.join(", "), mapping.table_name, mapping.primary_key))
    }
    
    fn generate_insert_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        let placeholders: Vec<String> = (0..mapping.fields.len()).map(|_| "?".to_string()).collect();
            
        Ok(format!("INSERT INTO `{}` ({}) VALUES ({})", 
            mapping.table_name, columns.join(", "), placeholders.join(", ")))
    }
    
    fn generate_update_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
            
        let set_clauses: Vec<String> = mapping.fields.iter()
            .filter(|field| field.field_name != mapping.primary_key) // PK should not be in SET
            .map(|field| format!("`{}` = ?", field.column_name))
            .collect();
            
        Ok(format!("UPDATE `{}` SET {} WHERE `{}` = ?", 
            mapping.table_name, set_clauses.join(", "), mapping.primary_key))
    }
    
    fn generate_delete_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
            
        Ok(format!("DELETE FROM `{}` WHERE `{}` = ?", mapping.table_name, mapping.primary_key))
    }
    
    fn map_row_to_entity<T: ApiEntity + DeserializeOwned>(&self, row: MySqlRow, entity_name: &str) -> Result<T, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
        
        let mut json_object = serde_json::Map::new();
        
        for field in &mapping.fields {
            let column_name = field.column_name.as_str();
            let value: Option<Value> = match field.field_type.as_str() {
                "string" => row.try_get(column_name).ok().map(Value::String),
                "integer" => row.try_get::<i64, _>(column_name).ok().map(|v| Value::Number(v.into())),
                "float" => row.try_get::<f64, _>(column_name).ok().and_then(|v| serde_json::Number::from_f64(v).map(Value::Number)),
                "boolean" => row.try_get(column_name).ok().map(Value::Bool),
                _ => row.try_get(column_name).ok().map(Value::String), // Fallback to string
            };
            
            if let Some(v) = value {
                json_object.insert(field.field_name.clone(), v);
            }
        }
        
        match serde_json::from_value(Value::Object(json_object.clone())) {
            Ok(entity) => Ok(entity),
            Err(e) => {
                let keys: Vec<String> = json_object.keys().cloned().collect();
                let error_msg = format!(
                    "Error deserializing entity '{}': {}. Fields available: {}", 
                    entity_name, e, keys.join(", ")
                );
                eprintln!("Deserialization error: {}", error_msg);
                Err(Box::new(DataSourceError::MappingError(error_msg)))
            }
        }
    }
    
    fn entity_to_query_values<U: ApiEntity + Serialize>(&self, item: &U, entity_name: &str) -> Result<Vec<Value>, Box<dyn Error>> {
        let entity_json = serde_json::to_value(item)?;
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
        
        let mut values = Vec::new();
        if let Value::Object(map) = entity_json {
            for field in &mapping.fields {
                values.push(map.get(&field.field_name).cloned().unwrap_or(Value::Null));
            }
        } else {
            return Err(Box::new(DataSourceError::SerializationError(
                "The entity could not be serialized as a JSON object".to_string()
            )));
        }
        Ok(values)
    }

    fn prepare_update_values<U: Serialize>(&self, item: &U, entity_name: &str, id: &str) -> Result<Vec<Value>, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping for entity {}", entity_name)))?;
        let entity_json = serde_json::to_value(item)?;
    
        let mut values = Vec::new();
        if let Value::Object(map) = entity_json {
            for field in &mapping.fields {
                if field.field_name != mapping.primary_key { 
                    values.push(map.get(&field.field_name).cloned().unwrap_or(Value::Null));
                }
            }
            // Add the ID for the WHERE clause. Assuming ID is string for simplicity.
            // This might need adjustment if PKs are not always strings or require specific type handling.
            values.push(Value::String(id.to_string())); 
            Ok(values)
        } else {
            Err(Box::new(DataSourceError::SerializationError(
                "Entity could not be serialized as JSON object".to_string()
            )))
        }
    }
    
    fn validate_entity<U: ApiEntity + Serialize>(&self, item: &U, entity_name: &str) -> Result<(), Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
        
        let entity_json = serde_json::to_value(item)?;
        
        if let Value::Object(map) = &entity_json {
            if !map.contains_key(&mapping.primary_key) {
                // This could be an issue for updates, but inserts might generate PK.
                // eprintln!("Warning: Primary key '{}' missing from entity for validation", mapping.primary_key);
            }
            
            for field in &mapping.fields {
                if let Some(value) = map.get(&field.field_name) {
                    match (field.field_type.as_str(), value) {
                        ("string", Value::String(_)) => {},
                        ("integer", Value::Number(n)) if n.is_i64() => {},
                        ("float", Value::Number(_)) => {},
                        ("boolean", Value::Bool(_)) => {},
                        (_, Value::Null) => {},
                        (expected, actual) => {
                            eprintln!("Warning: Field '{}' expected type {}, but got {:?} during validation", 
                                    field.field_name, expected, actual.as_str().unwrap_or("complex type"));
                        }
                    }
                }
            }
            Ok(())
        } else {
            Err(Box::new(DataSourceError::ValidationError("Entity must be an object".to_string())))
        }
    }

    #[allow(dead_code)]
    fn get_entity_id<U: ApiEntity + Serialize>(&self, item: &U, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
        
        let entity_json = serde_json::to_value(item)?;
        
        if let Value::Object(map) = entity_json {
            if let Some(id_value) = map.get(&mapping.primary_key) {
                match id_value {
                    Value::String(s) => Ok(s.clone()),
                    Value::Number(n) => Ok(n.to_string()),
                    _ => Err(Box::new(DataSourceError::ValidationError(
                        format!("The ID value is not a valid string or number: {:?}", id_value)
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
        Ok(Box::new(self.get_pool_or_err()?.clone()))
    }

    fn connect(&self) -> Result<(), Box<dyn Error>> {
        // Connection is initialized on first use or via configure_entity_mappings
        if self.pool.is_none() {
            // This mutable call might be an issue if `connect` is called on an immutable `self`.
            // For now, assume `initialize_connection` is called elsewhere or this method's contract changes.
            // Or, make `initialize_connection` part of `new` or a separate setup step.
            // To avoid `&mut self` here, we rely on `configure_entity_mappings` or lazy init.
            return Err(Box::new(DataSourceError::ConnectionError("Connection not pre-initialized. Call configure_entity_mappings or ensure lazy init.".to_string())));
        }
        Ok(())
    }

    fn disconnect(&self) -> Result<(), Box<dyn Error>> {
        // sqlx Pool handles disconnection automatically on drop.
        Ok(())
    }
}

impl Clone for MariaDbDatasource {
    fn clone(&self) -> Self {
        MariaDbDatasource {
            config: self.config.clone(),
            pool: self.pool.clone(),
            entity_mappings: self.entity_mappings.clone(),
            runtime: Runtime::new().unwrap(), // Consider Arc<Runtime> if clones are frequent
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

impl<T> DataSource<T> for MariaDbDatasource 
where 
    T: ApiEntity + DeserializeOwned + Serialize + Send + Sync + Clone + 'static
{
    fn get_all(&self, entity_name_override: Option<&str>) -> Result<Vec<T>, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_select_query(&entity_name)?;
        
        let rows = self.runtime.block_on(Self::run_query_async(pool, &query_str, Vec::new()))?;
        
        if rows.is_empty() {
            return Ok(Vec::new());
        }
        
        rows.into_iter()
            .map(|row| self.map_row_to_entity(row, &entity_name))
            .collect()
    }

    fn get_by_id(&self, id: &str, entity_name_override: Option<&str>) -> Result<Option<T>, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_select_by_id_query(&entity_name)?;
        let params = vec![Value::String(id.to_string())];
        
        let row_opt = self.runtime.block_on(Self::run_query_optional_async(pool, &query_str, params))?;
        
        match row_opt {
            Some(r) => self.map_row_to_entity(r, &entity_name).map(Some),
            None => Ok(None),
        }
    }

    fn create(&self, item: T, entity_name_override: Option<&str>) -> Result<T, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        self.validate_entity(&item, &entity_name)?;
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_insert_query(&entity_name)?;
        let values = self.entity_to_query_values(&item, &entity_name)?;
        
        self.runtime.block_on(Self::run_execute_async(pool, &query_str, values))?;
        
        // Note: This returns the input item. If DB generates ID/timestamps, this won't reflect them.
        Ok(item) 
    }

    fn update(&self, id: &str, item: T, entity_name_override: Option<&str>) -> Result<T, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        self.validate_entity(&item, &entity_name)?;
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_update_query(&entity_name)?;
        let values = self.prepare_update_values(&item, &entity_name, id)?;

        self.runtime.block_on(Self::run_execute_async(pool, &query_str, values))?;
        
        Ok(item)
    }

    fn delete(&self, id: &str, entity_name_override: Option<&str>) -> Result<bool, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_delete_query(&entity_name)?;
        let params = vec![Value::String(id.to_string())];
        
        let rows_affected = self.runtime.block_on(Self::run_execute_async(pool, &query_str, params))?;
        
        Ok(rows_affected > 0)
    }
    
    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        Box::new(self.clone())
    }
}