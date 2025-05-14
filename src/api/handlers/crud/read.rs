use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody, EndpointHandler};
use crate::api::handlers::common::utils::{default_headers, handle_datasource_error};
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::base::DataSource;
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

        match datasource.get_by_id(id) {
            Ok(Some(item)) => {
                let headers = default_headers();
                Ok(ApiResponse {
                    status: 200,
                    headers,
                    body: Some(ApiResponseBody::Single(item)),
                })
            }
            Ok(None) => Err(RusterApiError::EntityNotFound(format!(
                "Item with ID {} not found",
                id
            ))),
            Err(err) => Err(handle_datasource_error(err)),
        }
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler.clone()).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
    
    // Also register with a full API path to handle both cases
    let api_endpoint_key = format!("GET:api/{}", base_path);
    if endpoints.insert(api_endpoint_key.clone(), handler.clone()).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", api_endpoint_key);
    }
}