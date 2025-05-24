import React from 'react';
import {
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { EntitySelectorProps } from './types';

/**
 * Entity selector component with proper accessibility
 */
const EntitySelector: React.FC<EntitySelectorProps> = React.memo(({
  entities,
  selectedEntityName,
  isLoadingConfig,
  serverStatus,
  onEntityChange
}) => (
  <Card 
    sx={{ 
      mb: 4, 
      p: 3,
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      borderRadius: 2,
    }}
    role="region"
    aria-labelledby="entity-selector-title"
  >
    <FormControl 
      fullWidth 
      sx={{ 
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#ffffff',
          borderRadius: 2,
        },
        '& .MuiInputLabel-root': {
          color: '#000000',
          fontWeight: 500,
        },
      }}
    >
      <InputLabel id="entity-select-label">Select Entity</InputLabel>
      <Select
        labelId="entity-select-label"
        id="entity-select"
        value={selectedEntityName}
        label="Select Entity"
        onChange={onEntityChange}
        disabled={isLoadingConfig || serverStatus !== 'running'}
        aria-describedby={serverStatus !== 'running' ? "server-status-message" : undefined}
        sx={{
          color: '#000000',
          '& .MuiSelect-icon': {
            color: '#000000',
          }
        }}
      >
        {entities.map((entity) => (
          <MenuItem 
            key={entity.name} 
            value={entity.name}
            sx={{
              backgroundColor: '#ffffff',
              color: 'rgba(0, 0, 0, 0.87)',
              '&.Mui-selected': {
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
              },
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            {entity.name}
          </MenuItem>
        ))}
      </Select>
      {serverStatus !== 'running' && (
        <Typography 
          variant="caption" 
          color="error" 
          id="server-status-message" 
          sx={{ 
            mt: 1,
            color: 'rgba(244, 67, 54, 0.8)',
            fontWeight: 500,
          }}
          role="alert"
        >
          Server is not running. Please start the server to select an entity.
        </Typography>
      )}
    </FormControl>
  </Card>
));

EntitySelector.displayName = 'EntitySelector';

export default EntitySelector;
