use filemanager::file::get_config_file;


pub mod filemanager;
pub mod request_manager;
pub mod data;
pub mod config;



#[tokio::main]
pub async fn main() {

    let config_file = get_config_file();
    

}


