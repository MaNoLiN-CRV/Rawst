use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody, EndpointHandler};
use crate::config::configuration::Config;
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::DataSource;
use crate::error::{Result, RusterApiError};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;

pub struct ApiHandlerManager<T> {
    config: Config,
    datasource: Box<dyn DataSource<T>>,
}

impl<T> ApiHandlerManager<T>
where
    T: Serialize + Send + Sync + 'static,
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
            self.register_create_endpoint(entity, &mut endpoints);
        }

        if entity.endpoints.generate_read {
            self.register_read_endpoint(entity, &mut endpoints);
        }

        if entity.endpoints.generate_update {
            self.register_update_endpoint(entity, &mut endpoints);
        }

        if entity.endpoints.generate_delete {
            self.register_delete_endpoint(entity, &mut endpoints);
        }

        if entity.endpoints.generate_list {
            self.register_list_endpoint(&entity.name, &mut endpoints);
        }

        // Register custom routes
        for custom_route in &entity.endpoints.custom_routes {
            self.register_custom_endpoint(entity, custom_route, &mut endpoints);
        }

        endpoints
    }

    /// Registers a create endpoint for an entity
    fn register_create_endpoint(
        &self,
        _entity: &Entity,
        _endpoints: &mut HashMap<String, EndpointHandler<T>>,
    ) {
        // TODO - Implement the logic for registering the create endpoint
    }

    /// Registers a read endpoint for an entity
    fn register_read_endpoint(
        &self,
        _entity: &Entity,
        _endpoints: &mut HashMap<String, EndpointHandler<T>>,
    ) {
        // TODO - Implement the logic for registering the read endpoint
    }

    /// Registers an update endpoint for an entity
    fn register_update_endpoint(
        &self,
        _entity: &Entity,
        _endpoints: &mut HashMap<String, EndpointHandler<T>>,
    ) {
        // TODO - Implement the logic for registering the update endpoint
    }

    /// Registers a delete endpoint for an entity
    fn register_delete_endpoint(
        &self,
        _entity: &Entity,
        _endpoints: &mut HashMap<String, EndpointHandler<T>>,
    ) {
        // TODO - Implement the logic for registering the delete endpoint
    }

    /// Registers a list endpoint for an entity
    fn register_list_endpoint(
        &self,
        base_path: &str,
        endpoints: &mut HashMap<String, EndpointHandler<T>>,
    ) {
        let datasource = self.datasource.clone();
        let endpoint_key = format!("GET:{}", base_path);

        // Handler for the list endpoint
        let handler = Arc::new(move |_request: ApiRequest| -> Result<ApiResponse<T>> {
            match datasource.get_all() {
                Ok(items) => {
                    let headers = Self::default_headers();
                    Ok(ApiResponse {
                        status: 200,
                        headers,
                        body: Some(ApiResponseBody::List(items)),
                    })
                }
                Err(err) => Err(Self::handle_datasource_error(err)),
            }
        });

        // Handler and endpoint key registration
        if endpoints.insert(endpoint_key.clone(), handler).is_some() {
            eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
        }
    }

    /// Registers a custom endpoint for an entity
    fn register_custom_endpoint(
        &self,
        _entity: &Entity,
        _custom_route: &crate::config::specific::entity_config::CustomRoute,
        _endpoints: &mut HashMap<String, EndpointHandler<T>>,
    ) {
        // TODO - Implement the logic for registering the custom endpoint
    }

    /// Returns default headers for API responses
    fn default_headers() -> HashMap<String, String> {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());
        headers
    }

    /// Handles errors from the datasource and formats them into an API error
    fn handle_datasource_error(err: impl std::fmt::Display) -> RusterApiError {
        let error_message = format!("Error retrieving items: {}", err);
        RusterApiError::EndpointGenerationError(error_message)
    }
}

impl<T> Clone for Box<dyn DataSource<T>> {
    fn clone(&self) -> Self {
        // TODO - Implement the logic for cloning the DataSource
        unimplemented!()
    }
}
