use std::collections::HashMap;
use std::error::Error;
use serde::Serialize;
use crate::config::configuration::Config;
use crate::config::specific::database_config::DatabaseType;
use crate::data::datasource::DataSource;
use crate::data::datasource::relationaldb_ds::Database;

/// Factory responsible for creating and managing datasources for entities
/// This struct handles the creation and mapping of datasources based on configuration
pub struct DataSourceFactory;

impl DataSourceFactory {
    /// Creates datasources for all entities defined in the configuration
    /// Returns a HashMap with entity names as keys and their corresponding datasources as values
    pub fn create_datasources<T: 'static + Serialize + Send + Sync>(
        config: &Config
    ) -> HashMap<String, Box<dyn DataSource<T>>> {
        let mut datasources = HashMap::new();
        
        // Loop through all advanced entities in the config and create appropriate datasources
        for entity in &config.entities_advanced {
            // Determine datasource type from entity configuration or use default from global config
            let datasource = Self::create_datasource_for_entity::<T>(&entity.name, config);
            
            if let Ok(ds) = datasource {
                datasources.insert(entity.name.clone(), ds);
            }
            // TODO: Handle error case
        }
        
        datasources
    }
    
    /// Creates a specific datasource for a given entity based on configuration
    fn create_datasource_for_entity<T: 'static + Serialize + Send + Sync>(
        entity_name: &str, 
        config: &Config
    ) -> Result<Box<dyn DataSource<T>>, Box<dyn Error>> {
        
        // For now, defaulting to database defined in config
        match config.database.db_type {
            DatabaseType::PostgreSQL | DatabaseType::MySQL | DatabaseType::SQLite => {
                let db = Database::new(&config.database);
                Ok(Box::new(db) as Box<dyn DataSource<T>>)
            },
            DatabaseType::MongoDB => {
                // TODO : 
                // Handle MongoDB datasource creation
                // let mongo_db = MongoDB::new(&config.database);
                // Ok(Box::new(mongo_db) as Box<dyn DataSource<T>>)
                Err("MongoDB datasource not implemented".into())
            },
            // Add additional database types as needed
        }
        
    }
}

