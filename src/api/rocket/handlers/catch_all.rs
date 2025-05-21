use crate::api::adapters::api_adapter::{ApiRequest, ApiResponse, ApiResponseBody};
use crate::api::handlers::common::utils::default_headers;
use crate::config::specific::entity_config::HttpMethod;
use crate::error::RusterApiError;
use rocket::data::ToByteUnit;
use rocket::http::Status;
use rocket::State;
use serde_json;
use std::collections::HashMap;
use std::path::PathBuf;

// Import our RocketApiState wrapper
use crate::api::rocket::rocket_adapter::RocketApiState;
use crate::api::rocket::rocket_adapter::ApiResponseWrapper;

/// Catch-all handler for GET requests
#[rocket::get("/<path..>")]
pub async fn get_handler(path: PathBuf, state: &State<RocketApiState<serde_json::Value>>) 
-> ApiResponseWrapper<serde_json::Value> {
    // Create API request with the path info but without request body
    let api_request = ApiRequest {
        method: HttpMethod::GET,
        path: path.to_string_lossy().to_string(),
        params: HashMap::new(),
        headers: HashMap::new(),
        body: None,
    };
    let api_response_wrapper = process_request(api_request, state).await;
    ApiResponseWrapper(api_response_wrapper)
}

/// Catch-all handler for POST requests
#[rocket::post("/<path..>", data = "<body>")]
pub async fn post_handler(path: PathBuf, body: rocket::Data<'_>, state: &State<RocketApiState<serde_json::Value>>) 
-> ApiResponseWrapper<serde_json::Value> {
    let body_string = body_to_string(body).await;
    
    // Create API request with the path info and request body
    let api_request = ApiRequest {
        method: HttpMethod::POST,
        path: path.to_string_lossy().to_string(),
        params: HashMap::new(),
        headers: HashMap::new(),
        body: body_string,
    };
    let api_response = process_request(api_request, state).await;
    ApiResponseWrapper(api_response)
}

/// Catch-all handler for PUT requests
#[rocket::put("/<path..>", data = "<body>")]
pub async fn put_handler(path: PathBuf, body: rocket::Data<'_>, state: &State<RocketApiState<serde_json::Value>>) 
-> ApiResponseWrapper<serde_json::Value> {
    let body_string = body_to_string(body).await;
    
    // Create API request with the path info and request body
    let api_request = ApiRequest {
        method: HttpMethod::PUT,
        path: path.to_string_lossy().to_string(),
        params: HashMap::new(),
        headers: HashMap::new(),
        body: body_string,
    };
    let api_response = process_request(api_request, state).await;
    ApiResponseWrapper(api_response)
}

/// Catch-all handler for DELETE requests
#[rocket::delete("/<path..>")]
pub async fn delete_handler(path: PathBuf, state: &State<RocketApiState<serde_json::Value>>) 
-> ApiResponseWrapper<serde_json::Value> {
    // Create API request with the path info
    let api_request = ApiRequest {
        method: HttpMethod::DELETE,
        path: path.to_string_lossy().to_string(),
        params: HashMap::new(),
        headers: HashMap::new(),
        body: None,
    };
    let api_response = process_request(api_request, state).await;
    ApiResponseWrapper(api_response)
}

/// Catch-all handler for PATCH requests
#[rocket::patch("/<path..>", data = "<body>")]
pub async fn patch_handler(path: PathBuf, body: rocket::Data<'_>, state: &State<RocketApiState<serde_json::Value>>) 
-> ApiResponseWrapper<serde_json::Value> {
    let body_string = body_to_string(body).await;
    
    // Create API request with the path info and request body
    let api_request = ApiRequest {
        method: HttpMethod::PATCH,
        path: path.to_string_lossy().to_string(),
        params: HashMap::new(),
        headers: HashMap::new(),
        body: body_string,
    };
    let api_response = process_request(api_request, state).await;
    ApiResponseWrapper(api_response)
}

/// Helper to convert Rocket's Data to String
async fn body_to_string(body: rocket::Data<'_>) 
-> Option<String> {
    use rocket::tokio::io::AsyncReadExt;
    
    let mut stream = body.open(2.mebibytes()); // TODO: Make this configurable
    let mut body_bytes = Vec::new();
    
    if let Ok(_) = stream.read_to_end(&mut body_bytes).await {
        String::from_utf8(body_bytes).ok()
    } else {
        None
    }
}

/// Common request processing logic
pub async fn process_request(api_request: ApiRequest, state: &State<RocketApiState<serde_json::Value>>) 
-> ApiResponse<serde_json::Value> {
    
    let api_adapter_clone = state.api_adapter.clone();
    let timeout_duration = std::time::Duration::from_secs(30);
    match tokio::time::timeout(
        timeout_duration,
        tokio::task::spawn_blocking(move || {
            // DEBUG
            eprintln!("Processing request: {:?} {}", api_request.method, api_request.path);
            let result = api_adapter_clone.handle_request(api_request);
            eprintln!("Request processing completed with result: {:?}", result.is_ok());
            result
        })
    ).await {
        Ok(join_result) => match join_result {
            Ok(result) => match result {
                Ok(api_response) => api_response, 
                Err(err) => {
                    // Convert error to ApiResponse
                    let status = match err {
                        RusterApiError::EntityNotFound(_) => Status::NotFound,
                        RusterApiError::ValidationError(_) => Status::BadRequest,
                        RusterApiError::BadRequest(_) => Status::BadRequest,
                        RusterApiError::DatabaseError(_) => Status::InternalServerError,
                        _ => Status::InternalServerError,
                    };
                    
                    // Log the error for debugging
                    eprintln!("API Error: {:?}", err);
                    
                    // Create API error response
                    ApiResponse {
                        status: status.code,
                        body: Some(ApiResponseBody::Json(serde_json::json!({ "error": err.to_string() }))),
                        headers: default_headers(),
                    }
                }
            },
            Err(join_err) => {
                eprintln!("Task join error: {:?}", join_err);
                ApiResponse {
                    status: Status::InternalServerError.code,
                    body: Some(ApiResponseBody::Json(serde_json::json!({ 
                        "error": "Internal server error: Request processing failed" 
                    }))),
                    headers: default_headers(),
                }
            }
        },
        Err(_) => {
            // Timeout occurred
            eprintln!("Request processing timed out after {} seconds", timeout_duration.as_secs());
            ApiResponse {
                status: Status::GatewayTimeout.code,
                body: Some(ApiResponseBody::Json(serde_json::json!({ 
                    "error": "Request timed out - database operation may be taking too long" 
                }))),
                headers: default_headers(),
            }
        }
    }
}