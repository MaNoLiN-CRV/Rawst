use std::fs;

use crate::filemanager::directory::user_folder_path;

use super::directory::create_directory;

pub fn create_file(file_name: &str, path: &str) -> bool {
    fs::File::create(&format!("{}/{}", path, file_name)).is_ok()
}

pub fn get_files() -> Vec<String> {
    let path: &str = &user_folder_path();
    fs::read_dir(path)
        .unwrap()
        .map(|entry| entry.unwrap().file_name().into_string().unwrap())
        .collect()
}

pub fn get_config_file() -> String {

    let path: &str = &user_folder_path();

    match fs::metadata(path) {
        Ok(_) => {}
        Err(_) => {
            create_directory(path);
        }
    }

    let config_file = format!("{}/config.json", path);
    
    match fs::metadata(&config_file) {
        Ok(_) => config_file,
        Err(_) => {
            create_file("config.json", path);
            config_file
        }
    }
}


