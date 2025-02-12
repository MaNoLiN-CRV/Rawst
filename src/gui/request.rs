#[derive(Debug, Clone)]
enum RequestType {
    GET,
    POST,
    PUT,
    DELETE,
}

trait Request {
    fn get_name(&self) -> String;
    fn get_url(&self) -> String;
    fn get_method(&self) -> RequestType;
}

#[derive(Debug, Clone)]
pub struct RequestImpl {
    name: String,
    url: String,
    method: RequestType,
}


impl Default for RequestImpl {
    fn default() -> Self {
        Self {
            name: "Default Request".to_string(),
            url: "https://api.example.com".to_string(),
            method: RequestType::GET,
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
}

fn main() {
    let req = RequestImpl::default(); // Crea una request con valores predeterminados
    println!("Nombre: {}", req.get_name());
    println!("URL: {}", req.get_url());
    println!("Método: {:?}", req.get_method());
}
