use std::any::Any;
use crate::config::specific::entity_config::{Entity, DataType};
use crate::data::datasource::base::{DataSource, DatabaseCommon};

/// Trait for relational datasources
pub trait RelationalSource<T>: DataSource<T> + DatabaseCommon {
    /// Gets the database structure
    fn get_db_structure(&self) -> &dyn Any;
}

/// Structure to map entity fields to database columns
#[derive(Clone)]
pub struct FieldMapping {
    pub field_name: String,
    pub column_name: String,
    pub field_type: String,
}

/// Structure to map entities to tables
#[derive(Clone)]
pub struct TableMapping {
    pub table_name: String,
    pub primary_key: String,
    pub fields: Vec<FieldMapping>,
}

/// Converts an entity data type to a relational database type
pub fn data_type_to_string(data_type: &DataType) -> String {
    match data_type {
        DataType::String => "string".to_string(),
        DataType::Integer => "integer".to_string(),
        DataType::Float => "float".to_string(),
        DataType::Boolean => "boolean".to_string(),
        DataType::Date => "date".to_string(),
        DataType::DateTime => "datetime".to_string(),
        DataType::Binary => "binary".to_string(),
        DataType::JSON => "json".to_string(),
    }
}

/// Helper to detect a primary key in an entity
pub fn detect_primary_key(entity: &Entity) -> String {
    // Look for a field marked as primary key or use "id" by default
    entity.fields.iter()
        .find(|f| f.name == "id" || (f.unique && f.required))
        .map(|f| f.name.clone())
        .unwrap_or_else(|| "id".to_string())
}

/// Create a table mapping for an entity
pub fn create_table_mapping(entity: &Entity) -> TableMapping {
    // Get the table name from entity config, fallback to entity name if not specified
    let table_name = entity.table_name.clone().unwrap_or_else(|| entity.name.clone());
    
    // Create field mappings based on entity fields
    let mut fields = Vec::new();
    let mut primary_key = "id".to_string(); // Default primary key
    
    for field in &entity.fields {
        let column_name = field.column_name.clone().unwrap_or_else(|| field.name.clone());
        
        // Add field to mappings
        fields.push(FieldMapping {
            field_name: field.name.clone(),
            column_name: column_name.clone(),
            field_type: data_type_to_string(&field.data_type),
        });
        
        // Use first field as primary key for now (better handling needed)
        if fields.len() == 1 {
            primary_key = column_name;
        }
    }
    
    TableMapping {
        table_name,
        primary_key,
        fields,
    }
}