use iced::{
    widget::button::{Status, Style},
    Theme,
};


pub fn button_style(theme: &Theme, st: Status) -> Style {

    let palette = theme.extended_palette();
    let mut style = Style::default();
    style.border.width = 1.0;
    style.text_color = palette.secondary.strong.color;
    style.border.color = palette.secondary.strong.color;

    match st {
        Status::Active => {
            style.border.width = 1.0;
            style.text_color = palette.secondary.strong.color;
            style.border.color = palette.secondary.strong.color;
        }
        Status::Hovered => {
            style.border.width = 1.0;
            style.text_color = palette.secondary.weak.color;
            style.border.color = palette.secondary.weak.color;
        }
        Status::Pressed => {
            style.text_color = palette.secondary.strong.color;
            style.border.color = palette.secondary.strong.color;
        } 
        Status::Disabled => {
            style.text_color = palette.secondary.strong.color;
        }
    }

    style
}


