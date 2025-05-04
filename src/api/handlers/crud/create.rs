use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody, EndpointHandler};
use crate::api::handlers::common::utils::default_headers;
use crate::config::specific::entity_config::Entity;
use crate::data::datasource::DataSource;
use crate::error::{Result, RusterApiError};
use crate::api::common::api_entity::ApiEntity;
use std::collections::HashMap;
use std::sync::Arc;
use serde::{Deserialize, Serialize};

/// Registers a create endpoint for an entity
pub fn register_create_endpoint<T>(
    datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
)
where
    T: ApiEntity,
{
    let base_path = &entity.name;
    let endpoint_key = format!("POST:{}", base_path);
    
    // Create a thread-safe clone of the datasource for the handler
    let ds = datasource.box_clone();
    
    // Handler for the create endpoint
    let handler = Arc::new(move |request: ApiRequest| -> Result<ApiResponse<T>> {
        // Validate that we have a request body
        let body = match &request.body {
            Some(b) if !b.is_empty() => b,
            _ => return Err(RusterApiError::BadRequest("Request body is required".to_string())),
        };

        // Deserialize the request body into the entity type
        let new_item: T = serde_json::from_str(body).map_err(|e| {
            RusterApiError::BadRequest(format!("Invalid request format: {}", e))
        })?;
        
        // Attempt to create the item in the datasource
        match ds.create(new_item) {
            Ok(created_item) => {
                Ok(ApiResponse {
                    status: 201,
                    headers: default_headers(),
                    body: Some(ApiResponseBody::Single(created_item)),
                })
            },
            Err(e) => {
                Err(RusterApiError::ServerError(format!("Failed to create item: {}", e)))
            }
        }
    });

    // Register the handler for this endpoint
    endpoints.insert(endpoint_key, handler);
}