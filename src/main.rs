use rawst::filemanager::file::get_config_file;
use rawst::config::configuration::{Config, Configuration, load_configuration};
use rawst::api::adapters::api_adapter::ApiAdapter;
use rawst::data::datasource_factory::DataSourceFactory;
use rawst::api::common::api_entity::ApiEntity;
use serde::{Serialize, Deserialize};

pub mod filemanager;
pub mod request_manager;

// Define a generic entity type that implements ApiEntity
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenericEntity {
    #[serde(flatten)]
    pub data: std::collections::HashMap<String, serde_json::Value>,
}

impl ApiEntity for GenericEntity {
    fn entity_name() -> &'static str {
        "generic"
    }
}

#[tokio::main]
pub async fn main() {
    // Get the config file path
    let config_file_path = get_config_file();
    println!("Using config file: {}", config_file_path);
    
    // Load the configuration from file
    let config = match load_configuration(&config_file_path) {
        Ok(cfg) => {
            println!("Configuration loaded successfully");
            cfg
        },
        Err(e) => {
            eprintln!("Error loading configuration: {}", e);
            // Fall back to default configuration
            println!("Using default configuration");
            Config::new()
        }
    };
    
    // Create datasources for entities using our GenericEntity type
    let datasources = DataSourceFactory::create_datasources::<GenericEntity>(&config);
    println!("Created datasources for {} entities", datasources.len());
    
    // Create API adapter with the configuration and datasources
    let api_adapter = ApiAdapter::new(config.clone(), datasources);
    
    // Start the API server
    println!("Starting API server...");
    match api_adapter.start_server() {
        Ok(_) => println!("API server started successfully"),
        Err(e) => eprintln!("Failed to start API server: {}", e),
    }
}


