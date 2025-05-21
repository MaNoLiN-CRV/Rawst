import React, { useState, useEffect, useCallback, useMemo, SetStateAction } from 'react';
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

const ApiTester: React.FC = () => {
  const theme = useTheme();
  
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);
  const [monitoringTabValue, setMonitoringTabValue] = useState<number>(0);
  
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
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError: setApiConfigError
  } = useApiConfiguration(serverStatus);

  useEffect(() => {
    if (selectedEndpoint) {
      if (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') {
        const currentEntity = entities.find(e => e.name === selectedEntityName);
        setRequestBody(generateSampleBody(currentEntity));
      } else {
        setRequestBody('');
      }
    } else {
      setRequestBody('');
    }
  }, [selectedEndpoint, selectedEntityName, entities, generateSampleBody]);

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
    setSelectedEndpoint(endpoint as SetStateAction<EndpointConfig | null>);
    setResponse(''); 
    setTabValue(0); 
  }, [setSelectedEndpoint]);
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  }, []);
  
  const handleMonitoringTabChange = useCallback((event: React.SyntheticEvent, newValue: number): void => {
    setMonitoringTabValue(newValue);
    if (newValue === 0) fetchServerMetrics();
    else if (newValue === 1) fetchServerLogs();
  }, [fetchServerMetrics, fetchServerLogs]);

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
      if (urlPath.includes('{id}')) {
        const idValue = prompt('Enter ID value for path parameter {id}:', '1');
        if (idValue !== null && idValue.trim() !== '') {
          urlPath = urlPath.replace('{id}', encodeURIComponent(idValue));
        } else {
          setApiConfigError('ID value is required for this endpoint and was not provided.');
          setIsSendingRequest(false);
          return;
        }
      }
      const fullUrl = `${apiUrl}${urlPath}`;

      const result = await invoke<string>('test_api_endpoint', { 
        url: fullUrl,
        method: selectedEndpoint.method,
        body: (selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') ? requestBody : null
      });
      
      try {
        const parsedResult = JSON.parse(result);
        setResponse(JSON.stringify(parsedResult, null, 2));
      } catch (parseError) {
        setResponse(result);
      }
      setTabValue(1); 
      fetchServerMetrics();
    } catch (err: unknown) {
      console.error('Error making API request:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResponse(JSON.stringify({ error: 'API Request Failed', details: errorMessage }, null, 2));
      setApiConfigError(`API Request Failed: ${errorMessage}`);
      setTabValue(1);
    } finally {
      setIsSendingRequest(false);
    }
  }, [selectedEndpoint, apiUrl, requestBody, fetchServerMetrics, setApiConfigError]);

  const currentFullUrl = useMemo(() => {
    if (!selectedEndpoint) return apiUrl;
    return `${apiUrl}${selectedEndpoint.path}`;
  }, [apiUrl, selectedEndpoint]);

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

        <ServerControls
          status={serverStatus}
          metrics={serverMetrics}
          onStart={startApiServer}
          onStop={stopApiServer}
          onRestart={restartApiServer}
          onRefresh={checkServerStatus}
          message={serverMessage}
        />

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

        {apiConfigError && !isLoadingConfig && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setApiConfigError(null)}>
            {apiConfigError}
          </Alert>
        )}

        {!isLoadingConfig && entities.length === 0 && !apiConfigError && (
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
                <EndpointSelector
                  endpoints={endpoints}
                  selectedEndpoint={selectedEndpoint}
                  onEndpointSelect={handleEndpointChange}
                  getMethodColor={getMethodColor}
                />
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

export default React.memo(ApiTester);
