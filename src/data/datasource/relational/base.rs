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

/// Helper to create a table mapping from an entity
pub fn create_table_mapping(entity: &Entity) -> TableMapping {
    let table_name = entity.table_name.clone().unwrap_or_else(|| entity.name.clone());
    let primary_key = detect_primary_key(entity);
    
    let fields = entity.fields.iter().map(|field| {
        FieldMapping {
            field_name: field.name.clone(),
            column_name: field.column_name.clone().unwrap_or_else(|| field.name.clone()),
            field_type: data_type_to_string(&field.data_type),
        }
    }).collect();
    
    TableMapping {
        table_name,
        primary_key,
        fields,
    }
}