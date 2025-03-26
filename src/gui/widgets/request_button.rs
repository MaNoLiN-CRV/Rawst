use iced::widget::{button, column, container, row, text};
use iced::{Element, Length};

use crate::gui::styles::button_styles::{button_style, button_style_toggled};

use crate::gui::gui::Message;
use crate::request_manager::request::{Request, RequestImpl};

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
    

/**
 * Nota: No uso aqui la referencia ya que boolean ocupa solo 1 byte, es mas rápido copiar 1 byte que
 * manejar 8 bytes de una referencia + dereferencia 
 */

pub struct RequestButton<'a> {
    pub request: &'a RequestImpl,
    pub is_toggled:  bool,
}


pub fn request_button_component(info: RequestButton) -> Element<'static, Message> {
    let name = text(info.request.get_name());
    let url = text(info.request.get_url());
    let method = text(info.request.get_method().to_string());
    let is_toggled = info.is_toggled;

    container(
        row![
            // Botón principal con la información de la solicitud
            button(
                column![
                    row![method, name].spacing(10), 
                    url
                ]
                .width(Length::Fill)
            )
            .on_press(Message::RequestButtonToggled(info.request.clone()))
            .width(Length::Fill)
            .style(if is_toggled {
                button_style_toggled
            } else {
                button_style
            }),
         
            button(
                text("Send")
                .align_x(iced::Alignment::Center)
                .height(Length::Fill)
                
            )
            .width(Length::Fill)
            .height(Length::Fill)
            .on_press(Message::RequestButtonToggled(info.request.clone()))
            .style(button_style)
          
        ]
        .spacing(10)
        .height(Length::Shrink) 
    )
    .into()
}