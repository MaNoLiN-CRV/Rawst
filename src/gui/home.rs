use iced::Element;
use iced::widget::{ column, text};


#[derive(Debug, Clone)]
pub enum MessageHome{
    
}


pub fn home_screen() -> Element<'static, MessageHome> {
    column![
        text("Home"),
    ].into()
}
