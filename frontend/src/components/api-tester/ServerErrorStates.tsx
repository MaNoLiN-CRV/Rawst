import React from 'react';
import { Card, Typography, Alert } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { ServerStatus } from './types';

interface ServerErrorStatesProps {
  isLoadingConfig: boolean;
  serverStatus: ServerStatus;
  serverMessage: string | null;
  apiConfigError: string | null;
  onClearError: () => void;
}

/**
 * Server error states component
 */
const ServerErrorStates: React.FC<ServerErrorStatesProps> = ({
  isLoadingConfig,
  serverStatus,
  serverMessage,
  apiConfigError,
  onClearError,
}) => {
  const showServerStopped = !isLoadingConfig && serverStatus === 'stopped';
  const showServerError = !isLoadingConfig && serverStatus === 'error';
  const showConfigError = apiConfigError && !isLoadingConfig;

  return (
    <>
      {/* Server Not Running State */}
      {showServerStopped && (
        <Card 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            my: 6,
            p: 4,
            flexDirection: 'column',
            gap: 3,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
          }}
        >
          <WarningIcon sx={{ fontSize: 48, color: '#f59e0b', opacity: 0.8 }} />
          <Typography 
            variant="h5" 
            sx={{ 
              color: '#000000',
              fontWeight: 600,
            }}
          >
            API Server Not Running
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#000000',
              opacity: 0.8,
              maxWidth: 500,
              lineHeight: 1.6,
            }}
          >
            The API server needs to be running to test endpoints. Please start the server using the controls above.
          </Typography>
        </Card>
      )}

      {/* Server Error State */}
      {showServerError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            borderRadius: 2,
            color: '#000000',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '& .MuiAlert-icon': {
              color: '#ef4444',
            }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#000000' }}>
            Server Error: {serverMessage || 'Failed to start API server'}
          </Typography>
          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8, color: '#000000' }}>
            Please check your database configuration and ensure the database server is running.
          </Typography>
        </Alert>
      )}

      {/* Configuration Error Alert */}
      {showConfigError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4,
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            borderRadius: 2,
            color: '#000000',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            '& .MuiAlert-icon': {
              color: '#ef4444',
            }
          }} 
          onClose={onClearError}
        >
          {apiConfigError}
        </Alert>
      )}
    </>
  );
};

export default React.memo(ServerErrorStates);
