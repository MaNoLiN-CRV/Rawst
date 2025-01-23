use iced::Element;
use iced::widget::{ column, text,};

#[derive(Debug, Clone)]
pub enum MessageEditor {
    
}



pub fn editor_screen() -> Element<'static, MessageEditor> {
    column![
        text("Editor"),
    ].into()
}
