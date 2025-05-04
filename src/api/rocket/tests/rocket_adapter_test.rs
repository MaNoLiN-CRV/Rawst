use mockall::mock;
use rocket::{get, routes, http::{Status, ContentType}};
use rocket::local::blocking::Client;
use rocket::local::blocking::LocalResponse;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

use crate::api::adapters::api_adapter::{ApiResponse, ApiResponseBody};
use crate::api::rocket::rocket_adapter::{ApiResponseWrapper, RocketApiState};
use std::sync::Arc;

// Mock for RocketApiState is used in the configuration test
mock! {
    pub ApiAdapterTrait<T: 'static + Serialize + Send + Sync> {}

    impl<T: 'static + Serialize + Send + Sync> Clone for ApiAdapterTrait<T> {
        fn clone(&self) -> Self;
    }

    impl<T: 'static + Serialize + Send + Sync> crate::api::adapters::api_adapter::ApiAdapterTrait<T> for ApiAdapterTrait<T> {
        fn handle_request(&self, request: crate::api::adapters::api_adapter::ApiRequest) -> crate::error::Result<ApiResponse<T>>;
    }
}

#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
struct TestUser {
    id: u32,
    name: String,
}

#[get("/json")]
fn json_endpoint() -> ApiResponseWrapper<TestUser> {
    let test_user = TestUser { id: 1, name: "Test User".to_string() };
    let api_response = ApiResponse {
        status: 200,
        headers: {
            let mut h = HashMap::new();
            h.insert("X-Test".to_string(), "Test-Value".to_string());
            h
        },
        body: Some(ApiResponseBody::Json(test_user)),
    };
    ApiResponseWrapper(api_response)
}

#[get("/single")]
fn single_endpoint() -> ApiResponseWrapper<TestUser> {
    let test_user = TestUser { id: 2, name: "Another User".to_string() };
    let api_response = ApiResponse {
        status: 201,
        headers: HashMap::new(),
        body: Some(ApiResponseBody::Single(test_user)),
    };
    ApiResponseWrapper(api_response)
}

#[get("/list")]
fn list_endpoint() -> ApiResponseWrapper<TestUser> {
    let test_users = vec![
        TestUser { id: 3, name: "User 3".to_string() },
        TestUser { id: 4, name: "User 4".to_string() },
    ];
    let api_response = ApiResponse {
        status: 200,
        headers: HashMap::new(),
        body: Some(ApiResponseBody::List(test_users)),
    };
    ApiResponseWrapper(api_response)
}

#[get("/empty")]
fn empty_endpoint() -> ApiResponseWrapper<TestUser> {
    let api_response = ApiResponse {
        status: 204,
        headers: HashMap::new(),
        body: None,
    };
    ApiResponseWrapper(api_response)
}

#[get("/custom")]
fn custom_status_endpoint() -> ApiResponseWrapper<TestUser> {
    let api_response = ApiResponse {
        status: 418, // I'm a teapot
        headers: HashMap::new(),
        body: None,
    };
    ApiResponseWrapper(api_response)
}

#[get("/error")]
fn error_endpoint() -> ApiResponseWrapper<serde_json::Value> {
    let error_json = serde_json::json!({"error": "Internal Server Error", "code": 500});
    
    let api_response = ApiResponse {
        status: 500,
        headers: {
            let mut h = HashMap::new();
            h.insert("X-Error-Type".to_string(), "ServerError".to_string());
            h
        },
        body: Some(ApiResponseBody::Json(error_json)),
    };
    
    ApiResponseWrapper(api_response)
}

// Helper function to setup common test assertions
fn validate_response_basics(response: &LocalResponse, expected_status: Status, expected_content_type: Option<ContentType>) {
    assert_eq!(
        response.status(),
        expected_status,
        "HTTP status should be {}",
        expected_status
    );
    
    assert_eq!(
        response.content_type(),
        expected_content_type,
        "Content-Type should be {:?}",
        expected_content_type
    );
}

#[test]
fn test_json_response() {
    // Arrange: Set up the Rocket environment and the test client
    let rocket = rocket::build().mount("/", routes![json_endpoint]);
    let client = Client::tracked(rocket).expect("Failed to create Rocket test client");

    // Act: Make the GET request to the /json route
    let response = client.get("/json").dispatch();

    // Assert: Check response basics
    validate_response_basics(&response, Status::Ok, Some(ContentType::JSON));

    // Assert: Check the custom header
    let x_test_header = response.headers().get("X-Test").collect::<Vec<_>>();
    assert_eq!(
        x_test_header,
        vec!["Test-Value"],
        "The X-Test header should be present and unique"
    );

    // Assert: The body should not be empty
    let body = response.into_string().expect("Failed to extract response body");
    assert!(!body.trim().is_empty(), "The response body should not be empty");

    // Assert: The body should be valid JSON and have the expected data
    let deserialized: Result<TestUser, _> = serde_json::from_str(&body);
    assert!(
        deserialized.is_ok(),
        "Failed to deserialize JSON body: {}",
        body
    );
    
    let user = deserialized.unwrap();
    let expected_user = TestUser { id: 1, name: "Test User".to_string() };
    assert_eq!(
        user,
        expected_user,
        "The deserialized user does not match the expected value.\nExpected: {:?}\nActual: {:?}",
        expected_user,
        user
    );
}

