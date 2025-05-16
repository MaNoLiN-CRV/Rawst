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
        
        eprintln!("Debug: Path parts: {:?}", path_parts);
        eprintln!("Debug: API prefix: {:?}", self.config.api_prefix);
        eprintln!("Debug: Available entities: {:?}", self.entities.keys().collect::<Vec<_>>());
        
        // Extract entity name accounting for API prefix
        let entity_name;

        // Check if the API prefix is set and adjust the entity name accordingly
        if let Some(api_prefix) = &self.config.api_prefix {
            let prefix = api_prefix.trim_start_matches('/').trim_end_matches('/');
            
            if !path_parts.is_empty() && path_parts[0] == prefix {
                if path_parts.len() < 2 {
                    return Err(RusterApiError::ValidationError("Invalid path: missing entity name".to_string()));
                }
                // Normilize the entity name to lowercase
                entity_name = path_parts[1].to_lowercase();
            } else if !path_parts.is_empty() {
                // If the prefix is not present, use the first part of the path
                entity_name = path_parts[0].to_lowercase();
            } else {
                return Err(RusterApiError::ValidationError("Invalid path: empty path".to_string()));
            }
        } else if !path_parts.is_empty() {
            // If no prefix is set, use the first part of the path
            entity_name = path_parts[0].to_lowercase();
        } else {
            return Err(RusterApiError::ValidationError("Invalid path: empty path".to_string()));
        };
        
        // Add more debug logging
        eprintln!("Debug: Extracted entity name: {}", entity_name);
        
        // Entity name search is case insensitive
        let entity_api = self.entities.iter()
            .find_map(|(key, value)| {
                if key.to_lowercase() == entity_name {
                    Some(value)
                } else {
                    None
                }
            });
        
        if let Some(entity_api) = entity_api {
            // Generate possible keys based on the request method and entity name
            let possible_keys = vec![
                // Without prefix
                format!("{:?}:{}", request.method, entity_name),
                // Key with ID without prefix
                format!("{:?}:{}/:id", request.method, entity_name),
                // Key with API prefix
                format!("{:?}:api/{}", request.method, entity_name),
                // Key with API prefix and ID
                format!("{:?}:api/{}/:id", request.method, entity_name),
            ];
            
            eprintln!("Debug: Trying keys: {:?}", possible_keys);
            eprintln!("Debug: Available endpoints: {:?}", entity_api.endpoints.keys().collect::<Vec<_>>());

            // Try all possible keys
            for key in &possible_keys {
                if let Some(handler) = entity_api.endpoints.get(key) {
                    eprintln!("Debug: Found handler with key: {}", key);
                    return match handler(request) {
                        Ok(response) => Ok(response),
                        Err(RusterApiError::EndpointGenerationError(msg)) => {
                            eprintln!("Debug: Entity mapping error: {}", msg);
                            Ok(ApiResponse {
                                status: 500,
                                headers: HashMap::new(),
                                body: None,
                            })
                        }
                        Err(e) => Err(e)
                    };
                }
            }

            // If no exact key is found, look for a partial match
            let mut found_handler = None;
            for (key, handler) in &entity_api.endpoints {
                if key.contains(&entity_name) && key.starts_with(&format!("{:?}", request.method)) {
                    found_handler = Some(handler);
                    eprintln!("Debug: Found handler with partial match: {}", key);
                    break;
                }
            }
            
            if let Some(handler) = found_handler {
                handler(request)
            } else {
                Err(RusterApiError::EntityNotFound(format!(
                    "Endpoint not found for {:?} {}. Available endpoints: {:?}",
                    request.method, 
                    request.path, 
                    entity_api.endpoints.keys().collect::<Vec<_>>()
                )))
            }
        } else {
            // If the entity is not found, return an error
            Err(RusterApiError::EntityNotFound(format!(
                "Entity not found: {}. Available entities: {:?}",
                entity_name,
                self.entities.keys().collect::<Vec<_>>()
            )))
        }
    }
}

// Implement the Clone trait for ApiAdapter
// This allows the ApiAdapter to be cloned, which is useful for passing it around
impl<T: ApiEntity> Clone for ApiAdapter<T> {
    fn clone(&self) -> Self {
        // Create a new ApiAdapter with the same configuration but with shared references to the data
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
    
    // Normalize all datasource keys for better matching
    let normalized_datasources: HashMap<String, &Box<dyn DataSource<T>>> = datasources.iter()
        .map(|(k, v)| (k.to_lowercase(), v))
        .collect();

    // Process all entities (both advanced and basic)
    let mut processed_entities = std::collections::HashSet::new();

    // First process advanced entities
    for entity in &config.entities_advanced {
        println!("Processing advanced entity: {}", entity.name);
        let normalized_name = entity.name.to_lowercase();
        if !processed_entities.contains(&normalized_name) {
            // Search for the datasource by both normalized and exact name
            let datasource = normalized_datasources.get(&normalized_name)
                .copied()
                .or_else(|| datasources.get(&entity.name));
            
            if let Some(datasource) = datasource {
                // Initialize the handler manager for the entity
                let handler_manager = ApiHandlerManager::new(config.clone(), (*datasource).clone());

                // Get the initialized endpoints for the entity
                let endpoints = handler_manager.initialize_endpoints(entity);

                // Add the entity's API configuration to the HashMap
                entities.insert(
                    entity.name.clone(),
                    EntityApi {
                        datasource: (*datasource).clone(),
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

        // Normalize the entity name to lowercase for case-insensitive matching
        let normalized_name = entity_basic.name.to_lowercase();
        
        if !processed_entities.contains(&normalized_name) {
            // Search for the datasource by both normalized and exact name
            let datasource = normalized_datasources.get(&normalized_name)
                .or_else(|| normalized_datasources.get(&entity_basic.name.to_lowercase()))
                .map(|ds| *ds)
                .or_else(|| {
                    datasources.get(&entity_basic.name)
                });
           
            if let Some(datasource) = datasource {
                println!("Found datasource for basic entity: {}", entity_basic.name);
                
                // Prepare the entity configuration
                // Use the entity_basic fields to create the Entity struct
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
                let handler_manager = ApiHandlerManager::new(config.clone(), (*datasource).clone());

                // Get the initialized endpoints for the entity
                let endpoints = handler_manager.initialize_endpoints(&entity);

                // Register the available endpoints
                println!("Registered endpoints for {}: {:?}", 
                         entity_basic.name, 
                         endpoints.keys().collect::<Vec<_>>());

                // Add the entity's API configuration to the HashMap
                // Use the normalized name as the key
                entities.insert(
                    normalized_name.clone(),
                    EntityApi {
                        datasource: (*datasource).clone(),
                        endpoints,
                    },
                );
                processed_entities.insert(normalized_name);
                println!("Successfully mapped basic entity: {}", entity_basic.name);
            } else {
                println!("No datasource found for basic entity: {}. Available datasources: {:?}", 
                         entity_basic.name, 
                         datasources.keys().collect::<Vec<_>>());
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
