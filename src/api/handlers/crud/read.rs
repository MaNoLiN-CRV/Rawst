use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, EndpointHandler};
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::DataSource;
use crate::error::{Result, RusterApiError};
use crate::api::common::api_entity::ApiEntity;
use std::collections::HashMap;
use std::sync::Arc;

/// Registers a read endpoint for an entity
pub fn register_read_endpoint<T>(
    datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
)
where
    T: ApiEntity,
{
    let base_path = format!("{}/:id", entity.name);
    let endpoint_key = format!("GET:{}", base_path);

    // Handler for the read endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        let id = request
            .params
            .get("id")
            .ok_or_else(|| RusterApiError::ValidationError("ID parameter missing".to_string()))?;

        unimplemented!("Implement the deserialization of the request body and the retrieval of the item by ID");
        
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
}