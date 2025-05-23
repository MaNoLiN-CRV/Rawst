import { memo } from 'react';
import {
  Box,
  Chip,
  useTheme,
} from '@mui/material';
import { EndpointConfig } from './types'; 

interface EndpointSelectorProps {
  endpoints: EndpointConfig[];
  selectedEndpoint: EndpointConfig | null;
  onEndpointSelect: (endpoint: EndpointConfig) => void;
  getMethodColor: (method: string) => string;
}

const EndpointSelector = memo(({ 
  endpoints,
  selectedEndpoint,
  onEndpointSelect,
  getMethodColor
}: EndpointSelectorProps) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
      {endpoints.map((endpoint, index) => (
        <Chip
          key={`${endpoint.method}-${endpoint.path}-${index}`}
          label={`${endpoint.method} ${endpoint.path}`}
          onClick={() => onEndpointSelect(endpoint)}
          variant={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? "filled" : "outlined"}
          clickable
          sx={{
            fontWeight: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? 'bold' : 'normal',
            fontSize: '0.875rem',
            height: 40,
            borderRadius: 3,
            px: 2,
            background: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method 
              ? `linear-gradient(135deg, ${getMethodColor(endpoint.method)}, ${getMethodColor(endpoint.method)}80)`
              : 'rgba(255, 255, 255, 0.08)',
            color: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method 
              ? theme.palette.getContrastText(getMethodColor(endpoint.method)) 
              : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
              ? `1px solid ${getMethodColor(endpoint.method)}60`
              : `1px solid ${getMethodColor(endpoint.method)}40`,
            boxShadow: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
              ? `0 4px 15px ${getMethodColor(endpoint.method)}30`
              : `0 2px 8px ${getMethodColor(endpoint.method)}20`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${getMethodColor(endpoint.method)}, transparent)`,
              opacity: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? 1 : 0,
              transition: 'opacity 0.3s ease',
            },
            '&:hover': {
              background: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                ? `linear-gradient(135deg, ${getMethodColor(endpoint.method)}, ${getMethodColor(endpoint.method)}99)`
                : `rgba(255, 255, 255, 0.15)`,
              transform: 'translateY(-2px) scale(1.02)',
              boxShadow: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method
                ? `0 8px 25px ${getMethodColor(endpoint.method)}40`
                : `0 6px 20px ${getMethodColor(endpoint.method)}30`,
              borderColor: `${getMethodColor(endpoint.method)}60`,
              '&::before': {
                opacity: 1,
              }
            },
            '&:active': {
              transform: 'translateY(-1px) scale(1.01)',
            }
          }}
          aria-pressed={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method}
          aria-label={`Select ${endpoint.method} ${endpoint.path} endpoint`}
        />
      ))}
    </Box>
  );
});

EndpointSelector.displayName = 'EndpointSelector';
export default EndpointSelector;