#[test]
fn test_single_response() {
    // Arrange
    let rocket = rocket::build().mount("/", routes![single_endpoint]);
    let client = Client::tracked(rocket).expect("Failed to create Rocket test client");

    // Act
    let response = client.get("/single").dispatch();

    // Assert
    validate_response_basics(&response, Status::Created, Some(ContentType::JSON));

    let body = response.into_string().expect("Failed to extract response body");
    assert!(!body.trim().is_empty(), "The response body should not be empty");

    let body_value: serde_json::Value = serde_json::from_str(&body)
        .expect("Body should be valid JSON");
    
    // Check that the response has the correct structure (ApiResponseBody::Single)
    assert!(
        body_value.get("Single").is_some(),
        "Body should contain 'Single' field. Body: {}",
        body
    );
    
    let user = body_value.get("Single").unwrap();
    assert_eq!(
        user.get("id").unwrap().as_u64().unwrap(),
        2,
        "User ID should be 2"
    );
    assert_eq!(
        user.get("name").unwrap().as_str().unwrap(),
        "Another User",
        "User name should be 'Another User'"
    );
}

#[test]
fn test_list_response() {
    // Arrange
    let rocket = rocket::build().mount("/", routes![list_endpoint]);
    let client = Client::tracked(rocket).expect("Failed to create Rocket test client");

    // Act
    let response = client.get("/list").dispatch();

    // Assert
    validate_response_basics(&response, Status::Ok, Some(ContentType::JSON));

    let body = response.into_string().expect("Failed to extract response body");
    assert!(!body.trim().is_empty(), "The response body should not be empty");

    let body_value: serde_json::Value = serde_json::from_str(&body)
        .expect("Body should be valid JSON");
    
    // Check that the response has the correct structure (ApiResponseBody::List)
    assert!(
        body_value.get("List").is_some(),
        "Body should contain 'List' field. Body: {}",
        body
    );
    
    let users = body_value.get("List").unwrap().as_array().expect("List should be an array");
    assert_eq!(
        users.len(),
        2,
        "List should contain exactly 2 users, found {}",
        users.len()
    );
    
    // Check first user
    assert_eq!(
        users[0].get("id").unwrap().as_u64().unwrap(),
        3,
        "First user ID should be 3"
    );
    assert_eq!(
        users[0].get("name").unwrap().as_str().unwrap(),
        "User 3",
        "First user name should be 'User 3'"
    );
    
    // Check second user
    assert_eq!(
        users[1].get("id").unwrap().as_u64().unwrap(),
        4,
        "Second user ID should be 4"
    );
    assert_eq!(
        users[1].get("name").unwrap().as_str().unwrap(),
        "User 4",
        "Second user name should be 'User 4'"
    );
}

#[test]
fn test_empty_response() {
    // Arrange
    let rocket = rocket::build().mount("/", routes![empty_endpoint]);
    let client = Client::tracked(rocket).expect("Failed to create Rocket test client");

    // Act
    let response = client.get("/empty").dispatch();

    // Assert
    validate_response_basics(&response, Status::NoContent, None);

    let body = response.into_string().unwrap_or_default();
    assert!(
        body.is_empty(),
        "Body should be empty for NoContent response, found: '{}'",
        body
    );
}

#[test]
fn test_custom_status_response() {
    // Arrange
    let rocket = rocket::build().mount("/", routes![custom_status_endpoint]);
    let client = Client::tracked(rocket).expect("Failed to create Rocket test client");

    // Act
    let response = client.get("/custom").dispatch();

    // Assert
    validate_response_basics(&response, Status::ImATeapot, None);
}

#[test]
fn test_error_response() {
    // Arrange
    let rocket = rocket::build().mount("/", routes![error_endpoint]);
    let client = Client::tracked(rocket).expect("Failed to create Rocket test client");

    // Act
    let response = client.get("/error").dispatch();

    // Assert
    validate_response_basics(&response, Status::InternalServerError, Some(ContentType::JSON));
    
    // Check error header
    let error_type = response.headers().get_one("X-Error-Type");
    assert_eq!(
        error_type,
        Some("ServerError"),
        "X-Error-Type header should be 'ServerError'"
    );

    // Check error body
    let body = response.into_string().expect("Failed to extract response body");
    let error_json: serde_json::Value = serde_json::from_str(&body)
        .expect("Body should be valid JSON");
    
    assert_eq!(
        error_json.get("error").unwrap().as_str().unwrap(),
        "Internal Server Error",
        "Error message should match"
    );
    assert_eq!(
        error_json.get("code").unwrap().as_u64().unwrap(),
        500,
        "Error code should be 500"
    );
}

#[test]
fn test_rocket_instance_configuration() {
    // Create a mock adapter
    let mut mock_adapter = MockApiAdapterTrait::<TestUser>::new();
    mock_adapter.expect_clone().returning(|| MockApiAdapterTrait::new());
    
    // Create a rocket instance with the mock
    let rocket_api_state = RocketApiState {
        api_adapter: Arc::new(mock_adapter) as Arc<dyn crate::api::adapters::api_adapter::ApiAdapterTrait<TestUser> + Send + Sync>,
    };
    
    let rocket_instance = rocket::build()
        .manage(rocket_api_state)
        .mount("/api", routes![]);
    
    // Check that the state was correctly added
    let state_exists = rocket_instance
        .state::<RocketApiState<TestUser>>()
        .is_some();
    
    assert!(
        state_exists,
        "Rocket instance should have RocketApiState registered"
    );
}