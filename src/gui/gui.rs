use iced::widget::{button, column, container, row};
use iced::Length::Fill;
use iced::{Alignment, Element, Task};

use crate::gui::home::home_screen;
use crate::gui::home;
use crate::gui::editor::editor_screen;
use crate::gui::editor;

use crate::gui::editor::MessageEditor;

use super::home::handle_message;

#[derive(Default)]
pub struct State {
    actual_tab: Tab,
    editor_state: editor::StateEditor,
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
    MessageEditor(editor::MessageEditor),
}

pub fn update(state: &mut State, message: Message) -> iced::Task<Message> {
    match message {
        Message::TabChanged(message) => {
            state.actual_tab = message;
            Task::none()
        }
        Message::MessageEditor(MessageEditor::Edit(action)) => {
            state.editor_state.text_editor_content.perform(action);
            Task::none()
        }
        Message::MessageHome(message) => {
            handle_message(message).map(Message::MessageHome)
        }
     
    }
}

pub fn view(state: &State) -> Element<Message> {

    let tab_bar = row![
      
        button("Home")
            .on_press(Message::TabChanged(Tab::Home)),

        button("Editor")
            .on_press(Message::TabChanged(Tab::Editor)),
       
        iced::widget::Space::with_width(Fill), 
       
        button("New File")
            .on_press(Message::MessageHome(home::MessageHome::CreateFile))
            
    ]
    .spacing(5)
    .width(Fill);


    let content: Element<Message> = match state.actual_tab {
            Tab::Home => home_screen().map(Message::MessageHome),
            Tab::Editor => editor_screen(&state.editor_state).map(Message::MessageEditor),
        };

    let content_box = container(content)
        .width(Fill)
        .height(Fill)
        .align_x(Alignment::Center)
        .align_y(Alignment::Center);
    
    container(  
        column![
            tab_bar,
            content_box
        ]
        

    )


        
    .padding(10)
    .width(Fill)
    .height(Fill)
    .into()

    

}



