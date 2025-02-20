use iced::widget::{column, container, text};
use iced::Length::Fill;
use iced::{Element, Task};

use crate::gui::home;
use super::home::handle_message;
use crate::request_manager::request;
use super::widgets::request_button::{request_button_component, RequestButton};

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
    RequestButtonToggled(request::RequestImpl),
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
        Message::RequestButtonToggled(request) => {
            println!("RequestButtonToggled: {:?}", request);
            



            Task::none()
        }
    }
}

pub fn view(state: &State) -> Element<Message> {

    let requests_tab_bar = column![

        request_button_component(RequestButton {
            name: "Request 1",
            url: "https://api.example.com",
            method: "GET",
            is_toggled: false,
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



