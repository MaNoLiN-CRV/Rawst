use crate::api::adapters::api_adapter::{ApiAdapter, ApiResponse};
use crate::error::{Result, RusterApiError};
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
pub struct RocketApiState<T: 'static + Serialize + Send + Sync> {
    pub api_adapter: Arc<ApiAdapter<T>>,
}

// Custom responder to handle our API responses - now public
pub struct ApiResponseWrapper<T: Serialize>(pub ApiResponse<T>);

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

// Main function to start the Rocket server
pub fn start_server<T: 'static + Serialize + Send + Sync>(api_adapter: ApiAdapter<T>) -> Result<()> {

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