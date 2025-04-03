use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
/// Configuration for authentication.
pub struct AuthConfig {
    /// Type of authentication to use.
    pub auth_type: AuthType,
    /// Configuration for JWT authentication (optional).
    pub jwt_config: Option<JWTConfig>,
    /// Configuration for OAuth authentication (optional).
    pub oauth_config: Option<OAuthConfig>,
    /// Configuration for API key authentication (optional).
    pub api_key_config: Option<ApiKeyConfig>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AuthType {
    JWT,
    OAuth,
    ApiKey,
    Basic,
    None,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JWTConfig {
    pub secret: String,
    pub expiration_hours: u32,
    pub issuer: Option<String>,
    pub refresh_token_enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OAuthConfig {
    pub providers: Vec<OAuthProvider>,
    pub callback_url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OAuthProvider {
    pub name: String,
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ApiKeyConfig {
    pub header_name: String,
    pub prefix: Option<String>,
}
