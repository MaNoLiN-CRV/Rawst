use rawst::filemanager::file::get_config_file;
use rawst::config::configuration::{Config, load_configuration};
use rawst::api::adapters::api_adapter::ApiAdapter;
use rawst::data::datasource_factory::DataSourceFactory;
use rawst::api::common::api_entity::ApiEntity;
use serde::{Serialize, Deserialize};

pub mod filemanager;
pub mod request_manager;

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

