use std::error::Error;
use mockall::predicate::*; // Keep for potential future mocking, though not used in this version
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::config::specific::database_config::{DatabaseConfig, DatabaseType};
use crate::config::specific::entity_config::{Authorization, DataType, EndpointConfig, Entity, Field};
use crate::data::datasource::relational::mariadb::MariaDbDatasource;
 // Added DataSource
use crate::api::common::api_entity::ApiEntity; // Added for TestUser impl

/// Test user entity for database operations
#[derive(Debug, Serialize, Deserialize, PartialEq, Clone)]
struct TestUser {
    id: String,
    name: String,
    age: i64,
    active: bool,
}

impl ApiEntity for TestUser {
    fn entity_name() -> String {
        "users".to_string() // This must match the entity name in `create_test_entities`
    }
}


/// Creates a test database configuration for MariaDB
fn create_test_config() -> DatabaseConfig {
    DatabaseConfig {
        db_type: DatabaseType::MySQL,
        host: "localhost".to_string(),
        port: Some(3306),
        username: "test_user".to_string(), // Ensure these credentials are valid for your test DB
        password: "test_password".to_string(), // Ensure these credentials are valid for your test DB
        database_name: "test_db".to_string(), // Ensure this database exists
        max_connections: Some(5),
        timeout_seconds: Some(30),
        ssl_enabled: false,
        connection_string: String::new(), // Assuming make_url in DatabaseConfig handles this
    }
}

/// Creates test entity configurations to match the TestUser struct
fn create_test_entities() -> Vec<Entity> {
    vec![Entity {
        name: "users".to_string(), // Matches TestUser::entity_name()
        table_name: Some("user_table".to_string()),
        fields: vec![
            Field {
                name: "id".to_string(),
                column_name: Some("user_id".to_string()), // Ensure this matches the actual column name for PK
                data_type: DataType::String,
                required: true,
                unique: true,
                searchable: true,
                default_value: None,
                description: Some("User ID".to_string()),
            },
            Field {
                name: "name".to_string(),
                column_name: Some("user_name".to_string()),
                data_type: DataType::String,
                required: true,
                unique: false,
                searchable: true,
                default_value: None,
                description: Some("User name".to_string()),
            },
            Field {
                name: "age".to_string(),
                column_name: Some("user_age".to_string()),
                data_type: DataType::Integer,
                required: false, // Assuming age can be optional in some contexts
                unique: false,
                searchable: true,
                default_value: None,
                description: Some("User age".to_string()),
            },
            Field {
                name: "active".to_string(),
                column_name: Some("is_active".to_string()),
                data_type: DataType::Boolean,
                required: true,
                unique: false,
                searchable: true,
                default_value: None,
                description: Some("Is user active".to_string()),
            },
        ],
        relationships: vec![],
        endpoints: EndpointConfig {
            generate_create: true,
            generate_read: true,
            generate_update: true,
            generate_delete: true,
            generate_list: true,
            custom_routes: vec![],
        },
        authentication: false,
        authorization: Authorization {
            active: false,
            roles: vec![],
            permissions: vec![],
        },
        validations: vec![],
        pagination: None,
    }]
}

/// Creates a sample test user with predefined values
fn create_test_user(id_suffix: &str) -> TestUser {
    TestUser {
        id: format!("user_{}", id_suffix),
        name: format!("Test User {}", id_suffix),
        age: 30 + id_suffix.parse::<i64>().unwrap_or(0),
        active: true,
    }
}

