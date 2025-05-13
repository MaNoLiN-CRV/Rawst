use std::any::Any;
use std::error::Error;
use crate::data::datasource::base::{DataSource, DatabaseCommon};

/// Trait for document-based datasources like MongoDB, CouchDB, etc.
pub trait DocumentSource<T>: DataSource<T> + DatabaseCommon {
    /// Gets the structure of the document database
    fn get_db_structure(&self) -> &dyn Any;
    
    /// Executes a query on the document database
    fn execute_query(&self, query: &str, params: &[&str]) -> Result<Vec<T>, Box<dyn Error>>;
}

/// Structure to map entities to collections
#[derive(Clone)]
pub struct CollectionMapping {
    /// Name of the collection
    pub collection_name: String,
    /// Field used as the ID
    pub id_field: String,
    /// Indexes for the collection
    pub indexes: Vec<IndexDefinition>,
}

/// Definition of an index for a collection
#[derive(Clone)]
pub struct IndexDefinition {
    /// Name of the index
    pub name: String,
    /// Fields in the index
    pub fields: Vec<String>,
    /// Whether the index is unique
    pub unique: bool,
}