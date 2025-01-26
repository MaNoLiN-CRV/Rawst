use iced::{
    widget::button::{Status, Style},
    Theme,
};

pub fn selected(theme: &Theme, _: Status) -> Style {
    let palette = theme.extended_palette();
    let mut style = Style::default();
    style.border.width = 1.0;
    style.text_color = palette.secondary.strong.color;
    style.border.color = palette.secondary.strong.color;
    style
}

pub fn unselected(theme: &Theme, _: Status) -> Style {
    let palette = theme.extended_palette();
    let mut style = Style::default();
    style.border.width = 1.0;
    style.text_color = palette.secondary.base.color;
    style.border.color = palette.secondary.base.color;
    style
}