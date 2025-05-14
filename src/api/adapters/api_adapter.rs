use serde::{Serialize, Deserialize};

// Actualizar la importación del ApiHandlerManager a la nueva ruta
use crate::api::handlers::manager::ApiHandlerManager;
use crate::api::rocket::rocket_adapter;
use crate::config::configuration::Config;
use crate::config::specific::entity_config::{Entity, HttpMethod};
use crate::data::datasource::base::DataSource;
use crate::error::{Result, RusterApiError};
use crate::api::common::api_entity::ApiEntity;
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

impl<T: ApiEntity> ApiAdapter<T> {
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
impl<T: ApiEntity> ApiAdapterTrait<T> for ApiAdapter<T> {
    /// Handles an API request and returns a response
    fn handle_request(&self, request: ApiRequest) -> Result<ApiResponse<T>> {
        // Split the path into components
        let path_parts: Vec<&str> = request.path.split('/').filter(|s| !s.is_empty()).collect();
        
        // Add debug logging
        eprintln!("Debug: Path parts: {:?}", path_parts);
        eprintln!("Debug: API prefix: {:?}", self.config.api_prefix);
        eprintln!("Debug: Available entities: {:?}", self.entities.keys().collect::<Vec<_>>());
        
        // Extract entity name accounting for API prefix
        let entity_name = if let Some(api_prefix) = &self.config.api_prefix {
            let prefix = api_prefix.trim_start_matches('/').trim_end_matches('/');
            
            // If the path starts with the API prefix, the entity name is the next part
            if !path_parts.is_empty() && path_parts[0] == prefix {
                if path_parts.len() < 2 {
                    return Err(RusterApiError::ValidationError("Invalid path: missing entity name".to_string()));
                }
                path_parts[1]
            } else if !path_parts.is_empty() {
                // If no prefix, the first part is the entity name
                path_parts[0]
            } else {
                return Err(RusterApiError::ValidationError("Invalid path: empty path".to_string()));
            }
        } else if !path_parts.is_empty() {
            // No API prefix configured, first part is the entity name
            path_parts[0]
        } else {
            return Err(RusterApiError::ValidationError("Invalid path: empty path".to_string()));
        };
        
        // Add more debug logging
        eprintln!("Debug: Extracted entity name: {}", entity_name);
        eprintln!("Debug: Endpoint key: {:?}:{}", request.method, request.path);

        // Find the entity's API configuration
        if let Some(entity_api) = self.entities.get(entity_name) {
            let endpoint_key = format!("{:?}:{}", request.method, request.path);
            
            // Add debug logging for endpoints
            eprintln!("Debug: Available endpoints for entity {}: {:?}", 
                     entity_name, 
                     entity_api.endpoints.keys().collect::<Vec<_>>());

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
impl<T: ApiEntity> Clone for ApiAdapter<T> {
    fn clone(&self) -> Self {
        // Crear un nuevo ApiAdapter con las mismas configuraciones pero con referencias compartidas a los datos
        Self {
            config: self.config.clone(),
            entities: self.entities.clone(),
        }
    }
}

/// Maps the entities from the configuration to their respective data sources and handlers
fn entity_mapper<T: ApiEntity>(
    config: &Config,
    datasources: HashMap<String, Box<dyn DataSource<T>>>,
    entities: &mut HashMap<String, EntityApi<T>>,
) {
    println!("Mapping entities to handlers...");
    println!("Available datasources: {:?}", datasources.keys().collect::<Vec<_>>());
    println!("Advanced entities count: {}", config.entities_advanced.len());
    println!("Basic entities count: {}", config.entities_basic.len());

    // Process all entities (both advanced and basic)
    let mut processed_entities = std::collections::HashSet::new();

    // First process advanced entities
    for entity in &config.entities_advanced {
        println!("Processing advanced entity: {}", entity.name);
        if !processed_entities.contains(&entity.name) {
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
                processed_entities.insert(entity.name.clone());
                println!("Successfully mapped advanced entity: {}", entity.name);
            } else {
                println!("No datasource found for advanced entity: {}", entity.name);
            }
        }
    }

    // Then process basic entities
    for entity_basic in &config.entities_basic {
        println!("Processing basic entity: {}", entity_basic.name);
        if !processed_entities.contains(&entity_basic.name) {
            if let Some(datasource) = datasources.get(&entity_basic.name) {
                println!("Found datasource for basic entity: {}", entity_basic.name);
                
                // Convert EntityBasic to Entity
                let entity = Entity {
                    name: entity_basic.name.clone(),
                    table_name: entity_basic.table_name.clone(),
                    fields: entity_basic.fields.iter().map(|f| {
                        crate::config::specific::entity_config::Field {
                            name: f.name.clone(),
                            column_name: Some(f.name.clone()),
                            data_type: f.data_type.clone(),
                            required: f.required,
                            unique: false,
                            searchable: true,
                            default_value: None,
                            description: None,
                        }
                    }).collect(),
                    relationships: Vec::new(),
                    endpoints: crate::config::specific::entity_config::EndpointConfig {
                        generate_create: true,
                        generate_read: true,
                        generate_update: true,
                        generate_delete: true,
                        generate_list: true,
                        custom_routes: Vec::new(),
                    },
                    authentication: entity_basic.authentication,
                    authorization: crate::config::specific::entity_config::Authorization {
                        active: false,
                        roles: Vec::new(),
                        permissions: Vec::new(),
                    },
                    validations: Vec::new(),
                    pagination: None,
                };

                // Initialize the handler manager for the entity
                let handler_manager = ApiHandlerManager::new(config.clone(), datasource.clone());

                // Get the initialized endpoints for the entity
                let endpoints = handler_manager.initialize_endpoints(&entity);

                // Add the entity's API configuration to the HashMap
                entities.insert(
                    entity_basic.name.clone(),
                    EntityApi {
                        datasource: datasource.clone(),
                        endpoints,
                    },
                );
                processed_entities.insert(entity_basic.name.clone());
                println!("Successfully mapped basic entity: {}", entity_basic.name);
            } else {
                println!("No datasource found for basic entity: {}", entity_basic.name);
            }
        }
    }

    println!("Total entities mapped: {}", entities.len());
    println!("Mapped entities: {:?}", entities.keys().collect::<Vec<_>>());
}

impl<T> Clone for Box<dyn DataSource<T>> {
    fn clone(&self) -> Self {
        // Use the box_clone method defined in the DataSource trait
        self.box_clone()
    }
}

impl<T: ApiEntity> Clone for EntityApi<T> {
    fn clone(&self) -> Self {
        Self {
            datasource: self.datasource.clone(),
            endpoints: self.endpoints.clone(),
        }
    }
}
