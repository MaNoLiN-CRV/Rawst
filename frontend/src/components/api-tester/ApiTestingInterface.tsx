import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import { EndpointConfig, ApiEntity, ServerStatus } from './types';

import EndpointSelector from './EndpointSelector';
import RequestPanel from './RequestPanel';
import TabPanel from '../common/TabPanel';

interface ApiTestingInterfaceProps {
  selectedEntityName: string;
  endpoints: EndpointConfig[];
  selectedEndpoint: EndpointConfig | null;
  entities: ApiEntity[];
  tabValue: number;
  requestBody: string;
  response: string;
  isSendingRequest: boolean;
  currentFullUrl: string;
  serverStatus: ServerStatus;
  getMethodColor: (method: string) => string;
  onEndpointSelect: (endpoint: EndpointConfig) => void;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onRequestBodyChange: (value: string) => void;
  onSendRequest: () => Promise<void>;
}

/**
 * API Testing Interface component
 */
const ApiTestingInterface: React.FC<ApiTestingInterfaceProps> = ({
  selectedEntityName,
  endpoints,
  selectedEndpoint,
  tabValue,
  requestBody,
  response,
  isSendingRequest,
  currentFullUrl,
  serverStatus,
  getMethodColor,
  onEndpointSelect,
  onTabChange,
  onRequestBodyChange,
  onSendRequest,
}) => {
  if (!selectedEntityName || endpoints.length === 0) {
    return null;
  }

  return (
    <>
      {/* Endpoints Section */}
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
          variant="h5" 
          gutterBottom 
          component="h3"
          sx={{ 
            fontWeight: 600,
            color: '#000000',
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box 
            sx={{ 
              width: 4, 
              height: 24, 
              backgroundColor: '#6366f1',
              borderRadius: 2,
            }} 
          />
          Available Endpoints for "{selectedEntityName}"
        </Typography>
        <EndpointSelector
          endpoints={endpoints}
          selectedEndpoint={selectedEndpoint}
          onEndpointSelect={onEndpointSelect}
          getMethodColor={getMethodColor}
        />
      </Card>

      {/* API Testing Interface */}
      {selectedEndpoint && (
        <Card 
          variant="outlined" 
          sx={{ 
            mb: 4,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography 
              variant="h6" 
              component="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: '#000000',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%',
                  backgroundColor: getMethodColor(selectedEndpoint.method),
                }} 
              />
              Testing: {selectedEndpoint.description}
            </Typography>
            
            {/* Tabs Section */}
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(0, 0, 0, 0.1)', mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={onTabChange}
                aria-label="Request and Response Tabs"
                indicatorColor="primary"
                textColor="primary"
                sx={{
                  '& .MuiTab-root': {
                    color: '#000000',
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    borderRadius: 2,
                    mx: 1,
                    minHeight: 48,
                    '&.Mui-selected': {
                      color: '#6366f1',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: '#6366f1',
                    height: 3,
                    borderRadius: 1.5,
                  }
                }}
              >
                <Tab 
                  label="Request" 
                  id="api-tab-0" 
                  aria-controls="api-tabpanel-0" 
                />
                <Tab 
                  label="Response" 
                  id="api-tab-1" 
                  aria-controls="api-tabpanel-1" 
                  disabled={!response && !isSendingRequest} 
                />
              </Tabs>
            </Box>

            {/* Request Tab */}
            <TabPanel value={tabValue} index={0}>
              <RequestPanel
                selectedEndpoint={selectedEndpoint}
                currentFullUrl={currentFullUrl}
                requestBody={requestBody}
                isSendingRequest={isSendingRequest}
                serverStatus={serverStatus}
                onRequestBodyChange={onRequestBodyChange}
                onSendRequest={onSendRequest}
                getMethodColor={getMethodColor}
              />
            </TabPanel>

            {/* Response Tab */}
            <TabPanel value={tabValue} index={1}>
              <ResponseDisplay
                response={response}
                isSendingRequest={isSendingRequest}
              />
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </>
  );
};

/**
 * Response display component
 */
const ResponseDisplay: React.FC<{ response: string; isSendingRequest: boolean }> = ({
  response,
  isSendingRequest,
}) => {
  return (
    <Card 
      sx={{ 
        p: 3,
        backgroundColor: '#f8f9fa',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        borderRadius: 2,
        minHeight: 200,
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        component="h5"
        sx={{ 
          fontWeight: 600,
          color: '#000000',
          mb: 3,
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
        Response
      </Typography>
      
      {/* Loading Response State */}
      {isSendingRequest && !response && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            py: 6,
          }}
        >
          <CircularProgress 
            size={32} 
            sx={{ 
              color: '#6366f1',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              }
            }}
          />
          <Typography 
            sx={{ 
              color: '#000000',
              fontWeight: 500,
            }}
          >
            Waiting for response...
          </Typography>
        </Box>
      )}
      
      {/* No Response State */}
      {!isSendingRequest && !response && (
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 6,
            textAlign: 'center',
          }}
        >
          <Typography 
            sx={{ 
              fontStyle: 'italic',
              color: '#000000',
              opacity: 0.6,
              fontSize: '1.1rem',
            }}
          >
            No response yet. Send a request to see the results.
          </Typography>
        </Box>
      )}
      
      {/* Response Display */}
      {response && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: 3,
            maxHeight: '600px',
            overflow: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            color: '#000000',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
          }}
          aria-live="polite"
          role="log"
        >
          {response}
        </Paper>
      )}
    </Card>
  );
};

export default React.memo(ApiTestingInterface);
