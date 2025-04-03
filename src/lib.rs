pub mod data {
    pub mod datasource;
}

pub mod config {
    pub mod configuration;
    pub mod shared;
    pub mod specific {
        pub mod api_config;
        pub mod database_config;
        pub mod server_config;
        pub mod entity_config;
        pub mod auth_config;
        pub mod cors_config;
        pub mod documentation_config;
    }
}

pub mod error;
pub mod filemanager;