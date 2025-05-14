// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use mysql::*;
use mysql::prelude::*;
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::fs;
use std::path::Path;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};

// Import the main library
use rawst::{
    config::{
        configuration::Config,
        specific::{
            server_config::ServerConfig,
            database_config::DatabaseConfig,
            cors_config::CorsConfig,
            documentation_config::DocumentationConfig,
        },
        shared::EntityBasic,
    },
    api::adapters::api_adapter::ApiAdapter,
};

#[derive(Debug, Serialize, Deserialize)]
struct DbConfig {
    host: String,
    port: u16,
    username: String,
    password: String,
    database_name: String,
    db_type: String,
    connection_string: String,
    ssl_enabled: bool,
    max_connections: Option<u32>,
    timeout_seconds: Option<u32>,
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
    database: DatabaseConfig,
    entities_basic: Vec<EntityBasic>,
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

#[derive(Debug, Deserialize)]
struct ApiTestRequest {
    url: String,
    method: String,
    body: Option<String>,
}

// Add server state tracking
static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);
static SERVER_ERROR: Mutex<Option<String>> = Mutex::new(None);

#[tauri::command]
async fn get_mariadb_tables(config: DbConfig) -> Result<Vec<TableInfo>, String> {
    let url = format!(
        "mysql://{}:{}@{}:{}/{}",
        config.username, config.password, config.host, config.port, config.database_name
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
        request.config.username, request.config.password, request.config.host, request.config.port, request.config.database_name
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
    
    // Ensure server config has all required fields
    let server_config = ServerConfig {
        host: config.server.host,
        port: config.server.port,
        request_timeout_seconds: config.server.request_timeout_seconds,
        max_payload_size_mb: config.server.max_payload_size_mb,
        rate_limiting: config.server.rate_limiting,
        logging_level: config.server.logging_level,
    };

    // Create a new config with all required fields
    let config_to_save = ApiConfig {
        api_version: config.api_version,
        api_prefix: config.api_prefix,
        server: server_config,
        database: config.database,
        entities_basic: config.entities_basic,
    };
    
    let config_json = serde_json::to_string_pretty(&config_to_save).map_err(|e| e.to_string())?;
    
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

/// Retrieves the current API configuration
#[tauri::command]
async fn get_current_configuration() -> Result<ApiConfig, String> {
    let config_dir = Path::new("config");
    let config_file = config_dir.join("api_config.json");
    
    if !config_file.exists() {
        return Err("Configuration file not found".to_string());
    }
    
    let config_content = fs::read_to_string(config_file)
        .map_err(|e| format!("Failed to read configuration file: {}", e))?;
    
    let config: ApiConfig = serde_json::from_str(&config_content)
        .map_err(|e| format!("Failed to parse configuration: {}", e))?;
    
    Ok(config)
}

/// Tests an API endpoint with the given request
#[tauri::command]
async fn test_api_endpoint(url: String, method: String, body: Option<String>) -> Result<String, String> {
    println!("Testing API endpoint: {} {}", method, url);
    
    let client = reqwest::Client::new();
    
    let mut request_builder = match method.to_uppercase().as_str() {
        "GET" => client.get(&url),
        "POST" => client.post(&url),
        "PUT" => client.put(&url),
        "DELETE" => client.delete(&url),
        _ => return Err(format!("Unsupported HTTP method: {}", method)),
    };
    
    // Add JSON content-type header if we have a body
    if let Some(body_content) = &body {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        request_builder = request_builder.headers(headers);
        
        if method.to_uppercase() == "POST" || method.to_uppercase() == "PUT" {
            request_builder = request_builder.body(body_content.clone());
        }
    }
    
    let response = request_builder
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let status = response.status();
    let headers = response.headers().clone();
    
    // Try to get response as JSON
    let response_text = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;
    
    // Format response as readable JSON if possible
    let formatted_response = if let Ok(json) = serde_json::from_str::<serde_json::Value>(&response_text) {
        serde_json::to_string_pretty(&json).unwrap_or(response_text)
    } else {
        response_text
    };
    
    // Prepare response
    let result = format!(
        "Status: {} {}\n\nHeaders:\n{}\n\nBody:\n{}",
        status.as_u16(),
        status.canonical_reason().unwrap_or(""),
        headers
            .iter()
            .map(|(k, v)| format!("{}: {}", k.as_str(), v.to_str().unwrap_or("<binary>")))
            .collect::<Vec<String>>()
            .join("\n"),
        formatted_response
    );
    
    Ok(result)
}

/// Starts the API server with the current configuration
#[tauri::command]
async fn start_api_server() -> Result<String, String> {
    println!("Starting API server...");
    
    // Check if server is already running
    if SERVER_RUNNING.load(Ordering::SeqCst) {
        return Err("Server is already running".to_string());
    }
    
    // Get the current configuration
    let config = get_current_configuration().await?;
    
    // Validate database configuration
    if !validate_database_config(&config.database).await {
        return Err("Invalid database configuration".to_string());
    }
    
    // Convert the configuration to the format expected by the API server
    let api_config = Config {
        api_version: config.api_version,
        api_prefix: Some(config.api_prefix),
        server: ServerConfig {
            host: config.server.host,
            port: config.server.port,
            request_timeout_seconds: config.server.request_timeout_seconds,
            max_payload_size_mb: config.server.max_payload_size_mb,
            rate_limiting: config.server.rate_limiting,
            logging_level: config.server.logging_level,
        },
        database: DatabaseConfig {
            db_type: config.database.db_type.clone(),
            host: config.database.host.clone(),
            port: Some(config.database.port.unwrap_or(3306) as u16),
            database_name: config.database.database_name.clone(),
            username: config.database.username.clone(),
            password: config.database.password.clone(),
            connection_string: config.database.connection_string.clone(),
            max_connections: config.database.max_connections,
            timeout_seconds: config.database.timeout_seconds,
            ssl_enabled: config.database.ssl_enabled,
        },
        entities_basic: config.entities_basic,
        entities_advanced: vec![],
        auth: None,
        cors: CorsConfig::default(),
        documentation: DocumentationConfig::default(),
    };
    
    // Set server as starting
    SERVER_RUNNING.store(true, Ordering::SeqCst);
    *SERVER_ERROR.lock().unwrap() = None;
    
    // Start the API server in a new thread
    std::thread::spawn(move || {
        match ApiAdapter::<serde_json::Value>::new(api_config, std::collections::HashMap::new()).start_server() {
            Ok(_) => {
                println!("API server started successfully");
            }
            Err(e) => {
                println!("Error starting API server: {:?}", e);
                *SERVER_ERROR.lock().unwrap() = Some(e.to_string());
                SERVER_RUNNING.store(false, Ordering::SeqCst);
            }
        }
    });
    
    // Wait a bit to check if server started successfully
    std::thread::sleep(std::time::Duration::from_secs(1));
    
    if let Some(error) = SERVER_ERROR.lock().unwrap().as_ref() {
        SERVER_RUNNING.store(false, Ordering::SeqCst);
        Err(format!("Failed to start server: {}", error))
    } else {
        Ok("API server started successfully".to_string())
    }
}

async fn validate_database_config(config: &DatabaseConfig) -> bool {
    let url = format!(
        "mysql://{}:{}@{}:{}/{}",
        config.username,
        config.password,
        config.host,
        config.port.unwrap_or(3306),
        config.database_name
    );

    match Pool::new(url.as_str()) {
        Ok(pool) => {
            match pool.get_conn() {
                Ok(_) => true,
                Err(_) => false
            }
        }
        Err(_) => false
    }
}

/// Gets the server status
#[tauri::command]
async fn get_server_status() -> Result<String, String> {
    if SERVER_RUNNING.load(Ordering::SeqCst) {
        if let Some(error) = SERVER_ERROR.lock().unwrap().as_ref() {
            Ok(format!("error: {}", error))
        } else {
            Ok("running".to_string())
        }
    } else {
        Ok("stopped".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_mariadb_tables,
            get_mariadb_table_columns,
            save_configuration,
            get_current_configuration,
            test_api_endpoint,
            start_api_server,
            get_server_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
