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

impl std::error::Error for DataError {}

impl std::fmt::Display for DataError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::fmt::Debug for DataError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "DataError: {}", self.message)
    }
}