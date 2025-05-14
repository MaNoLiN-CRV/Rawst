use serde::{Deserialize, Serialize};
use std::any::type_name;
use serde_json::Value;

// ApiEntity trait that defines common operations for API entities
pub trait ApiEntity: Serialize + Send + Sync + 'static + for<'de> Deserialize<'de> + Clone {
    /// Returns the name of the entity.
    /// By default, uses the type name as the entity name.
    fn entity_name() -> String {
        let full_type_name = type_name::<Self>();
        let parts: Vec<&str> = full_type_name.split("::").collect();
        let type_name = parts.last().unwrap_or(&"Unknown");
        
        type_name.to_string()
    }
}

// Specific implementation for serde_json::Value
impl ApiEntity for Value {
    // Override the default implementation
    fn entity_name() -> String {
        // This method won't be called in practice, as we'll be using entity names from config
        // But we provide it to satisfy the trait
        "JsonValue".to_string()
    }
}

