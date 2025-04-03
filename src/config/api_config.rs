use serde::{Serialize, Deserialize};
use crate::config::database_config::DatabaseConfig;
use crate::config::server_config::ServerConfig;
use crate::config::entity_config::Entity;
use crate::config::auth_config::AuthConfig;
use crate::config::cors_config::CorsConfig;
use crate::config::documentation_config::DocumentationConfig;

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

