use std::any::Any;
use std::error::Error;

/// Core trait for all CRUD operations in a data source
pub trait DataSource<T>: Send + Sync {
    /// Gets all entities
    fn get_all(&self) -> Result<Vec<T>, Box<dyn Error>>;
    
    /// Creates a new entity
    fn create(&self, item: T) -> Result<T, Box<dyn Error>>;
    
    /// Updates an existing entity
    fn update(&self, id: &str, item: T) -> Result<T, Box<dyn Error>>;
    
    /// Deletes an entity by its ID
    fn delete(&self, id: &str) -> Result<bool, Box<dyn Error>>;
    
    /// Gets an entity by its ID
    fn get_by_id(&self, id: &str) -> Result<Option<T>, Box<dyn Error>>;

    /// Method to clone a trait object
    fn box_clone(&self) -> Box<dyn DataSource<T>>;
}

/// Implementation for Box<dyn DataSource<T>> to allow direct method use
impl<T> DataSource<T> for Box<dyn DataSource<T>> {
    fn get_all(&self) -> Result<Vec<T>, Box<dyn Error>> {
        (**self).get_all()
    }

    fn create(&self, item: T) -> Result<T, Box<dyn Error>> {
        (**self).create(item)
    }

    fn update(&self, id: &str, item: T) -> Result<T, Box<dyn Error>> {
        (**self).update(id, item)
    }

    fn delete(&self, id: &str) -> Result<bool, Box<dyn Error>> {
        (**self).delete(id)
    }

    fn get_by_id(&self, id: &str) -> Result<Option<T>, Box<dyn Error>> {
        (**self).get_by_id(id)
    }

    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        (**self).box_clone()
    }
}

/// Macro to implement box_clone for structures that implement DataSource<T>
#[macro_export]
macro_rules! impl_datasource_clone {
    ($type:ty, $(<$($generic:ident),*>)?) => {
        impl$(<$($generic),*>)? Clone for $type {
            fn clone(&self) -> Self {
                Self {
                    ..(*self)
                }
            }
        }

        impl$(<$($generic),*>)? DataSource<$($($generic),*)? + 'static> for $type {
            fn box_clone(&self) -> Box<dyn DataSource<$($($generic),*)? + 'static>> {
                Box::new(self.clone())
            }
        }
    };
}

/// Specific error for datasource operations
#[derive(Debug)]
pub enum DataSourceError {
    ConnectionError(String),
    QueryError(String),
    NotFound(String),
    ValidationError(String),
    MappingError(String),
    SerializationError(String),
}

impl std::fmt::Display for DataSourceError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DataSourceError::ConnectionError(msg) => write!(f, "Connection error: {}", msg),
            DataSourceError::QueryError(msg) => write!(f, "Query error: {}", msg),
            DataSourceError::NotFound(msg) => write!(f, "Not found: {}", msg),
            DataSourceError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
            DataSourceError::MappingError(msg) => write!(f, "Mapping error: {}", msg),
            DataSourceError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
        }
    }
}

impl Error for DataSourceError {}

/// Trait for common database features
pub trait DatabaseCommon: Send + Sync {
    /// Gets the database connection
    fn get_connection(&self) -> Result<Box<dyn Any>, Box<dyn Error>>;
    
    /// Connects to the database
    fn connect(&self) -> Result<(), Box<dyn Error>>;
    
    /// Disconnects from the database
    fn disconnect(&self) -> Result<(), Box<dyn Error>>;
}

/// Trait for mapping between entities and tables/collections
pub trait EntityMapper {
    /// Configures the mappings between entities and their database representations
    fn configure_entity_mappings(&mut self) -> Result<(), Box<dyn Error>>;
}