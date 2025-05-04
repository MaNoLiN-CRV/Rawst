use std::error::Error;
use std::path::PathBuf;
use crate::data::datasource::base::DataSource;

/// Trait for file-based datasources
pub trait FileSource<T>: DataSource<T> {
    /// Gets the file path
    fn get_file_path(&self) -> &PathBuf;
    
    /// Sets the file path
    fn set_file_path(&mut self, path: PathBuf);
    
    /// Reads all content from the file
    fn read_file_contents(&self) -> Result<String, Box<dyn Error>>;
    
    /// Writes content to the file
    fn write_file_contents(&self, contents: &str) -> Result<(), Box<dyn Error>>;
}

/// Structure to map entities to files
#[derive(Clone)]
pub struct FileMapping {
    /// File path
    pub file_path: PathBuf,
    /// Field used as ID
    pub id_field: String,
    /// File format type (csv, json, xml, etc.)
    pub format: FileFormat,
}

/// Supported file formats
#[derive(Clone)]
pub enum FileFormat {
    /// CSV file (comma-separated values)
    CSV {
        delimiter: char,
        has_header: bool
    },
    /// JSON file
    JSON {
        is_array: bool
    },
    /// XML file
    XML {
        root_element: String,
        item_element: String
    },
    /// Custom format
    Custom(String),
}