use iced::widget::{button, column, row, text};
use iced::{Element, Length};

use crate::gui::styles::button_styles::{button_style, button_style_toggled};

use crate::gui::gui::Message;

/**
 * 
 * Uses a lifetime to avoid copying the strings
 * If I use string it wont work, because the button will try to take ownership of the string
 * and it will try to copy the string into the button, which will cause a compile error
 * because the string is not copyable
 * 
 * String is owned, which means it is allocated on the heap. When the memory is freed, 
 * the string is deallocated.
 * 
 * &str is borrowed, which means it is not allocated on the heap, it is just a pointer to a string
 * 
 * 'a means that the lifetime of the string is the same as the lifetime of the button, as long 
 * as the button exists, the string will exist (the pointer will exist)
 */

pub struct RequestButton<'a> {
    pub name: &'a str,
    pub url: &'a str,
    pub method: &'a str,
    pub is_toggled: bool,
}

pub fn request_button_component(info: RequestButton<'static>) -> Element<'static, Message> {
    let name = text(info.name);
    let url = text(info.url);
    let method = text(info.method);
    let is_toggled = info.is_toggled;

    button(
        column![row![method, name].spacing(10), url]
            .width(Length::Fill)
    )
    .on_press(Message::RequestButtonToggled(info.name.to_string()))
    .width(Length::Fill)
    .style(if is_toggled {
        button_style_toggled
    } else {
        button_style
    })
    .into()
}