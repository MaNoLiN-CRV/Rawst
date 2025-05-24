import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tabs,
  Tab,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
} from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WarningIcon from '@mui/icons-material/Warning';
import { useApiConfiguration } from '../hooks/useApiConfiguration';
import { useServerStatus } from '../hooks/useServerStatus';
import EndpointSelector from './api-tester/EndpointSelector';
import ServerControls from './api-tester/ServerControls';
import ServerLogsPanel from './api-tester/ServerLogsPanel';
import ServerMetricsPanel from './api-tester/ServerMetricsPanel';
import TabPanel from './common/TabPanel';
import { EndpointConfig } from './api-tester/types';

/**
 * Interface for API request parameters
 */
interface ApiRequestParams {
  url: string;
  method: string;
  body: string | null;
  [key: string]: string | null | unknown; 
}

/**
 * Type for HTTP methods that require a request body
 */
type HttpMethodWithBody = 'POST' | 'PUT';

/**
 * Props for the EntitySelector component
 */
interface EntitySelectorProps {
  entities: Array<{ name: string }>;
  selectedEntityName: string;
  isLoadingConfig: boolean;
  serverStatus: string;
  onEntityChange: (event: SelectChangeEvent<string>) => void;
}

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

/**
 * Props for the RequestPanel component
 */
interface RequestPanelProps {
  selectedEndpoint: EndpointConfig;
  currentFullUrl: string;
  requestBody: string;
  isSendingRequest: boolean;
  serverStatus: string;
  onRequestBodyChange: (value: string) => void;
  onSendRequest: () => void;
  getMethodColor: (method: string) => string;
}

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

/**
 * Main ApiTester component
 */
