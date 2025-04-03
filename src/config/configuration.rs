use serde::{Serialize, Deserialize};
use std::fs;
use std::path::Path;
use crate::config::database_config::DatabaseConfig;
use crate::config::server_config::ServerConfig;
use crate::config::entity_config::Entity;
use crate::config::auth_config::AuthConfig;
use crate::config::cors_config::CorsConfig;
use crate::config::documentation_config::DocumentationConfig;
use crate::config::api_config::ApiConfig;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum ConfigError {
    FileNotFound(String), // Configuration file not found
    FileReadError(String, std::io::Error), // Error reading configuration file
    DeserializeError(String, serde_json::Error), // Error deserializing configuration file
    ValidationError(String), // Validation error 
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ConfigError::FileNotFound(path) => write!(f, "Configuration file not found: {}", path),
            ConfigError::FileReadError(path, err) => write!(f, "Error reading configuration file {}: {}", path, err),
            ConfigError::DeserializeError(path, err) => write!(f, "Error deserializing configuration file {}: {}", path, err),
            ConfigError::ValidationError(message) => write!(f, "Configuration validation error: {}", message),
        }
    }
}

impl Error for ConfigError {}

pub trait Configuration {
    fn get_config(&self) -> Result<String, Box<dyn std::error::Error>>;
    fn set_config(&mut self, config: String) -> Result<(), Box<dyn std::error::Error>>;
    fn load_from_file(&mut self, path: &str) -> Result<(), ConfigError>;
    fn save_to_file(&self, path: &str) -> Result<(), Box<dyn std::error::Error>>;
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    // API Configuration
    pub api_version: String,
    pub api_prefix: Option<String>,

    // Server Configuration
    pub server: ServerConfig,

    // Database Configuration
    pub database: DatabaseConfig,

    // Entity Definitions
    pub entities: Vec<Entity>,

    // Authentication Configuration
    pub auth: Option<AuthConfig>,

    // CORS Configuration
    pub cors: CorsConfig,

    // Documentation Configuration
    pub documentation: DocumentationConfig,
}

impl Config {

    /// Create a new Config object with default values.
    pub fn new() -> Self {
        Config {
            api_version: "1.0".to_string(),
            api_prefix: Some("/api".to_string()),
            server: ServerConfig::default(),
            database: DatabaseConfig::default(),
            entities: Vec::new(),
            auth: None,
            cors: CorsConfig::default(),
            documentation: DocumentationConfig::default(),
        }
    }

    /// Convert the Config object to an ApiConfig object.
    /// This function will take the current Config object and convert it into an ApiConfig object.
    pub fn to_api_config(&self) -> ApiConfig {
        ApiConfig {
            database_config: self.database.clone(),
            server_config: self.server.clone(),
            entities: self.entities.clone(),
            global_auth: self.auth.clone(),
            cors_config: self.cors.clone(),
            documentation: self.documentation.clone(),
            api_prefix: self.api_prefix.clone(),
            api_version: self.api_version.clone(),
        }
    }

    /// Create a new Config object from an ApiConfig object.
    /// This function will take an ApiConfig object and convert it into a Config object.
    pub fn from_api_config(api_config: &ApiConfig) -> Self {
        Config {
            api_version: api_config.api_version.clone(),
            api_prefix: api_config.api_prefix.clone(),
            server: api_config.server_config.clone(),
            database: api_config.database_config.clone(),
            entities: api_config.entities.clone(),
            auth: api_config.global_auth.clone(),
            cors: api_config.cors_config.clone(),
            documentation: api_config.documentation.clone(),
        }
    }
}

impl Configuration for Config {

    /// Get the configuration as a JSON string.
    fn get_config(&self) -> Result<String, Box<dyn std::error::Error>> {
        let config = serde_json::to_string_pretty(self)?;
        Ok(config)
    }

    /// Set the configuration from a JSON string.
    fn set_config(&mut self, config: String) -> Result<(), Box<dyn std::error::Error>> {
        let new_config: Config = serde_json::from_str(&config)?;
        *self = new_config;
        Ok(())
    }

    /// Load configuration from a file.
    fn load_from_file(&mut self, path: &str) -> Result<(), ConfigError> {
        if !Path::new(path).exists() {
            return Err(ConfigError::FileNotFound(path.to_string()));
        }

        let config_data = fs::read_to_string(path)
            .map_err(|e| ConfigError::FileReadError(path.to_string(), e))?;

        self.set_config_string(config_data)
    }

    /// Save the configuration to a file.
    fn save_to_file(&self, path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let config_json = self.get_config()?;
        fs::write(path, config_json)?;
        Ok(())
    }

}

impl Config {
    /// Load configuration from a string and set it to the current instance.
    fn set_config_string(&mut self, config: String) -> Result<(), ConfigError> {
        let new_config: Config = serde_json::from_str(&config)
            .map_err(|e| ConfigError::DeserializeError("config.json".to_string(), e))?;
        
        self.validate(&new_config)?;
        *self = new_config;
        Ok(())
    }
    /// Validate the configuration.
    fn validate(&self, config: &Config) -> Result<(), ConfigError> {
        if config.server.port < 1024 || config.server.port > 65535 {
            return Err(ConfigError::ValidationError("Server port must be between 1024 and 65535".to_string()));
        }
        Ok(())
    }
}

/// Load configuration from a file and return a Config object.
/// This function will read the configuration from the specified path,
/// deserialize it into a Config object, and return it.
/// If the file does not exist or there is an error during reading or deserialization,
/// an error will be returned.
///
/// # Arguments
/// * `config_path` - A string slice that holds the path to the configuration file.
///
/// # Returns
/// * `Ok(Config)` - A Result containing the Config object if successful.
pub fn load_configuration(config_path: &str) -> Result<Config, ConfigError> {
    let mut config = Config::new();
    config.load_from_file(config_path)?;
    Ok(config)
}
