#[derive(Debug, Clone, PartialEq)]
pub struct Colors {
    pub primary: iced::Color,
    pub secondary: iced::Color,
    pub background: iced::Color,
}



impl Colors {
    pub fn default() -> Self {
        Colors {
            // Coral
            primary: iced::Color::from_rgb8(255, 160,122),
            // Blush
            secondary: iced::Color::from_rgb8(254, 205, 178),
            // Ash
            background: iced::Color::from_rgb8(43, 41, 45),
            
        
        }
    }
}