const ApiTester: React.FC = () => {
  const theme = useTheme();
  
  // Local state
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [monitoringTabValue, setMonitoringTabValue] = useState<number>(0);
  
  // Custom hooks
  const {
    serverStatus,
    serverMessage,
    serverMetrics,
    serverLogs,
    isLoadingMetrics,
    isLoadingLogs,
    errorCount,
    checkServerStatus,
    fetchServerMetrics,
    fetchServerLogs,
    startApiServer,
    stopApiServer,
    restartApiServer
  } = useServerStatus();
  
  const {
    entities,
    selectedEntityName,
    selectedEndpoint,
    endpoints,
    isLoadingConfig,
    error: apiConfigError,
    apiUrl,
    createEndpointsForEntity,
    generateSampleBody,
    manualRefreshConfig,
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError: setApiConfigError
  } = useApiConfiguration(serverStatus);

  // Effects
  useEffect(() => {
    if (selectedEndpoint) {
      const methodsWithBody: HttpMethodWithBody[] = ['POST', 'PUT'];
      if (methodsWithBody.includes(selectedEndpoint.method as HttpMethodWithBody)) {
        const currentEntity = entities.find(e => e.name === selectedEntityName);
        setRequestBody(generateSampleBody(currentEntity));
      } else {
        setRequestBody('');
      }
    } else {
      setRequestBody('');
    }
  }, [selectedEndpoint, selectedEntityName, entities, generateSampleBody]);

  // Memoized values
  const getMethodColor = useCallback((method: string): string => {
    const colorMap: Record<string, string> = {
      'GET': theme.palette.info.main,
      'POST': theme.palette.success.main,
      'PUT': theme.palette.warning.main,
      'DELETE': theme.palette.error.main,
      'PATCH': theme.palette.secondary.main,
    };
    return colorMap[method.toUpperCase()] || theme.palette.grey[700];
  }, [theme]);

  const currentFullUrl = useMemo(() => {
    if (!selectedEndpoint) return apiUrl;
    return `${apiUrl}${selectedEndpoint.path}`;
  }, [apiUrl, selectedEndpoint]);

  // Event handlers
  const handleEntityChange = useCallback((event: SelectChangeEvent<string>): void => {
    const entityName = event.target.value;
    setSelectedEntityName(entityName);
    setResponse(''); 

    const entity = entities.find(e => e.name === entityName);
    if (entity) {
      const newEndpoints = createEndpointsForEntity(entity);
      setEndpoints(newEndpoints);
      if (newEndpoints.length > 0) {
        setSelectedEndpoint(newEndpoints[0]);
      } else {
        setSelectedEndpoint(null); 
      }
    } else {
      setEndpoints([]); 
      setSelectedEndpoint(null);
    }
  }, [entities, createEndpointsForEntity, setSelectedEntityName, setEndpoints, setSelectedEndpoint]);

  const handleEndpointChange = useCallback((endpoint: EndpointConfig): void => {
    setSelectedEndpoint(endpoint);
    setResponse(''); 
    setTabValue(0); 
  }, [setSelectedEndpoint]);
  
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  }, []);
  
  const handleMonitoringTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
    setMonitoringTabValue(newValue);
    if (newValue === 0) fetchServerMetrics();
    else if (newValue === 1) fetchServerLogs();
  }, [fetchServerMetrics, fetchServerLogs]);

  /**
   * Makes an API request with proper error handling
   */
  const makeApiRequest = useCallback(async (): Promise<void> => {
    if (!selectedEndpoint) {
      setApiConfigError("No endpoint selected.");
      return;
    }
    
    setIsSendingRequest(true);
    setApiConfigError(null);
    setResponse('');

    try {
      let urlPath = selectedEndpoint.path;
      
      // Handle path parameters
      if (urlPath.includes('{id}')) {
        const idValue = prompt('Enter ID value for path parameter {id}:', '1');
        if (idValue !== null && idValue.trim() !== '') {
          urlPath = urlPath.replace('{id}', encodeURIComponent(idValue));
        } else {
          setApiConfigError('ID value is required for this endpoint and was not provided.');
          return;
        }
      }

      const fullUrl = `${apiUrl}${urlPath}`;
      const requestParams: ApiRequestParams = {
        url: fullUrl,
        method: selectedEndpoint.method,
        body: (['POST', 'PUT'].includes(selectedEndpoint.method)) ? requestBody : null
      };

      const result = await invoke<string>('test_api_endpoint', requestParams);
      
      try {
        const parsedResult = JSON.parse(result);
        setResponse(JSON.stringify(parsedResult, null, 2));
      } catch (parseError) {
        setResponse(result);
      }
      
      setTabValue(1); 
      
      // Refresh metrics if monitoring tab is active
      if (monitoringTabValue === 0) {
        fetchServerMetrics();
      }
    } catch (err: unknown) {
      console.error('Error making API request:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResponse(JSON.stringify({ error: 'API Request Failed', details: errorMessage }, null, 2));
      setApiConfigError(`API Request Failed: ${errorMessage}`);
      setTabValue(1);
    } finally {
      setIsSendingRequest(false);
    }
  }, [selectedEndpoint, apiUrl, requestBody, fetchServerMetrics, setApiConfigError, monitoringTabValue]);

  /**
   * Tests database connection with error handling
   */
  const testDatabaseConnection = useCallback(async (): Promise<void> => {
    try {
      setApiConfigError(null);
      const result = await invoke<string>('test_database_connection');
      setApiConfigError(`Database Test Success: ${result}`);
    } catch (err: unknown) {
      console.error('Error testing database connection:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setApiConfigError(`Database Test Failed: ${errorMessage}`);
    }
  }, [setApiConfigError]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <Box sx={{ 
        py: { xs: 2, sm: 4 }, 
        px: { xs: 1, sm: 3 },
      }}>
        {/* Hero Section */}
        <Card 
          sx={{ 
            mb: 4, 
            p: 4,
            textAlign: 'center',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              color: '#000000',
              mb: 2,
            }}
          >
            API Tester
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 400,
              color: '#000000',
              opacity: 0.8,
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            Test your dynamically generated API endpoints with our modern, intuitive interface. 
            Ensure your backend server is configured and running for optimal performance.
          </Typography>
        </Card>

        <Divider sx={{ mb: 4 }} />

        {/* Server Controls */}
        <Card 
          sx={{ 
            mb: 4, 
            p: 3,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
          }}
        >
          <ServerControls
            status={serverStatus}
            metrics={serverMetrics}
            onStart={startApiServer}
            onStop={stopApiServer}
            onRestart={restartApiServer}
            onRefresh={checkServerStatus}
            message={serverMessage}
          />
        </Card>

        {/* Database Test Section */}
        {serverStatus === 'error' && (
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
              onClick={testDatabaseConnection}
              sx={{
                borderColor: 'rgba(99, 102, 241, 0.6)',
                color: 'rgba(99, 102, 241, 0.9)',
              }}
            >
              Test Database Connection
            </Button>
          </Card>
        )}

        {/* Server Monitoring Accordion */}
        <Accordion 
          defaultExpanded={false} 
          sx={{ 
            mb: 4,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(0, 0, 0, 0.7)' }} />}
            aria-controls="server-monitoring-content"
            id="server-monitoring-header"
            sx={{ 
              backgroundColor: '#f9f9f9',
              borderRadius: 2,
              minHeight: 64,
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: '#000000',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <BarChartIcon sx={{ color: 'rgba(99, 102, 241, 0.8)' }} />
                Server Monitoring
              </Typography>
              {errorCount > 0 && (
                <Badge 
                  badgeContent={errorCount} 
                  color="error" 
                  sx={{ 
                    mr: 4,
                    '& .MuiBadge-badge': {
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                      boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
                    }
                  }}
                >
                  <WarningIcon sx={{ color: '#ff6b6b' }} />
                </Badge>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 3, backgroundColor: '#ffffff' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
              <Tabs
                value={monitoringTabValue}
                onChange={handleMonitoringTabChange}
                aria-label="Server monitoring tabs"
                indicatorColor="primary"
                textColor="primary"
                sx={{                            '& .MuiTab-root': {
                              color: '#000000',
                              fontWeight: 500,
                              borderRadius: 2,
                              mx: 0.5,
                              '&.Mui-selected': {
                      color: 'rgba(99, 102, 241, 0.9)',
                      background: 'rgba(99, 102, 241, 0.1)',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    background: 'rgba(99, 102, 241, 0.8)',
                    height: 3,
                    borderRadius: 1.5,
                  }
                }}
              >
                <Tab
                  icon={<BarChartIcon />}
                  iconPosition="start"
                  label="Metrics"
                  id="monitoring-tab-0"
                  aria-controls="monitoring-tabpanel-0"
                />
                <Tab
                  icon={<Badge badgeContent={errorCount} color="error" invisible={errorCount === 0}>
                    <ListAltIcon />
                  </Badge>}
                  iconPosition="start"
                  label="Logs"
                  id="monitoring-tab-1"
                  aria-controls="monitoring-tabpanel-1"
                />
              </Tabs>
            </Box>
            <TabPanel value={monitoringTabValue} index={0}>
              <ServerMetricsPanel metrics={serverMetrics} isLoading={isLoadingMetrics} />
            </TabPanel>
            <TabPanel value={monitoringTabValue} index={1}>
              <ServerLogsPanel
                logs={serverLogs}
                isLoading={isLoadingLogs}
                onRefresh={fetchServerLogs}
              />
            </TabPanel>
          </AccordionDetails>
        </Accordion>

        {/* Loading States */}
        {(isLoadingConfig || serverStatus === 'starting' || serverStatus === 'restarting') && (
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
              aria-label={isLoadingConfig ? "Loading API configuration" : "Server starting"}
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
              {isLoadingConfig ? 'Loading API configuration...' : 
               serverStatus === 'starting' ? 'Starting API server...' :
               'Restarting API server...'}
            </Typography>
            {isLoadingConfig && (            <Button 
              variant="outlined" 
              onClick={manualRefreshConfig}
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
        )}

        {/* Server Not Running State */}
        {!isLoadingConfig && serverStatus === 'stopped' && (
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
        {!isLoadingConfig && serverStatus === 'error' && (
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

        {/* Error and Info Alerts */}
        {apiConfigError && !isLoadingConfig && (
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
            onClose={() => setApiConfigError(null)}
          >
            {apiConfigError}
          </Alert>
        )}

        {/* Main Content Container */}
        {!isLoadingConfig && entities.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
            {/* Entity Selector */}
            <EntitySelector
              entities={entities}
              selectedEntityName={selectedEntityName}
              isLoadingConfig={isLoadingConfig}
              serverStatus={serverStatus}
              onEntityChange={handleEntityChange}
            />

            {/* Endpoints Section */}
            {selectedEntityName && endpoints.length > 0 && (
              <>
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
                    onEndpointSelect={handleEndpointChange}
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
                          onChange={handleTabChange}
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
                          onRequestBodyChange={setRequestBody}
                          onSendRequest={makeApiRequest}
                          getMethodColor={getMethodColor}
                        />
                      </TabPanel>

                      {/* Response Tab */}
                      <TabPanel value={tabValue} index={1}>
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
                      </TabPanel>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            
            {/* No Endpoints Alert - Enhanced */}
            {!isLoadingConfig && entities.length > 0 && selectedEntityName && endpoints.length === 0 && (
              <Alert 
                severity="info" 
                sx={{
                  mt: 3,
                  background: 'rgba(59, 130, 246, 0.15) !important',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 2,
                  color: '#000000',
                  '& .MuiAlert-icon': {
                    color: '#3b82f6',
                  }
                }}
              >
                No endpoints are configured or generated for the selected entity "{selectedEntityName}".
              </Alert>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(ApiTester);
