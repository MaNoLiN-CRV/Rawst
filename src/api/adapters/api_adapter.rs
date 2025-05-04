use serde::{Serialize, Deserialize};

// Actualizar la importación del ApiHandlerManager a la nueva ruta
use crate::api::handlers::manager::ApiHandlerManager;
use crate::api::rocket::rocket_adapter;
use crate::config::configuration::Config;
use crate::config::specific::entity_config::HttpMethod;
use crate::data::datasource::DataSource;
use crate::error::{Result, RusterApiError};
use std::collections::HashMap;
use std::sync::Arc;

pub type EndpointHandler<T> = Arc<dyn Fn(ApiRequest) -> Result<ApiResponse<T>> + Send + Sync>;

/// Represents an API request with all necessary data
pub struct ApiRequest {
    pub method: HttpMethod,
    pub path: String,
    pub params: HashMap<String, String>,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

/// Represents an API response with typed data payload
#[derive(Serialize, Deserialize)]
pub enum ApiResponseBody<T> {
    Single(T),
    List(Vec<T>),
    Json(T)
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: Option<ApiResponseBody<T>>,
}

/// Represents a single entity's API configuration

pub struct EntityApi<T> {
    pub datasource: Box<dyn DataSource<T>>,
    pub endpoints: HashMap<String, EndpointHandler<T>>,
}

/// Defines the API adapter interface for handling API operations
/// This trait is used for both the actual implementation and for mocking in tests
pub trait ApiAdapterTrait<T> {
    /// Handles an API request and returns a response
    fn handle_request(&self, request: ApiRequest) -> Result<ApiResponse<T>>;
}

/// ApiAdapter serves as the main interface for handling API operations.
/// It acts as a bridge between the configuration and the data sources for each entity.
pub struct ApiAdapter<T> {
    pub config: Config,
    pub entities: HashMap<String, EntityApi<T>>,
}

impl<T: 'static + Serialize + Send + Sync> ApiAdapter<T> {
    /// Creates a new ApiAdapter with the provided configuration and data sources
    pub fn new(config: Config, datasources: HashMap<String, Box<dyn DataSource<T>>>) -> Self {
        let mut entities = HashMap::new(); 
        entity_mapper(&config, datasources, &mut entities);
        Self { config, entities }
    }

    /// Starts the API server based on the configuration
    pub fn start_server(&self) -> Result<()> {
        // Use the Rocket adapter for server implementation
        rocket_adapter::start_server(self.clone())
    }
}

// Implement the ApiAdapterTrait for the ApiAdapter struct
impl<T: 'static + Serialize + Send + Sync> ApiAdapterTrait<T> for ApiAdapter<T> {
    /// Handles an API request and returns a response
    fn handle_request(&self, request: ApiRequest) -> Result<ApiResponse<T>> {
        let entity_name = request
            .path
            .split('/')
            .nth(1)
            .ok_or_else(|| RusterApiError::ValidationError("Invalid path".to_string()))?;

        // Find the entity's API configuration
        if let Some(entity_api) = self.entities.get(entity_name) {
            let endpoint_key = format!("{:?}:{}", request.method, request.path);

            // Find the handler for the specific endpoint
            if let Some(handler) = entity_api.endpoints.get(&endpoint_key) {
                handler(request)
            } else {
                Err(RusterApiError::EntityNotFound(format!(
                    "Endpoint not found: {}",
                    endpoint_key
                )))
            }
        } else {
            Err(RusterApiError::EntityNotFound(format!(
                "Entity not found: {}",
                entity_name
            )))
        }
    }
}

// Implementar Clone para ApiAdapter para poder usarlo con el adaptador de Rocket
impl<T: 'static + Serialize + Send + Sync> Clone for ApiAdapter<T> {
    fn clone(&self) -> Self {
        // Crear un nuevo ApiAdapter con las mismas configuraciones pero con referencias compartidas a los datos
        Self {
            config: self.config.clone(),
            entities: self.entities.clone(),
        }
    }
}

/// Maps the entities from the configuration to their respective data sources and handlers
fn entity_mapper<T: 'static + Serialize + Send + Sync>(
    config: &Config,
    datasources: HashMap<String, Box<dyn DataSource<T>>>,
    entities: &mut HashMap<String, EntityApi<T>>,
) {
    for entity in &config.entities_advanced {
        if let Some(datasource) = datasources.get(&entity.name) {
            // Initialize the handler manager for the entity
            let handler_manager = ApiHandlerManager::new(config.clone(), datasource.clone());

            // Get the initialized endpoints for the entity
            let endpoints = handler_manager.initialize_endpoints(entity);

            // Add the entity's API configuration to the HashMap
            entities.insert(
                entity.name.clone(),
                EntityApi {
                    datasource: datasource.clone(),
                    endpoints,
                },
            );
        }
    }
}

impl<T> Clone for Box<dyn DataSource<T>> {
    fn clone(&self) -> Self {
        // Implement the clone logic for your DataSource
        // This is a placeholder implementation
        unimplemented!()
    }
}

impl<T: Serialize + Send + Sync + 'static> Clone for EntityApi<T> {
    fn clone(&self) -> Self {
        Self {
            datasource: self.datasource.clone(),
            endpoints: self.endpoints.clone(),
        }
    }
}
