import { 
  Box, 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationItem {
  text: string;
  icon: React.ReactNode;
  step?: number;
  path: string;
  disabled?: boolean;
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
          border: 'none'
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', p: 1, height: '100%' }}>
        <List>
          {navigationItems.map((item, index) => (
            <ListItemButton
              key={index}
              selected={isHomePage ? step === item.step : location.pathname === item.path}
              onClick={() => {
                if (item.path === '/') {
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
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(63, 81, 181, 0.12)',
                  '&:hover': {
                    backgroundColor: 'rgba(63, 81, 181, 0.18)',
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.disabled ? (
                  <Box sx={{ color: 'text.disabled' }}>{item.icon}</Box>
                ) : (
                  <Badge 
                    color="success" 
                    variant="dot" 
                    invisible={isHomePage ? step < (item.step || 0) : location.pathname !== item.path}
                  >
                    {item.icon}
                  </Badge>
                )}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontSize: '0.9rem',
                  fontWeight: (isHomePage ? step === item.step : location.pathname === item.path) ? 600 : 400
                }} 
              />
            </ListItemButton>
          ))}
        </List>
        
        <Divider sx={{ my: 2 }} />
        
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