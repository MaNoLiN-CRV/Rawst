use std::process::Command;

use super::request;

pub(crate) struct CurlClient;

impl CurlClient {
    
    pub(crate) fn execute_request(request: &impl request::Request) -> String {

        let headers = request.get_headers();
        
        let output = Command::new("curl")
            .arg("-X")
            .arg(request.get_method().to_string())
            .arg(&request.get_url())
            .args(headers.iter().map(|header| format!("-H {}", header)))
            .output()
            .expect("Fallo al ejecutar curl");
        String::from_utf8_lossy(&output.stdout).to_string()
    }
}