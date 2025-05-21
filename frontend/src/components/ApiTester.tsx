import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  IconButton,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tooltip
} from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WarningIcon from '@mui/icons-material/Warning';

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
  data_type: 'String' | 'Integer' | 'Number' | 'Boolean' | 'Date' | string;
}

/**
 * Represents a custom route configuration for an entity.
 */
interface CustomRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  handler?: string;
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
  entities_advanced?: ApiEntity[];
  server?: ServerConfig;
  api_prefix?: string;
}

/**
 * Configuration for a specific API endpoint to be tested.
 */
interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  description: string;
}

/**
 * Server status types
 */
type ServerStatus = 'stopped' | 'starting' | 'running' | 'error' | 'stopping' | 'restarting';

/**
 * Server metrics data structure
 */
interface ServerMetrics {
  uptime_seconds: number;
  request_count: number;
  error_count: number;
  is_running: boolean;
  start_time: number;
  current_time: number;
}

/**
 * Server log entry structure
 */
interface ServerLogEntry {
  timestamp: number;
  level: string;
  message: string;
}

// --- END TYPE DEFINITIONS ---

/**
 * Formats a timestamp to a human-readable date/time string
 */
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Formats seconds to a human-readable duration
 */
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}s`;
};

/**
 * A simple panel component to display content for a selected tab.
 */
function TabPanel(props: TabPanelProps): React.ReactElement | null {
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
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
 * ServerControls component for managing the API server
 */
const ServerControls: React.FC<{
  status: ServerStatus;
  metrics: ServerMetrics | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRefresh: () => void;
  message: string;
}> = ({ status, metrics, onStart, onStop, onRestart, onRefresh, message }) => {
  const theme = useTheme();
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Server Control
        </Typography>
        <Tooltip title="Refresh server status">
          <IconButton onClick={onRefresh} size="small" aria-label="Refresh server status">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Grid container spacing={2} alignItems="center">
        <Grid>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color={status === 'running' ? 'success' : 'primary'}
              onClick={onStart}
              disabled={status === 'starting' || status === 'running' || status === 'restarting'}
              startIcon={status === 'starting' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              aria-label={status === 'running' ? 'API Server is running' : 'Start API Server'}
            >
              {status === 'running' ? 'Server Running' : (status === 'starting' ? 'Starting...' : 'Start Server')}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              onClick={onStop}
              disabled={status !== 'running'}
              startIcon={<StopIcon />}
              aria-label="Stop API Server"
            >
              Stop Server
            </Button>
            
            <Button
              variant="outlined"
              color="warning"
              onClick={onRestart}
              disabled={status !== 'running'}
              startIcon={<RestartAltIcon />}
              aria-label="Restart API Server"
            >
              Restart
            </Button>
          </Box>
        </Grid>
        
        <Grid >
          <Box>
            <Typography 
              variant="body2" 
              color={
                status === 'error' ? 'error' : 
                (status === 'running' ? 'success.main' : 
                (status === 'starting' || status === 'restarting' ? 'warning.main' : 'text.secondary'))
              }
              sx={{ mb: 1 }}
            >
              <strong>Status:</strong> {message || status.toUpperCase()}
            </Typography>
            
            {metrics && status === 'running' && (
              <Typography variant="body2" color="text.secondary">
                <strong>Uptime:</strong> {formatDuration(metrics.uptime_seconds)} | 
                <strong> Requests:</strong> {metrics.request_count} | 
                <strong> Errors:</strong> {metrics.error_count}
              </Typography>
            )}
            
            {status === 'starting' || status === 'restarting' && (
              <LinearProgress sx={{ mt: 1 }} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

/**
 * ServerMetricsPanel component to display detailed server metrics
 */
const ServerMetricsPanel: React.FC<{
  metrics: ServerMetrics | null;
  isLoading: boolean;
}> = ({ metrics, isLoading }) => {
  const theme = useTheme();
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!metrics) {
    return (
      <Alert severity="info">
        No metrics available. The server may not be running.
      </Alert>
    );
  }
  
  const successRate = metrics.request_count > 0
    ? ((metrics.request_count - metrics.error_count) / metrics.request_count) * 100
    : 100;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Server Metrics</Typography>
      
      <Grid container spacing={3}>
        <Grid>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>Status Overview</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Server Status" 
                  secondary={metrics.is_running ? "Running" : "Stopped"} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                  secondaryTypographyProps={{ color: metrics.is_running ? 'success.main' : 'error' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Uptime" 
                  secondary={formatDuration(metrics.uptime_seconds)} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Start Time" 
                  secondary={formatTimestamp(metrics.start_time)} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Current Time" 
                  secondary={formatTimestamp(metrics.current_time)} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid >
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>Request Statistics</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Total Requests" 
                  secondary={metrics.request_count} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Error Count" 
                  secondary={metrics.error_count} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                  secondaryTypographyProps={{ color: metrics.error_count > 0 ? 'error' : undefined }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Success Rate" 
                  secondary={`${successRate.toFixed(1)}%`} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                  secondaryTypographyProps={{ 
                    color: successRate < 95 
                      ? (successRate < 80 ? 'error' : 'warning.main') 
                      : 'success.main' 
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Requests Per Minute" 
                  secondary={metrics.uptime_seconds > 60 
                    ? (metrics.request_count / (metrics.uptime_seconds / 60)).toFixed(2)
                    : "N/A (need > 1 minute of uptime)"
                  } 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * ServerLogsPanel component to display server logs
 */
const ServerLogsPanel: React.FC<{
  logs: ServerLogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}> = ({ logs, isLoading, onRefresh }) => {
  const theme = useTheme();
  
  const getLogColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR': return theme.palette.error.main;
      case 'WARNING': return theme.palette.warning.main;
      case 'INFO': return theme.palette.info.main;
      case 'DEBUG': return theme.palette.text.secondary;
      default: return theme.palette.text.primary;
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Server Logs</Typography>
        <Tooltip title="Refresh logs">
          <IconButton onClick={onRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Alert severity="info">No logs available.</Alert>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            maxHeight: '400px', 
            overflow: 'auto', 
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' 
          }}
        >
          <List dense>
            {logs.map((log, index) => (
              <ListItem 
                key={`${log.timestamp}-${index}`} 
                divider={index < logs.length - 1}
                sx={{
                  borderLeft: `4px solid ${getLogColor(log.level)}`,
                  bgcolor: log.level.toUpperCase() === 'ERROR' 
                    ? theme.palette.error.main + '10' 
                    : undefined
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={log.level} 
                        size="small" 
                        sx={{ 
                          bgcolor: getLogColor(log.level),
                          color: theme.palette.getContrastText(getLogColor(log.level)),
                          width: 70,
                          fontSize: '0.7rem'
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        component="span" 
                        sx={{ fontWeight: log.level.toUpperCase() === 'ERROR' ? 'bold' : 'normal' }}
                      >
                        {log.message}
                      </Typography>
                    </Box>
                  }
                  secondary={formatTimestamp(log.timestamp)}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { color: theme.palette.text.secondary }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

/**
 * `ApiTester` component allows users to interact with and test API endpoints
 * that are configured in the backend. It fetches the API configuration,
 * allows selection of entities and endpoints, and sending requests to a
 * locally running API server.
 */
const ApiTester: React.FC = () => {
  const theme = useTheme();
  const metricsIntervalRef = useRef<number | null>(null);

  const [entities, setEntities] = useState<ApiEntity[]>([]);
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api');
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('stopped');
  const [serverMessage, setServerMessage] = useState<string>('');
  
  // New state variables for enhanced features
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [serverLogs, setServerLogs] = useState<ServerLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [monitoringTabValue, setMonitoringTabValue] = useState<number>(0);
  
  const getMethodColor = useCallback((method: string): string => {
    switch (method.toUpperCase()) {
      case 'GET': return theme.palette.info.main;
      case 'POST': return theme.palette.success.main;
      case 'PUT': return theme.palette.warning.main;
      case 'DELETE': return theme.palette.error.main;
      case 'PATCH': return theme.palette.secondary.main;
      default: return theme.palette.grey[700];
    }
  }, [theme]);

  const generateSampleBody = useCallback((entity: ApiEntity | undefined): string => {
    if (!entity || !entity.fields || entity.fields.length === 0) {
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
        case 'Date': defaultValue = new Date().toISOString().split('T')[0]; break;
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
        setEntities([]);
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
  }, [createEndpointsForEntity, generateSampleBody]);

  const fetchServerMetrics = useCallback(async (): Promise<void> => {
    if (serverStatus !== 'running') {
      setServerMetrics(null);
      return;
    }
    
    try {
      setIsLoadingMetrics(true);
      const metrics = await invoke<ServerMetrics>('get_server_metrics');
      setServerMetrics(metrics);
    } catch (err: any) {
      console.error('Error fetching server metrics:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [serverStatus]);
  
  const fetchServerLogs = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingLogs(true);
      const logs = await invoke<ServerLogEntry[]>('get_server_logs', { limit: 50 });
      setServerLogs(logs);
    } catch (err: any) {
      console.error('Error fetching server logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

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
        setServerStatus('error');
        setServerMessage(`Unknown server status: ${statusResult}`);
      }
      
      // If server is running, fetch metrics too
      if (statusResult === 'running') {
        fetchServerMetrics();
        fetchServerLogs();
      }
    } catch (err: any) {
      console.error('Error checking server status:', err);
      setServerStatus('error');
      setServerMessage(err?.message || err?.toString() || 'Error checking server status');
    }
  }, [fetchServerMetrics, fetchServerLogs]);

  useEffect(() => {
    fetchApiConfiguration();
    checkServerStatus(); // Initial check
    
    // Set up polling for server status and metrics
    const statusInterval = setInterval(checkServerStatus, 5000); // Poll every 5 seconds
    
    // Clean up intervals on unmount
    return () => {
      clearInterval(statusInterval);
      if (metricsIntervalRef.current !== null) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [fetchApiConfiguration, checkServerStatus]);

  // Effect for metrics interval management
  useEffect(() => {
    // Clear any existing interval
    if (metricsIntervalRef.current !== null) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
    
    // Only set up metrics polling if server is running
    if (serverStatus === 'running') {
      metricsIntervalRef.current = window.setInterval(fetchServerMetrics, 3000) as unknown as number;
    }
    
    return () => {
      if (metricsIntervalRef.current !== null) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [serverStatus, fetchServerMetrics]);

  const handleEntityChange = useCallback((event: SelectChangeEvent<string>): void => {
    const entityName = event.target.value;
    setSelectedEntityName(entityName);
    setSelectedEndpoint(null);
    setRequestBody('');

    const entity = entities.find(e => e.name === entityName);
    if (entity) {
      const newEndpoints = createEndpointsForEntity(entity);
      setEndpoints(newEndpoints);
      if (newEndpoints.length > 0) {
        setSelectedEndpoint(newEndpoints[0]);
        if (newEndpoints[0].method === 'POST' || newEndpoints[0].method === 'PUT') {
          setRequestBody(generateSampleBody(entity));
        }
      }
    } else {
      setEndpoints([]);
    }
  }, [entities, createEndpointsForEntity, generateSampleBody]);

  const handleEndpointChange = useCallback((endpoint: EndpointConfig): void => {
    setSelectedEndpoint(endpoint);
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      const currentEntity = entities.find(e => e.name === selectedEntityName);
      setRequestBody(generateSampleBody(currentEntity));
    } else {
      setRequestBody('');
    }
    setTabValue(0);
    setResponse('');
  }, [entities, selectedEntityName, generateSampleBody]);
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  }, []);
  
  const handleMonitoringTabChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setMonitoringTabValue(newValue);
    
    // Refresh data when switching to a tab
    if (newValue === 0) { // Metrics tab
      fetchServerMetrics();
    } else if (newValue === 1) { // Logs tab
      fetchServerLogs();
    }
  }, [fetchServerMetrics, fetchServerLogs]);

  const makeApiRequest = useCallback(async (): Promise<void> => {
    if (!selectedEndpoint) {
      setError("No endpoint selected.");
      return;
    }
    
    setIsSendingRequest(true);
    setError(null);
    setResponse('');

    try {
      let urlPath = selectedEndpoint.path;
      if (urlPath.includes('{id}')) {
        const idValue = prompt('Enter ID value for path parameter {id}:', '1');
        if (idValue !== null && idValue.trim() !== '') {
          urlPath = urlPath.replace('{id}', encodeURIComponent(idValue));
        } else {
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
        setResponse(result);
      }
      setTabValue(1); // Switch to response tab
      
      // Refresh metrics after making a request
      fetchServerMetrics();
    } catch (err: any) {
      console.error('Error making API request:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error during API request';
      setResponse(JSON.stringify({ error: 'API Request Failed', details: errorMessage }, null, 2));
      setError(`API Request Failed: ${errorMessage}`);
      setTabValue(1);
    } finally {
      setIsSendingRequest(false);
    }
  }, [selectedEndpoint, apiUrl, requestBody, fetchServerMetrics]);

  const startApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('starting');
      setError(null);
      setServerMessage('Attempting to start API server...');
      
      console.log("Invoking start_api_server...");
      const result = await invoke<string>('start_api_server');
      console.log("Server start result:", result);
      
      if (result.toLowerCase().includes("error") || result.toLowerCase().includes("fail")) {
          setServerStatus('error');
          setServerMessage(result || 'Failed to start API server.');
          setError(result || 'Failed to start API server.');
      } else {
          setServerStatus('running'); 
          setServerMessage(result || 'Server start initiated. Checking status...');
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
  }, [fetchApiConfiguration, checkServerStatus]);
  
  const stopApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('stopping');
      setError(null);
      setServerMessage('Stopping API server...');
      
      const result = await invoke<string>('stop_api_server');
      console.log("Server stop result:", result);
      
      // Check status again to confirm
      setTimeout(checkServerStatus, 1000);
    } catch (err: any) {
      console.error('Error stopping API server:', err);
      setError(`Failed to stop server: ${err?.message || err?.toString() || 'Unknown error'}`);
      setServerMessage(`Failed to stop server: ${err?.message || err?.toString() || 'Unknown error'}`);
      // Reset status after error
      setTimeout(checkServerStatus, 1000);
    }
  }, [checkServerStatus]);
  
  const restartApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('restarting');
      setError(null);
      setServerMessage('Restarting API server...');
      
      const result = await invoke<string>('restart_api_server');
      console.log("Server restart result:", result);
      
      // Reset metrics
      setServerMetrics(null);
      
      // Check status again to confirm
      setTimeout(checkServerStatus, 2000);
    } catch (err: any) {
      console.error('Error restarting API server:', err);
      setError(`Failed to restart server: ${err?.message || err?.toString() || 'Unknown error'}`);
      setServerMessage(`Failed to restart server: ${err?.message || err?.toString() || 'Unknown error'}`);
      // Reset status after error
      setTimeout(checkServerStatus, 1000);
    }
  }, [checkServerStatus]);

  // Memoized values for display
  const currentFullUrl = useMemo(() => {
    if (!selectedEndpoint) return apiUrl;
    return `${apiUrl}${selectedEndpoint.path}`;
  }, [apiUrl, selectedEndpoint]);
  
  // Error count for badge display
  const errorCount = useMemo(() => {
    return serverLogs.filter(log => log.level.toUpperCase() === 'ERROR').length;
  }, [serverLogs]);

  return (
    <Box>
      <Box sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>API Tester</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Test your dynamically generated API endpoints. Ensure the backend server is configured and running.
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Server Control Panel */}
        <ServerControls
          status={serverStatus}
          metrics={serverMetrics}
          onStart={startApiServer}
          onStop={stopApiServer}
          onRestart={restartApiServer}
          onRefresh={checkServerStatus}
          message={serverMessage}
        />

        {/* Server Monitoring Section */}
        <Accordion defaultExpanded={false} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="server-monitoring-content"
            id="server-monitoring-header"
            sx={{ bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Typography variant="h6">Server Monitoring</Typography>
              {errorCount > 0 && (
                <Badge badgeContent={errorCount} color="error" sx={{ mr: 4 }}>
                  <WarningIcon color="error" />
                </Badge>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={monitoringTabValue}
                onChange={handleMonitoringTabChange}
                aria-label="Server monitoring tabs"
                indicatorColor="primary"
                textColor="primary"
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

        {isLoadingConfig && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress aria-label="Loading API configuration" />
            <Typography sx={{ ml: 2 }}>Loading API Configuration...</Typography>
          </Box>
        )}

        {error && !isLoadingConfig && (
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
                disabled={isLoadingConfig || serverStatus !== 'running'}
                aria-describedby={serverStatus !== 'running' ? "server-status-message" : undefined}
              >
                {entities.map((entity) => (
                  <MenuItem key={entity.name} value={entity.name}>
                    {entity.name}
                  </MenuItem>
                ))}
              </Select>
              {serverStatus !== 'running' && (
                <Typography variant="caption" color="error" id="server-status-message" sx={{ mt: 1 }}>
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
                      key={`${endpoint.method}-${endpoint.path}-${index}`}
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
                          backgroundColor: getMethodColor(endpoint.method) + (selectedEndpoint?.path === endpoint.path && selectedEndpoint?.method === endpoint.method ? '' : '2A'),
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
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1 }}>
                            <Chip
                              label={selectedEndpoint.method}
                              size="small"
                              sx={{
                                backgroundColor: getMethodColor(selectedEndpoint.method),
                                color: theme.palette.getContrastText(getMethodColor(selectedEndpoint.method)),
                                fontWeight: 'bold',
                                minWidth: 70,
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
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            The API server is not running. Please start the server to send requests.
                          </Alert>
                        )}
                      </TabPanel>
                      
                      <TabPanel value={tabValue} index={1}>
                        <Typography variant="subtitle1" gutterBottom component="h5">
                          Response
                        </Typography>
                        {isSendingRequest && !response && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            <Typography>Waiting for response...</Typography>
                          </Box>
                        )}
                        {!isSendingRequest && !response && (
                          <Typography sx={{ fontStyle: 'italic' }}>No response yet, or request not sent.</Typography>
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
                              fontSize: '0.875rem',
                              borderRadius: 1,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                            }}
                            aria-live="polite"
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
    </Box>
  );
};

export default ApiTester;