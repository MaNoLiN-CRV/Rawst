use std::{collections::HashMap, error::Error};

use serde::{Deserialize, Serialize};

use super::data_error::DataError;

/**
 * Defines a Trait that will be used to interact via CRUD operations with the data source.
 * This trait will include methods for creating, reading, updating, and deleting records.
 */

#[derive(Serialize, Deserialize)]
struct Data {
    id: String,
    fields: HashMap<String, String>,

}

trait DataSource {
    fn get_all(&self) -> Result<Vec<Data>, DataError>;
    fn get_by_id(&self, id: &str) -> Result<Data, DataError>;
    fn create(&self, data: Data) -> Result<(), DataError>;
    fn update(&self, id: &str, data: Data) -> Result<(), DataError>;
    fn delete(&self, id: &str) -> Result<(), DataError>;
}
