import React from 'react';
import { Box, Typography, Card, Button } from '@mui/material';
import { ServerStatus } from './types';


interface DatabaseTestSectionProps {
  serverStatus: ServerStatus;
  onTestConnection: () => Promise<void>;
}

/**
 * Database connection test section component
 */
const DatabaseTestSection: React.FC<DatabaseTestSectionProps> = ({
  serverStatus,
  onTestConnection,
}) => {
  if (serverStatus !== 'error') {
    return null;
  }

  return (
    <Card 
      sx={{ 
        mb: 4, 
        p: 3,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2,
      }}
    >
      <Typography 
        variant="h6" 
        component="h2"
        sx={{ 
          fontWeight: 600,
          color: '#000000',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box 
          sx={{ 
            width: 3, 
            height: 20, 
            backgroundColor: '#6366f1',
            borderRadius: 1.5,
          }} 
        />
        Database Connection Test
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, color: '#000000' }}>
        Test the database connection to troubleshoot server startup issues.
      </Typography>
      <Button
        variant="outlined"
        onClick={onTestConnection}
        sx={{
          borderColor: 'rgba(99, 102, 241, 0.6)',
          color: 'rgba(99, 102, 241, 0.9)',
        }}
      >
        Test Database Connection
      </Button>
    </Card>
  );
};

export default React.memo(DatabaseTestSection);
