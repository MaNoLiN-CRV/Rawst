use std::any::Any;
use crate::data::datasource::DataSource;
use crate::config::specific::database_config::DatabaseConfig;



pub trait DatabaseSource<T>: DataSource<T> {
    fn get_connection(&self) -> Result<Box<dyn Any>, Box<dyn std::error::Error>>;
    fn get_db_structure(&self) -> &RelationalDatabase;
    fn connect(&self) -> Result<(), Box<dyn std::error::Error>>;
    fn disconnect(&self) -> Result<(), Box<dyn std::error::Error>>;
}

pub struct RelationalDatabase{
    pub config: DatabaseConfig,

    // *** FELIX ***
    // Ahi tienes todo lo que necesitas para la configuracion de la base de datos
    // Si quieres leer mas configuracion que ha seteado el usuario, como entidades y demás
    // usa directamente el config de la API (config::configuration::Config)
    // *** FELIX ***
}

impl RelationalDatabase {
    pub fn new(config: &DatabaseConfig) -> Self {
        RelationalDatabase {
            config: config.clone()
        }
    }
}

impl<T> DatabaseSource<T> for RelationalDatabase {
    fn get_connection(&self) -> Result<Box<dyn Any>, Box<dyn std::error::Error>> {
  
        let db_type = self.config.db_type.clone();
        

        Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other, "Not implemented")))
    }

    fn get_db_structure(&self) -> &RelationalDatabase {
        self
    }

    fn connect(&self) -> Result<(), Box<dyn std::error::Error>> {
        Ok(())
    }

    fn disconnect(&self) -> Result<(), Box<dyn std::error::Error>> {
        Ok(())
    }
}

impl<T> DataSource<T> for RelationalDatabase {
    fn get_all(&self) -> Result<Vec<T>, Box<dyn std::error::Error>> {
        Ok(vec![])
    }

    fn create(&self, item: T) -> Result<T, Box<dyn std::error::Error>> {
        Ok(item)
    }

    fn update(&self, id: &str, item: T) -> Result<T, Box<dyn std::error::Error>> {
        Ok(item)
    }

    fn delete(&self, id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        Ok(true)
    }
    
    fn box_clone(&self) -> Box<dyn DataSource<T>> {
        todo!()
    }
}
