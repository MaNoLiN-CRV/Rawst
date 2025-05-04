use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody, EndpointHandler};
use crate::api::handlers::common::utils::{default_headers, handle_datasource_error};
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::DataSource;
use crate::error::{Result, RusterApiError};
use crate::api::common::api_entity::ApiEntity;
use std::collections::HashMap;
use std::sync::Arc;

/// Registers an update endpoint for an entity
pub fn register_update_endpoint<T>(
    datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
)
where
    T: ApiEntity,
{
    let base_path = format!("{}/:id", entity.name);
    let endpoint_key = format!("PUT:{}", base_path);

    // Handler for the update endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        let id = request
            .params
            .get("id")
            .ok_or_else(|| RusterApiError::ValidationError("ID parameter missing".to_string()))?;
        
        // First check if the item exists
        match datasource.get_by_id(id) {
            Ok(Some(_)) => {
                // Deserialize the request body into the entity type
                let updated_item: T = serde_json::from_str(request.body.as_deref().unwrap_or("{}"))
                    .map_err(|e| RusterApiError::BadRequest(format!("Invalid request format: {}", e)))?;
                
                // Attempt to update the item in the datasource
                match datasource.update(id, updated_item) {
                    Ok(updated_item) => {
                        Ok(ApiResponse {
                            status: 200,
                            headers: default_headers(),
                            body: Some(ApiResponseBody::Single(updated_item)),
                        })
                    }
                    Err(e) => Err(RusterApiError::ServerError(format!("Failed to update item: {}", e))),
                }
            }
            Ok(None) => Err(RusterApiError::EntityNotFound(format!(
                "Item with ID {} not found",
                id
            ))),
            Err(err) => Err(handle_datasource_error(err)),
        }
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
}