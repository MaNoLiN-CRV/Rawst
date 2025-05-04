use crate::api::adapters::api_adapter::EndpointHandler;
use crate::api::handlers::crud::{create, delete, list, read, update};
use crate::api::handlers::custom::routes;
use crate::config::configuration::Config;
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::base::DataSource;
use crate::api::common::api_entity::ApiEntity;
use std::collections::HashMap;

pub struct ApiHandlerManager<T> {
    config: Config,
    datasource: Box<dyn DataSource<T>>,
}

impl<T> ApiHandlerManager<T>
where
    T: ApiEntity,
{
    /// Creates a new ApiHandlerManager for a specific entity
    pub fn new(config: Config, datasource: Box<dyn DataSource<T>>) -> Self {
        Self { config, datasource }
    }

    /// Initializes all endpoints for a specific entity based on its configuration
    pub fn initialize_endpoints(&self, entity: &Entity) -> HashMap<String, EndpointHandler<T>> {
        let mut endpoints = HashMap::new();

        // Register standard CRUD endpoints
        if entity.endpoints.generate_create {
            create::register_create_endpoint(self.datasource.clone(), entity, &mut endpoints);
        }

        if entity.endpoints.generate_read {
            read::register_read_endpoint(self.datasource.clone(), entity, &mut endpoints);
        }

        if entity.endpoints.generate_update {
            update::register_update_endpoint(self.datasource.clone(), entity, &mut endpoints);
        }

        if entity.endpoints.generate_delete {
            delete::register_delete_endpoint(self.datasource.clone(), entity, &mut endpoints);
        }

        if entity.endpoints.generate_list {
            list::register_list_endpoint(self.datasource.clone(), &entity.name, &mut endpoints);
        }

        // Register custom routes
        for custom_route in &entity.endpoints.custom_routes {
            routes::register_custom_endpoint(
                self.datasource.clone(),
                entity,
                custom_route,
                &mut endpoints,
            );
        }

        endpoints
    }
}
