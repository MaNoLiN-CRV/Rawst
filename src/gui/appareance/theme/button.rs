use iced::widget::button::{Catalog, Status, Style, StyleFn};
use iced::{Background, Border, Color};

use super::Theme;

impl Catalog for Theme {
    type Class<'a> = StyleFn<'a, Self>;

    fn default<'a>() -> Self::Class<'a> {
        Box::new(default)
    }

    fn style(&self, class: &Self::Class<'_>, status: Status) -> Style {
        class(self, status)
    }
}

fn default(theme: &Theme, status: Status) -> Style {
    primary(theme, status, false)
}

fn button(foreground: Color, background: Color, 
    background_hover: Color, status: Status) -> Style {

    match status {
        Status::Active | Status::Pressed => Style {
            background: Some(Background::Color(background)),
            text_color: foreground,
            border: Border {
                width: 1.0,
                ..Default::default()
            },
            ..Default::default()
        },
        Status::Hovered => Style {
            background: Some(Background::Color(background_hover)),
            text_color: foreground,
            border: Border {
                width: 1.0,
                ..Default::default()
            },
            ..Default::default()
        },
        Status::Disabled => {
            let active: Style = button(foreground, background, background_hover, Status::Active);

            Style {
                text_color: Color {
                    a: 0.2,
                    ..active.text_color
                },
                ..active
            }
        }
    }
}


pub fn primary(theme: &Theme, status: Status, selected: bool) -> Style {
    let foreground = theme.colors().primary;

    let background = if selected {
        theme.colors().background
    } else {
        theme.colors().primary
    };

    let background_hover = if selected {
        theme.colors().primary
    } else {
        theme.colors().background
    };

    button(foreground, background, background_hover, status)
}

pub fn secondary(theme: &Theme, status: Status, selected: bool) -> Style {
    let foreground = theme.colors().secondary;

    let background = if selected {
        theme.colors().background
    } else {
        theme.colors().secondary
    };

    let background_hover = if selected {
        theme.colors().primary
    } else {
        theme.colors().background
    };

    button(foreground, background, background_hover, status)
}

