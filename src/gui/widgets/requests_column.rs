use iced::{Element, Length};
use crate::gui::gui::{Message, State};
use crate::gui::widgets::request_button::{RequestButton, request_button_component};

pub fn build_requests_column_widget(state: &State) -> Element<'static, Message> {
    let request_buttons = state.requests().iter().map(|(req, toggled)| {
        request_button_component(RequestButton {
            request: req,
            is_toggled: *toggled,
        })
    }).collect::<Vec<_>>();
    
    let mut column_children = request_buttons;
    column_children.push(iced::widget::Space::with_width(Length::Fill).into());
    
    iced::widget::Column::with_children(column_children)
        .spacing(5)
        .width(Length::Fill)
        .into()
}