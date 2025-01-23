use iced::widget::{button, column, container, row, text_editor, Container};
use iced::Length::Fill;
use iced::{Alignment, Element};

use crate::gui::home::home_screen;
use crate::gui::home;
use crate::gui::editor::editor_screen;
use crate::gui::editor;

use crate::gui::editor::MessageEditor;

#[derive(Default)]
pub struct State {
    actual_tab: Tab,
    pub text_editor_content: text_editor::Content,
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
        }
        Message::MessageEditor(MessageEditor::Edit(action)) => {
            state.text_editor_content.perform(action);
        }
    }
    iced::Task::none()
}

pub fn view(state: &State) -> Element<Message> {

    let tab_bar = row![
            button("Home")
                .on_press(Message::TabChanged(Tab::Home)),
            button("Editor")
                .on_press(Message::TabChanged(Tab::Editor)),
        ]
        .spacing(5);

    let content: Element<Message> = match state.actual_tab {
            Tab::Home => home_screen().map(Message::MessageHome),
            Tab::Editor => editor_screen(state).map(Message::MessageEditor),
        };

    let contentBox = container(content)
        .width(Fill)
        .height(Fill)
        .align_x(Alignment::Center)
        .align_y(Alignment::Center);

    container(  
        column![
            tab_bar,
            contentBox
        ]

        
        

    )


        
    .padding(10)
    .width(Fill)
    .height(Fill)
    .into()

    

}



