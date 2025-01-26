use std::fs;

use crate::filemanager::directory::user_folder_path;

pub fn create_file(file_name : &str, path: &str) -> bool {
    fs::File::create(&format!("{}/{}", path, file_name)).is_ok()
}

pub fn get_files() -> Vec<String> {
    let path: &str = &user_folder_path();
    fs::read_dir(path)
        .unwrap()
        .map(|entry| entry.unwrap().file_name().into_string().unwrap())
        .collect()
}