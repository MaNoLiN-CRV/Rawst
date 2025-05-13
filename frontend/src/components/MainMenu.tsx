import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Container, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 85, 85, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 85, 85, 0.8); }
  100% { box-shadow: 0 0 5px rgba(255, 85, 85, 0.5); }
`;

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const GlassBox = styled(Box)(({ theme }) => ({
  background: 'rgba(40, 42, 54, 0.85)',
  backdropFilter: 'blur(15px)',
  borderRadius: '20px',
  border: '1px solid rgba(248, 248, 242, 0.15)',
  padding: theme.spacing(5),
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(4),
  maxWidth: '900px',
  margin: '0 auto',
  marginTop: '8vh',
  animation: `${floatAnimation} 6s ease-in-out infinite`,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.45)',
  },
  '@media (max-width: 768px)': {
    marginTop: '5vh',
    padding: theme.spacing(3),
  },
}));

const TypewriterText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Fira Code, monospace',
  background: 'linear-gradient(45deg, #FF5555, #FF79C6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  textShadow: '0 0 10px rgba(255, 85, 85, 0.5)',
  fontSize: '4rem',
  fontWeight: 'bold',
  marginBottom: theme.spacing(2),
  textAlign: 'center',
  animation: `${glowAnimation} 3s ease-in-out infinite`,
  '@media (max-width: 768px)': {
    fontSize: '2.8rem',
  },
}));

const SloganText = styled(Typography)(({ theme }) => ({
  fontFamily: 'Fira Code, monospace',
  color: '#F8F8F2',
  opacity: 0.95,
  fontSize: '1.6rem',
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  lineHeight: 1.6,
  letterSpacing: '0.5px',
  '@media (max-width: 768px)': {
    fontSize: '1.2rem',
  },
}));

const StartButton = styled(Button)(({ }) => ({
  background: 'linear-gradient(45deg, #FF5555 30%, #FF79C6 90%)',
  border: 0,
  borderRadius: '12px',
  color: '#F8F8F2',
  padding: '14px 42px',
  fontSize: '1.3rem',
  fontFamily: 'Fira Code, monospace',
  textTransform: 'none',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
    transition: '0.5s',
  },
  '&:hover': {
    background: 'linear-gradient(45deg, #FF79C6 30%, #FF5555 90%)',
    transform: 'translateY(-3px)',
    boxShadow: '0 0 25px rgba(255, 85, 85, 0.6)',
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(-1px)',
  },
  '@media (max-width: 768px)': {
    width: '100%',
    padding: '12px 28px',
  },
}));

interface MainMenuProps {
  onStart: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [title, setTitle] = useState<string>('');
  const [slogan, setSlogan] = useState<string>('');
  const [isTitleComplete, setIsTitleComplete] = useState<boolean>(false);
  const [isSloganComplete, setIsSloganComplete] = useState<boolean>(false);

  const fullTitle = 'Rawst';
  const fullSlogan = 'Transform your database into elegant RESTful APIs';

  const typeTitle = useCallback(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullTitle.length) {
        setTitle(prev => prev + fullTitle[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTitleComplete(true);
      }
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const typeSlogan = useCallback(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullSlogan.length) {
        setSlogan(prev => prev + fullSlogan[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsSloganComplete(true);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = typeTitle();
    return cleanup;
  }, [typeTitle]);

  useEffect(() => {
    if (isTitleComplete) {
      const cleanup = typeSlogan();
      return cleanup;
    }
  }, [isTitleComplete, typeSlogan]);

  return (
    <Container maxWidth="lg">
      <GlassBox>
        <TypewriterText>
          {title}
          {!isTitleComplete && <span className="terminal-cursor" />}
        </TypewriterText>
        <SloganText>
          {slogan}
          {!isSloganComplete && <span className="terminal-cursor" />}
        </SloganText>
        <StartButton 
          variant="contained" 
          onClick={onStart}
          disabled={!isSloganComplete}
          sx={{
            opacity: isSloganComplete ? 1 : 0.7,
            transform: isSloganComplete ? 'none' : 'scale(0.95)',
          }}
        >
          Start
        </StartButton>
      </GlassBox>
    </Container>
  );
};

export default MainMenu; 