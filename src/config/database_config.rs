use serde::{Serialize, Deserialize};
use std::{clone, fmt};

#[derive(Serialize, Deserialize, Debug, Default)]
/// Configuration for the database connection.
pub struct DatabaseConfig {
    /// Type of the database (e.g., PostgreSQL, MySQL).
    pub db_type: DatabaseType,
    /// Hostname or IP address of the database server.
    pub host: String,
    /// Port number for the database connection (optional).
    pub port: Option<u16>,
    /// Name of the database to connect to.
    pub database_name: String,
    /// Username for the database connection.
    pub username: String,
    /// Password for the database connection.
    pub password: String,
    /// Connection string for the database
    pub connection_string: String,
    /// Maximum number of connections in the connection pool (optional).
    pub max_connections: Option<u32>,
    /// Timeout for database operations in seconds (optional).
    pub timeout_seconds: Option<u32>,
    /// Whether SSL is enabled for the database connection.
    pub ssl_enabled: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
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

impl Default for DatabaseType {
    fn default() -> Self {
        DatabaseType::PostgreSQL
    }
}

impl fmt::Display for DatabaseType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DatabaseType::PostgreSQL => write!(f, "PostgreSQL"),
            DatabaseType::MySQL => write!(f, "MySQL"),
            DatabaseType::SQLite => write!(f, "SQLite"),
            DatabaseType::MongoDB => write!(f, "MongoDB"),
        }
    }
    
}


impl DatabaseType {
    pub fn default_port(&self) -> u16 {
        match self {
            DatabaseType::PostgreSQL => 5432,
            DatabaseType::MySQL => 3306,
            DatabaseType::SQLite => 0, // SQLite does not use a port
            DatabaseType::MongoDB => 27017,
        }
    }
}

impl clone::Clone for DatabaseConfig {
    fn clone(&self) -> Self {
        DatabaseConfig {
            db_type: self.db_type.clone(),
            port: self.port,
            database_name: self.database_name.clone(),
            username: self.username.clone(),
            password: self.password.clone(),
            connection_string: self.connection_string.clone(),
            host: self.host.clone(),
            max_connections: self.max_connections,
            timeout_seconds: self.timeout_seconds,
            ssl_enabled: self.ssl_enabled,
        }
    }
}

impl DatabaseConfig {
    pub fn make_url(&self) -> String {
        match self.db_type {
            DatabaseType::PostgreSQL => format!(
                "postgresql://{}:{}@{}/{}",
                self.username, self.password, self.host, self.database_name
            ),
            DatabaseType::MySQL => format!(
                "mysql://{}:{}@{}/{}",
                self.username, self.password, self.host, self.database_name
            ),
            DatabaseType::SQLite => format!("sqlite://{}", self.connection_string),
            DatabaseType::MongoDB => format!(
                "mongodb://{}:{}@{}/{}",
                self.username, self.password, self.host, self.database_name
            ),
        }
    }
}
