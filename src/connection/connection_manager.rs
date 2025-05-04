use crate::config::specific::database_config::{DatabaseConfig, DatabaseType};
use std::any::Any;
// Import necessary crates for each database type (e.g., sqlx, diesel)
// as suggested previously if using Cargo features.

pub struct ConnectionManager;

impl ConnectionManager {
    pub async fn create_connection(
        config: &DatabaseConfig,
    ) -> Result<Box<dyn Any>, Box<dyn std::error::Error>> {
        let connection_url = config.make_url();

        match config.db_type {
            DatabaseType::PostgreSQL => {
                println!("Attempting to connect to PostgreSQL at {}...", connection_url);

                use sqlx::postgres::PgPoolOptions;

                let pool = PgPoolOptions::new()
                    .max_connections(config.max_connections.unwrap_or(5)) 
                    .connect(&connection_url) 
                    .await?;

                println!("Successfully connected to PostgreSQL.");
                Ok(Box::new(pool))
            }
            DatabaseType::MySQL => {
                println!("Attempting to connect to MySQL at {}...", connection_url);

                use sqlx::mysql::MySqlPoolOptions;

                let pool = MySqlPoolOptions::new()
                    .max_connections(config.max_connections.unwrap_or(5))
                    .connect(&connection_url) 
                    .await?;

                println!("Successfully connected to MySQL.");
                Ok(Box::new(pool))
            }
            DatabaseType::SQLite => {
                
                let sqlite_path = &config.connection_string; 
                println!("Attempting to connect to SQLite at {}...", sqlite_path);


                use sqlx::sqlite::SqlitePoolOptions;

                let pool = SqlitePoolOptions::new()
                    .max_connections(config.max_connections.unwrap_or(1))
                    .connect(sqlite_path) 
                    .await?;

                println!("Successfully connected to SQLite.");
                Ok(Box::new(pool))
            }
            DatabaseType::MongoDB => {
                 println!("Attempting to connect to MongoDB at {}...", connection_url);
      

                 Err(Box::new(std::io::Error::new(
                     std::io::ErrorKind::Other,
                     "MongoDB connection using `mongodb` crate not implemented yet",
                 )))
            }
        }
    }
}