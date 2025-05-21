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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
      {endpoints.map((endpoint, index) => (
        <Chip
          key={`${endpoint.method}-${endpoint.path}-${index}`}
          label={`${endpoint.method} ${endpoint.path}`}
          onClick={() => onEndpointSelect(endpoint)}
          variant={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? "filled" : "outlined"}
          clickable
          sx={{
            fontWeight: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? 'bold' : 'normal',
            color: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method 
              ? theme.palette.getContrastText(getMethodColor(endpoint.method)) 
              : getMethodColor(endpoint.method),
            backgroundColor: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method 
              ? getMethodColor(endpoint.method) 
              : 'transparent',
            borderColor: getMethodColor(endpoint.method),
            '&:hover': {
              backgroundColor: getMethodColor(endpoint.method) + (
                selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? '' : '2A'
              ),
              boxShadow: selectedEndpoint?.path !== endpoint.path || selectedEndpoint?.method !== endpoint.method 
                ? `0 0 5px ${getMethodColor(endpoint.method)}40` 
                : 'none',
            },
          }}
          aria-pressed={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method}
        />
      ))}
    </Box>
  );
});

EndpointSelector.displayName = 'EndpointSelector';
export default EndpointSelector;
