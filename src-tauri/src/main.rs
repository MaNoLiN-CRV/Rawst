// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use mysql::*;
use mysql::prelude::*;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct DbConfig {
    host: String,
    port: u16,
    user: String,
    password: String,
    database: String,
}

#[derive(Debug, Serialize)]
struct TableInfo {
    name: String,
}

#[derive(Debug, Deserialize)]
struct TableColumnsRequest {
    config: DbConfig,
    table: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct ApiConfig {
    api_version: String,
    api_prefix: String,
    server: ServerConfig,
    database: DbConfig,
    entities_basic: Vec<EntityBasic>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ServerConfig {
    host: String,
    port: u16,
}

#[derive(Debug, Deserialize, Serialize)]
struct EntityBasic {
    name: String,
    table_name: String,
    fields: Vec<FieldConfig>,
    relationships: Vec<RelationshipConfig>,
    endpoints: EndpointConfig,
    authentication: bool,
    authorization: AuthorizationConfig,
    validations: Vec<ValidationConfig>,
    pagination: PaginationConfig,
}

#[derive(Debug, Deserialize, Serialize)]
struct FieldConfig {
    name: String,
    column_name: String,
    data_type: String,
    required: bool,
    unique: bool,
    searchable: bool,
    default_value: Option<String>,
    description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct RelationshipConfig {
    target_entity: String,
    relation_type: String,
    foreign_key: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct EndpointConfig {
    generate_create: bool,
    generate_read: bool,
    generate_update: bool,
    generate_delete: bool,
    generate_list: bool,
    custom_routes: Vec<CustomRouteConfig>,
}

#[derive(Debug, Deserialize, Serialize)]
struct CustomRouteConfig {
    path: String,
    method: String,
    handler: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct AuthorizationConfig {
    active: bool,
    roles: Vec<RoleConfig>,
    permissions: Vec<PermissionConfig>,
}

#[derive(Debug, Deserialize, Serialize)]
struct RoleConfig {
    name: String,
    description: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct PermissionConfig {
    action: String,
    subject: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct ValidationConfig {
    field: String,
    validation_type: ValidationTypeConfig,
    error_message: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ValidationTypeConfig {
    #[serde(rename = "type")]
    validation_type: String,
    min: Option<i32>,
    max: Option<i32>,
    pattern: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
struct PaginationConfig {
    default_page_size: i32,
    max_page_size: i32,
    page_param_name: String,
    size_param_name: String,
}

#[tauri::command]
async fn get_mariadb_tables(config: DbConfig) -> Result<Vec<TableInfo>, String> {
    let url = format!(
        "mysql://{}:{}@{}:{}/{}",
        config.user, config.password, config.host, config.port, config.database
    );

    let pool = Pool::new(url.as_str()).map_err(|e| e.to_string())?;
    let mut conn = pool.get_conn().map_err(|e| e.to_string())?;

    let tables: Vec<TableInfo> = conn
        .query("SHOW TABLES")
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row: Row| {
            let name: String = row.get(0).unwrap();
            TableInfo { name }
        })
        .collect();

    Ok(tables)
}


/// Gets a list of columns from a MariaDB table
#[tauri::command]
async fn get_mariadb_table_columns(request: TableColumnsRequest) -> Result<Vec<String>, String> {
    let url = format!(
        "mysql://{}:{}@{}:{}/{}",
        request.config.user, request.config.password, request.config.host, request.config.port, request.config.database
    );

    let pool = Pool::new(url.as_str()).map_err(|e| e.to_string())?;
    let mut conn = pool.get_conn().map_err(|e| e.to_string())?;

    let query = format!("SHOW COLUMNS FROM {}", request.table);
    let columns: Vec<String> = conn
        .query(query)
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|row: Row| {
            let name: String = row.get(0).unwrap();
            name
        })
        .collect();

    Ok(columns)
}

/// Saves the configuration to a file
#[tauri::command]
async fn save_configuration(config: ApiConfig) -> Result<String, String> {
    println!("Saving configuration: {:?}", config);
    println!("Entities count: {}", config.entities_basic.len());
    
    let config_json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    
    // Get the current directory
    let config_dir = Path::new("config");
    if !config_dir.exists() {
        fs::create_dir(config_dir).map_err(|e| e.to_string())?;
    }
    
    // Save to file
    let config_file = config_dir.join("api_config.json");
    fs::write(&config_file, config_json).map_err(|e| e.to_string())?;
    
    Ok(format!("Configuration saved to {:?}", config_file))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_mariadb_tables,
            get_mariadb_table_columns,
            save_configuration
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
