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
    manualRefreshConfig,
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError: setApiConfigError
  } = useApiConfiguration(serverStatus);

  // Debug logging
  useEffect(() => {
    console.log('ApiTester render state:', {
      isLoadingConfig,
      serverStatus,
      entitiesCount: entities.length,
      apiConfigError,
      selectedEntityName
    });
  }, [isLoadingConfig, serverStatus, entities.length, apiConfigError, selectedEntityName]);

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
  
  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  }, []);
  
  const handleMonitoringTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
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
      // Only fetch server metrics if the monitoring metrics tab is currently active
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


  const currentFullUrl = useMemo(() => {
    if (!selectedEndpoint) return apiUrl;
    return `${apiUrl}${selectedEndpoint.path}`;
  }, [apiUrl, selectedEndpoint]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(1px)',
        pointerEvents: 'none',
        zIndex: 0,
      }
    }}>
      <Box sx={{ 
        py: { xs: 2, sm: 4 }, 
        px: { xs: 1, sm: 3 },
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Hero Section */}
        <Box 
          className="floating-card"
          sx={{ 
            mb: 4, 
            p: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              animation: 'shimmer 3s infinite',
            }
          }}
        >
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            API Tester
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ 
              fontWeight: 400,
              opacity: 0.9,
              maxWidth: 600,
              margin: '0 auto',
            }}
          >
            Test your dynamically generated API endpoints with our modern, intuitive interface. 
            Ensure your backend server is configured and running for optimal performance.
          </Typography>
        </Box>

        <Divider 
          sx={{ 
            mb: 4,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            height: 2,
            border: 'none',
          }} 
        />

        {/* Server Controls - Enhanced */}
        <Box 
          className="glass-effect"
          sx={{ 
            mb: 4, 
            p: 3,
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
            }
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
        </Box>

        {/* Database Test Section - For Debugging */}
        {serverStatus === 'error' && (
          <Box 
            className="glass-effect"
            sx={{ 
              mb: 4, 
              p: 3,
              borderRadius: 3,
            }}
          >
            <Typography 
              variant="h6" 
              component="h2"
              sx={{ 
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
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
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: 1.5,
                }} 
              />
              Database Connection Test
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
              Test the database connection to troubleshoot server startup issues.
            </Typography>
            <Button
              variant="outlined"
              onClick={testDatabaseConnection}
              sx={{
                borderColor: 'rgba(99, 102, 241, 0.6)',
                color: 'rgba(99, 102, 241, 0.9)',
                '&:hover': {
                  borderColor: 'rgba(99, 102, 241, 0.8)',
                  background: 'rgba(99, 102, 241, 0.1)',
                }
              }}
            >
              Test Database Connection
            </Button>
          </Box>
        )}

        {/* Server Monitoring Accordion - Enhanced */}
        <Accordion 
          defaultExpanded={false} 
          sx={{ 
            mb: 4,
            background: 'rgba(255, 255, 255, 0.08) !important',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px !important',
            overflow: 'hidden',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
            '&:before': { display: 'none' },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.3)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />}
            aria-controls="server-monitoring-content"
            id="server-monitoring-header"
            sx={{ 
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px 16px 0 0',
              minHeight: 64,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
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
                  color: 'rgba(255,255,255,0.9)',
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
          <AccordionDetails sx={{ p: 3, background: 'rgba(255, 255, 255, 0.02)' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
              <Tabs
                value={monitoringTabValue}
                onChange={handleMonitoringTabChange}
                aria-label="Server monitoring tabs"
                indicatorColor="primary"
                textColor="primary"
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 500,
                    borderRadius: 2,
                    mx: 0.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: 'rgba(255,255,255,0.9)',
                      background: 'rgba(255,255,255,0.08)',
                    },
                    '&.Mui-selected': {
                      color: 'rgba(99, 102, 241, 0.9)',
                      background: 'rgba(99, 102, 241, 0.1)',
                    }
                  },
                  '& .MuiTabs-indicator': {
                    background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8))',
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

        {/* Loading State & Server Status - Enhanced */}
        {(isLoadingConfig || serverStatus === 'starting' || serverStatus === 'restarting') && (
          <Box 
            className="glass-effect"
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              my: 6,
              p: 4,
              flexDirection: 'column',
              gap: 2,
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
                color: 'rgba(30, 30, 50, 0.8)',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {isLoadingConfig ? 'Loading API configuration...' : 
               serverStatus === 'starting' ? 'Starting API server...' :
               'Restarting API server...'}
            </Typography>
            {isLoadingConfig && (
              <Button 
                variant="outlined" 
                onClick={manualRefreshConfig}
                size="small"
                sx={{ mt: 2 }}
              >
                Force Refresh Configuration
              </Button>
            )}
          </Box>
        )}

        {/* Server Not Running State */}
        {!isLoadingConfig && serverStatus === 'stopped' && (
          <Box 
            className="floating-card"
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              my: 6,
              p: 4,
              flexDirection: 'column',
              gap: 3,
              textAlign: 'center',
            }}
          >
            <WarningIcon sx={{ fontSize: 48, color: '#f59e0b', opacity: 0.8 }} />
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'rgba(30, 30, 50, 0.9)',
                fontWeight: 600,
              }}
            >
              API Server Not Running
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(30, 30, 50, 0.7)',
                maxWidth: 500,
                lineHeight: 1.6,
              }}
            >
              The API server needs to be running to test endpoints. Please start the server using the controls above.
            </Typography>
          </Box>
        )}

        {/* Server Error State */}
        {!isLoadingConfig && serverStatus === 'error' && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              background: 'rgba(244, 67, 54, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(244, 67, 54, 0.2)',
              borderRadius: 2,
              color: 'rgba(30, 30, 50, 0.9)',
              '& .MuiAlert-icon': {
                color: '#ef4444',
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Server Error: {serverMessage || 'Failed to start API server'}
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
              Please check your database configuration and ensure the database server is running.
            </Typography>
          </Alert>
        )}

        {/* Error Alert - Enhanced */}
        {apiConfigError && !isLoadingConfig && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              background: 'rgba(255, 107, 107, 0.15) !important',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 2,
              color: 'rgba(255,255,255,0.9)',
              '& .MuiAlert-icon': {
                color: '#ff6b6b',
              }
            }} 
            onClose={() => setApiConfigError(null)}
          >
            {apiConfigError}
          </Alert>
        )}

        {/* No Entities Alert - Enhanced */}
        {!isLoadingConfig && entities.length === 0 && !apiConfigError && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 4,
              background: 'rgba(59, 130, 246, 0.15) !important',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 2,
              color: 'rgba(255,255,255,0.9)',
              '& .MuiAlert-icon': {
                color: '#3b82f6',
              }
            }}
          >
            No API entities found or configuration is empty. Please generate/check your API configuration.
          </Alert>
        )}

        {/* Main Content Container - Enhanced */}
        {!isLoadingConfig && entities.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
            {/* Entity Selector - Enhanced */}
            <Box 
              className="floating-card"
              sx={{ 
                mb: 4, 
                p: 3,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <FormControl 
                fullWidth 
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.12)',
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.3)',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: 'rgba(99, 102, 241, 0.9)',
                    }
                  },
                }}
              >
                <InputLabel id="entity-select-label">Select Entity</InputLabel>
                <Select
                  labelId="entity-select-label"
                  id="entity-select"
                  value={selectedEntityName}
                  label="Select Entity"
                  onChange={handleEntityChange}
                  disabled={isLoadingConfig || serverStatus !== 'running'}
                  aria-describedby={serverStatus !== 'running' ? "server-status-message" : undefined}
                  sx={{
                    color: 'rgba(255,255,255,0.9)',
                    '& .MuiSelect-icon': {
                      color: 'rgba(255,255,255,0.7)',
                    }
                  }}
                >
                  {entities.map((entity) => (
                    <MenuItem 
                      key={entity.name} 
                      value={entity.name}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.1)',
                        },
                        '&.Mui-selected': {
                          background: 'rgba(99, 102, 241, 0.2)',
                          '&:hover': {
                            background: 'rgba(99, 102, 241, 0.3)',
                          }
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
                      color: '#ff6b6b',
                      fontWeight: 500,
                    }}
                  >
                    Server is not running. Please start the server to select an entity.
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* Endpoints Section - Enhanced */}
            {selectedEntityName && endpoints.length > 0 && (
              <>
                <Box 
                  className="floating-card"
                  sx={{ 
                    mb: 4, 
                    p: 3,
                    borderRadius: 3,
                  }}
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    component="h3"
                    sx={{ 
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.9)',
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
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
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
                </Box>

                {/* API Testing Interface - Enhanced */}
                {selectedEndpoint && (
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      mb: 4,
                      background: 'rgba(255, 255, 255, 0.08) !important',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px 0 rgba(31, 38, 135, 0.3)',
                      }
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography 
                        variant="h6" 
                        component="h4" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.9)',
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
                            background: `linear-gradient(135deg, ${getMethodColor(selectedEndpoint.method)}, ${getMethodColor(selectedEndpoint.method)}80)`,
                            boxShadow: `0 0 8px ${getMethodColor(selectedEndpoint.method)}40`,
                          }} 
                        />
                        Testing: {selectedEndpoint.description}
                      </Typography>
                      
                      {/* Tabs Section - Enhanced */}
                      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
                        <Tabs
                          value={tabValue}
                          onChange={handleTabChange}
                          aria-label="Request and Response Tabs"
                          indicatorColor="primary"
                          textColor="primary"
                          sx={{
                            '& .MuiTab-root': {
                              color: 'rgba(255,255,255,0.7)',
                              fontWeight: 600,
                              fontSize: '1rem',
                              textTransform: 'none',
                              borderRadius: 2,
                              mx: 1,
                              minHeight: 48,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                color: 'rgba(255,255,255,0.9)',
                                background: 'rgba(255,255,255,0.08)',
                              },
                              '&.Mui-selected': {
                                color: 'rgba(99, 102, 241, 0.9)',
                                background: 'rgba(99, 102, 241, 0.1)',
                              }
                            },
                            '& .MuiTabs-indicator': {
                              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8))',
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

                      {/* Request Tab - Enhanced */}
                      <TabPanel value={tabValue} index={0}>
                        {/* URL Display - Enhanced */}
                        <Box 
                          className="glass-effect"
                          sx={{ 
                            mb: 4, 
                            p: 3,
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
                                boxShadow: `0 4px 12px ${getMethodColor(selectedEndpoint.method)}30`,
                                border: `1px solid ${getMethodColor(selectedEndpoint.method)}40`,
                                mb: { xs: 1, sm: 0 },
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-1px)',
                                  boxShadow: `0 6px 16px ${getMethodColor(selectedEndpoint.method)}40`,
                                }
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
                                color: 'rgba(255,255,255,0.9)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                padding: '8px 12px',
                                borderRadius: 1,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              {currentFullUrl}
                            </Typography>
                          </Stack>
                        </Box>

                        {/* Request Body Section - Enhanced */}
                        {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
                          <Box 
                            className="glass-effect"
                            sx={{ 
                              mb: 4, 
                              p: 3,
                              borderRadius: 2,
                            }}
                          >
                            <Typography 
                              variant="h6" 
                              gutterBottom 
                              component="h5"
                              sx={{ 
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.9)',
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
                                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
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
                              onChange={(e) => setRequestBody(e.target.value)}
                              InputProps={{
                                sx: { 
                                  fontFamily: 'monospace', 
                                  fontSize: '0.9rem',
                                  background: 'rgba(0, 0, 0, 0.2)',
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                  },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: 'rgba(99, 102, 241, 0.6)',
                                    borderWidth: 2,
                                  }
                                }
                              }}
                              sx={{
                                '& .MuiInputBase-input': {
                                  color: 'rgba(255,255,255,0.9)',
                                }
                              }}
                              placeholder="Enter JSON request body here..."
                              aria-label="Request body input"
                            />
                          </Box>
                        )}

                        {/* Send Button Section - Enhanced */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                          <Button
                            variant="contained"
                            onClick={makeApiRequest}
                            disabled={isSendingRequest || serverStatus !== 'running'}
                            startIcon={isSendingRequest ? <CircularProgress size={20} color="inherit" /> : null}
                            sx={{
                              minWidth: 180,
                              height: 48,
                              fontSize: '1rem',
                              fontWeight: 600,
                              background: `linear-gradient(135deg, ${getMethodColor(selectedEndpoint.method)}, ${getMethodColor(selectedEndpoint.method)}80)`,
                              color: theme.palette.getContrastText(getMethodColor(selectedEndpoint.method)),
                              border: `1px solid ${getMethodColor(selectedEndpoint.method)}40`,
                              borderRadius: 3,
                              boxShadow: `0 4px 15px ${getMethodColor(selectedEndpoint.method)}30`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                background: `linear-gradient(135deg, ${getMethodColor(selectedEndpoint.method)}dd, ${getMethodColor(selectedEndpoint.method)}99)`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 25px ${getMethodColor(selectedEndpoint.method)}40`,
                              },
                              '&:active': {
                                transform: 'translateY(0px)',
                              },
                              '&:disabled': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.4)',
                                boxShadow: 'none',
                              }
                            }}
                            aria-label={`Send ${selectedEndpoint.method} request`}
                          >
                            {isSendingRequest ? 'Sending...' : 'Send Request'}
                          </Button>
                        </Box>

                        {/* Server Status Warning - Enhanced */}
                        {serverStatus !== 'running' && (
                          <Alert 
                            severity="warning" 
                            sx={{ 
                              mt: 3,
                              background: 'rgba(245, 158, 11, 0.15) !important',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: 2,
                              color: 'rgba(255,255,255,0.9)',
                              '& .MuiAlert-icon': {
                                color: '#f59e0b',
                              }
                            }}
                          >
                            The API server is not running. Please start the server to send requests.
                          </Alert>
                        )}
                      </TabPanel>
                      {/* Response Tab - Enhanced */}
                      <TabPanel value={tabValue} index={1}>
                        <Box 
                          className="glass-effect"
                          sx={{ 
                            p: 3,
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
                              color: 'rgba(255,255,255,0.9)',
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
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
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
                                  color: 'rgba(99, 102, 241, 0.8)',
                                  '& .MuiCircularProgress-circle': {
                                    strokeLinecap: 'round',
                                  }
                                }}
                              />
                              <Typography 
                                sx={{ 
                                  color: 'rgba(255,255,255,0.8)',
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
                                  color: 'rgba(255,255,255,0.6)',
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
                                background: 'rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 2,
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all',
                                color: 'rgba(255,255,255,0.9)',
                                position: 'relative',
                                '&::-webkit-scrollbar': {
                                  width: 8,
                                },
                                '&::-webkit-scrollbar-track': {
                                  background: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: 4,
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  background: 'rgba(255, 255, 255, 0.3)',
                                  borderRadius: 4,
                                  '&:hover': {
                                    background: 'rgba(255, 255, 255, 0.4)',
                                  }
                                },
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: 1,
                                  background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.4), transparent)',
                                }
                              }}
                              aria-live="polite"
                            >
                              {response}
                            </Paper>
                          )}
                        </Box>
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
                  color: 'rgba(255,255,255,0.9)',
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
