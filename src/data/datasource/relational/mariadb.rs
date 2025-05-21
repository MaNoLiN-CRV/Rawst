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

/// MariaDB datasource implementation that provides CRUD operations 
/// against MariaDB/MySQL databases, with flexible entity-table mapping.
pub struct MariaDbDatasource {
    pub config: DatabaseConfig,
    pool: Option<Pool<MySql>>,
    entity_mappings: HashMap<String, TableMapping>,
    runtime: Runtime,
}

impl MariaDbDatasource {
    /// Creates a new MariaDbDatasource instance with the provided configuration.
    ///
    /// # Parameters
    /// * `config`: Database configuration containing connection details
    ///
    /// # Returns
    /// A new MariaDbDatasource instance (without an active connection)
    pub fn new(config: &DatabaseConfig) -> Self {
        MariaDbDatasource {
            config: config.clone(),
            pool: None,
            entity_mappings: HashMap::new(),
            runtime: Runtime::new().unwrap(),
        }
    }
    
    /// Normalizes an entity name by converting to lowercase and trimming whitespace.
    /// This ensures consistent lookups regardless of case or spacing issues.
    ///
    /// # Parameters
    /// * `name`: The entity name to normalize
    ///
    /// # Returns
    /// Normalized entity name as a String
    fn normalize_entity_name(&self, name: &str) -> String {
        name.to_lowercase().trim().to_string()
    }
    
    /// Finds an entity mapping using a flexible lookup strategy with multiple fallbacks.
    /// Will try: normalized name, original name, and matching by table name.
    ///
    /// # Parameters
    /// * `entity_name`: The name of the entity to look up
    ///
    /// # Returns
    /// Option containing a reference to the TableMapping if found, or None if not found
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

    /// Configures the mappings between entities and database tables.
    /// Also initializes the database connection if not already established.
    ///
    /// # Parameters
    /// * `entities`: Array of Entity configurations to register
    ///
    /// # Returns
    /// Result indicating success or containing an error
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
    
    /// Initializes the database connection pool.
    /// Creates a connection pool using the configuration parameters.
    ///
    /// # Returns
    /// Result indicating success or containing a connection error
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

    /// Gets the connection pool or returns an error if no connection has been established.
    ///
    /// # Returns
    /// Result containing a reference to the connection pool or an error
    fn get_pool_or_err(&self) -> Result<&Pool<MySql>, Box<dyn Error>> {
        self.pool.as_ref().ok_or_else(|| {
            Box::new(DataSourceError::ConnectionError(
                "No database connection".to_string(),
            )) as Box<dyn Error>
        })
    }

    /// Binds a Serde JSON value to an SQL query parameter with appropriate type conversion.
    ///
    /// # Parameters
    /// * `query_builder`: The SQL query builder to bind parameters to
    /// * `value`: The JSON value to bind
    ///
    /// # Returns
    /// Result containing the updated query builder or an error if binding fails
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

    /// Executes an SQL query that returns multiple rows.
    /// Handles parameter binding, execution, and timeout management.
    ///
    /// # Parameters
    /// * `executor`: Database connection executor
    /// * `query_str`: SQL query string
    /// * `params`: Vector of parameter values to bind to query
    ///
    /// # Returns
    /// Result containing the rows returned by the query or an error
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
    
    /// Executes an SQL query that returns zero or one row.
    /// Handles parameter binding, execution, and timeout management.
    ///
    /// # Parameters
    /// * `executor`: Database connection executor
    /// * `query_str`: SQL query string
    /// * `params`: Vector of parameter values to bind to query
    ///
    /// # Returns
    /// Result containing an Option with the row if found, or None if not found
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

    /// Executes an SQL command that modifies data (INSERT, UPDATE, DELETE).
    /// Handles parameter binding, execution, and timeout management.
    ///
    /// # Parameters
    /// * `executor`: Database connection executor
    /// * `query_str`: SQL query string
    /// * `params`: Vector of parameter values to bind to query
    ///
    /// # Returns
    /// Result containing the number of affected rows or an error
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

