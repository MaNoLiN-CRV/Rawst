/// Configuration for the database connection.
pub struct DatabaseConfig {
    /// Type of the database (e.g., PostgreSQL, MySQL).
    pub db_type: DatabaseType,
    /// Connection string for the database.
    pub connection_string: String,
    /// Maximum number of connections in the connection pool (optional).
    pub max_connections: Option<u32>,
    /// Timeout for database operations in seconds (optional).
    pub timeout_seconds: Option<u32>,
    /// Whether SSL is enabled for the database connection.
    pub ssl_enabled: bool,
}

/// Supported database types.
pub enum DatabaseType {
    /// PostgreSQL database.
    PostgreSQL,
    /// MySQL database.
    MySQL,
    /// SQLite database.
    SQLite,
    /// MongoDB database.
    MongoDB,
}
