use serde::{Serialize, Deserialize};
use crate::config::specific::auth_config::AuthConfig;
use crate::config::specific::cors_config::CorsConfig;
use crate::config::specific::documentation_config::DocumentationConfig;
use crate::config::specific::database_config::DatabaseConfig;
use crate::config::specific::server_config::ServerConfig;
use crate::config::specific::entity_config::Entity;


#[derive(Serialize, Deserialize, Debug, Clone)]
/// Configuration for the entire API, including database, server, entities, authentication, and more.
pub struct ApiConfig {
    /// Database configuration settings.
    pub database_config: DatabaseConfig,
    /// Server configuration settings.
    pub server_config: ServerConfig,
    /// List of entities exposed by the API.
    pub entities: Vec<Entity>,
    /// Global authentication configuration (optional).
    pub global_auth: Option<AuthConfig>,
    /// Cross-Origin Resource Sharing (CORS) configuration.
    pub cors_config: CorsConfig,
    /// API documentation configuration.
    pub documentation: DocumentationConfig,
    /// Optional prefix for API routes.
    pub api_prefix: Option<String>,
    /// Version of the API.
    pub api_version: String,
}

