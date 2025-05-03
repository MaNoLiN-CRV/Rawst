pub mod csv_ds;
pub mod json_ds;
pub mod norelationaldb_ds;
pub mod relationaldb_ds;
pub mod xml_ds;

// Macro para implementar box_clone para estructuras que implementan DataSource<T>
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

        impl$(<$($generic),*>)? DataSource<$($($generic),*)?> for $type {
            // ...existing methods...

            fn box_clone(&self) -> Box<dyn DataSource<$($($generic),*)? + 'static>> {
                Box::new(self.clone())
            }
        }
    };
}

/**
 * Defines a Trait that will be used to interact via CRUD operations with the data source.
 * This trait will include methods for creating, reading, updating, and deleting records.
 */

pub trait DataSource<T>: Send + Sync {
    fn get_all(&self) -> Result<Vec<T>, Box<dyn std::error::Error>>;
    fn create(&self, item: T) -> Result<T, Box<dyn std::error::Error>>;
    fn update(&self, id: &str, item: T) -> Result<T, Box<dyn std::error::Error>>;
    fn delete(&self, id: &str) -> Result<bool, Box<dyn std::error::Error>>;

    // Método que permite la clonación de trait objects
    fn box_clone(&self) -> Box<dyn DataSource<T>>;
}

impl<T> DataSource<T> for Box<dyn DataSource<T>> {
    fn get_all(&self) -> Result<Vec<T>, Box<dyn std::error::Error>> {
        (**self).get_all()
    }

    fn create(&self, item: T) -> Result<T, Box<dyn std::error::Error>> {
        (**self).create(item)
    }

    fn update(&self, id: &str, item: T) -> Result<T, Box<dyn std::error::Error>> {
        (**self).update(id, item)
    }

    fn delete(&self, id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        (**self).delete(id)
    }

    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        (**self).box_clone()
    }
}
