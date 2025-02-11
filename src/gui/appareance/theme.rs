pub mod button;

use iced::Color;
use super::colors::Colors;


#[derive(Debug, Clone)]
pub enum Theme {
    Cosm,
}

// Todo: This creates a new instance of the Colors struct for each theme.
// This is not efficient and should be changed to a static instance of the Colors struct.
// This is a temporary solution to the problem, because right now I dont intend on changing the theme at runtime.

impl Theme {
    pub fn colors(&self) -> Colors {
        match self {
            Theme::Cosm => Colors::default(),
        }
    }
}

impl Default for Theme {
    fn default() -> Self {
        Theme::Cosm
    }
}

impl iced::theme::Base for Theme {
    fn base(&self) -> iced::theme::Style {
        iced::theme::Style {
            background_color: Color::from_rgb8(255, 255, 255),
            text_color: Color::from_rgb8(0, 0, 0),
        }
    }
}




