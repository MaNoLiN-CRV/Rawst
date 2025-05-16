use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody, EndpointHandler};
use crate::api::handlers::common::utils::{default_headers, handle_datasource_error};
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::base::DataSource;
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
    let entity_name = entity.name.clone();

    // Handler for the update endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        let id = request
            .params
            .get("id")
            .ok_or_else(|| RusterApiError::ValidationError("ID parameter missing".to_string()))?;

        let body = match &request.body {
            Some(b) if !b.is_empty() => b,
            _ => return Err(RusterApiError::BadRequest("Request body is required".to_string())),
        };

        let updated_item: T = serde_json::from_str(body).map_err(|e| {
            RusterApiError::BadRequest(format!("Invalid request format: {}", e))
        })?;

        // First check if the item exists
        match datasource.get_by_id(id, Some(&entity_name)) {
            Ok(Some(_)) => {
                // Item exists, proceed with update
                match datasource.update(id, updated_item , Some(&entity_name)) {
                    Ok(item) => {
                        let headers = default_headers();
                        Ok(ApiResponse {
                            status: 200,
                            headers,
                            body: Some(ApiResponseBody::Single(item)),
                        })
                    }
                    Err(err) => Err(handle_datasource_error(err)),
                }
            }
            Ok(None) => {
                // Item doesn't exist
                Err(RusterApiError::EntityNotFound(format!(
                    "Item with ID {} not found",
                    id
                )))
            }
            Err(err) => Err(handle_datasource_error(err)),
        }
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler.clone()).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
    
    // Also register with a full API path to handle both cases
    let api_endpoint_key = format!("PUT:api/{}", base_path);
    if endpoints.insert(api_endpoint_key.clone(), handler.clone()).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", api_endpoint_key);
    }
}