use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, EndpointHandler};
use crate::api::handlers::common::utils::default_headers;
use crate::config::specific::entity_config::{CustomRoute, Entity, HttpMethod};
use crate::data::datasource::base::DataSource;
use crate::error::Result;
use crate::api::common::api_entity::ApiEntity;
use std::collections::HashMap;
use std::sync::Arc;

/// Registers a custom endpoint for an entity
pub fn register_custom_endpoint<T>(
    _datasource: Box<dyn DataSource<T>>,
    entity: &Entity,
    custom_route: &CustomRoute,
    endpoints: &mut HashMap<String, EndpointHandler<T>>,
)
where
    T: ApiEntity,
{
    let path = format!("{}{}", entity.name, custom_route.path);
    let endpoint_key = format!("{:?}:{}", custom_route.method, path);

    let method = custom_route.method.clone();

    let handler = Arc::new(move |_request: ApiRequest| -> Result<ApiResponse<T>> {
        match method {
            HttpMethod::GET => {
            }
            HttpMethod::POST => {
            }
            HttpMethod::PUT => {
            }
            HttpMethod::DELETE => {
            }
            HttpMethod::PATCH => {
            }
        }

        Ok(ApiResponse {
            status: 200,
            headers: default_headers(),
            body: None,
        })
    });

    // Handler and endpoint key registration
    if endpoints.insert(endpoint_key.clone(), handler).is_some() {
        eprintln!("Warning: Overwriting existing handler for endpoint key: {}", endpoint_key);
    }
}
