use rawst::api::common::api_entity::ApiEntity;
use serde::{Serialize, Deserialize};


// Define a generic entity type that implements ApiEntity
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GenericEntity {
    #[serde(flatten)]
    pub data: std::collections::HashMap<String, serde_json::Value>,
}

impl ApiEntity for GenericEntity {
    fn entity_name() -> String {
        "generic".to_string()
    }
}

#[tokio::main]
pub async fn main() {
    
}

