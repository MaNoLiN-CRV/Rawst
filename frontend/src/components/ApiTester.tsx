import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added React
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
  useTheme, // Import useTheme
} from '@mui/material';
import { invoke } from '@tauri-apps/api/core';

// --- START TYPE DEFINITIONS ---

/**
 * Properties for the TabPanel component.
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Represents a field within an API entity.
 */
interface EntityField {
  name: string;
  data_type: 'String' | 'Integer' | 'Number' | 'Boolean' | 'Date' | string; // Allow other string for extensibility
  // Add other potential properties like 'required', 'is_primary_key' if needed by the backend config
}

/**
 * Represents a custom route configuration for an entity.
 */
interface CustomRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string; // Common HTTP methods + string
  handler?: string; // Description or identifier for the handler
}

/**
 * Configuration for the standard CRUD and custom endpoints of an entity.
 */
interface EntityEndpointsConfig {
  generate_list?: boolean;
  generate_read?: boolean;
  generate_create?: boolean;
  generate_update?: boolean;
  generate_delete?: boolean;
  custom_routes?: CustomRoute[];
}

/**
 * Represents an API entity with its configuration.
 */
interface ApiEntity {
  name: string;
  fields: EntityField[];
  endpoints?: EntityEndpointsConfig;
  // Other potential properties for an entity
}

/**
 * Configuration for the API server.
 */
interface ServerConfig {
  host: string;
  port: number;
}

/**
 * Overall API configuration structure fetched from the backend.
 */
interface ApiConfiguration {
  entities_basic?: ApiEntity[];
  entities_advanced?: ApiEntity[]; // Assuming similar structure for advanced entities
  server?: ServerConfig;
  api_prefix?: string;
  // Other top-level configuration properties
}

/**
 * Configuration for a specific API endpoint to be tested.
 */
interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string; // Common HTTP methods
  description: string;
}

type ServerStatus = 'stopped' | 'starting' | 'running' | 'error';

// --- END TYPE DEFINITIONS ---

/**
 * A simple panel component to display content for a selected tab.
 * @param props - The props for the TabPanel.
 * @returns A React element representing the tab panel.
 */
function TabPanel(props: TabPanelProps): React.ReactElement | null { // Changed to React.ReactElement | null
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      hidden={value !== index} // Still useful for semantics even if returning null above for React tree
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {children}
      </Box>
    </div>
  );
}

/**
 * `ApiTester` component allows users to interact with and test API endpoints
 * that are configured in the backend. It fetches the API configuration,
 * allows selection of entities and endpoints, and sending requests to a
 * locally running API server.
 */
