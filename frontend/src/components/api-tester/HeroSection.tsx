import React from 'react';
import { Card, Typography } from '@mui/material';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
}

/**
 * Hero section component for the API Tester
 */
const HeroSection: React.FC<HeroSectionProps> = ({
  title = "API Tester",
  subtitle = "Test your dynamically generated API endpoints with our modern, intuitive interface. Ensure your backend server is configured and running for optimal performance."
}) => {
  return (
    <Card 
      sx={{ 
        mb: 4, 
        p: 4,
        textAlign: 'center',
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2,
      }}
    >
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 700,
          color: '#000000',
          mb: 2,
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 400,
          color: '#000000',
          opacity: 0.8,
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        {subtitle}
      </Typography>
    </Card>
  );
};

export default React.memo(HeroSection);
