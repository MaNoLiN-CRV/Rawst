use iced::widget::{button, column, container};
use iced::{Alignment, Element};

use crate::gui::home::home_screen;
use crate::gui::home;
use crate::gui::editor::editor_screen;
use crate::gui::editor;


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
    MessageEditor(editor::MessageEditor),
}

pub fn update(state: &mut State, message: Message) -> iced::Task<Message> {

    match message {
        Message::TabChanged(message) => {
            state.actual_tab = message;
        }
    }

    iced::Task::none()
   
}


pub fn view(state: &State) -> Element<Message> {

    let tab_bar = column![
            button("Home")
                .on_press(Message::TabChanged(Tab::Home)),
            button("Editor")
                .on_press(Message::TabChanged(Tab::Editor)),
        ]
        .spacing(10);

        let content: Element<Message> = match state.actual_tab {
            Tab::Home => home_screen().map(Message::MessageHome),
            Tab::Editor => editor_screen().map(Message::MessageEditor),
        };

    container(
        column![
            tab_bar,
            content
        ]
        .spacing(20)
        .align_x(Alignment::Center)
    )
    .padding(20)
    .into()

}