const ApiTester: React.FC = () => {
  const theme = useTheme(); // For accessing theme properties

  const [entities, setEntities] = useState<ApiEntity[]>([]);
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true); // For initial config load
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false); // For API request in progress
  const [tabValue, setTabValue] = useState<number>(0);
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api'); // Default, will be updated from config
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('stopped');
  const [serverMessage, setServerMessage] = useState<string>('');


  const getMethodColor = useCallback((method: string): string => {
    switch (method.toUpperCase()) {
      case 'GET': return theme.palette.info.main; // Blue
      case 'POST': return theme.palette.success.main; // Green
      case 'PUT': return theme.palette.warning.main; // Orange
      case 'DELETE': return theme.palette.error.main; // Red
      case 'PATCH': return theme.palette.secondary.main; // Purple/Secondary
      default: return theme.palette.grey[700];
    }
  }, [theme]);

  const generateSampleBody = useCallback((entity: ApiEntity | undefined): string => {
    if (!entity || !entity.fields || entity.fields.length === 0) {
      // Default if no fields or entity
      return JSON.stringify({ id: 0, sample_field: "sample_value" }, null, 2);
    }
    const sampleBody: { [key: string]: any } = {};
    entity.fields.forEach((field) => {
      if (!field || !field.name) return;
      let defaultValue: any;
      switch (field.data_type) {
        case 'String': defaultValue = `Sample ${field.name}`; break;
        case 'Integer': case 'Number': defaultValue = 0; break;
        case 'Boolean': defaultValue = false; break;
        case 'Date': defaultValue = new Date().toISOString().split('T')[0]; break; // Just date part
        default: defaultValue = null;
      }
      sampleBody[field.name] = defaultValue;
    });
    return JSON.stringify(sampleBody, null, 2);
  }, []);
  
  const createEndpointsForEntity = useCallback((entity: ApiEntity): EndpointConfig[] => {
    const entityName = entity.name;
    let newEndpoints: EndpointConfig[] = [];

    if (!entity.endpoints || Object.keys(entity.endpoints).length === 0) {
      console.log(`Entity ${entityName} has no specific endpoints configuration, using defaults.`);
      newEndpoints = [
        { path: `/${entityName}`, method: 'GET', description: `Get all ${entityName}` },
        { path: `/${entityName}/{id}`, method: 'GET', description: `Get ${entityName} by ID` },
        { path: `/${entityName}`, method: 'POST', description: `Create new ${entityName}` },
        { path: `/${entityName}/{id}`, method: 'PUT', description: `Update ${entityName}` },
        { path: `/${entityName}/{id}`, method: 'DELETE', description: `Delete ${entityName}` },
      ];
    } else {
      const { generate_list, generate_read, generate_create, generate_update, generate_delete, custom_routes } = entity.endpoints;
      if (generate_list) newEndpoints.push({ path: `/${entityName}`, method: 'GET', description: `Get all ${entityName}` });
      if (generate_read) newEndpoints.push({ path: `/${entityName}/{id}`, method: 'GET', description: `Get ${entityName} by ID` });
      if (generate_create) newEndpoints.push({ path: `/${entityName}`, method: 'POST', description: `Create new ${entityName}` });
      if (generate_update) newEndpoints.push({ path: `/${entityName}/{id}`, method: 'PUT', description: `Update ${entityName}` });
      if (generate_delete) newEndpoints.push({ path: `/${entityName}/{id}`, method: 'DELETE', description: `Delete ${entityName}` });

      if (custom_routes && custom_routes.length > 0) {
        custom_routes.forEach((route: CustomRoute) => {
          newEndpoints.push({
            path: route.path,
            method: route.method,
            description: route.handler || `Custom endpoint for ${entityName}`,
          });
        });
      }
    }
    return newEndpoints;
  }, []);


  const fetchApiConfiguration = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingConfig(true);
      setError(null);
      console.log("Fetching API configuration...");
      const config = await invoke<ApiConfiguration | null>('get_current_configuration');
      
      console.log("API configuration received:", config ? "YES" : "NO", 
                  config?.entities_basic ? `(${config.entities_basic.length} basic entities)` : "(no basic entities)");
      
      if (config && config.entities_basic && config.entities_basic.length > 0) {
        setEntities(config.entities_basic);
        
        const firstEntity = config.entities_basic[0];
        if (firstEntity?.name) {
          console.log("Auto-selecting first entity:", firstEntity.name);
          setSelectedEntityName(firstEntity.name);
          
          const newEndpoints = createEndpointsForEntity(firstEntity);
          setEndpoints(newEndpoints);

          if (newEndpoints.length > 0) {
            setSelectedEndpoint(newEndpoints[0]);
            if (newEndpoints[0].method === 'POST' || newEndpoints[0].method === 'PUT') {
              setRequestBody(generateSampleBody(firstEntity));
            } else {
              setRequestBody('');
            }
          } else {
            setSelectedEndpoint(null);
            setRequestBody('');
          }
        }
        if (config.server && config.server.host && config.server.port) {
          setApiUrl(`http://${config.server.host}:${config.server.port}${config.api_prefix || '/api'}`);
        }
      } else {
        setEntities([]); // Clear entities if none found
        setSelectedEntityName('');
        setEndpoints([]);
        setSelectedEndpoint(null);
        console.error("No entities found in configuration or configuration is null.");
        setError("No API entities found in configuration. Please ensure your API is configured and the server has access to it.");
      }
    } catch (err: any) {
      console.error('Error fetching API configuration:', err);
      setError(err?.message || err?.toString() || 'Unknown error loading API configuration');
      setResponse(JSON.stringify({ error: 'Error loading API configuration', details: err?.message || err }, null, 2));
    } finally {
      setIsLoadingConfig(false);
    }
  }, [createEndpointsForEntity, generateSampleBody]); // Added dependencies

  const checkServerStatus = useCallback(async (): Promise<void> => {
    try {
      const statusResult = await invoke<string>('get_server_status');
      if (statusResult.startsWith('error:')) {
        setServerStatus('error');
        setServerMessage(statusResult.substring(6));
      } else if (statusResult === 'running' || statusResult === 'stopped' || statusResult === 'starting') {
        setServerStatus(statusResult as ServerStatus);
        setServerMessage(statusResult === 'running' ? 'Server is running' : (statusResult === 'starting' ? 'Server is starting...' : 'Server is stopped.'));
      } else {
        // Fallback for unexpected status strings
        setServerStatus('error');
        setServerMessage(`Unknown server status: ${statusResult}`);
      }
    } catch (err: any) {
      console.error('Error checking server status:', err);
      setServerStatus('error');
      setServerMessage(err?.message || err?.toString() || 'Error checking server status');
    }
  }, []);


  useEffect(() => {
    fetchApiConfiguration();
    checkServerStatus(); // Initial check
    const statusInterval = setInterval(checkServerStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(statusInterval);
  }, [fetchApiConfiguration, checkServerStatus]);


  const handleEntityChange = useCallback((event: SelectChangeEvent<string>): void => {
    const entityName = event.target.value;
    setSelectedEntityName(entityName);
    setSelectedEndpoint(null); // Reset endpoint selection
    setRequestBody(''); // Clear request body

    const entity = entities.find(e => e.name === entityName);
    if (entity) {
      const newEndpoints = createEndpointsForEntity(entity);
      setEndpoints(newEndpoints);
      if (newEndpoints.length > 0) {
        setSelectedEndpoint(newEndpoints[0]); // Auto-select first endpoint
        if (newEndpoints[0].method === 'POST' || newEndpoints[0].method === 'PUT') {
          setRequestBody(generateSampleBody(entity));
        }
      }
    } else {
      setEndpoints([]); // Clear endpoints if entity not found (should not happen with Select)
    }
  }, [entities, createEndpointsForEntity, generateSampleBody]);

  const handleEndpointChange = useCallback((endpoint: EndpointConfig): void => {
    setSelectedEndpoint(endpoint);
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      // If body is empty or for a different entity type, regenerate
      // For simplicity, always regenerate for POST/PUT if not already set for this entity type
      const currentEntity = entities.find(e => e.name === selectedEntityName);
      setRequestBody(generateSampleBody(currentEntity));
    } else {
      setRequestBody(''); // Clear body for GET/DELETE etc.
    }
    setTabValue(0); // Switch to request tab
    setResponse(''); // Clear previous response
  }, [entities, selectedEntityName, generateSampleBody]);
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  }, []);

  const makeApiRequest = useCallback(async (): Promise<void> => {
    if (!selectedEndpoint) {
      setError("No endpoint selected.");
      return;
    }
    
    setIsSendingRequest(true);
    setError(null);
    setResponse(''); // Clear previous response

    try {
      let urlPath = selectedEndpoint.path;
      // Basic placeholder replacement for {id}
      // A more robust solution might involve parsing all params from path
      if (urlPath.includes('{id}')) {
        // For simplicity, prompt for ID. In a real app, this might come from a form field.
        const idValue = prompt('Enter ID value for path parameter {id}:', '1');
        if (idValue !== null && idValue.trim() !== '') {
          urlPath = urlPath.replace('{id}', encodeURIComponent(idValue));
        } else {
          // If user cancels or enters empty, either throw or use a default/show error
          setError('ID value is required for this endpoint and was not provided.');
          setIsSendingRequest(false);
          return;
        }
      }
      const fullUrl = `${apiUrl}${urlPath}`;

      console.log(`Making API request: ${selectedEndpoint.method} ${fullUrl}`);
      if (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') {
        console.log('Request body:', requestBody);
      }

      const result = await invoke<string>('test_api_endpoint', { 
        url: fullUrl,
        method: selectedEndpoint.method,
        body: (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') ? requestBody : null
      });
      
      // Try to parse and re-stringify for pretty printing if it's JSON
      try {
        const parsedResult = JSON.parse(result);
        setResponse(JSON.stringify(parsedResult, null, 2));
      } catch (parseError) {
        setResponse(result); // If not JSON, show as is
      }
      setTabValue(1); // Switch to response tab
    } catch (err: any) {
      console.error('Error making API request:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error during API request';
      setResponse(JSON.stringify({ error: 'API Request Failed', details: errorMessage }, null, 2));
      setError(`API Request Failed: ${errorMessage}`);
      setTabValue(1); // Switch to response tab
    } finally {
      setIsSendingRequest(false);
    }
  }, [selectedEndpoint, apiUrl, requestBody]); // Added dependencies

  const startApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('starting');
      setError(null);
      setServerMessage('Attempting to start API server...');
      
      console.log("Invoking start_api_server...");
      const result = await invoke<string>('start_api_server');
      console.log("Server start result:", result);
      
      // The 'start_api_server' might return immediately or after server is up.
      // We rely on 'checkServerStatus' to confirm.
      // For immediate feedback:
      if (result.toLowerCase().includes("error") || result.toLowerCase().includes("fail")) {
          setServerStatus('error');
          setServerMessage(result || 'Failed to start API server.');
          setError(result || 'Failed to start API server.');
      } else {
          // Optimistically set to running, checkServerStatus will confirm
          setServerStatus('running'); 
          setServerMessage(result || 'Server start initiated. Checking status...');
          // After server starts (or attempts to), refresh the configuration
          // and check status more quickly.
          await fetchApiConfiguration(); 
      }
      // Trigger a status check soon after attempting to start
      setTimeout(checkServerStatus, 1500);

    } catch (err: any) {
      console.error('Error invoking start_api_server:', err);
      setServerStatus('error');
      const errorMessage = err?.message || err?.toString() || 'Unknown error starting API server';
      setError(errorMessage);
      setServerMessage(`Failed to start API server: ${errorMessage}`);
    }
  }, [fetchApiConfiguration, checkServerStatus]); // Added dependencies

  // Memoized values for display
  const currentFullUrl = useMemo(() => {
    if (!selectedEndpoint) return apiUrl;
    // Basic placeholder display, actual replacement happens in makeApiRequest
    return `${apiUrl}${selectedEndpoint.path}`;
  }, [apiUrl, selectedEndpoint]);

  return (
    <Box sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}> {/* Responsive padding */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>API Tester</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Test your dynamically generated API endpoints. Ensure the backend server is configured and running.
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Server Control Section */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom component="h2">
          Server Control
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color={serverStatus === 'running' ? 'success' : (serverStatus === 'starting' ? 'warning' : 'primary')}
            onClick={startApiServer}
            disabled={serverStatus === 'starting' || serverStatus === 'running'}
            startIcon={serverStatus === 'starting' ? <CircularProgress size={20} color="inherit" /> : null}
            aria-label={serverStatus === 'running' ? 'API Server is running' : 'Start API Server'}
          >
            {serverStatus === 'running' ? 'Server Running' : (serverStatus === 'starting' ? 'Starting Server...' : 'Start API Server')}
          </Button>
          {serverMessage && (
            <Typography 
              variant="body2" 
              color={serverStatus === 'error' ? 'error' : (serverStatus === 'running' ? 'success.main' : 'text.secondary')}
              sx={{ flexGrow: 1 }}
            >
              Status: {serverMessage}
            </Typography>
          )}
        </Box>
      </Paper>
      
      {isLoadingConfig && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress aria-label="Loading API configuration" />
          <Typography sx={{ ml: 2 }}>Loading API Configuration...</Typography>
        </Box>
      )}
      
      {error && !isLoadingConfig && ( // Don't show general error if config is still loading
        <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {!isLoadingConfig && entities.length === 0 && !error && (
        <Alert severity="info" sx={{ mb: 4 }}>
          No API entities found or configuration is empty. Please generate/check your API configuration.
        </Alert>
      )}

      {!isLoadingConfig && entities.length > 0 && (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel id="entity-select-label">Select Entity</InputLabel>
            <Select
              labelId="entity-select-label"
              id="entity-select"
              value={selectedEntityName}
              label="Select Entity"
              onChange={handleEntityChange}
              disabled={isLoadingConfig || serverStatus !== 'running'} // Disable if server not running
              aria-describedby={serverStatus !== 'running' ? "server-status-message" : undefined}
            >
              {entities.map((entity) => (
                <MenuItem key={entity.name} value={entity.name}>
                  {entity.name}
                </MenuItem>
              ))}
            </Select>
            {serverStatus !== 'running' && (
                 <Typography variant="caption" color="error" id="server-status-message" sx={{mt:1}}>
                    Server is not running. Please start the server to select an entity.
                 </Typography>
            )}
          </FormControl>
          
          {selectedEntityName && endpoints.length > 0 && (
            <>
              <Typography variant="h6" gutterBottom component="h3">
                Available Endpoints for "{selectedEntityName}"
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {endpoints.map((endpoint, index) => (
                  <Chip
                    key={`${endpoint.method}-${endpoint.path}-${index}`} // More unique key
                    label={`${endpoint.method} ${endpoint.path}`}
                    onClick={() => handleEndpointChange(endpoint)}
                    variant={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? "filled" : "outlined"}
                    clickable
                    sx={{
                      fontWeight: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? 'bold' : 'normal',
                      color: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? theme.palette.getContrastText(getMethodColor(endpoint.method)) : getMethodColor(endpoint.method),
                      backgroundColor: selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? getMethodColor(endpoint.method) : 'transparent',
                      borderColor: getMethodColor(endpoint.method),
                      '&:hover': {
                        backgroundColor: getMethodColor(endpoint.method) + (selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? '' : '2A'), // Add alpha for hover on outlined
                        boxShadow: selectedEndpoint?.path !== endpoint.path || selectedEndpoint?.method !== endpoint.method ? `0 0 5px ${getMethodColor(endpoint.method)}40` : 'none',
                      },
                    }}
                    aria-pressed={selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method}
                  />
                ))}
              </Box>
              
              {selectedEndpoint && (
                <Card variant="outlined" sx={{ mb: 4, borderRadius: 2, boxShadow: theme.shadows[2] }}>
                  <CardContent>
                    <Typography variant="h6" component="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
                      Testing: {selectedEndpoint.description}
                    </Typography>
                    
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        aria-label="Request and Response Tabs"
                        indicatorColor="primary"
                        textColor="primary"
                      >
                        <Tab label="Request" id="api-tab-0" aria-controls="api-tabpanel-0" />
                        <Tab label="Response" id="api-tab-1" aria-controls="api-tabpanel-1" disabled={!response && !isSendingRequest} />
                      </Tabs>
                    </Box>
                    
                    <TabPanel value={tabValue} index={0}>
                      <Box sx={{ mb: 3 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{sm: "center"}} sx={{ mb: 1 }}>
                          <Chip 
                            label={selectedEndpoint.method} 
                            size="small" 
                            sx={{ 
                              backgroundColor: getMethodColor(selectedEndpoint.method),
                              color: theme.palette.getContrastText(getMethodColor(selectedEndpoint.method)),
                              fontWeight: 'bold',
                              minWidth: 70, // Ensure method chip is wide enough
                              mb: { xs: 1, sm: 0 }
                            }} 
                          />
                          <Typography variant="body1" component="div" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', flexGrow: 1 }}>
                            {currentFullUrl}
                          </Typography>
                        </Stack>
                      </Box>
                      
                      {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle1" gutterBottom component="h5">
                            Request Body (JSON)
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={10}
                            variant="outlined"
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            InputProps={{
                              sx: { fontFamily: 'monospace', fontSize: '0.9rem' }
                            }}
                            placeholder="Enter JSON request body here..."
                            aria-label="Request body input"
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                          variant="contained"
                          onClick={makeApiRequest}
                          disabled={isSendingRequest || serverStatus !== 'running'}
                          startIcon={isSendingRequest ? <CircularProgress size={20} color="inherit" /> : null}
                          sx={{
                            minWidth: 150,
                            backgroundColor: getMethodColor(selectedEndpoint.method),
                            color: theme.palette.getContrastText(getMethodColor(selectedEndpoint.method)),
                            '&:hover': {
                              backgroundColor: theme.palette.augmentColor({ color: { main: getMethodColor(selectedEndpoint.method) } }).dark,
                            },
                          }}
                          aria-label={`Send ${selectedEndpoint.method} request`}
                        >
                          {isSendingRequest ? 'Sending...' : 'Send Request'}
                        </Button>
                      </Box>
                       {serverStatus !== 'running' && (
                            <Alert severity="warning" sx={{mt:2}}>
                                The API server is not running. Please start the server to send requests.
                            </Alert>
                        )}
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={1}>
                      <Typography variant="subtitle1" gutterBottom component="h5">
                        Response
                      </Typography>
                      {isSendingRequest && !response && (
                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                           <CircularProgress size={20} sx={{mr: 1}}/> 
                           <Typography>Waiting for response...</Typography>
                        </Box>
                      )}
                      {!isSendingRequest && !response && (
                        <Typography sx={{fontStyle: 'italic'}}>No response yet, or request not sent.</Typography>
                      )}
                      {response && (
                        <Paper 
                          elevation={0}
                          variant="outlined"
                          sx={{ 
                            p: 2, 
                            maxHeight: '500px', 
                            overflow: 'auto',
                            backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                            borderColor: theme.palette.divider,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem', // Slightly smaller for dense info
                            borderRadius: 1, // Consistent with TextField
                            whiteSpace: 'pre-wrap', // Ensure wrapping
                            wordBreak: 'break-all', // Break long words/strings
                          }}
                          aria-live="polite" // Announce changes to screen readers
                        >
                          {response}
                        </Paper>
                      )}
                    </TabPanel>
                  </CardContent>
                </Card>
              )}
            </>
          )}
           {!isLoadingConfig && entities.length > 0 && selectedEntityName && endpoints.length === 0 && (
                <Alert severity="info" sx={{mt: 2}}>
                    No endpoints are configured or generated for the selected entity "{selectedEntityName}".
                </Alert>
           )}
        </Box>
      )}
    </Box>
  );
};

export default ApiTester;