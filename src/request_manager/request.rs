use std::fmt::{Display, Formatter};

#[derive(Debug, Clone)]
pub enum RequestType {
    GET,
    POST,
    PUT,
    DELETE,
}

pub trait Request {
    fn get_name(&self) -> String;
    fn get_url(&self) -> String;
    fn get_method(&self) -> RequestType;
    fn get_body(&self) -> String;
    fn get_headers(&self) -> Vec<String>; 
}

#[derive(Debug, Clone)]
pub struct RequestImpl {
    name: String,
    url: String,
    method: RequestType,
    body: String,
    headers: Vec<String>,
}



impl Display for RequestType {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}


impl Default for RequestImpl {
    fn default() -> Self {
        Self {
            name: "Default Request".to_string(),
            url: "https://api.example.com".to_string(),
            method: RequestType::GET,
            body: "".to_string(),
            headers: vec![],
        }
    }
}

impl RequestImpl {
    pub fn new(method_str: &str, url: &str, name: &str, body: &str) -> Self {
        let method = match method_str.to_uppercase().as_str() {
            "GET" => RequestType::GET,
            "POST" => RequestType::POST,
            "PUT" => RequestType::PUT,
            "DELETE" => RequestType::DELETE,
            _ => RequestType::GET,
        };
        
        Self {
            name: name.to_string(),
            url: url.to_string(),
            method,
            body: body.to_string(),
            headers: vec![],
        }
    }
}


impl Request for RequestImpl {
    fn get_name(&self) -> String {
        self.name.clone()
    }

    fn get_url(&self) -> String {
        self.url.clone()
    }

    fn get_method(&self) -> RequestType {
        self.method.clone()
    }

    fn get_body(&self) -> String {
        self.body.clone()
    }

    fn get_headers(&self) -> Vec<String> {
        self.headers.clone()
    }
}

