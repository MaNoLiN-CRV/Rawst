pub mod csv_ds;
pub mod json_ds;
pub mod norelationaldb_ds;
pub mod relationaldb_ds;
pub mod xml_ds;

/**
 * Defines a Trait that will be used to interact via CRUD operations with the data source.
 * This trait will include methods for creating, reading, updating, and deleting records.
 */

pub trait DataSource<T> {
    fn get_all(&self) -> Result<Vec<T>, Box<dyn std::error::Error>>;
    fn create(&self, item: T) -> Result<T, Box<dyn std::error::Error>>;
    fn update(&self, id: &str, item: T) -> Result<T, Box<dyn std::error::Error>>;
    fn delete(&self, id: &str) -> Result<bool, Box<dyn std::error::Error>>;
}
