use std::collections::HashMap;
use std::error::Error;
use serde::{Serialize, de::DeserializeOwned};
use crate::config::configuration::Config;
use crate::config::specific::database_config::DatabaseType;
use crate::config::specific::entity_config::Entity;
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
        
        println!("Initializing datasources...");
        println!("Advanced entities: {}", config.entities_advanced.len());
        println!("Basic entities: {}", config.entities_basic.len());
        println!("Database type: {:?}", config.database.db_type);
        
        // First, create a single database connection to be shared among all entities
        let db_connection = match config.database.db_type {
            DatabaseType::MySQL => {
                println!("Creating MariaDB/MySQL connection");
                match Self::create_mariadb_datasource::<T>(config) {
                    Ok(db) => {
                        println!("Successfully created MariaDB/MySQL connection");
                        Some(db)
                    },
                    Err(e) => {
                        eprintln!("Failed to create database connection: {}", e);
                        None
                    }
                }
            },
            _ => {
                eprintln!("Unsupported database type: {:?}", config.database.db_type);
                None
            }
        };
        
        if let Some(db) = db_connection {
            // Process all entities (both advanced and basic)
            let mut processed_entities = std::collections::HashSet::new();
            
            // First process advanced entities
            for entity in &config.entities_advanced {
                println!("Setting up advanced entity: {}", entity.name);
                if !processed_entities.contains(&entity.name) {
                    datasources.insert(entity.name.clone(), db.box_clone());
                    processed_entities.insert(entity.name.clone());
                    println!("Successfully created datasource for advanced entity: {}", entity.name);
                }
            }
            
            // Then process basic entities
            for entity in &config.entities_basic {
                println!("Setting up basic entity: {}", entity.name);
                if !processed_entities.contains(&entity.name) {
                    datasources.insert(entity.name.clone(), db.box_clone());
                    processed_entities.insert(entity.name.clone());
                    println!("Successfully created datasource for basic entity: {}", entity.name);
                }
            }
        } else {
            eprintln!("Failed to create database connection, no datasources will be available");
        }
        
        println!("Total datasources created: {}", datasources.len());
        println!("Datasource keys: {:?}", datasources.keys().collect::<Vec<_>>());
        
        datasources
    }
    
    /// Creates a MariaDB datasource with entity mappings configured
    fn create_mariadb_datasource<T: 'static + ApiEntity + Serialize + DeserializeOwned + Send + Sync>(
        config: &Config
    ) -> Result<Box<dyn DataSource<T>>, Box<dyn Error>> {
        println!("Creating MariaDB datasource with connection string: {}", 
                &config.database.connection_string);
        
        // Create the MariaDB datasource
        let mut db = MariaDbDatasource::new(&config.database);
        
        // Collect all entities (both advanced and basic) for mapping
        let mut all_entities = config.entities_advanced.clone();
        
        // Convert basic entities to advanced format and add them
        let basic_entities: Vec<Entity> = config.entities_basic.iter().map(|e| {
            Entity {
                name: e.name.clone(),
                table_name: e.table_name.clone(),
                fields: e.fields.iter().map(|f| {
                    crate::config::specific::entity_config::Field {
                        name: f.name.clone(),
                        column_name: Some(f.name.clone()),
                        data_type: f.data_type.clone(),
                        required: f.required,
                        unique: false,
                        searchable: true,
                        default_value: None,
                        description: None,
                    }
                }).collect(),
                relationships: Vec::new(),
                endpoints: crate::config::specific::entity_config::EndpointConfig {
                    generate_create: true,
                    generate_read: true,
                    generate_update: true,
                    generate_delete: true,
                    generate_list: true,
                    custom_routes: Vec::new(),
                },
                authentication: e.authentication,
                authorization: crate::config::specific::entity_config::Authorization {
                    active: false,
                    roles: Vec::new(),
                    permissions: Vec::new(),
                },
                validations: Vec::new(),
                pagination: None,
            }
        }).collect();
        
        // Add basic entities to the collection
        all_entities.extend(basic_entities);
        
        println!("Configuring entity mappings for {} entities", all_entities.len());
        for entity in &all_entities {
            println!("  - Entity: {}, Table: {:?}", entity.name, entity.table_name);
        }
        
        // Configure entity mappings for the database
        match db.configure_entity_mappings(&all_entities) {
            Ok(_) => {
                println!("Entity mappings configured successfully");
                Ok(Box::new(db) as Box<dyn DataSource<T>>)
            },
            Err(e) => {
                eprintln!("Failed to configure entity mappings: {}", e);
                Err(e)
            }
        }
    }
}

