
use iced::widget::{button, column, container, row, text, text_editor, toggler, Button, Container};
use iced::Length::Fill;
use iced::{Element, Padding, Task};

use super::styling::{selected, unselected};

#[derive(Debug, Clone)]
pub enum MessageEditor {
    Edit(text_editor::Action),
}
#[derive(Default)]
pub struct StateEditor {
    pub text_editor_content: text_editor::Content,
}

fn editor_box(state: &StateEditor) -> Element<MessageEditor> {
    container(
        column![
            text_editor(&state.text_editor_content)
                .on_action(MessageEditor::Edit)
                .height(Fill),
        ]
        .padding(18)
    )
    .into()
}

fn file_tab(state: &StateEditor) -> Element<MessageEditor> {
    container(
        column![
            button("C://file.txt").style(unselected),
            button("C://file.txt").style(selected),
           
        ].spacing(10)
        .padding(
            Padding::new(0.0).top(18.5), 
        ),
    )
    .into()
}

fn editor_content(state: &StateEditor) -> Element<MessageEditor> {
    container(row![file_tab(state), editor_box(state)]).into()
}

pub fn editor_screen(state: &StateEditor) -> Element<MessageEditor> {
    container(editor_content(state)).into()
}
