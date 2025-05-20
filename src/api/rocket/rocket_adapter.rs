use crate::api::adapters::api_adapter::{ApiAdapter, ApiAdapterTrait, ApiResponse, ApiResponseBody};
use crate::error::{Result, RusterApiError};
use crate::api::common::api_entity::ApiEntity;
use rocket::{Request, Response};
use rocket::http::{ContentType, Status as RocketStatus};
use rocket::response::{self, Responder};
use rocket::routes;
use serde::Serialize;
use std::io::Cursor;
use std::sync::Arc;

// Import handlers from our new module
use crate::api::rocket::handlers::catch_all;

// Structure to hold the API adapter for use in Rocket routes - now public
pub struct RocketApiState<T: ApiEntity> {
    pub api_adapter: Arc<dyn ApiAdapterTrait<T> + Send + Sync>,
}

// Custom responder to handle our API responses - now public
pub struct ApiResponseWrapper<T: Serialize>(pub ApiResponse<T>);

impl<'r, T: Serialize> Responder<'r, 'static> for ApiResponseWrapper<T> {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let api_response = self.0;
        let status = RocketStatus::from_code(api_response.status).unwrap_or(RocketStatus::Ok);
        
        // Serialization of the body , there are 3 types of body
        // 1. Json
        // 2. Single
        // 3. List
        let body = match api_response.body {
            Some(ApiResponseBody::Json(value)) => match serde_json::to_string(&value) { // Json
                Ok(json) => json,
                Err(_) => r#"{"error": "Failed to serialize response"}"#.to_string(),
            },
            Some(body) => match serde_json::to_string(&body) { // Single or List
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

// Main function to start the Rocket server
pub async fn start_server<T: ApiEntity>(api_adapter: ApiAdapter<T>) -> Result<()> {

    let rocket_api_state = RocketApiState {
        api_adapter: Arc::new(api_adapter),
    };

    // Create a Rocket instance with our routes and state
    let rocket_instance = rocket::build()
        .manage(rocket_api_state)
        .mount("/api", routes![
            catch_all::get_handler,
            catch_all::post_handler,
            catch_all::put_handler,
            catch_all::delete_handler,
            catch_all::patch_handler
        ]);

    // Launch Rocket and handle any errors
    rocket_instance.launch().await.map(|_| ()).map_err(|e| {
        RusterApiError::ServerError(format!("Failed to launch Rocket server: {:?}", e))
    })
}