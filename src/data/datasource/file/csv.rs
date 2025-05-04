use std::error::Error;
use std::path::PathBuf;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use crate::api::common::api_entity::ApiEntity;
use crate::data::datasource::base::{DataSource, DataSourceError};
use crate::data::datasource::file::base::{FileSource, FileMapping, FileFormat};
use serde::{Serialize, de::DeserializeOwned};

/// Datasource implementation for CSV files
pub struct CsvDatasource<T: ApiEntity> {
    file_mapping: FileMapping,
    _phantom: std::marker::PhantomData<T>,
}

impl<T: ApiEntity> CsvDatasource<T> {
    /// Creates a new CSV datasource
    pub fn new(file_path: PathBuf, delimiter: char, has_header: bool) -> Self {
        let file_mapping = FileMapping {
            file_path,
            id_field: "id".to_string(), // Default
            format: FileFormat::CSV {
                delimiter,
                has_header,
            },
        };
        
        CsvDatasource {
            file_mapping,
            _phantom: std::marker::PhantomData,
        }
    }
}

impl<T: ApiEntity> FileSource<T> for CsvDatasource<T> {
    fn get_file_path(&self) -> &PathBuf {
        &self.file_mapping.file_path
    }
    
    fn set_file_path(&mut self, path: PathBuf) {
        self.file_mapping.file_path = path;
    }
    
    fn read_file_contents(&self) -> Result<String, Box<dyn Error>> {
        let mut file = File::open(&self.file_mapping.file_path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        Ok(contents)
    }
    
    fn write_file_contents(&self, contents: &str) -> Result<(), Box<dyn Error>> {
        let mut file = OpenOptions::new()
            .write(true)
            .truncate(true)
            .create(true)
            .open(&self.file_mapping.file_path)?;
        file.write_all(contents.as_bytes())?;
        Ok(())
    }
}

impl<T: ApiEntity + Serialize + DeserializeOwned> DataSource<T> for CsvDatasource<T> {
    fn get_all(&self) -> Result<Vec<T>, Box<dyn Error>> {
        // Basic implementation - would be expanded in a real version
        Err(Box::new(DataSourceError::QueryError(
            "The get_all() implementation for CSV is not complete".to_string()
        )))
    }
    
    fn get_by_id(&self, _id: &str) -> Result<Option<T>, Box<dyn Error>> {
        // Basic implementation - would be expanded in a real version
        Err(Box::new(DataSourceError::QueryError(
            "The get_by_id() implementation for CSV is not complete".to_string()
        )))
    }
    
    fn create(&self, _item: T) -> Result<T, Box<dyn Error>> {
        // Basic implementation - would be expanded in a real version
        Err(Box::new(DataSourceError::QueryError(
            "The create() implementation for CSV is not complete".to_string()
        )))
    }
    
    fn update(&self, _id: &str, _item: T) -> Result<T, Box<dyn Error>> {
        // Basic implementation - would be expanded in a real version
        Err(Box::new(DataSourceError::QueryError(
            "The update() implementation for CSV is not complete".to_string()
        )))
    }
    
    fn delete(&self, _id: &str) -> Result<bool, Box<dyn Error>> {
        // Basic implementation - would be expanded in a real version
        Err(Box::new(DataSourceError::QueryError(
            "The delete() implementation for CSV is not complete".to_string()
        )))
    }
    
    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        Box::new(CsvDatasource {
            file_mapping: self.file_mapping.clone(),
            _phantom: std::marker::PhantomData,
        })
    }
}

impl<T: ApiEntity> Clone for CsvDatasource<T> {
    fn clone(&self) -> Self {
        CsvDatasource {
            file_mapping: self.file_mapping.clone(),
            _phantom: std::marker::PhantomData,
        }
    }
}