use serde::Serialize;
use serde::Deserialize;
use serde_json;

pub trait Configuration {
    fn get_config(&self) -> Result<String, Box<dyn std::error::Error>>;
    fn set_config(&mut self, config: String) -> Result<(), Box<dyn std::error::Error>>;
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}
impl Config {
    pub fn new(host: String, port: u16, database: String, username: String, password: String) -> Self {
        Config {
            host,
            port,
            database,
            username,
            password,
        }
    }
}
impl Configuration for Config {
    fn get_config(&self) -> Result<String, Box<dyn std::error::Error>> {
        let config = serde_json::to_string(self)?;
        Ok(config)
    }

    fn set_config(&mut self, config: String) -> Result<(), Box<dyn std::error::Error>> {
        let new_config: Config = serde_json::from_str(&config)?;
        self.host = new_config.host;
        self.port = new_config.port;
        self.database = new_config.database;
        self.username = new_config.username;
        self.password = new_config.password;
        Ok(())
    }
}
