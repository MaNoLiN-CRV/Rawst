use serde::{Serialize, Deserialize};
use std::fs;
use std::path::Path;
use crate::config::specific::{
    database_config::DatabaseConfig, server_config::ServerConfig, entity_config::Entity,
    auth_config::AuthConfig, cors_config::CorsConfig, documentation_config::DocumentationConfig,
    api_config::ApiConfig,
};
use crate::config::shared::{ConfigError, EntityBasic};

pub trait Configuration {
    fn get_config(&self) -> Result<String, Box<dyn std::error::Error>>;
    fn set_config(&mut self, config: String) -> Result<(), Box<dyn std::error::Error>>;
    fn load_from_file(&mut self, path: &str) -> Result<(), ConfigError>;
    fn save_to_file(&self, path: &str) -> Result<(), Box<dyn std::error::Error>>;
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Config {
    // Basic configuration to set in the GUI
    pub api_version: String,
    pub api_prefix: Option<String>,
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub entities_basic: Vec<EntityBasic>,

    // Advanced configuration
    #[serde(default)]
    pub entities_advanced: Vec<Entity>,
    pub auth: Option<AuthConfig>,
    pub cors: CorsConfig,
    pub documentation: DocumentationConfig,
}

impl Config {
    pub fn new() -> Self {
        Config {
            api_version: "1.0".to_string(),
            api_prefix: Some("/api".to_string()),
            server: ServerConfig::default(),
            database: DatabaseConfig::default(),
            entities_basic: Vec::new(),
            entities_advanced: Vec::new(),
            auth: None,
            cors: CorsConfig::default(),
            documentation: DocumentationConfig::default(),
        }
    }

    pub fn to_api_config(&self) -> ApiConfig {
        ApiConfig {
            database_config: self.database.clone(),
            server_config: self.server.clone(),
            entities: Vec::new(),
            global_auth: self.auth.clone(),
            cors_config: self.cors.clone(),
            documentation: self.documentation.clone(),
            api_prefix: self.api_prefix.clone(),
            api_version: self.api_version.clone(),
        }
    }

    pub fn from_api_config(api_config: &ApiConfig) -> Self {
        Config {
            api_version: api_config.api_version.clone(),
            api_prefix: api_config.api_prefix.clone(),
            server: api_config.server_config.clone(),
            database: api_config.database_config.clone(),
            entities_basic: Vec::new(),
            entities_advanced: Vec::new(),
            auth: api_config.global_auth.clone(),
            cors: api_config.cors_config.clone(),
            documentation: api_config.documentation.clone(),
        }
    }

    fn set_config_string(&mut self, config: String) -> Result<(), ConfigError> {
        let new_config: Config = serde_json::from_str(&config)
            .map_err(|e| ConfigError::DeserializeError("config.json".to_string(), e))?;
        self.validate(&new_config)?;
        *self = new_config;
        Ok(())
    }

    fn validate(&self, config: &Config) -> Result<(), ConfigError> {
        if config.server.port < 1024 || config.server.port > 65535 {
            return Err(ConfigError::ValidationError(
                "Server port must be between 1024 and 65535".to_string(),
            ));
        }
        Ok(())
    }
}

impl Configuration for Config {
    fn get_config(&self) -> Result<String, Box<dyn std::error::Error>> {
        let config = serde_json::to_string_pretty(self)?;
        Ok(config)
    }

    fn set_config(&mut self, config: String) -> Result<(), Box<dyn std::error::Error>> {
        let new_config: Config = serde_json::from_str(&config)?;
        *self = new_config;
        Ok(())
    }

    fn load_from_file(&mut self, path: &str) -> Result<(), ConfigError> {
        if !Path::new(path).exists() {
            return Err(ConfigError::FileNotFound(path.to_string()));
        }

        let config_data = fs::read_to_string(path)
            .map_err(|e| ConfigError::FileReadError(path.to_string(), e))?;

        self.set_config_string(config_data)
    }

    fn save_to_file(&self, path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let config_json = self.get_config()?;
        fs::write(path, config_json)?;
        Ok(())
    }
}

/// Load configuration from a file and return a Config object.
/// This function will read the configuration file, parse it, and return a Config object.
/// If the file does not exist or cannot be read, it will return a ConfigError.
///
/// # Arguments
/// * `config_path` - A string slice that holds the path to the configuration file.
///
pub fn load_configuration(config_path: &str) -> Result<Config, ConfigError> {
    let mut config = Config::new();
    config.load_from_file(config_path)?;
    Ok(config)
}
