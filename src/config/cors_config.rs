use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone, Default)]
/// Configuration for Cross-Origin Resource Sharing (CORS).
pub struct CorsConfig {
    /// List of allowed origins.
    pub allowed_origins: Vec<String>,
    /// List of allowed HTTP methods.
    pub allowed_methods: Vec<String>,
    /// List of allowed HTTP headers.
    pub allowed_headers: Vec<String>,
    /// Whether credentials are allowed in CORS requests.
    pub allow_credentials: bool,
    /// Maximum age for CORS preflight requests in seconds (optional).
    pub max_age_seconds: Option<u32>,
}
