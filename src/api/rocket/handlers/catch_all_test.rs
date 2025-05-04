use crate::api::adapters::api_adapter::{ApiAdapterTrait, ApiRequest, ApiResponse, ApiResponseBody};
use crate::api::rocket::handlers::catch_all::{self, get_handler, post_handler, put_handler, delete_handler, patch_handler};
use crate::api::rocket::rocket_adapter::RocketApiState;
use crate::config::specific::entity_config::HttpMethod;
use crate::error::{Result, RusterApiError};
use mockall::predicate::*;
use mockall::*;
use rocket::http::Status;
use rocket::local::asynchronous::Client as AsyncClient;
use rocket::State;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;

// Mock for the ApiAdapterTrait - placed outside any modules
mock! {
    pub ApiAdapter<T: 'static + Send + Sync> {}
    
    impl<T: 'static + Send + Sync> ApiAdapterTrait<T> for ApiAdapter<T> {
        fn handle_request(&self, request: ApiRequest) -> Result<ApiResponse<T>>;
    }
    
    impl<T: 'static + Send + Sync> Clone for ApiAdapter<T> {
        fn clone(&self) -> Self;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    // Configure a Rocket client for testing
    async fn setup_rocket_client() -> AsyncClient {
        // Create a mock of the ApiAdapter
        let mut mock_adapter = MockApiAdapter::<Value>::new();
        
        // Configure the mock to respond to all requests with a successful response
        mock_adapter
            .expect_handle_request()
            .returning(|request| {
                let response_body = match request.method {
                    HttpMethod::GET => json!({"method": "GET", "path": request.path}),
                    HttpMethod::POST => json!({"method": "POST", "path": request.path, "body": request.body}),
                    HttpMethod::PUT => json!({"method": "PUT", "path": request.path, "body": request.body}),
                    HttpMethod::DELETE => json!({"method": "DELETE", "path": request.path}),
                    HttpMethod::PATCH => json!({"method": "PATCH", "path": request.path, "body": request.body}),
                };

                Ok(ApiResponse {
                    status: 200,
                    body: Some(ApiResponseBody::Json(response_body)),
                    headers: HashMap::new(),
                })
            });
        
        // Configure the clone behavior
        mock_adapter.expect_clone().return_const(MockApiAdapter::<Value>::new());

        // Create the Rocket state with our mock
        let rocket_api_state = RocketApiState {
            api_adapter: Arc::new(mock_adapter),
        };

        // Build a Rocket instance with the handlers and the mocked state
        let rocket = rocket::build()
            .manage(rocket_api_state)
            .mount("/api", rocket::routes![
                get_handler,
                post_handler,
                put_handler,
                delete_handler,
                patch_handler
            ]);

        // Create and return a test client for Rocket
        AsyncClient::tracked(rocket).await.expect("valid rocket instance")
    }

    #[tokio::test]
    async fn test_get_handler() {
        // Configure the test client
        let client = setup_rocket_client().await;

        // Perform a test GET request
        let response = client.get("/api/users").dispatch().await;
        
        // Verify the status code
        assert_eq!(response.status(), Status::Ok);
        
        // Verify the response body
        let response_body: Value = response.into_json().await.expect("Valid JSON response");
        
        // The response is nested within the Json variant
        if let Some(method) = response_body.get("method") {
            assert_eq!(method, "GET");
        } else {
            panic!("Response missing 'method' field");
        }
        if let Some(path) = response_body.get("path") {
            assert_eq!(path, "users");
        } else {
            panic!("Response missing 'path' field");
        }
    }

    #[tokio::test]
    async fn test_post_handler() {
        // Configure the test client
        let client = setup_rocket_client().await;

        // Perform a test POST request with a JSON body
        let test_body = json!({"name": "John Doe", "email": "john@example.com"});
        let response = client.post("/api/users")
            .json(&test_body)
            .dispatch()
            .await;
        
        // Verify the status code
        assert_eq!(response.status(), Status::Ok);
        
        // Verify the response body
        let response_body: Value = response.into_json().await.expect("Valid JSON response");
        
        // Verify that the response contains the expected values
        if let Some(method) = response_body.get("method") {
            assert_eq!(method, "POST");
        } else {
            panic!("Response missing 'method' field");
        }
        if let Some(path) = response_body.get("path") {
            assert_eq!(path, "users");
        } else {
            panic!("Response missing 'path' field");
        }
    }

    #[tokio::test]
    async fn test_put_handler() {
        // Configure the test client
        let client = setup_rocket_client().await;

        // Perform a test PUT request with a JSON body
        let test_body = json!({"id": 1, "name": "Updated Name", "email": "updated@example.com"});
        let response = client.put("/api/users/1")
            .json(&test_body)
            .dispatch()
            .await;
        
        // Verify the status code
        assert_eq!(response.status(), Status::Ok);
        
        // Verify the response body
        let response_body: Value = response.into_json().await.expect("Valid JSON response");
        
        // Verify that the response contains the expected values
        if let Some(method) = response_body.get("method") {
            assert_eq!(method, "PUT");
        } else {
            panic!("Response missing 'method' field");
        }
        if let Some(path) = response_body.get("path") {
            assert_eq!(path, "users/1");
        } else {
            panic!("Response missing 'path' field");
        }
    }

    #[tokio::test]
    async fn test_delete_handler() {
        // Configure the test client
        let client = setup_rocket_client().await;

        // Perform a test DELETE request
        let response = client.delete("/api/users/1").dispatch().await;
        
        // Verify the status code
        assert_eq!(response.status(), Status::Ok);
        
        // Verify the response body
        let response_body: Value = response.into_json().await.expect("Valid JSON response");
        
        // Verify that the response contains the expected values
        if let Some(method) = response_body.get("method") {
            assert_eq!(method, "DELETE");
        } else {
            panic!("Response missing 'method' field");
        }
        if let Some(path) = response_body.get("path") {
            assert_eq!(path, "users/1");
        } else {
            panic!("Response missing 'path' field");
        }
    }

    #[tokio::test]
    async fn test_patch_handler() {
        // Configure the test client
        let client = setup_rocket_client().await;

        // Perform a test PATCH request with a JSON body
        let test_body = json!({"name": "Partial Update"});
        let response = client.patch("/api/users/1")
            .json(&test_body)
            .dispatch()
            .await;
        
        // Verify the status code
        assert_eq!(response.status(), Status::Ok);
        
        // Verify the response body
        let response_body: Value = response.into_json().await.expect("Valid JSON response");
        
        // Verify that the response contains the expected values
        if let Some(method) = response_body.get("method") {
            assert_eq!(method, "PATCH");
        } else {
            panic!("Response missing 'method' field");
        }
        if let Some(path) = response_body.get("path") {
            assert_eq!(path, "users/1");
        } else {
            panic!("Response missing 'path' field");
        }
    }

    #[tokio::test]
    async fn test_process_request_error_handling() {
        // Create a mock of the ApiAdapter that always returns an error
        let mut mock_adapter = MockApiAdapter::<Value>::new();
        
        // Configure the mock to respond with a specific error
        mock_adapter
            .expect_handle_request()
            .returning(|_| {
                Err(RusterApiError::EntityNotFound("User not found".into()))
            });
        
        // Configure the clone behavior
        mock_adapter.expect_clone().return_const(MockApiAdapter::<Value>::new());

        // Create the Rocket state with our mock
        let rocket_api_state = RocketApiState {
            api_adapter: Arc::new(mock_adapter),
        };

        // Create the API request
        let api_request = ApiRequest {
            method: HttpMethod::GET,
            path: "users/999".to_string(),
            params: HashMap::new(),
            headers: HashMap::new(),
            body: None,
        };

        // Build a Rocket instance with the mocked state
        let rocket = rocket::build().manage(rocket_api_state);
        
        // Create a client and get the state
        let client = AsyncClient::tracked(rocket).await.expect("valid rocket instance");
        let state = State::get(&client.rocket()).expect("state should be available");
        
        // Call process_request directly
        let response = catch_all::process_request(api_request, state).await;
        
        // Verify that the response contains a 404 Not Found error
        assert_eq!(response.status, Status::NotFound.code);
        
        // Verify that the response body contains an error message
        if let Some(ApiResponseBody::Json(json)) = response.body {
            assert!(json["error"].as_str().unwrap().contains("User not found"));
        } else {
            panic!("Response should contain error message in JSON format");
        }
    }
}