    /// Generates a SQL SELECT query to retrieve all entities of a given type.
    ///
    /// # Parameters
    /// * `entity_name`: The name of the entity type to query
    ///
    /// # Returns
    /// Result containing the generated SQL query string or an error
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
    
    /// Generates a SQL SELECT query to retrieve a single entity by its ID.
    ///
    /// # Parameters
    /// * `entity_name`: The name of the entity type to query
    ///
    /// # Returns
    /// Result containing the generated SQL query string or an error
    fn generate_select_by_id_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
            
        let columns: Vec<String> = mapping.fields.iter()
            .map(|field| format!("`{}`", field.column_name))
            .collect();
            
        Ok(format!("SELECT {} FROM `{}` WHERE `{}` = ?", 
            columns.join(", "), mapping.table_name, mapping.primary_key))
    }
    
    /// Generates a SQL INSERT query to create a new entity.
    ///
    /// # Parameters
    /// * `entity_name`: The name of the entity type to insert
    ///
    /// # Returns
    /// Result containing the generated SQL query string or an error
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
    
    /// Generates a SQL UPDATE query to modify an existing entity.
    ///
    /// # Parameters
    /// * `entity_name`: The name of the entity type to update
    ///
    /// # Returns
    /// Result containing the generated SQL query string or an error
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
    
    /// Generates a SQL DELETE query to remove an entity by its ID.
    ///
    /// # Parameters
    /// * `entity_name`: The name of the entity type to delete
    ///
    /// # Returns
    /// Result containing the generated SQL query string or an error
    fn generate_delete_query(&self, entity_name: &str) -> Result<String, Box<dyn Error>> {
        let mapping = self.find_entity_mapping(entity_name)
            .ok_or_else(|| DataSourceError::NotFound(format!("No mapping found for entity {}", entity_name)))?;
            
        Ok(format!("DELETE FROM `{}` WHERE `{}` = ?", mapping.table_name, mapping.primary_key))
    }
    
    /// Maps a database row to an entity object using the entity mapping configuration.
    /// Converts database column values to appropriate types based on field mappings.
    ///
    /// # Parameters
    /// * `row`: The database row containing entity data
    /// * `entity_name`: The name of the entity type to map to
    ///
    /// # Returns
    /// Result containing the mapped entity object or an error
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
    
    /// Converts an entity object to a vector of values for use in SQL queries.
    /// Orders values according to the entity mapping field order.
    ///
    /// # Parameters
    /// * `item`: The entity object to convert
    /// * `entity_name`: The name of the entity type
    ///
    /// # Returns
    /// Result containing vector of values in field order or an error
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

    /// Prepares values for an UPDATE query, excluding the primary key field from SET clause values
    /// but including it as the WHERE clause parameter.
    ///
    /// # Parameters
    /// * `item`: The entity object to convert
    /// * `entity_name`: The name of the entity type
    /// * `id`: The ID value for the WHERE clause
    ///
    /// # Returns
    /// Result containing vector of values ordered for UPDATE query or an error
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
    
    /// Validates an entity object against its mapping configuration.
    /// Checks that field types match expected types in the mapping.
    ///
    /// # Parameters
    /// * `item`: The entity object to validate
    /// * `entity_name`: The name of the entity type
    ///
    /// # Returns
    /// Result indicating validation success or an error
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

    /// Extracts the ID value from an entity object.
    ///
    /// # Parameters
    /// * `item`: The entity object to extract ID from
    /// * `entity_name`: The name of the entity type
    ///
    /// # Returns
    /// Result containing the ID as a string or an error
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
    /// Gets a cloned connection to the database.
    ///
    /// # Returns
    /// Result containing a boxed connection pool or an error
    fn get_connection(&self) -> Result<Box<dyn Any>, Box<dyn Error>> {
        Ok(Box::new(self.get_pool_or_err()?.clone()))
    }

    /// Verifies that the database connection is established.
    /// Note: This implementation relies on lazy initialization or prior call to configure_entity_mappings.
    ///
    /// # Returns
    /// Result indicating success or an error if connection isn't initialized
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

    /// Releases database connection resources.
    /// Since sqlx handles cleanup through Drop trait, this is a no-op.
    ///
    /// # Returns
    /// Result indicating success (always succeeds)
    fn disconnect(&self) -> Result<(), Box<dyn Error>> {
        // sqlx Pool handles disconnection automatically on drop.
        Ok(())
    }
}

