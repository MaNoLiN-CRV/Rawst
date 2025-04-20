pub struct SerializationService;
use serde::de::DeserializeOwned;
use serde::Serialize;

impl SerializationService {
    /// Serializes the given data into a JSON string
    pub fn serialize<T: Serialize>(data: &T) -> Result<String, serde_json::Error> {
        serde_json::to_string(data)
    }

    /// Deserializes the given JSON string into the specified type
    pub fn deserialize<T: DeserializeOwned>(json_str: &str) -> Result<T, serde_json::Error> {
        serde_json::from_str(json_str)
    }
}
