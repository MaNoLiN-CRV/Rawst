use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
/// Configuration for API documentation.
pub struct DocumentationConfig {
    /// Whether to generate OpenAPI documentation.
    pub generate_openapi: bool,
    /// Title of the API documentation.
    pub title: String,
    /// Description of the API (optional).
    pub description: Option<String>,
    /// Version of the API documentation.
    pub version: String,
    /// Contact email for the API (optional).
    pub contact_email: Option<String>,
    /// License information for the API (optional).
    pub license: Option<String>,
}
