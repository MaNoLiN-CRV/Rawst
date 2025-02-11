pub mod gui;
pub mod filemanager;



use iced::Theme;

use gui::gui::{update, view, State};



pub fn main() -> iced::Result {

    iced::application("Cosmurl", update, view)
    .theme(theme)
    .run()

}

fn theme(state: &State) -> Theme {
    Theme::Ferra
}




