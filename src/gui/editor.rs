use iced::Element;
use iced::widget::{ column, container, text, text_editor};

use super::gui::State;

#[derive(Debug, Clone)]
pub enum MessageEditor {
    Edit(text_editor::Action)
}



pub fn editor_screen(state: &State) -> Element<MessageEditor> {
    container(
        text_editor(&state.text_editor_content)
             .on_action(MessageEditor::Edit),   
    ).into()
}
