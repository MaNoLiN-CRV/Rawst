use rocket::{get, routes, http::{Status, ContentType}};
use rocket::local::blocking::Client;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

use crate::api::adapters::api_adapter::{ApiResponse, ApiResponseBody};
use crate::api::rocket::rocket_adapter::ApiResponseWrapper;

#[derive(Debug, Serialize, Deserialize, PartialEq)]
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
        status: 418, 
        headers: HashMap::new(),
        body: None,
    };
    ApiResponseWrapper(api_response)
}

#[test]
fn test_json_response() {
    let rocket = rocket::build().mount("/", routes![json_endpoint]);
    let client = Client::tracked(rocket).expect("valid rocket instance");
    let response = client.get("/json").dispatch();

    assert_eq!(response.status(), Status::Ok);
    assert_eq!(response.content_type(), Some(ContentType::JSON));
    assert_eq!(response.headers().get_one("X-Test"), Some("Test-Value"));

    let body = response.into_string().unwrap();
    let deserialized: TestUser = serde_json::from_str(&body).unwrap();
    assert_eq!(deserialized, TestUser { id: 1, name: "Test User".to_string() });
}

#[test]
fn test_single_response() {
    let rocket = rocket::build().mount("/", routes![single_endpoint]);
    let client = Client::tracked(rocket).expect("valid rocket instance");
    let response = client.get("/single").dispatch();

    assert_eq!(response.status(), Status::Created);
    assert_eq!(response.content_type(), Some(ContentType::JSON));

    let body = response.into_string().unwrap();
    let value: serde_json::Value = serde_json::from_str(&body).unwrap();
    assert!(value.get("Single").is_some());
    let user = value.get("Single").unwrap();
    assert_eq!(user.get("id").unwrap().as_u64().unwrap(), 2);
    assert_eq!(user.get("name").unwrap().as_str().unwrap(), "Another User");
}

#[test]
fn test_list_response() {
    let rocket = rocket::build().mount("/", routes![list_endpoint]);
    let client = Client::tracked(rocket).expect("valid rocket instance");
    let response = client.get("/list").dispatch();

    assert_eq!(response.status(), Status::Ok);

    let body = response.into_string().unwrap();
    let value: serde_json::Value = serde_json::from_str(&body).unwrap();
    assert!(value.get("List").is_some());
    let users = value.get("List").unwrap().as_array().unwrap();
    assert_eq!(users.len(), 2);
    assert_eq!(users[0].get("id").unwrap().as_u64().unwrap(), 3);
    assert_eq!(users[1].get("id").unwrap().as_u64().unwrap(), 4);
}

#[test]
fn test_empty_response() {
    let rocket = rocket::build().mount("/", routes![empty_endpoint]);
    let client = Client::tracked(rocket).expect("valid rocket instance");
    let response = client.get("/empty").dispatch();

    assert_eq!(response.status(), Status::NoContent);
    let body = response.into_string().unwrap_or_default();
    assert!(body.is_empty());
}

#[test]
fn test_custom_status_response() {
    let rocket = rocket::build().mount("/", routes![custom_status_endpoint]);
    let client = Client::tracked(rocket).expect("valid rocket instance");
    let response = client.get("/custom").dispatch();

    assert_eq!(response.status(), Status::ImATeapot);
}