use crate::api::adapters::api_adapter::{ApiAdapter, ApiRequest, ApiResponse, ApiResponseBody};
use crate::config::specific::entity_config::HttpMethod;
use crate::error::{Result, RusterApiError};
use rocket::data::ToByteUnit;
use rocket::http::{ContentType, Status};
use rocket::{Request, Response};
use rocket::http::Status as RocketStatus;
use rocket::response::{self, Responder};
use rocket::routes;
use rocket::State;
use serde::Serialize;
use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;

// Structure to hold the API adapter for use in Rocket routes
struct RocketApiState<T: 'static + Serialize + Send + Sync> {
    api_adapter: Arc<ApiAdapter<T>>,
}

// Custom responder to handle our API responses
struct ApiResponseWrapper<T: Serialize>(ApiResponse<T>);

impl<'r, T: Serialize> Responder<'r, 'static> for ApiResponseWrapper<T> {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let api_response = self.0;
        let status = RocketStatus::from_code(api_response.status).unwrap_or(RocketStatus::Ok);
        
        let body = match api_response.body {
            Some(body) => match serde_json::to_string(&body) {
                Ok(json) => json,
                Err(_) => r#"{"error": "Failed to serialize response"}"#.to_string(),
            },
            None => String::new(),
        };

        let body_len = body.len();
        // Create a response with the body owned by the response
        let response = Response::build()
            .status(status)
            .sized_body(body_len, Cursor::new(body))
            .finalize();
        
        // Create a new builder from the existing response
        let mut response_builder = Response::build_from(response);
        
        // Add headers
        for (key, value) in api_response.headers {
            response_builder.raw_header(key, value);
        }
        
        // If we have a body, ensure content type is set to JSON
        if body_len > 0 {
            response_builder.header(ContentType::JSON);
        }
        
        response_builder.ok()
    }
}



// Catch-all handler for GET requests
#[rocket::get("/<path..>")]
async fn get_handler(path: std::path::PathBuf, state: &State<RocketApiState<serde_json::Value>>) 
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

// Catch-all handler for POST requests
#[rocket::post("/<path..>", data = "<body>")]
async fn post_handler(path: std::path::PathBuf, body: rocket::Data<'_>, state: &State<RocketApiState<serde_json::Value>>) 
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

// Catch-all handler for PUT requests
#[rocket::put("/<path..>", data = "<body>")]
async fn put_handler(path: std::path::PathBuf, body: rocket::Data<'_>, state: &State<RocketApiState<serde_json::Value>>) 
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

// Catch-all handler for DELETE requests
#[rocket::delete("/<path..>")]
async fn delete_handler(path: std::path::PathBuf, state: &State<RocketApiState<serde_json::Value>>) 
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

// Catch-all handler for PATCH requests
#[rocket::patch("/<path..>", data = "<body>")]
async fn patch_handler(path: std::path::PathBuf, body: rocket::Data<'_>, state: &State<RocketApiState<serde_json::Value>>) 
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

// Helper to convert Rocket's Data to String
async fn body_to_string(body: rocket::Data<'_>) 
    -> Option<String> {
    use rocket::tokio::io::AsyncReadExt;
    
    let mut stream = body.open(2.mebibytes()); // TODO : Make this configurable
    let mut body_bytes = Vec::new();
    
    if let Ok(_) = stream.read_to_end(&mut body_bytes).await {
        String::from_utf8(body_bytes).ok()
    } else {
        None
    }
}

// Common request processing logic
async fn process_request(api_request: ApiRequest, state: &State<RocketApiState<serde_json::Value>>) 
    -> ApiResponse<serde_json::Value> {
    // Process the request using our API adapter
    let result = state.api_adapter.handle_request(api_request);
    
    match result {
        Ok(api_response) => api_response, 
        Err(err) => {
            // Convert error to ApiResponse
            let status = match err {
                RusterApiError::EntityNotFound(_) => Status::NotFound,
                RusterApiError::ValidationError(_) => Status::BadRequest,
                RusterApiError::DatabaseError(_) => Status::InternalServerError,
                _ => Status::InternalServerError,
            };
            ApiResponse {
                status: status.code,
                body: Some(ApiResponseBody::Json(serde_json::json!({ "error": err.to_string() }))),
                headers: HashMap::new(),
            }
        },
    }
}


// Main function to start the Rocket server
pub fn start_server<T: 'static + Serialize + Send + Sync>(api_adapter: ApiAdapter<T>) -> Result<()> {

    let rocket_api_state = RocketApiState {
        api_adapter: Arc::new(api_adapter),
    };

    // Create a Rocket instance with our routes and state
    let rocket_instance = rocket::build()
        .manage(rocket_api_state)
        .mount("/api", routes![get_handler, post_handler, put_handler, delete_handler, patch_handler]);

    // TODO : Set the rocket launch async , because it is blocking and can cause issues
    let runtime = tokio::runtime::Runtime::new().map_err(|e| 
        RusterApiError::ServerError(format!("Failed to create runtime: {}", e))
    )?;

    // Launch Rocket and handle any errors
    runtime.block_on(async {
        match rocket_instance.launch().await {
            Ok(_) => Ok(()),
            Err(e) => Err(RusterApiError::ServerError(format!("Failed to launch Rocket server: {:?}", e))),
        }
    })
}