import React from 'react';
import { Card, CircularProgress, Typography, Button } from '@mui/material';
import { ServerStatus } from './types';

interface LoadingStatesProps {
  isLoadingConfig: boolean;
  serverStatus: ServerStatus;
  onForceRefresh: () => void;
}

/**
 * Loading states component for API Tester
 */
const LoadingStates: React.FC<LoadingStatesProps> = ({
  isLoadingConfig,
  serverStatus,
  onForceRefresh,
}) => {
  const shouldShowLoading = isLoadingConfig || serverStatus === 'starting' || serverStatus === 'restarting';

  if (!shouldShowLoading) {
    return null;
  }

  const getLoadingText = (): string => {
    if (isLoadingConfig) return 'Loading API configuration...';
    if (serverStatus === 'starting') return 'Starting API server...';
    if (serverStatus === 'restarting') return 'Restarting API server...';
    return 'Loading...';
  };

  return (
    <Card 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        my: 6,
        p: 4,
        flexDirection: 'column',
        gap: 2,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2,
      }}
    >
      <CircularProgress 
        aria-label={getLoadingText()}
        sx={{ 
          color: 'rgba(99, 102, 241, 0.8)',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          }
        }}
      />
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#000000',
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {getLoadingText()}
      </Typography>
      {isLoadingConfig && (
        <Button 
          variant="outlined" 
          onClick={onForceRefresh}
          size="small"
          sx={{ 
            mt: 2,
            borderColor: 'rgba(99, 102, 241, 0.6)',
            color: 'rgba(99, 102, 241, 0.9)',
          }}
        >
          Force Refresh Configuration
        </Button>
      )}
    </Card>
  );
};

export default React.memo(LoadingStates);
