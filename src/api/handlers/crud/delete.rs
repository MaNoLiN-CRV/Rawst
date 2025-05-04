use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, EndpointHandler};
use crate::api::handlers::common::utils::{default_headers, handle_datasource_error};
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::base::DataSource;
use crate::error::{Result, RusterApiError};
use crate::api::common::api_entity::ApiEntity;
use std::collections::HashMap;
use std::sync::Arc;

/// Registers a delete endpoint for an entity
pub fn register_delete_endpoint<T>(
    datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
) where
    T: ApiEntity,
{
    let base_path = format!("{}/:id", entity.name);
    let endpoint_key = format!("DELETE:{}", base_path);

    // Handler for the delete endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        let id = request
            .params
            .get("id")
            .ok_or_else(|| RusterApiError::ValidationError("ID parameter missing".to_string()))?;

        match datasource.delete(id) {
            Ok(true) => {
                let headers = default_headers();
                Ok(ApiResponse {
                    status: 204, // No Content
                    headers,
                    body: None,
                })
            }
            Ok(false) => Err(RusterApiError::EntityNotFound(format!(
                "Item with ID {} not found",
                id
            ))),
            Err(err) => Err(handle_datasource_error(err)),
        }
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler).is_some() {
        eprintln!(
            "Warning: Overwriting existing handler for endpoint key: {}",
            endpoint_key
        );
    }
}
