use iced::widget::{column, container, text};
use iced::Length::Fill;
use iced::{Element, Task};

use crate::gui::home;
use super::home::handle_message;
use super::widgets;
use crate::request_manager::request::{self, Request};
use super::widgets::request_button::{request_button_component, RequestButton};


    

#[derive(Default, Debug, Clone, Copy, PartialEq)]
pub enum Tab {
    #[default]
    Home,
    Editor,
}

// State of the GUI. Interacts via messages.
#[derive(Debug, Clone)]
pub struct State {
    actual_tab: Tab,
    requests: Vec<(request::RequestImpl, bool)>,
}

// Defines the messages that can be sent to the GUI. Acts like a message bus, like events.
#[derive(Debug, Clone)]
pub enum Message {
    TabChanged(Tab),
    MessageHome(home::MessageHome),
    RequestButtonToggled(request::RequestImpl),
}



// Default implementation for State
impl Default for State {
    fn default() -> Self {
        let default_requests = vec![
            (
                request::RequestImpl::new("GET", "https://jsonplaceholder.typicode.com/todos/1", "Get Todo", ""),
                false
            ),
            (
                request::RequestImpl::new("POST", "https://jsonplaceholder.typicode.com/posts", "Create Post", 
                "{ \"title\": \"foo\", \"body\": \"bar\", \"userId\": 1 }"),
                false
            ),
        ];
        Self {
            actual_tab: Tab::default(),
            requests: default_requests,
        }
    }
}

// implementa metodos dentro de state para poder acceder a los requests y hacer cosas con ellos.
// deberia de poder refactorizar la gui y meter states distintos para cada parte de la gui
impl State {

    pub fn requests(&self) -> &[(request::RequestImpl, bool)] {
        &self.requests
    }

    pub fn toggle_request(&mut self, request: &request::RequestImpl) -> bool {
        let mut found = false;
        for (req, toggled) in &mut self.requests {
            if req.get_url() == request.get_url() && req.get_method().to_string() == request.get_method().to_string() {
                *toggled = !*toggled;
                found = true;
                break;
            }
        }
        
        if !found {
            self.requests.push((request.clone(), true));
        }
        
        found
    }
    
    // Método para añadir una request
    pub fn add_request(&mut self, request: request::RequestImpl, toggled: bool) {
        self.requests.push((request, toggled));
    }
}


// Updates the state of the GUI based on the message received.
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
            state.toggle_request(&request);
            Task::none()
        }
      
    }
}

// Main GUI view. It is the main component that will be rendered.
pub fn view(state: &State) -> Element<Message> {

    let request_buttons = 
    widgets::requests_column::build_requests_column_widget(state);
    
    let search_and_name = column![
        text("COSMURL"),
        
    ]
    .spacing(20);

    let left_bar = column![

        container(
            column![
                search_and_name,
                request_buttons
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



