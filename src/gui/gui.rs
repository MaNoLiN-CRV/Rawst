use iced::widget::{button, column, container, row, text};
use iced::Length::Fill;
use iced::{Alignment, Element, Task};

use crate::gui::home::home_screen;
use crate::gui::home;




use super::appareance::theme::button::button_style;
use super::home::handle_message;
use super::widgets::request_button::{self, request_button_component, RequestButton};

#[derive(Default)]
pub struct State {
    actual_tab: Tab,
}

#[derive(Default, Debug, Clone, Copy, PartialEq)]
pub enum Tab {
    #[default]
    Home,
    Editor,
}

#[derive(Debug, Clone)]
pub enum Message {
    TabChanged(Tab),
    MessageHome(home::MessageHome),
    RequestButtonPressed(String),
}

pub fn update(state: &mut State, message: Message) -> iced::Task<Message> {
    match message {
        Message::TabChanged(message) => {
            state.actual_tab = message;
            Task::none()
        }
        Message::MessageHome(message) => {
            handle_message(message).map(Message::MessageHome)
        }
        Message::RequestButtonPressed(request_name) => {
            println!("Request button pressed: {}", request_name);
            Task::none()
        }
    }
}

pub fn view(state: &State) -> Element<Message> {

    let requests_tab_bar = column![

        request_button_component(RequestButton {
            name: "Request 1",
            url: "https://api.example.com",
            method: "GET"
        }),

        iced::widget::Space::with_width(Fill), 
    ]
    .spacing(5)
    .width(Fill);

    let search_and_name = column![
        text("COSMURL"),
        
        
    ]
    .spacing(20);

    let left_bar = column![

        container(
            column![
                search_and_name,
                requests_tab_bar
            ].spacing(20)
        )
     
    
    ]
    .spacing(20);

  


    container(  
        left_bar
    )


        
    .padding(15)
    .width(Fill)
    .height(Fill)
    .into()

    

}



