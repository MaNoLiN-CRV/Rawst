use crate::error::RusterApiError;
use std::collections::HashMap;

/// Returns default headers for API responses
pub fn default_headers() -> HashMap<String, String> {
    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    headers
}

/// Handles errors from the datasource and formats them into an API error
pub fn handle_datasource_error(err: impl std::fmt::Display) -> RusterApiError {
    let error_message = format!("Error retrieving items: {}", err);
    RusterApiError::EndpointGenerationError(error_message)
}