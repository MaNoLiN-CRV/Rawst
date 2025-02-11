use iced::advanced::layout::{self, Layout};
use iced::advanced::{renderer};
use iced::advanced::widget::{self, Widget};
use iced::border;
use iced::mouse;
use iced::widget::{button, Button, Text};
use iced::{Color, Element, Length, Rectangle, Size};

pub struct ToggleButton {
    pub name: String,
    pub url: String,
    pub method: String,
}

#[derive(Default)]
pub struct ToggleButtonState {
    pub is_on: bool,
}

#[derive(Debug, Clone)]
pub enum ToggleMessage {
    Toggled,
}

impl ToggleButton {
    pub fn new(name: &str, url: &str, method: &str) -> Self {
        Self {
            name: name.to_string(),
            url: url.to_string(),
            method: method.to_string(),
        }
    }
}

impl<Message, Theme, Renderer> Widget<Message, Theme, Renderer> for ToggleButton 
where
    Renderer: renderer::Renderer,
    Theme: button::Catalog,
{
    fn size(&self) -> Size<Length> {
        Size {
            width: Length::Shrink,
            height: Length::Shrink,
        }
    }


    fn layout(
        &self,
        _tree: &mut widget::Tree,
        _renderer: &Renderer,
        _limits: &layout::Limits,
    ) -> layout::Node {
        layout::Node::new(Size::new(100.0, 40.0))
    }

    fn draw(
        &self,
        _state: &widget::Tree,
        renderer: &mut Renderer,
        _theme: &Theme,
        _style: &renderer::Style,
        layout: Layout<'_>,
        _cursor: mouse::Cursor,
        _viewport: &Rectangle,
    ) {

        let label = Text::new(format!("{} [{}]", self.name, "OFF"));
        
    }

  
      
    }

