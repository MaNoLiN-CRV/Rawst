use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody, EndpointHandler};
use crate::api::handlers::common::utils::{default_headers, handle_datasource_error};
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::DataSource;
use crate::error::Result;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;

/// Registers a create endpoint for an entity
pub fn register_create_endpoint<T>(
    datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
)
where
    T: Serialize + Send + Sync + 'static,
{
    let base_path = &entity.name;
    let endpoint_key = format!("POST:{}", base_path);

    // Handler for the create endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        // TODO: Implement the deserialization of the request body
        // and the creation of the new item

        Ok(ApiResponse {
            status: 201,
            headers: default_headers(),
            body: None, // <-- Should return the created item
        })
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
}