/// Creates a test user with custom values
fn create_custom_test_user(id: &str, name: &str, age: i64, active: bool) -> TestUser {
    TestUser {
        id: id.to_string(),
        name: name.to_string(),
        age,
        active,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    /// Tests for initialization and configuration
    mod initialization_tests {
        use super::*;

        #[test]
        fn test_new_mariadb_datasource() {
            // Arrange
            let config = create_test_config();
            
            // Act
            let datasource = MariaDbDatasource::new(&config);
            
            // Assert
            assert_eq!(datasource.config.host, "localhost");
            assert_eq!(datasource.config.port, Some(3306));
            assert_eq!(datasource.config.database_name, "test_db");
            assert_eq!(datasource.config.username, "test_user");
            assert_eq!(datasource.config.password, "test_password");
        }
        
        #[test]
        fn test_config_with_different_values() {
            // Arrange
            let mut config = create_test_config();
            config.host = "testdb.example.com".to_string();
            config.port = Some(3307);
            config.max_connections = Some(10);
            
            // Act
            let datasource = MariaDbDatasource::new(&config);
            
            // Assert
            assert_eq!(datasource.config.host, "testdb.example.com");
            assert_eq!(datasource.config.port, Some(3307));
            assert_eq!(datasource.config.max_connections, Some(10));
        }
    }

    /// Tests for public API methods (Unit test style, expecting connection errors)
    mod public_api_tests {
        use super::*;

        #[test]
        fn test_configure_entity_mappings_fails_on_connection() {
            // Arrange
            let config = create_test_config(); // Config for a potentially non-existent/unreachable DB
            let mut datasource = MariaDbDatasource::new(&config);
            let entities = create_test_entities();
            
            // Act - We expect an error since we have no real DB connection guaranteed for unit tests
            let result = datasource.configure_entity_mappings(&entities);
            
            // Assert
            assert!(result.is_err(), "configure_entity_mappings should fail without a valid DB connection");
            
            if let Err(e) = result {
                let error_message = e.to_string();
                // Check for common connection error messages
                assert!(
                    error_message.to_lowercase().contains("connection refused") ||
                    error_message.to_lowercase().contains("access denied") ||
                    error_message.to_lowercase().contains("unknown database") ||
                    error_message.to_lowercase().contains("error connecting to mariadb") || // From initialize_connection
                    error_message.to_lowercase().contains("timed out"),
                    "Expected a connection-related error, got: {}", error_message
                );
            }
        }
        
        #[test]
        fn test_configure_entity_mappings_empty_entities_still_tries_connection() {
            // Arrange
            let config = create_test_config();
            let mut datasource = MariaDbDatasource::new(&config);
            let entities = vec![]; // No entities
            
            // Act - Even with no entities, it should attempt to initialize connection if pool is None
            let result = datasource.configure_entity_mappings(&entities);
            
            // Assert
            assert!(result.is_err(), "configure_entity_mappings should attempt connection even with no entities, and fail here.");
        }
    }

    /// Tests for serialization and deserialization (Unit tests)
    mod serialization_tests {
        use super::*;

        #[test]
        fn test_user_serialization() -> Result<(), Box<dyn Error>> {
            // Arrange
            let user = create_test_user("serial");
            
            // Act
            let serialized = serde_json::to_value(&user)?;
            
            // Assert
            assert_eq!(serialized["id"], json!("user_serial"));
            assert_eq!(serialized["name"], json!("Test User serial"));
            assert_eq!(serialized["age"], json!(30)); // Assuming "serial" parses to 0 for age calculation
            assert_eq!(serialized["active"], json!(true));
            
            Ok(())
        }
        
        #[test]
        fn test_user_deserialization() -> Result<(), Box<dyn Error>> {
            // Arrange
            let json_data = json!({
                "id": "user_deserial",
                "name": "Another User deserial",
                "age": 42,
                "active": false
            });
            
            // Act
            let user: TestUser = serde_json::from_value(json_data)?;
            
            // Assert
            assert_eq!(user.id, "user_deserial");
            assert_eq!(user.name, "Another User deserial");
            assert_eq!(user.age, 42);
            assert_eq!(user.active, false);
            
            Ok(())
        }
        
        #[test]
        fn test_multiple_users_serialization() -> Result<(), Box<dyn Error>> {
            // Arrange
            let users = vec![
                create_custom_test_user("multi1", "User Multi 1", 25, true),
                create_custom_test_user("multi2", "User Multi 2", 30, false),
                create_custom_test_user("multi3", "User Multi 3", 35, true),
            ];
            
            // Act
            let serialized = serde_json::to_value(&users)?;
            
            // Assert
            assert!(serialized.is_array());
            let arr = serialized.as_array().unwrap();
            assert_eq!(arr.len(), 3);
            assert_eq!(arr[0]["id"], json!("multi1"));
            assert_eq!(arr[1]["name"], json!("User Multi 2"));
            assert_eq!(arr[2]["age"], json!(35));
            
            Ok(())
        }
        
        #[test]
        fn test_partial_user_deserialization_fails() {
            // Arrange - Missing required fields (age, active based on TestUser struct)
            let json_data = json!({
                "id": "partial_fail",
                "name": "Partial User Fail"
            });
            
            // Act & Assert - Should fail because required fields are missing
            let result = serde_json::from_value::<TestUser>(json_data);
            assert!(result.is_err(), "Deserialization should fail for missing required fields.");
        }
    }
    
    /// Tests for edge cases and error handling (Unit tests)
    mod edge_case_tests {
        use super::*;
        
        #[test]
        fn test_new_with_empty_string_config_values() {
            // Arrange - Create minimal config with empty strings
            let config = DatabaseConfig {
                db_type: DatabaseType::MySQL,
                host: "".to_string(),
                port: None, // Port can be optional
                username: "".to_string(),
                password: "".to_string(),
                database_name: "".to_string(),
                max_connections: None,
                timeout_seconds: None,
                ssl_enabled: false,
                connection_string: String::new(),
            };
            
            // Act
            let datasource = MariaDbDatasource::new(&config);
            
            // Assert - Should still construct without error, fields are assigned
            assert_eq!(datasource.config.host, "");
            assert_eq!(datasource.config.port, None);
            assert_eq!(datasource.config.username, "");
            assert_eq!(datasource.config.password, "");
            assert_eq!(datasource.config.database_name, "");
        }
    }
}

// Integration tests that require a real database connection
// These are marked with #[ignore] so they don't run in normal test suites
// To run: cargo test -- --ignored
// Ensure your test database is set up according to `create_test_config()`
// and the `user_table` (as defined in `create_test_entities`) exists with the correct schema.
#[cfg(test)]
mod integration_tests {
    use crate::data::datasource::base::DataSource;

    use super::*;
    use sqlx::mysql::MySqlPoolOptions;
    use std::sync::Once;

    static DB_SETUP: Once = Once::new();

    async fn setup_test_database_table() {
        let config = create_test_config();
        let db_url = format!("mysql://{}:{}@{}:{}/{}",
            config.username, config.password, config.host, config.port.unwrap_or(3306), config.database_name);

        let pool = MySqlPoolOptions::new()
            .max_connections(1) // Only need one connection for setup
            .connect(&db_url)
            .await
            .expect("Failed to connect to test database for setup. Ensure DB is running and credentials are correct.");

        // Drop table if exists to ensure clean state
        sqlx::query("DROP TABLE IF EXISTS user_table")
            .execute(&pool)
            .await
            .expect("Failed to drop user_table for setup.");

        // Create table based on TestUser and create_test_entities
        // This DDL should match what MariaDbDatasource expects based on its mapping logic
        sqlx::query(
            "CREATE TABLE user_table (
                user_id VARCHAR(255) PRIMARY KEY,
                user_name VARCHAR(255) NOT NULL,
                user_age INT,
                is_active BOOLEAN NOT NULL
            )"
        )
        .execute(&pool)
        .await
        .expect("Failed to create user_table for setup.");
    }


    fn get_configured_datasource() -> Result<MariaDbDatasource, Box<dyn Error>> {
        let config = create_test_config();
        let mut datasource = MariaDbDatasource::new(&config);
        datasource.configure_entity_mappings(&create_test_entities())?;
        Ok(datasource)
    }
    
    #[tokio::test]
    #[ignore]
    async fn test_crud_cycle() -> Result<(), Box<dyn Error>> {
        DB_SETUP.call_once(|| {
            tokio::runtime::Runtime::new().unwrap().block_on(setup_test_database_table());
        });

        let datasource = get_configured_datasource()?;
        let user_id_base = "crud_user";
        let initial_user = create_test_user(user_id_base);

        // 1. Create
        let created_user = datasource.create(initial_user.clone())?;
        assert_eq!(created_user, initial_user, "Created user should match initial user");

        // 2. Get by ID
        let fetched_user_opt: Option<TestUser> = datasource.get_by_id(&initial_user.id)?;
        assert!(fetched_user_opt.is_some(), "User should be found by ID after creation");
        assert_eq!(fetched_user_opt.unwrap(), initial_user, "Fetched user should match initial user");

        // 3. Get All
        let all_users = datasource.get_all()?;
        assert!(all_users.contains(&initial_user), "Get all should contain the created user");

        // 4. Update
        let mut user_to_update = initial_user.clone();
        user_to_update.name = "Updated CRUD User Name".to_string();
        user_to_update.age = 99;
        user_to_update.active = false;

        let updated_user_result = datasource.update(&initial_user.id, user_to_update.clone())?;
        assert_eq!(updated_user_result, user_to_update, "Update method should return the updated user data");
        
        let fetched_after_update_opt: Option<TestUser> = datasource.get_by_id(&initial_user.id)?;
        assert!(fetched_after_update_opt.is_some(), "User should still be found after update");
        assert_eq!(fetched_after_update_opt.unwrap(), user_to_update, "Fetched user should reflect updates");

        // 5. Delete
        let delete_result = DataSource::<TestUser>::delete(&datasource, &initial_user.id)?;
        assert!(delete_result, "Delete should return true for an existing user");

        // 6. Verify Deletion
        let fetched_after_delete_opt: Option<TestUser> = datasource.get_by_id(&initial_user.id)?;
        assert!(fetched_after_delete_opt.is_none(), "User should not be found after deletion");
        
        let all_users_after_delete = datasource.get_all()?;
        assert!(!all_users_after_delete.contains(&initial_user), "Get all should not contain the deleted user");

        Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_get_non_existent_entity() -> Result<(), Box<dyn Error>> {
        DB_SETUP.call_once(|| {
            tokio::runtime::Runtime::new().unwrap().block_on(setup_test_database_table());
        });
        let datasource = get_configured_datasource()?;
        let result : Option<TestUser> = datasource.get_by_id("non_existent_id_12345")?;
        assert!(result.is_none(), "Getting a non-existent entity by ID should return None");
        Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_update_non_existent_entity() -> Result<(), Box<dyn Error>> {
        DB_SETUP.call_once(|| {
            tokio::runtime::Runtime::new().unwrap().block_on(setup_test_database_table());
        });
        let datasource = get_configured_datasource()?;
        let user_update = create_test_user("update_non_existent");
        
        // The current implementation of update might not check if rows_affected > 0
        // It returns the item passed to it. If it should error, the underlying sqlx execute might error
        // or you might want to adjust MariaDbDatasource::update to check rows_affected.
        // For now, we test the current behavior.
        let result = datasource.update("id_does_not_exist", user_update.clone())?;
        assert_eq!(result, user_update, "Update on non-existent ID currently returns the provided item");

        // Optionally, verify that no new record was created and no existing one was affected if possible
        // This might require querying the DB directly or checking counts.
        Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_delete_non_existent_entity() -> Result<(), Box<dyn Error>> {
        DB_SETUP.call_once(|| {
            tokio::runtime::Runtime::new().unwrap().block_on(setup_test_database_table());
        });
        let datasource = get_configured_datasource()?;
        let result = DataSource::<TestUser>::delete(&datasource, "id_does_not_exist_either")?;
        assert!(!result, "Deleting a non-existent entity should return false");
        Ok(())
    }
}