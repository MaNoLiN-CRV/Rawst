use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug)]
pub enum ConfigError {
    FileNotFound(String),
    FileReadError(String, std::io::Error),
    DeserializeError(String, serde_json::Error),
    ValidationError(String),
}

impl fmt::Display for ConfigError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ConfigError::FileNotFound(path) => write!(f, "Configuration file not found: {}", path),
            ConfigError::FileReadError(path, err) => write!(f, "Error reading file {}: {}", path, err),
            ConfigError::DeserializeError(path, err) => write!(f, "Error deserializing file {}: {}", path, err),
            ConfigError::ValidationError(message) => write!(f, "Validation error: {}", message),
        }
    }
}

impl std::error::Error for ConfigError {}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EntityBasic {
    pub name: String,
    pub table_name: Option<String>,
    pub fields: Vec<FieldBasic>,
    pub authentication: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FieldBasic {
    pub name: String,
    pub data_type: crate::config::specific::entity_config::DataType,
    pub required: bool,
}
