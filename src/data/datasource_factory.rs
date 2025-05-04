use std::collections::HashMap;
use std::error::Error;
use serde::{Serialize, de::DeserializeOwned};
use crate::config::configuration::Config;
use crate::config::specific::database_config::DatabaseType;
use crate::data::datasource::base::DataSource;
use crate::data::datasource::relational::mariadb::MariaDbDatasource;
use crate::api::common::api_entity::ApiEntity;

/// Factory responsible for creating and managing datasources for entities
/// This structure handles the creation and mapping of datasources based on configuration
pub struct DataSourceFactory;

impl DataSourceFactory {
    /// Creates datasources for all entities defined in the configuration
    /// Returns a HashMap with entity names as keys and their corresponding datasources as values
    pub fn create_datasources<T: 'static + ApiEntity + Serialize + DeserializeOwned + Send + Sync>(
        config: &Config
    ) -> HashMap<String, Box<dyn DataSource<T>>> {
        let mut datasources = HashMap::new();
        
        // Iterate through all advanced entities in the config and create appropriate datasources
        for entity in &config.entities_advanced {
            // Determine the datasource type based on entity configuration or use the global one
            let datasource = Self::create_datasource_for_entity::<T>(&entity.name, config);
            
            if let Ok(ds) = datasource {
                datasources.insert(entity.name.clone(), ds);
            } else if let Err(e) = datasource {
                // Log error but continue with other entities
                eprintln!("Error creating datasource for entity '{}': {}", entity.name, e);
            }
        }
        
        datasources
    }
    
    /// Creates a specific datasource for an entity based on configuration
    fn create_datasource_for_entity<T: 'static + ApiEntity + Serialize + DeserializeOwned + Send + Sync>(
        _entity_name: &str, 
        config: &Config
    ) -> Result<Box<dyn DataSource<T>>, Box<dyn Error>> {
        
        // For now, use the database defined in the config
        match config.database.db_type {
            DatabaseType::MySQL => {
                // MariaDB and MySQL use the same driver
                let mut db = MariaDbDatasource::new(&config.database);
                
                // Configure entity mappings for the database
                db.configure_entity_mappings(&config.entities_advanced)?;
                
                Ok(Box::new(db) as Box<dyn DataSource<T>>)
            },
            DatabaseType::PostgreSQL => {
                // TODO: Implement PostgreSQL datasource
                Err("PostgreSQL datasource not implemented".into())
            },
            DatabaseType::SQLite => {
                // TODO: Implement SQLite datasource
                Err("SQLite datasource not implemented".into())
            },
            DatabaseType::MongoDB => {
                // TODO: Implement MongoDB datasource
                Err("MongoDB datasource not implemented".into())
            },
        }
    }
}

