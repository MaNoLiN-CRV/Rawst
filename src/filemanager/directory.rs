use std::fs;

fn check_directory(path: &str) -> bool {
    fs::metadata(path).is_ok()
}

fn create_directory(path: &str) -> bool {
    println!("Directory created");
    fs::create_dir(path).is_ok()

}

fn get_username() -> String {
    let username = whoami::username();
    username
}

pub fn user_folder_path() -> String {
    format!("/Users/{}/Documents/Cosmtes Files/", get_username())
}

pub fn initialize_folder_system() -> bool {
    println!("Initializing folder system");
    let directory = check_directory(&user_folder_path());
    if !directory {
        return create_directory(&user_folder_path());
    }
    println!("Directory already exists");
    true
}


