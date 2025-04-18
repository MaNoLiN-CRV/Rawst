use crate::config::specific::database_config::{DatabaseConfig, DatabaseType};
use std::any::Any;
// Importa los crates necesarios para cada tipo de base de datos (ej: sqlx, diesel)
// Ejemplo: use sqlx::postgres::PgPoolOptions;

pub struct ConnectionManager;

impl ConnectionManager {
    pub async fn create_connection(
        config: &DatabaseConfig,
    ) -> Result<Box<dyn Any>, Box<dyn std::error::Error>> {
        match config.db_type {
            DatabaseType::PostgreSQL => {
                
                println!("Attempting to connect to PostgreSQL...");

                use::sqlx::postgres::PgPoolOptions;
                use::sqlx::postgres::PgPool;
                use::sqlx::postgres::PgConnection;

                let pool = PgPoolOptions::new()
                    .max_connections(5)
                    .connect(&config.connection_string)
                    .await?;
               
            
     
                Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "PostgreSQL connection not implemented yet",
                )))
            }
            DatabaseType::MySQL => {
                println!("Attempting to connect to MySQL...");

                use::sqlx::mysql::MySqlPoolOptions;
                use::sqlx::mysql::MySqlPool;
                use::sqlx::mysql::MySqlConnection;

                let pool = MySqlPoolOptions::new()
                    .max_connections(5)
                    .connect(&config.connection_string)
                    .await?;

                Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "MySQL connection not implemented yet",
                )))
            }
            DatabaseType::SQLite => {
                println!("Attempting to connect to SQLite...");

                use::sqlx::sqlite::SqlitePoolOptions;
                use::sqlx::sqlite::SqlitePool;
                use::sqlx::sqlite::SqliteConnection;

                let pool = SqlitePoolOptions::new()
                    .max_connections(5)
                    .connect(&config.connection_string)
                    .await?;

                Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "SQLite connection not implemented yet",
                )))
            }

            DatabaseType::MongoDB => {
                println!("Attempting to connect to MongoDB...");

                

                Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    "MongoDB connection not implemented yet",
                )))
            }

            
        }
    }
}
