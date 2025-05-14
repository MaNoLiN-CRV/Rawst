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
  Avatar,
  Tooltip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: 'none',
          boxShadow: '0 0 15px rgba(0,0,0,0.05)'
        },
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flexDirection: 'column',
          mt: 2
        }}
      >
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            mb: 1,
            background: 'linear-gradient(45deg, var(--primary-color) 30%, var(--secondary-color) 90%)'
          }}
        >
          R
        </Avatar>
        <Typography variant="h6" fontWeight="bold">
          RusterAPI
        </Typography>
        <Typography variant="caption" color="text.secondary">
          API Builder
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ overflow: 'auto', p: 1, height: '100%' }}>
        <List>
          {allNavigationItems.map((item, index) => (
            <Tooltip title={item.tooltip || item.text} placement="right" key={index}>
              <ListItemButton
                selected={
                  isMainMenu 
                    ? item.path === '/main-menu' 
                    : isHomePage 
                      ? step === item.step 
                      : location.pathname === item.path
                }
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
                  borderRadius: '8px',
                  mb: 1,
                  p: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(63, 81, 181, 0.12)',
                    '&:hover': {
                      backgroundColor: 'rgba(63, 81, 181, 0.18)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'all 0.2s'
                }}
              >
                <ListItemIcon>
                  {item.disabled ? (
                    <Box sx={{ color: 'text.disabled' }}>{item.icon}</Box>
                  ) : (
                    <Badge 
                      color="success" 
                      variant="dot" 
                      invisible={
                        isMainMenu 
                          ? item.path !== '/main-menu' 
                          : isHomePage 
                            ? step < (item.step || 0) 
                            : location.pathname !== item.path
                      }
                    >
                      {item.icon}
                    </Badge>
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontSize: '0.9rem',
                    fontWeight: (
                      isMainMenu 
                        ? item.path === '/main-menu' 
                        : isHomePage 
                          ? step === item.step 
                          : location.pathname === item.path
                    ) ? 600 : 400
                  }} 
                />
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ p: 2 }}>
          <ListItemButton
            sx={{
              borderRadius: '8px',
              p: 1.5,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            onClick={() => window.open('https://github.com/yourusername/RusterAPI', '_blank')}
          >
            <ListItemIcon>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Documentation" 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
              }} 
            />
          </ListItemButton>
        </Box>
        
        <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2, boxSizing: 'border-box' }}>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            RusterAPI v1.0
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NavigationDrawer; 