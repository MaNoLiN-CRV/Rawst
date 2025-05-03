use thiserror::Error;

#[derive(Error, Debug)]
pub enum RusterApiError {
    #[error("Endpoint generation error: {0}")]
    EndpointGenerationError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Entity not found: {0}")]
    EntityNotFound(String),

    #[error("Serialization errot {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("Validation error: {0}")]
    ValidationError(String),

    #[error("Authentication error: {0}")]
    AuthError(String),

    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Server error: {0}")]
    ServerError(String),
}

pub type Result<T> = std::result::Result<T, RusterApiError>;
