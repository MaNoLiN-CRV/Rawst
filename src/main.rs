use filemanager::file::get_config_file;


pub mod filemanager;
pub mod request_manager;




#[tokio::main]
pub async fn main() {

    let config_file = get_config_file();
    

}


