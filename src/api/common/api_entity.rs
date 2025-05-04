use serde::{Deserialize, Serialize};
use std::any::type_name;

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

// Implement ApiEntity for any type that satisfies its super traits
impl<T> ApiEntity for T 
where 
    T: Serialize + Send + Sync + 'static + for<'de> Deserialize<'de> + Clone
{}