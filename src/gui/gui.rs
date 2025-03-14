use iced::widget::{column, container, text};
use iced::Length::Fill;
use iced::{Element, Task};

use crate::gui::home;
use super::home::handle_message;
use crate::request_manager::request::{self, Request};
use super::widgets::request_button::{request_button_component, RequestButton};

#[derive(Debug, Clone)]
pub struct State {
    actual_tab: Tab,
    requests: Vec<(request::RequestImpl, bool)>,
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

impl Default for State {
    fn default() -> Self {
        // Crear algunas requests predeterminadas
        let default_requests = vec![
            (
                request::RequestImpl::new("GET", "https://jsonplaceholder.typicode.com/todos/1", "Get Todo", ""),
                false
            ),
            (
                request::RequestImpl::new("POST", "https://jsonplaceholder.typicode.com/posts", "Create Post", "{ \"title\": \"foo\", \"body\": \"bar\", \"userId\": 1 }"),
                false
            ),
        ];
        
        Self {
            actual_tab: Tab::default(),
            requests: default_requests,
        }
    }
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
            
            let mut found = false;
            for (req, toggled) in &mut state.requests {
                if req.get_url() == request.get_url() && req.get_method().to_string() == request.get_method().to_string() {
                    *toggled = !*toggled;
                    found = true;
                    break;
                }
            }
            
            if !found {
                state.requests.push((request, true));
            }
            
            Task::none()
        }
    }
}

pub fn view(state: &State) -> Element<Message> {


    let request_buttons: Vec<_> = state.requests.iter().map(|(req, toggled)| {
        request_button_component(RequestButton {
            request: req.clone(),
            is_toggled: *toggled,
        })
    }).collect();
    
    let mut column_children = request_buttons;
    column_children.push(iced::widget::Space::with_width(Fill).into());
    
    let requests_tab_bar = iced::widget::Column::with_children(column_children)
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