impl Clone for MariaDbDatasource {
    /// Creates a clone of this datasource, including a new runtime instance.
    ///
    /// # Returns
    /// A new MariaDbDatasource instance with the same configuration
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
    /// Gets a reference to the database structure.
    ///
    /// # Returns
    /// Reference to this datasource as a dynamic trait object
    fn get_db_structure(&self) -> &dyn Any {
        self
    }
}

impl<T> DataSource<T> for MariaDbDatasource 
where 
    T: ApiEntity + DeserializeOwned + Serialize + Send + Sync + Clone + 'static
{
    /// Retrieves all entities of type T from the database.
    ///
    /// # Parameters
    /// * `entity_name_override`: Optional explicit entity name to use instead of T::entity_name()
    ///
    /// # Returns
    /// Result containing vector of entity objects or an error
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

    /// Retrieves a specific entity of type T by its ID.
    ///
    /// # Parameters
    /// * `id`: The entity's unique identifier
    /// * `entity_name_override`: Optional explicit entity name to use instead of T::entity_name()
    ///
    /// # Returns
    /// Result containing Option with entity if found, or None if not found
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

    /// Creates a new entity in the database.
    ///
    /// # Parameters
    /// * `item`: The entity object to create
    /// * `entity_name_override`: Optional explicit entity name to use instead of T::entity_name()
    ///
    /// # Returns
    /// Result containing the created entity object or an error
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

    /// Updates an existing entity in the database.
    ///
    /// # Parameters
    /// * `id`: The entity's unique identifier
    /// * `item`: The updated entity object
    /// * `entity_name_override`: Optional explicit entity name to use instead of T::entity_name()
    ///
    /// # Returns
    /// Result containing the updated entity object or an error
    fn update(&self, id: &str, item: T, entity_name_override: Option<&str>) -> Result<T, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        self.validate_entity(&item, &entity_name)?;
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_update_query(&entity_name)?;
        let values = self.prepare_update_values(&item, &entity_name, id)?;

        self.runtime.block_on(Self::run_execute_async(pool, &query_str, values))?;
        
        Ok(item)
    }

    /// Deletes an entity from the database by its ID.
    ///
    /// # Parameters
    /// * `id`: The entity's unique identifier
    /// * `entity_name_override`: Optional explicit entity name to use instead of T::entity_name()
    ///
    /// # Returns
    /// Result containing boolean indicating success (true if entity was deleted) or an error
    fn delete(&self, id: &str, entity_name_override: Option<&str>) -> Result<bool, Box<dyn Error>> {
        let entity_name = entity_name_override.map(|s| s.to_string()).unwrap_or_else(|| T::entity_name());
        let pool = self.get_pool_or_err()?;
        let query_str = self.generate_delete_query(&entity_name)?;
        let params = vec![Value::String(id.to_string())];
        
        let rows_affected = self.runtime.block_on(Self::run_execute_async(pool, &query_str, params))?;
        
        Ok(rows_affected > 0)
    }
    
    /// Creates a clone of this datasource as a boxed DataSource trait object.
    ///
    /// # Returns
    /// Boxed DataSource trait object
    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        Box::new(self.clone())
    }
}