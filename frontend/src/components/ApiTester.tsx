import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
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
  CircularProgress
} from '@mui/material';
import { invoke } from '@tauri-apps/api/core';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface EndpointConfig {
  path: string;
  method: string;
  description: string;
}

/**
 * API Tester component for testing the generated API endpoints
 */
const ApiTester = () => {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);
  const [requestBody, setRequestBody] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState(0);
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8080/api');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load API configuration when component mounts
    fetchApiConfiguration();
  }, []);

  const fetchApiConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get the configuration from the backend
      const config = await invoke<any>('get_current_configuration');
      
      if (config && config.entities_basic) {
        setEntities(config.entities_basic);
        
        if (config.server) {
          setApiUrl(`http://${config.server.host}:${config.server.port}${config.api_prefix || '/api'}`);
        }
      }
    } catch (error: any) {
      console.error('Error fetching API configuration:', error);
      setError(error?.toString() || 'Error loading API configuration');
      setResponse(JSON.stringify({ error: 'Error loading API configuration' }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handleEntityChange = (event: SelectChangeEvent) => {
    const entityName = event.target.value;
    setSelectedEntity(entityName);
    
    // Find the selected entity
    const entity = entities.find(e => e.name === entityName);
    
    if (entity) {
      // Generate endpoints based on entity configuration
      const newEndpoints: EndpointConfig[] = [];
      
      if (entity.endpoints.generate_list) {
        newEndpoints.push({
          path: `/${entityName}`,
          method: 'GET',
          description: `Get all ${entityName}`
        });
      }
      
      if (entity.endpoints.generate_read) {
        newEndpoints.push({
          path: `/${entityName}/{id}`,
          method: 'GET',
          description: `Get ${entityName} by ID`
        });
      }
      
      if (entity.endpoints.generate_create) {
        newEndpoints.push({
          path: `/${entityName}`,
          method: 'POST',
          description: `Create new ${entityName}`
        });
      }
      
      if (entity.endpoints.generate_update) {
        newEndpoints.push({
          path: `/${entityName}/{id}`,
          method: 'PUT',
          description: `Update ${entityName}`
        });
      }
      
      if (entity.endpoints.generate_delete) {
        newEndpoints.push({
          path: `/${entityName}/{id}`,
          method: 'DELETE',
          description: `Delete ${entityName}`
        });
      }
      
      // Add custom routes if any
      if (entity.endpoints.custom_routes && entity.endpoints.custom_routes.length > 0) {
        entity.endpoints.custom_routes.forEach((route: any) => {
          newEndpoints.push({
            path: route.path,
            method: route.method,
            description: route.handler || 'Custom endpoint'
          });
        });
      }
      
      setEndpoints(newEndpoints);
      setSelectedEndpoint(newEndpoints.length > 0 ? newEndpoints[0] : null);
      
      // Generate sample request body for POST/PUT
      if (newEndpoints.find(e => e.method === 'POST' || e.method === 'PUT')) {
        const sampleBody: any = {};
        entity.fields.forEach((field: any) => {
          let defaultValue: any = null;
          
          switch (field.data_type) {
            case 'String':
              defaultValue = `"Sample ${field.name}"`;
              break;
            case 'Integer':
            case 'Number':
              defaultValue = 0;
              break;
            case 'Boolean':
              defaultValue = false;
              break;
            case 'Date':
              defaultValue = new Date().toISOString();
              break;
            default:
              defaultValue = null;
          }
          
          sampleBody[field.name] = defaultValue;
        });
        
        setRequestBody(JSON.stringify(sampleBody, null, 2));
      } else {
        setRequestBody('');
      }
    }
  };

  const handleEndpointChange = (endpoint: EndpointConfig) => {
    setSelectedEndpoint(endpoint);
    
    // Update request body template based on method
    if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
      if (!requestBody) {
        const entity = entities.find(e => e.name === selectedEntity);
        if (entity) {
          const sampleBody: any = {};
          entity.fields.forEach((field: any) => {
            let defaultValue: any = null;
            
            switch (field.data_type) {
              case 'String':
                defaultValue = `"Sample ${field.name}"`;
                break;
              case 'Integer':
              case 'Number':
                defaultValue = 0;
                break;
              case 'Boolean':
                defaultValue = false;
                break;
              case 'Date':
                defaultValue = new Date().toISOString();
                break;
              default:
                defaultValue = null;
            }
            
            sampleBody[field.name] = defaultValue;
          });
          
          setRequestBody(JSON.stringify(sampleBody, null, 2));
        }
      }
    } else {
      setRequestBody('');
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const makeApiRequest = async () => {
    if (!selectedEndpoint) return;
    
    setLoading(true);
    try {
      // Prepare URL - replace placeholders like {id} with a value
      let url = `${apiUrl}${selectedEndpoint.path}`;
      if (url.includes('{id}')) {
        const idValue = prompt('Enter ID value:', '1');
        if (idValue) {
          url = url.replace('{id}', idValue);
        } else {
          throw new Error('ID is required for this endpoint');
        }
      }

      // Call the backend to make the API request
      const result = await invoke<string>('test_api_endpoint', { 
        url,
        method: selectedEndpoint.method,
        body: selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT' ? requestBody : null
      });
      
      setResponse(result);
      setTabValue(1); // Switch to response tab
    } catch (error: any) {
      console.error('Error making API request:', error);
      setResponse(JSON.stringify({ error: error.toString() }, null, 2));
      setTabValue(1); // Switch to response tab
    } finally {
      setLoading(false);
    }
  };

  // Method color mapping
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#2196F3';
      case 'POST': return '#4CAF50';
      case 'PUT': return '#FF9800';
      case 'DELETE': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <Box sx={{ py: 4, px: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>API Tester</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Test your generated API endpoints
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {loading && !selectedEntity && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}
      
      {entities.length === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          No API configuration found. Please generate your API configuration first.
        </Alert>
      ) : (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
          <FormControl fullWidth sx={{ mb: 4 }}>
            <InputLabel id="entity-select-label">Select Entity</InputLabel>
            <Select
              labelId="entity-select-label"
              id="entity-select"
              value={selectedEntity}
              label="Select Entity"
              onChange={handleEntityChange}
              disabled={loading}
            >
              {entities.map((entity) => (
                <MenuItem key={entity.name} value={entity.name}>
                  {entity.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedEntity && (
            <>
              <Typography variant="h6" gutterBottom>
                Available Endpoints
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {endpoints.map((endpoint, index) => (
                  <Chip
                    key={index}
                    label={`${endpoint.method} ${endpoint.path}`}
                    onClick={() => handleEndpointChange(endpoint)}
                    variant={selectedEndpoint === endpoint ? "filled" : "outlined"}
                    sx={{
                      mb: 1,
                      color: selectedEndpoint === endpoint ? 'white' : getMethodColor(endpoint.method),
                      backgroundColor: selectedEndpoint === endpoint ? getMethodColor(endpoint.method) : 'transparent',
                      borderColor: getMethodColor(endpoint.method),
                      '&:hover': {
                        backgroundColor: selectedEndpoint === endpoint ? getMethodColor(endpoint.method) : `${getMethodColor(endpoint.method)}20`,
                      },
                    }}
                  />
                ))}
              </Box>
              
              {selectedEndpoint && (
                <Card variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                      {selectedEndpoint.description}
                    </Typography>
                    
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                      <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        sx={{
                          '& .MuiTab-root': {
                            color: 'text.secondary',
                            '&.Mui-selected': {
                              color: 'var(--primary-color)',
                            },
                          },
                          '& .MuiTabs-indicator': {
                            backgroundColor: 'var(--primary-color)',
                          },
                        }}
                      >
                        <Tab label="Request" id="api-tab-0" aria-controls="api-tabpanel-0" />
                        <Tab label="Response" id="api-tab-1" aria-controls="api-tabpanel-1" />
                      </Tabs>
                    </Box>
                    
                    <TabPanel value={tabValue} index={0}>
                      <Box sx={{ mb: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Chip 
                            label={selectedEndpoint.method} 
                            size="small" 
                            sx={{ 
                              backgroundColor: getMethodColor(selectedEndpoint.method),
                              color: 'white',
                              fontWeight: 'bold',
                              minWidth: 60
                            }} 
                          />
                          <Typography variant="subtitle2">URL</Typography>
                        </Stack>
                        <TextField
                          fullWidth
                          variant="outlined"
                          value={`${apiUrl}${selectedEndpoint.path}`}
                          InputProps={{
                            readOnly: true,
                            sx: { fontFamily: 'monospace' }
                          }}
                        />
                      </Box>
                      
                      {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT') && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Request Body
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={10}
                            variant="outlined"
                            value={requestBody}
                            onChange={(e) => setRequestBody(e.target.value)}
                            InputProps={{
                              sx: { fontFamily: 'monospace' }
                            }}
                          />
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Button
                          variant="contained"
                          onClick={makeApiRequest}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                          sx={{
                            backgroundColor: getMethodColor(selectedEndpoint.method),
                            '&:hover': {
                              backgroundColor: getMethodColor(selectedEndpoint.method) + 'D0',
                            },
                          }}
                        >
                          {loading ? 'Sending...' : 'Send Request'}
                        </Button>
                      </Box>
                    </TabPanel>
                    
                    <TabPanel value={tabValue} index={1}>
                      <Typography variant="subtitle2" gutterBottom>
                        Response
                      </Typography>
                      <Paper 
                        elevation={0}
                        variant="outlined"
                        sx={{ 
                          p: 2, 
                          maxHeight: '400px', 
                          overflow: 'auto',
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          borderRadius: 2
                        }}
                      >
                        <pre>{response || 'No response yet'}</pre>
                      </Paper>
                    </TabPanel>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ApiTester; 