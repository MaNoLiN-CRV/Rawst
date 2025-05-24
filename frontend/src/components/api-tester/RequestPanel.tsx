import React from 'react';
import {
  Card,
  Stack,
  Chip,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { RequestPanelProps } from './types';

/**
 * Request panel component for API testing
 */
const RequestPanel: React.FC<RequestPanelProps> = React.memo(({
  selectedEndpoint,
  currentFullUrl,
  requestBody,
  isSendingRequest,
  serverStatus,
  onRequestBodyChange,
  onSendRequest,
  getMethodColor
}) => {
  const theme = useTheme();
  const needsRequestBody = selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT';

  return (
    <>
      {/* URL Display */}
      <Card 
        sx={{ 
          mb: 4, 
          p: 3,
          backgroundColor: '#f8f9fa',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          borderRadius: 2,
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems={{ sm: "center" }}
          sx={{ mb: 1 }}
        >
          <Chip
            label={selectedEndpoint.method}
            size="medium"
            sx={{
              background: `linear-gradient(135deg, ${getMethodColor(selectedEndpoint.method)}, ${getMethodColor(selectedEndpoint.method)}80)`,
              color: theme.palette.getContrastText(getMethodColor(selectedEndpoint.method)),
              fontWeight: 'bold',
              fontSize: '0.875rem',
              minWidth: 80,
              height: 36,
              mb: { xs: 1, sm: 0 },
            }}
          />
          <Typography 
            variant="body1" 
            component="div" 
            sx={{ 
              fontFamily: 'monospace', 
              fontSize: '1rem',
              fontWeight: 500,
              wordBreak: 'break-all', 
              flexGrow: 1,
              color: '#000000',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '8px 12px',
              borderRadius: 1,
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            {currentFullUrl}
          </Typography>
        </Stack>
      </Card>

      {/* Request Body Section */}
      {needsRequestBody && (
        <Card 
          sx={{ 
            mb: 4, 
            p: 3,
            backgroundColor: '#f8f9fa',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom 
            component="h5"
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
            Request Body (JSON)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            variant="outlined"
            value={requestBody}
            onChange={(e) => onRequestBodyChange(e.target.value)}
            InputProps={{
              sx: { 
                fontFamily: 'monospace', 
                fontSize: '0.9rem',
                backgroundColor: '#ffffff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#6366f1',
                  borderWidth: 2,
                }
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                color: '#000000',
              }
            }}
            placeholder="Enter JSON request body here..."
            aria-label="Request body input"
          />
        </Card>
      )}

      {/* Send Button Section */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          onClick={onSendRequest}
          disabled={isSendingRequest || serverStatus !== 'running'}
          startIcon={isSendingRequest ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            minWidth: 180,
            height: 48,
            fontSize: '1rem',
            fontWeight: 600,
            backgroundColor: getMethodColor(selectedEndpoint.method),
            color: theme.palette.getContrastText(getMethodColor(selectedEndpoint.method)),
            borderRadius: 2,
            '&:hover': {
              backgroundColor: getMethodColor(selectedEndpoint.method),
              opacity: 0.9,
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            }
          }}
          aria-label={`Send ${selectedEndpoint.method} request`}
        >
          {isSendingRequest ? 'Sending...' : 'Send Request'}
        </Button>
      </Box>

      {/* Server Status Warning */}
      {serverStatus !== 'running' && (
        <Alert 
          severity="warning" 
          sx={{ 
            mt: 3,
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderRadius: 2,
            color: '#000000',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            '& .MuiAlert-icon': {
              color: '#f59e0b',
            }
          }}
        >
          The API server is not running. Please start the server to send requests.
        </Alert>
      )}
    </>
  );
});

RequestPanel.displayName = 'RequestPanel';

export default RequestPanel;
