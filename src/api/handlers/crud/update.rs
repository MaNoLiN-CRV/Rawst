use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, EndpointHandler};
use crate::api::handlers::common::utils::default_headers;
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::DataSource;
use crate::error::{Result, RusterApiError};
use std::collections::HashMap;
use std::sync::Arc;
use serde::Serialize;

/// Registers an update endpoint for an entity
pub fn register_update_endpoint<T>(
    datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
)
where
    T: Serialize + Send + Sync + 'static,
{
    let base_path = format!("{}/:id", entity.name);
    let endpoint_key = format!("PUT:{}", base_path);

    // Handler for the update endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        let id = request
            .params
            .get("id")
            .ok_or_else(|| RusterApiError::ValidationError("ID parameter missing".to_string()))?;

        // TODO: Implement the deserialization of the request body
        // and the update of the existing item

        Ok(ApiResponse {
            status: 200,
            headers: default_headers(),
            body: None, // <-- Should return the updated item
        })
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
}