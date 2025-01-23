use iced::Theme;
use cosmtes::gui::gui::{update, view, State};

pub fn main() -> iced::Result {
    iced::application("Cosmtes", update, view)
        .theme(theme)
        .run()
}

fn theme(_state: &State) -> Theme {
    Theme::Ferra
}


