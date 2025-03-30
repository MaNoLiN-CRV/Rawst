pub struct DataError {
    message: String,
}

impl DataError {
    pub fn new(message: &str) -> Self {
        DataError {
            message: message.to_string(),
        }
    }

    pub fn get_message(&self) -> &str {
        &self.message
    }
}