use iced::{Element, Task};
use iced::widget::{ button, column, text};

use crate::filemanager::directory::initialize_folder_system;

#[derive(Debug, Clone)]
pub enum MessageHome {
    CreateFile,
    TaskCompleted,
}

#[derive(Default)]
pub struct StateHome {
    
}


pub fn home_screen() -> Element<'static, MessageHome> {
    column![
        text("Home"),
        button("Create New File").on_press(MessageHome::CreateFile)
    ].into()
}


pub fn handle_message(message: MessageHome) -> Task<MessageHome> {
    match message {
        MessageHome::CreateFile => Task::perform(
            async {
                initialize_folder_system(); 
                println!("Creating file");
                MessageHome::TaskCompleted
            },
            |result| result
        ),
        _ => Task::none(),
    }
}