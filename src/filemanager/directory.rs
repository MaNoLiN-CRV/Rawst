use std::fs;

pub fn create_directory(path: &str) -> bool {
    fs::create_dir(path).is_ok()
}

fn get_username() -> String {
    let username = whoami::username();
    username
}

pub fn user_folder_path() -> String {
    format!("/Users/{}/Documents/Ruster Files/", get_username())
}

