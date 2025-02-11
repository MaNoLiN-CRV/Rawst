pub mod gui;
pub mod filemanager;



use gui::appareance::theme::Theme;
use gui::gui::{update, view, State};



pub fn main() -> iced::Result {

    iced::application("Cosmtes", update, view)
    .theme(Theme::Cosm)
    .run()

}

pub fn theme(state: &State) -> iced::Theme {
    Theme::Cosm
}







