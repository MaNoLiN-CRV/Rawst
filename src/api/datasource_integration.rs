use std::collections::HashMap;
use serde::Serialize;
use crate::config::configuration::Config;
use crate::data::datasource::DataSource;
use crate::data::datasource_factory::DataSourceFactory;
use crate::api::adapters::api_adapter::EntityApi;

/// This module integrates datasources with the API system
pub struct DatasourceIntegration;

impl DatasourceIntegration {
    /// Sets up all datasources for entities and integrates them with the API adapter
    /// 
    /// This function handles:
    /// 1. Creating datasources for all entities based on configuration
    /// 2. Mapping entities to their datasources
    /// 3. Preparing entity APIs with proper endpoints
    pub fn setup_entity_datasources<T: 'static + Serialize + Send + Sync>(
        config: &Config
    ) -> HashMap<String, EntityApi<T>> {
        
        // Step 1: Create datasources for all entities
        let datasources = DataSourceFactory::create_datasources::<T>(config);
        
        // Step 2: Set up entities with their datasources
        let mut entity_apis = HashMap::new();
        
        // Step 3: Map entities to datasources and create API handlers
        // TODO: Implement the entity mapping logic
        entity_apis
    }
    
    /// Get datasource for specific entity from the datasources map
    pub fn get_entity_datasource<'a, T: 'static + Serialize + Send + Sync>(
        entity_name: &str,
        datasources: &'a HashMap<String, Box<dyn DataSource<T>>>
    ) -> Option<&'a Box<dyn DataSource<T>>> {
        datasources.get(entity_name)
    }
}



