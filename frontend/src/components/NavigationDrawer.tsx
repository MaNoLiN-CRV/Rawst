import { 
  Box, 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  Badge,
  useTheme,
  useMediaQuery,
  Tooltip,
  Chip,
  LinearProgress,
  Collapse,
  IconButton,
  Paper,
  alpha
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GitHubIcon from '@mui/icons-material/GitHub';
import BookIcon from '@mui/icons-material/Book';
import { useState } from 'react';

// Function to open external URLs using Tauri's shell API
const openExternalUrl = async (url: string) => {
  //TODO : Implement Tauri's shell API to open external URLs
  // For now, we can use window.open as a placeholder
  window.open(url, '_blank', 'noopener,noreferrer');
};

interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  step?: number;
  path: string;
  disabled?: boolean;
  tooltip?: string;
}

interface NavigationDrawerProps {
  drawerWidth: number;
  drawerOpen: boolean;
  toggleDrawer: () => void;
  navigationItems: NavigationItem[];
  step: number;
  setStep: (step: number) => void;
}

const NavigationDrawer = ({
  drawerWidth,
  drawerOpen,
  toggleDrawer,
  navigationItems,
  step,
  setStep
}: NavigationDrawerProps) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isHomePage = location.pathname === '/';
  const isMainMenu = location.pathname === '/main-menu';
  
  const [progressExpanded, setProgressExpanded] = useState(true);
  const [helpExpanded, setHelpExpanded] = useState(false);

  // Calculate progress
  const completedSteps = navigationItems.filter((item) => 
    item.step !== undefined && step > item.step!
  ).length;
  const totalSteps = navigationItems.filter(item => item.step !== undefined).length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Prepend the home icon to the navigation items if it doesn't exist
  const homeItem: NavigationItem = { 
    text: 'Home', 
    icon: <HomeIcon />, 
    path: '/main-menu',
    tooltip: 'Return to main menu'
  };
  
  const allNavigationItems: NavigationItem[] = [
    homeItem,
    ...navigationItems
  ];

  const getStepIcon = (item: NavigationItem) => {
    if (item.step === undefined) return item.icon;
    
    if (step > item.step!) {
      return <CheckCircleIcon sx={{ color: 'success.main' }} />;
    } else if (step === item.step!) {
      return <Box sx={{ 
        width: 24, 
        height: 24, 
        borderRadius: '50%', 
        border: '2px solid',
        borderColor: 'primary.main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main'
      }}>
        <Box sx={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%', 
          backgroundColor: 'white' 
        }} />
      </Box>;
    } else {
      return <RadioButtonUncheckedIcon sx={{ color: 'action.disabled' }} />;
    }
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? drawerOpen : true}
      onClose={toggleDrawer}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.background.paper, 0.95)} 0%, 
            ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: 'none',
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, 
              var(--primary-color, ${theme.palette.primary.main}) 0%, 
              var(--secondary-color, ${theme.palette.secondary.main}) 100%)`
          }
        },
      }}
    >

      
      {/* Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column',
          mt: 2,
          mx: 2,
          borderRadius: 2,
          background: `linear-gradient(135deg, 
            var(--primary-color, ${theme.palette.primary.main}) 0%, 
            var(--secondary-color, ${theme.palette.secondary.main}) 100%)`,
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="36" cy="24" r="5"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }
        }}
      >
        {/* Progress chip */}
        {!isMainMenu && isHomePage && (
          <Chip
            label={`${completedSteps}/${totalSteps} Complete`}
            size="small"
            sx={{ 
              mt: 1, 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              zIndex: 1
            }}
          />
        )}
      </Paper>

      {/* Progress Section */}
      {!isMainMenu && isHomePage && (
        <Box sx={{ mx: 2, mt: 2 }}>
          <ListItemButton
            onClick={() => setProgressExpanded(!progressExpanded)}
            sx={{
              borderRadius: 1,
              py: 1,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            <ListItemText 
              primary="Progress Overview"
              primaryTypographyProps={{ 
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'text.primary'
              }}
            />
            <IconButton size="small">
              {progressExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemButton>
          
          <Collapse in={progressExpanded}>
            <Box sx={{ px: 2, pb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    background: `linear-gradient(90deg, 
                      var(--primary-color, ${theme.palette.primary.main}) 0%, 
                      var(--secondary-color, ${theme.palette.secondary.main}) 100%)`,
                    borderRadius: 3
                  }
                }}
              />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ mt: 1, display: 'block' }}
              >
                {Math.round(progressPercentage)}% Complete
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}

      <Divider sx={{ my: 2, mx: 2 }} />

      {/* Navigation Items */}
      <Box sx={{ overflow: 'auto', p: 1, height: '100%' }}>
        <List sx={{ px: 1 }}>
          {allNavigationItems.map((item, index) => {
            const isSelected = isMainMenu 
              ? item.path === '/main-menu' 
              : isHomePage 
                ? step === item.step 
                : location.pathname === item.path;
                
            const isCompleted = item.step !== undefined && step > item.step!;
            
            return (
              <Tooltip title={item.tooltip || item.text} placement="right" key={index}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    if (item.path === '/main-menu') {
                      navigate('/main-menu');
                    } else if (item.path === '/') {
                      if (step !== item.step && !item.disabled) {
                        setStep(item.step!);
                      }
                    } else {
                      navigate(item.path);
                    }
                    if (isMobile) {
                      toggleDrawer();
                    }
                  }}
                  disabled={item.disabled}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1.5,
                    px: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: '4px',
                        background: `linear-gradient(180deg, 
                          var(--primary-color, ${theme.palette.primary.main}) 0%, 
                          var(--secondary-color, ${theme.palette.secondary.main}) 100%)`
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.18),
                      }
                    },
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateX(4px)',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.disabled ? (
                      <Box sx={{ color: 'text.disabled' }}>{item.icon}</Box>
                    ) : (
                      <Badge 
                        color="success" 
                        variant="dot" 
                        invisible={!isSelected && !isCompleted}
                        sx={{
                          '& .MuiBadge-badge': {
                            animation: isSelected ? 'pulse 2s infinite' : 'none',
                            '@keyframes pulse': {
                              '0%': {
                                transform: 'scale(1)',
                                opacity: 1,
                              },
                              '50%': {
                                transform: 'scale(1.2)',
                                opacity: 0.7,
                              },
                              '100%': {
                                transform: 'scale(1)',
                                opacity: 1,
                              },
                            }
                          }
                        }}
                      >
                        {item.step !== undefined ? getStepIcon(item) : item.icon}
                      </Badge>
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? 'primary.main' : 'text.primary'
                    }} 
                  />
                  {isCompleted && (
                    <CheckCircleIcon 
                      sx={{ 
                        color: 'success.main', 
                        fontSize: 16,
                        opacity: 0.7
                      }} 
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Help Section */}
        <Box sx={{ px: 1 }}>
          <ListItemButton
            onClick={() => setHelpExpanded(!helpExpanded)}
            sx={{
              borderRadius: 2,
              py: 1,
              '&:hover': {
                backgroundColor: alpha(theme.palette.action.hover, 0.8),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Help & Resources"
              primaryTypographyProps={{ 
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            />
            <IconButton size="small">
              {helpExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemButton>
          
          <Collapse in={helpExpanded}>
            <List sx={{ pl: 2 }}>
              <ListItemButton
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.8),
                  },
                }}
                onClick={() => openExternalUrl('https://github.com/MaNoLiN-CRV/Rawst/blob/master/Manual_Usuario_RusterAPI.md')}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <BookIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Documentation" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                  }} 
                />
              </ListItemButton>
              
              <ListItemButton
                sx={{
                  borderRadius: 2,
                  py: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.action.hover, 0.8),
                  },
                }}
                onClick={() => openExternalUrl('https://github.com/MaNoLiN-CRV/Rawst')}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <GitHubIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="GitHub" 
                  primaryTypographyProps={{ 
                    fontSize: '0.8rem',
                  }} 
                />
              </ListItemButton>
            </List>
          </Collapse>
        </Box>
        
        {/* Footer */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0,
          right: 0,
          p: 2,
          background: `linear-gradient(180deg, 
            transparent 0%, 
            ${alpha(theme.palette.background.paper, 0.8)} 50%,
            ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)'
        }}>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            align="center" 
            display="block"
            sx={{ fontWeight: 500 }}
          >
            RusterAPI v1.0
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary" 
            align="center" 
            display="block"
            sx={{ fontSize: '0.7rem', opacity: 0.7 }}
          >
            Built with ❤️ in Rust
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer;