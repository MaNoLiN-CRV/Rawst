import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  FormGroup, 
  FormControlLabel, 
  Divider, 
  Paper,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TextField,
  Button,
  IconButton,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

type DataType = 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date' | 'DateTime' | 'Binary' | 'JSON';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface CustomRoute {
  path: string;
  method: HttpMethod;
  handler: string;
}

export interface EndpointConfig {
  generate_create: boolean;
  generate_read: boolean;
  generate_update: boolean;
  generate_delete: boolean;
  generate_list: boolean;
  custom_routes: CustomRoute[];
}

type EndpointKey = 'generate_create' | 'generate_read' | 'generate_update' | 'generate_delete' | 'generate_list';

interface Field {
  name: string;
  column_name: string;
  data_type: DataType;
  required: boolean;
  unique: boolean;
  searchable: boolean;
  default_value?: string;
  description?: string;
}

interface Role {
  name: string;
  description?: string;
}

interface Permission {
  action: string;
  subject: string;
}

interface Authorization {
  active: boolean;
  roles: Role[];
  permissions: Permission[];
}

interface Validation {
  field: string;
  validation_type: {
    type: 'Length' | 'Regex' | 'Email' | 'Numeric' | 'Range';
    min?: number;
    max?: number;
    pattern?: string;
  };
  error_message?: string;
}

interface PaginationConfig {
  default_page_size: number;
  max_page_size: number;
  page_param_name: string;
  size_param_name: string;
}

export interface EntityFieldConfig {
  name: string;
  table_name: string;
  fields: Field[];
  endpoints: EndpointConfig;
  authentication: boolean;
  authorization: Authorization;
  validations: Validation[];
  pagination?: PaginationConfig;
}

interface Props {
  entities: { [table: string]: string[] }; // table: fields[]
  config: { [table: string]: EntityFieldConfig };
  onChange: (config: { [table: string]: EntityFieldConfig }) => void;
}

const endpointTypes = [
  { id: 'list', label: 'List All', defaultPath: '/', method: 'GET' as HttpMethod },
  { id: 'get', label: 'Get One', defaultPath: '/:id', method: 'GET' as HttpMethod },
  { id: 'create', label: 'Create', defaultPath: '/', method: 'POST' as HttpMethod },
  { id: 'update', label: 'Update', defaultPath: '/:id', method: 'PUT' as HttpMethod },
  { id: 'delete', label: 'Delete', defaultPath: '/:id', method: 'DELETE' as HttpMethod },
] as const;

const dataTypes: DataType[] = [
  'String',
  'Integer',
  'Float',
  'Boolean',
  'Date',
  'DateTime',
  'Binary',
  'JSON'
];

const defaultEntityConfig = (table: string): EntityFieldConfig => ({
  name: table,
  table_name: table,
  fields: [],
  endpoints: {
    generate_create: false,
    generate_read: false,
    generate_update: false,
    generate_delete: false,
    generate_list: false,
    custom_routes: []
  },
  authentication: false,
  authorization: {
    active: false,
    roles: [],
    permissions: [] 
  },
  validations: [],
  pagination: {
    default_page_size: 10,
    max_page_size: 100,
    page_param_name: "page",
    size_param_name: "size"
  }
});

const EntityConfig: React.FC<Props> = ({ entities, config, onChange }) => {
  const [newCustomRoute, setNewCustomRoute] = useState<{ [table: string]: Partial<CustomRoute> }>({});

  useEffect(() => {
    console.log("EntityConfig mounted or entities/config changed:", { entities, config });
    
    // Check if we have entities but no config
    if (Object.keys(entities).length > 0 && Object.keys(config).length === 0) {
      console.log("We have entities but no config, initializing...");
      initializeEntitiesConfig();
    }
  }, [entities, config]);

  // Initialize all entities config
  const initializeEntitiesConfig = () => {
    // Create initial configuration with all fields selected by default
    const initialConfig: { [table: string]: EntityFieldConfig } = {};
    
    Object.entries(entities).forEach(([table, fields]) => {
      initialConfig[table] = {
        name: table,
        table_name: table,
        fields: fields.map(field => ({
          name: field,
          column_name: field,
          data_type: 'String',
          required: true,
          unique: false,
          searchable: true
        })),
        endpoints: {
          generate_create: true,
          generate_read: true,
          generate_update: true,
          generate_delete: true,
          generate_list: true,
          custom_routes: []
        },
        authentication: false,
        authorization: {
          active: false,
          roles: [],
          permissions: []
        },
        validations: []
      };
    });
    
    console.log("Initialized config:", initialConfig);
    onChange(initialConfig);
  };

  // Ensure all tables in entities have config
  useEffect(() => {
    const newConfig = { ...config };
    let hasChanges = false;

    Object.entries(entities).forEach(([table, fields]) => {
      if (!config[table]) {
        console.log(`Initializing config for table ${table}`);
        newConfig[table] = {
          name: table,
          table_name: table,
          fields: fields.map(field => ({
            name: field,
            column_name: field,
            data_type: 'String',
            required: true,
            unique: false,
            searchable: true
          })),
          endpoints: {
            generate_create: true,
            generate_read: true,
            generate_update: true,
            generate_delete: true,
            generate_list: true,
            custom_routes: []
          },
          authentication: false,
          authorization: {
            active: false,
            roles: [],
            permissions: []
          },
          validations: []
        };
        hasChanges = true;
      }
    });

    if (hasChanges) {
      console.log("Updating config with new entities:", newConfig);
      onChange(newConfig);
    }
  }, [entities, config, onChange]);

  const handleFieldToggle = (table: string, field: string) => {
    const currentConfig = config[table] || defaultEntityConfig(table);

    const fieldExists = currentConfig.fields.some(f => f.name === field);
    const newFields = fieldExists
      ? currentConfig.fields.filter(f => f.name !== field)
      : [...currentConfig.fields, {
          name: field,
          column_name: field,
          data_type: 'String' as DataType,
          required: false,
          unique: false,
          searchable: false
        }];

    onChange({
      ...config,
      [table]: {
        ...currentConfig,
        fields: newFields
      }
    });
  };

  const handleEndpointToggle = (table: string, endpointId: string) => {
    const currentConfig = config[table] || defaultEntityConfig(table);
    const endpointType = endpointTypes.find(e => e.id === endpointId);
    if (!endpointType) return;

    const endpointKey = `generate_${endpointId}` as EndpointKey;
    const newEndpoints: EndpointConfig = {
      ...currentConfig.endpoints,
      [endpointKey]: !currentConfig.endpoints[endpointKey]
    };

    onChange({
      ...config,
      [table]: {
        ...currentConfig,
        endpoints: newEndpoints
      }
    });
  };

  const handleFieldConfigChange = (
    table: string,
    fieldName: string,
    field: string,
    value: any
  ) => {
    const currentConfig = config[table];
    if (!currentConfig) return;

    const fieldIndex = currentConfig.fields.findIndex(f => f.name === fieldName);
    if (fieldIndex === -1) return;

    const newFields = [...currentConfig.fields];
    newFields[fieldIndex] = {
      ...newFields[fieldIndex],
      [field]: value
    };

    onChange({
      ...config,
      [table]: {
        ...currentConfig,
        fields: newFields
      }
    });
  };

  const handleCustomRouteChange = (table: string, field: keyof CustomRoute, value: string) => {
    setNewCustomRoute(prev => ({
      ...prev,
      [table]: {
        ...prev[table],
        [field]: value
      }
    }));
  };

  const handleAddCustomRoute = (table: string) => {
    const currentConfig = config[table];
    if (!currentConfig || !newCustomRoute[table]?.path || !newCustomRoute[table]?.method || !newCustomRoute[table]?.handler) return;

    const newRoutes = [...currentConfig.endpoints.custom_routes, newCustomRoute[table] as CustomRoute];
    onChange({
      ...config,
      [table]: {
        ...currentConfig,
        endpoints: {
          ...currentConfig.endpoints,
          custom_routes: newRoutes
        }
      }
    });
    setNewCustomRoute(prev => {
      const newState = { ...prev };
      delete newState[table];
      return newState;
    });
  };

  const handleRemoveCustomRoute = (table: string, index: number) => {
    const currentConfig = config[table];
    if (!currentConfig) return;

    const newRoutes = currentConfig.endpoints.custom_routes.filter((_, i) => i !== index);
    onChange({
      ...config,
      [table]: {
        ...currentConfig,
        endpoints: {
          ...currentConfig.endpoints,
          custom_routes: newRoutes
        }
      }
    });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>Configura cada entidad</Typography>
      
      {/* Display debug info */}
      <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="caption" component="div">
          Entities: {Object.keys(entities).length} tables, 
          Config: {Object.keys(config).length} tables
        </Typography>
      </Box>
      
      {Object.entries(entities).map(([table, fields]) => (
        <Paper key={table} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>{table}</Typography>
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>Campos a exponer: {fields.length} campos</Typography>
          <FormGroup row>
            {fields.map(field => (
              <FormControlLabel
                key={field}
                control={
                  <Checkbox
                    checked={config[table]?.fields?.some(f => f.name === field) || false}
                    onChange={() => handleFieldToggle(table, field)}
                  />
                }
                label={field}
              />
            ))}
          </FormGroup>

          {config[table]?.fields?.map(field => (
            <Box key={field.name} sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>{field.name}</Typography>
              <Grid container spacing={2}>
                <Grid component="div">
                  <FormControl fullWidth size="small">
                    <InputLabel>Tipo de dato</InputLabel>
                    <Select
                      value={field.data_type}
                      onChange={(e) => handleFieldConfigChange(table, field.name, 'data_type', e.target.value)}
                      label="Tipo de dato"
                    >
                      {dataTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid component="div">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.required}
                        onChange={(e) => handleFieldConfigChange(table, field.name, 'required', e.target.checked)}
                      />
                    }
                    label="Requerido"
                  />
                </Grid>
                <Grid component="div">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.unique}
                        onChange={(e) => handleFieldConfigChange(table, field.name, 'unique', e.target.checked)}
                      />
                    }
                    label="Único"
                  />
                </Grid>
                <Grid component="div">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={field.searchable}
                        onChange={(e) => handleFieldConfigChange(table, field.name, 'searchable', e.target.checked)}
                      />
                    }
                    label="Buscable"
                  />
                </Grid>
              </Grid>
            </Box>
          ))}

          <Typography variant="subtitle1" sx={{ mt: 4 }} gutterBottom>Endpoints:</Typography>
          <FormGroup>
            {endpointTypes.map(endpoint => (
              <FormControlLabel
                key={endpoint.id}
                control={
                  <Switch
                    checked={config[table]?.endpoints?.[`generate_${endpoint.id}` as EndpointKey] || false}
                    onChange={() => handleEndpointToggle(table, endpoint.id)}
                  />
                }
                label={`${endpoint.label} (${endpoint.method})`}
              />
            ))}
          </FormGroup>

          <Typography variant="subtitle1" sx={{ mt: 4 }} gutterBottom>Rutas personalizadas:</Typography>
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid component="div">
                <TextField
                  fullWidth
                  size="small"
                  label="Path"
                  value={newCustomRoute[table]?.path || ''}
                  onChange={(e) => handleCustomRouteChange(table, 'path', e.target.value)}
                />
              </Grid>
              <Grid component="div">
                <FormControl fullWidth size="small">
                  <InputLabel>Método</InputLabel>
                  <Select
                    value={newCustomRoute[table]?.method || ''}
                    onChange={(e) => handleCustomRouteChange(table, 'method', e.target.value)}
                    label="Método"
                  >
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                      <MenuItem key={method} value={method}>{method}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid component="div">
                <TextField
                  fullWidth
                  size="small"
                  label="Handler"
                  value={newCustomRoute[table]?.handler || ''}
                  onChange={(e) => handleCustomRouteChange(table, 'handler', e.target.value)}
                />
              </Grid>
              <Grid component="div">
                <Button
                  variant="contained"
                  onClick={() => handleAddCustomRoute(table)}
                  disabled={!newCustomRoute[table]?.path || !newCustomRoute[table]?.method || !newCustomRoute[table]?.handler}
                >
                  <AddIcon />
                </Button>
              </Grid>
            </Grid>
          </Box>

          {config[table]?.endpoints?.custom_routes?.map((route, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ flex: 1 }}>
                {route.method} {route.path} → {route.handler}
              </Typography>
              <IconButton onClick={() => handleRemoveCustomRoute(table, index)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}

          <Typography variant="subtitle1" sx={{ mt: 4 }} gutterBottom>Autenticación y Autorización:</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={config[table]?.authentication || false}
                onChange={(e) => onChange({
                  ...config,
                  [table]: {
                    ...config[table],
                    authentication: e.target.checked
                  }
                })}
              />
            }
            label="Requerir autenticación"
          />
        </Paper>
      ))}
    </Box>
  );
};

export default EntityConfig; 