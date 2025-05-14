/**
 * RusterAPI - Frontend Application
 * 
 * This file contains the main application logic for the RusterAPI frontend.
 * It provides an interface to:
 * 1. Connect to a database
 * 2. Select tables to generate API endpoints
 * 3. Configure those endpoints
 * 4. Save the configuration
 * 5. Test the generated API
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

// Icons
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';

// Component imports
import DatabaseConnection from './components/DatabaseConnection';
import EntitySelector from './components/EntitySelector';
import EntityConfig, { EntityFieldConfig } from './components/EntityConfig';
import JsonPreview from './components/JsonPreview';
import ApiTester from './components/ApiTester';
import NavigationDrawer from './components/NavigationDrawer';
import DebugLogs from './components/DebugLogs';
import StepperComponent from './components/Stepper';
import MainMenu from './components/MainMenu';

// Custom hooks
import { useDatabaseOperations, DbConfig } from './hooks/useDatabaseOperations';

// Styles
import './styles/global.css';

// Types we need to define since they're not exported by EntityConfig
type DataType = 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date' | 'DateTime' | 'Binary' | 'JSON';

// Drawer width
const drawerWidth = 240;

/**
 * Main application content component
 * Handles the step-by-step process of configuring the API
 */
function AppContent() {
  // State management
  const [step, setStep] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [alert, setAlert] = useState<{message: string, severity: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  /**
   * Add a log entry to the debug console
   */
  const addLog = useCallback((message: string) => {
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  }, []);

  // Initialize database operations hook
  const {
    loading,
    error,
    dbConfig,
    tables,
    selectedTables,
    tableFields,
    entityConfig,
    handleConnect,
    handleSelectTables,
    handleConfigChange,
    saveConfiguration,
    setEntityConfig,
    setDbConfig
  } = useDatabaseOperations(addLog);

  /**
   * Log entity configuration changes
   */
  useEffect(() => {
    if (Object.keys(entityConfig).length > 0) {
      addLog(`EntityConfig updated: ${Object.keys(entityConfig).length} entities`);
      addLog(`EntityConfig keys: ${Object.keys(entityConfig)}`);
    }
  }, [entityConfig, addLog]);

  /**
   * Navigation handlers
   */
  const handleBack = () => setStep(prev => prev - 1);
  const handleNext = () => setStep(prev => prev + 1);
  const goToApiTester = () => navigate('/api-tester');
  const goToMainMenu = () => navigate('/main-menu');
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  /**
   * Handle actions at each step
   */
  const onConnectSuccess = async (success: boolean) => {
    if (success) {
      setStep(1);
      setAlert({
        message: 'Database connected successfully!',
        severity: 'success'
      });
    }
  };

  const onSelectTablesSuccess = async (success: boolean) => {
    if (success) {
      setStep(2);
      setAlert({
        message: `Selected ${selectedTables.length} tables successfully!`,
        severity: 'success'
      });
    }
  };

  /**
   * Handle JSON import from file or manual input
   */
  const handleJsonImport = async (importedJson: any) => {
    try {
      console.log("handleJsonImport called with data:", 
                 importedJson ? "data present" : "no data", 
                 typeof importedJson);
      
      // Log the structure of the imported JSON for debugging
      if (importedJson) {
        console.log("JSON structure:", 
          "database:", Boolean(importedJson.database),
          "entities_basic:", Array.isArray(importedJson.entities_basic) ? importedJson.entities_basic.length : 0,
          "entities_advanced:", Array.isArray(importedJson.entities_advanced) ? importedJson.entities_advanced.length : 0
        );
        
        // Check if JSON has any content
        const hasBasic = importedJson.entities_basic && Array.isArray(importedJson.entities_basic) && importedJson.entities_basic.length > 0;
        const hasAdvanced = importedJson.entities_advanced && Array.isArray(importedJson.entities_advanced) && importedJson.entities_advanced.length > 0;
        
        if (!hasBasic && !hasAdvanced) {
          console.error("JSON has no valid entities");
          setAlert({
            message: 'The imported JSON does not contain any valid entities',
            severity: 'error'
          });
          return;
        }
      } else {
        console.error("Imported JSON is null or undefined");
        setAlert({
          message: 'No valid JSON data was provided',
          severity: 'error'
        });
        return;
      }
      
      // Check if the JSON contains database configuration
      if (importedJson.database) {
        console.log("Setting database config from import");
        setDbConfig({
          host: importedJson.database.host || 'localhost',
          port: importedJson.database.port || 3306,
          username: importedJson.database.username || '',
          password: importedJson.database.password || '',
          database_name: importedJson.database.database_name || '',
          db_type: importedJson.database.db_type || 'MySQL',
          connection_string: importedJson.database.connection_string || '',
          ssl_enabled: importedJson.database.ssl_enabled || false,
          max_connections: importedJson.database.max_connections || 10,
          timeout_seconds: importedJson.database.timeout_seconds || 30
        });
      }

      // Update entity configuration based on imported JSON
      const newEntityConfig: Record<string, EntityFieldConfig> = {};
      
      // Process entities_basic if present
      if (importedJson.entities_basic && Array.isArray(importedJson.entities_basic)) {
        console.log(`Processing ${importedJson.entities_basic.length} basic entities`);
        importedJson.entities_basic.forEach((entity: any) => {
          if (!entity.name) {
            console.error("Entity missing name:", entity);
            return;
          }
          
          console.log(`Processing entity: ${entity.name} with ${entity.fields?.length || 0} fields`);
          
          newEntityConfig[entity.name] = {
            name: entity.name,
            table_name: entity.table_name || entity.name,
            fields: Array.isArray(entity.fields) ? entity.fields.map((field: any) => ({
              name: field.name,
              column_name: field.column_name || field.name,
              data_type: field.data_type as DataType,
              required: field.required,
              unique: field.unique,
              searchable: field.searchable,
              default_value: field.default_value,
              description: field.description
            })) : [],
            endpoints: {
              generate_create: entity.endpoints?.generate_create !== false,
              generate_read: entity.endpoints?.generate_read !== false,
              generate_update: entity.endpoints?.generate_update !== false,
              generate_delete: entity.endpoints?.generate_delete !== false,
              generate_list: entity.endpoints?.generate_list !== false,
              custom_routes: entity.endpoints?.custom_routes || []
            },
            authentication: entity.authentication || false,
            authorization: {
              active: entity.authorization?.active || false,
              roles: entity.authorization?.roles || [],
              permissions: entity.authorization?.permissions || []
            },
            validations: entity.validations || [],
            pagination: entity.pagination || {
              default_page_size: 10,
              max_page_size: 100,
              page_param_name: "page",
              size_param_name: "size"
            }
          };
        });
      }
      
      // Process entities_advanced if present
      if (importedJson.entities_advanced && Array.isArray(importedJson.entities_advanced)) {
        console.log(`Processing ${importedJson.entities_advanced.length} advanced entities`);
        importedJson.entities_advanced.forEach((entity: any) => {
          if (!entity.name) {
            console.error("Advanced entity missing name:", entity);
            return;
          }
          
          console.log(`Processing advanced entity: ${entity.name} with ${entity.fields?.length || 0} fields`);
          
          newEntityConfig[entity.name] = {
            name: entity.name,
            table_name: entity.table_name || entity.name,
            fields: Array.isArray(entity.fields) ? entity.fields.map((field: any) => ({
              name: field.name,
              column_name: field.column_name || field.name,
              data_type: field.data_type as DataType,
              required: field.required,
              unique: field.unique,
              searchable: field.searchable,
              default_value: field.default_value,
              description: field.description
            })) : [],
            endpoints: {
              generate_create: entity.endpoints?.generate_create !== false,
              generate_read: entity.endpoints?.generate_read !== false,
              generate_update: entity.endpoints?.generate_update !== false,
              generate_delete: entity.endpoints?.generate_delete !== false,
              generate_list: entity.endpoints?.generate_list !== false,
              custom_routes: entity.endpoints?.custom_routes || []
            },
            authentication: entity.authentication || false,
            authorization: {
              active: entity.authorization?.active || false,
              roles: entity.authorization?.roles || [],
              permissions: entity.authorization?.permissions || []
            },
            validations: entity.validations || [],
            pagination: entity.pagination || {
              default_page_size: 10,
              max_page_size: 100,
              page_param_name: "page",
              size_param_name: "size"
            }
          };
        });
      }
      
      // Check if we have any entities configured
      const entityCount = Object.keys(newEntityConfig).length;
      console.log(`Processed ${entityCount} total entities`);
      
      if (entityCount === 0) {
        setAlert({
          message: 'No entities found in imported JSON',
          severity: 'error'
        });
        return;
      }
      
      // Update entity configuration
      setEntityConfig(newEntityConfig);
      
      // Navigate to the configure page
      setStep(2);
      navigate('/');
      
      setAlert({
        message: `Imported configuration with ${Object.keys(newEntityConfig).length} entities successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error importing JSON:', error);
      setAlert({
        message: 'Failed to import JSON configuration',
        severity: 'error'
      });
    }
  };

  /**
   * Handle navigation from MainMenu
   */
  const handleMainMenuAction = (action: 'import' | 'connect') => {
    if (action === 'import') {
      // Open the import dialog - a click event from the UI will handle this
      const importButton = document.getElementById('json-import-button');
      if (importButton) {
        importButton.click();
      } else {
        setAlert({
          message: 'Import function not available',
          severity: 'error'
        });
      }
    } else if (action === 'connect') {
      navigate('/');
      setStep(0);
    }
  };

  /**
   * Generate the final JSON configuration
   * This is memoized to avoid unnecessary recalculations
   */
  const configJson = useMemo(() => {
    // Entity verification
    const entityCount = Object.keys(entityConfig).length;
    console.log(`Generating JSON with ${entityCount} entities`);
    
    if (entityCount === 0 && step === 2) {
      console.log("⚠️ No entities configured to generate JSON");
    }
    
    // Fallback to generate entities_basic if empty
    if (entityCount === 0 && Object.keys(tableFields).length > 0 && step === 2) {
      console.log("🔄 Using tableFields as fallback to generate configuration");
      // Create fallback configuration from tableFields
      const fallbackConfig: { [key: string]: Partial<EntityFieldConfig> } = {};
      
      Object.entries(tableFields).forEach(([table, fields]) => {
        console.log(`Creating fallback for table: ${table} with ${fields.length} fields`);
        fallbackConfig[table] = {
          name: table,
          table_name: table,
          fields: fields.map(field => ({
            name: field,
            column_name: field,
            data_type: 'String' as DataType,
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
      
      // For debugging only - does not modify the actual state
      console.log(`Fallback configuration generated: ${Object.keys(fallbackConfig).length} entities`);
      
      // Generate JSON with fallback configuration
      const result = {
        api_version: "1.0",
        api_prefix: "/api",
        server: {
          host: "localhost",
          port: 8080,
          request_timeout_seconds: 30,
          max_payload_size_mb: 10,
          rate_limiting: {
            requests_per_minute: 100,
            burst: 50
          },
          logging_level: "Info"
        },
        database: {
          host: dbConfig?.host || "localhost",
          port: dbConfig?.port || 3306,
          username: dbConfig?.username || "root",
          password: dbConfig?.password || "",
          database_name: dbConfig?.database_name || "",
          db_type: dbConfig?.db_type || "MySQL",
          connection_string: dbConfig?.connection_string || "",
          ssl_enabled: dbConfig?.ssl_enabled || false,
          max_connections: dbConfig?.max_connections || 10,
          timeout_seconds: dbConfig?.timeout_seconds || 30
        },
        entities_basic: Object.entries(tableFields).map(([table, fields]) => ({
          name: table,
          table_name: table,
          fields: fields.map(field => ({
            name: field,
            column_name: field,
            data_type: 'String',
            required: true,
            unique: false,
            searchable: true,
            default_value: null,
            description: null
          })),
          relationships: [],
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
          validations: [],
          pagination: {
            default_page_size: 10,
            max_page_size: 100,
            page_param_name: "page",
            size_param_name: "size"
          }
        })),
        cors: {
          allowed_origins: ["*"],
          allowed_methods: ["GET", "POST", "PUT", "DELETE"],
          allowed_headers: ["*"],
          allow_credentials: true,
          max_age_seconds: 86400
        },
        documentation: {
          generate_openapi: true,
          title: "Generated API",
          description: "API generated by RusterAPI",
          version: "1.0.0",
          contact_email: null,
          license: null
        },
        auth: null,
        entities_advanced: []
      };
      
      console.log(`Final JSON generated with ${result.entities_basic.length} entities`);
      return result;
    }
    
    // Generate the final JSON configuration with all entities from entityConfig
    return {
      api_version: "1.0",
      api_prefix: "/api",
      server: {
        host: "localhost",
        port: 8080,
        request_timeout_seconds: 30,
        max_payload_size_mb: 10,
        rate_limiting: {
          requests_per_minute: 100,
          burst: 50
        },
        logging_level: "Info"
      },
      database: {
        host: dbConfig?.host || "localhost",
        port: dbConfig?.port || 3306,
        username: dbConfig?.username || "root",
        password: dbConfig?.password || "",
        database_name: dbConfig?.database_name || "",
        db_type: dbConfig?.db_type || "MySQL",
        connection_string: dbConfig?.connection_string || "",
        ssl_enabled: dbConfig?.ssl_enabled || false,
        max_connections: dbConfig?.max_connections || 10,
        timeout_seconds: dbConfig?.timeout_seconds || 30
      },
      entities_basic: Object.values(entityConfig).map(cfg => ({
        name: cfg.name,
        table_name: cfg.table_name,
        fields: cfg.fields.map(field => ({
          name: field.name,
          column_name: field.column_name,
          data_type: field.data_type,
          required: field.required,
          unique: field.unique,
          searchable: field.searchable,
          default_value: null,
          description: null
        })),
        relationships: [],
        endpoints: {
          generate_create: cfg.endpoints.generate_create,
          generate_read: cfg.endpoints.generate_read,
          generate_update: cfg.endpoints.generate_update,
          generate_delete: cfg.endpoints.generate_delete,
          generate_list: cfg.endpoints.generate_list,
          custom_routes: cfg.endpoints.custom_routes.map(route => ({
            path: route.path,
            method: route.method,
            handler: route.handler
          }))
        },
        authentication: cfg.authentication,
        authorization: {
          active: cfg.authorization.active,
          roles: cfg.authorization.roles,
          permissions: cfg.authorization.permissions
        },
        validations: cfg.validations,
        pagination: {
          default_page_size: 10,
          max_page_size: 100,
          page_param_name: "page",
          size_param_name: "size"
        }
      })),
      cors: {
        allowed_origins: ["*"],
        allowed_methods: ["GET", "POST", "PUT", "DELETE"],
        allowed_headers: ["*"],
        allow_credentials: true,
        max_age_seconds: 86400
      },
      documentation: {
        generate_openapi: true,
        title: "Generated API",
        description: "API generated by RusterAPI",
        version: "1.0.0",
        contact_email: null,
        license: null
      },
      auth: null,
      entities_advanced: []
    };
  }, [entityConfig, dbConfig, tableFields, step]);

  /**
   * Save the configuration to the backend
   */
  const handleSaveConfig = async () => {
    const result = await saveConfiguration(configJson);
    if (result) {
      setAlert({
        message: 'Configuration saved successfully!',
        severity: 'success'
      });
    } else {
      setAlert({
        message: 'Failed to save configuration',
        severity: 'error'
      });
    }
  };
  
  // Navigation items
  const navigationItems = [
    { text: 'Connect Database', icon: <StorageIcon />, step: 0, path: '/' },
    { text: 'Select Tables', icon: <TableChartIcon />, step: 1, path: '/', disabled: !dbConfig },
    { text: 'Configure API', icon: <SettingsIcon />, step: 2, path: '/', disabled: selectedTables.length === 0 },
    { text: 'Test API', icon: <PlayArrowIcon />, path: '/api-tester', disabled: Object.keys(entityConfig).length === 0 },
  ];
  
  // Define steps for the stepper
  const steps = [
    {
      label: 'Connect to database',
      description: 'Establish connection to your MariaDB database to fetch tables.',
      content: <DatabaseConnection 
                onConnect={async (config) => {
                  const success = await handleConnect(config);
                  onConnectSuccess(success);
                }} 
                loading={loading} 
                error={error} 
              />
    },
    {
      label: 'Select tables',
      description: 'Choose which tables to expose as API endpoints.',
      content: <EntitySelector 
                tables={tables} 
                selected={selectedTables} 
                onChange={async (selected) => {
                  const success = await handleSelectTables(selected);
                  onSelectTablesSuccess(success);
                }} 
              />
    },
    {
      label: 'Configure API',
      description: 'Customize your API endpoints and options.',
      content: (
        <>
          <EntityConfig entities={tableFields} config={entityConfig} onChange={handleConfigChange} />
          <JsonPreview 
            json={configJson} 
            onJsonImport={handleJsonImport}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveConfig}
              disabled={loading}
              sx={{
                backgroundColor: 'var(--primary-color)',
                '&:hover': {
                  backgroundColor: 'var(--secondary-color)',
                },
                mr: 2
              }}
            >
              Save Configuration
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={goToApiTester}
              sx={{
                backgroundColor: 'var(--secondary-color)',
                '&:hover': {
                  backgroundColor: 'var(--primary-color)',
                },
              }}
            >
              Test API
            </Button>
          </Box>
        </>
      )
    }
  ];

  // Determine the current page
  const isHomePage = location.pathname === '/';
  const isMainMenuPage = location.pathname === '/main-menu';
  const isApiTesterPage = location.pathname === '/api-tester';
  
  // Page content
  let pageContent;
  
  if (isMainMenuPage) {
    pageContent = (
      <MainMenu
        onImportJson={() => {
          // Trigger the hidden import button click in JsonPreview
          const importButton = document.getElementById('json-import-button');
          if (importButton) {
            importButton.click();
          } else {
            setAlert({
              message: 'Import function not available',
              severity: 'error'
            });
          }
        }}
        onConnectDatabase={() => handleMainMenuAction('connect')}
      />
    );
  } else if (isHomePage) {
    pageContent = (
      <Box sx={{ p: 3, width: '100%' }}>
        <StepperComponent
          steps={steps}
          activeStep={step}
          loading={loading}
          handleBack={handleBack}
          handleNext={handleNext}
          selectedTables={selectedTables}
        />
      </Box>
    );
  } else if (isApiTesterPage) {
    pageContent = <ApiTester />;
  } else {
    // Default content for any unhandled routes
    pageContent = (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>Page Not Found</Typography>
        <Button 
          variant="contained" 
          onClick={goToMainMenu}
          startIcon={<HomeIcon />}
        >
          Return to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        color="default"
        elevation={0}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            onClick={goToMainMenu}
          >
            <Box 
              component="span" 
              sx={{ 
                color: 'var(--primary-color)', 
                mr: 1, 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              Ruster
            </Box>
            API
          </Typography>
          
          <Button 
            color="inherit" 
            onClick={() => setShowDebug(!showDebug)}
            size="small"
            sx={{ mr: 1 }}
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
          </Button>
          
          <Button
            color="primary"
            variant="outlined"
            onClick={() => {
              console.log("Import JSON button clicked in toolbar");
              // Try to find and click the button in JsonPreview first
              const importButton = document.getElementById('json-import-button');
              if (importButton) {
                console.log("Clicking json-import-button from JsonPreview");
                importButton.click();
              } else {
                // Fallback to the hidden input if JsonPreview button not found
                console.log("JsonPreview button not found, using hidden input");
                const fileInput = document.getElementById('hidden-json-file-input') as HTMLInputElement;
                if (fileInput) {
                  fileInput.click();
                } else {
                  console.error("No file input found");
                  setAlert({
                    message: 'Import function not available',
                    severity: 'error'
                  });
                }
              }
            }}
            size="small"
            sx={{ mr: 1 }}
          >
            Import JSON
          </Button>
          
          <Button
            color="primary"
            variant="contained"
            onClick={goToMainMenu}
            size="small"
            startIcon={<HomeIcon />}
            sx={{
              display: { xs: 'none', sm: 'flex' }
            }}
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer */}
      <NavigationDrawer
        drawerWidth={drawerWidth}
        drawerOpen={drawerOpen}
        toggleDrawer={toggleDrawer}
        navigationItems={navigationItems}
        step={step}
        setStep={setStep}
      />
      
      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        <Toolbar />
        {pageContent}
        
        {/* This is a hidden button that can be triggered programmatically */}
        <Box sx={{ display: 'none' }}>
          <input
            type="file"
            id="hidden-json-file-input"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(event) => {
              console.log("Hidden file input change detected");
              const file = event.target.files?.[0];
              if (!file) {
                console.error("No file selected in hidden input");
                return;
              }
              
              console.log("File selected in hidden input:", file.name, file.size, "bytes");
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  console.log("FileReader onload triggered for hidden input");
                  const content = e.target?.result as string;
                  console.log(`Loading JSON file content from hidden input (${content.length} bytes):`, 
                              content.substring(0, 100) + "...");
                  const parsedJson = JSON.parse(content);
                  
                  // Basic validation
                  if (parsedJson && typeof parsedJson === 'object') {
                    console.log("Calling handleJsonImport from hidden input");
                    handleJsonImport(parsedJson);
                  } else {
                    console.error("Invalid JSON format in hidden input");
                    setAlert({
                      message: 'Invalid JSON format',
                      severity: 'error'
                    });
                  }
                } catch (error) {
                  console.error('Error parsing JSON file from hidden input:', error);
                  setAlert({
                    message: 'Failed to parse JSON file',
                    severity: 'error'
                  });
                }
              };
              
              reader.onerror = (e) => {
                console.error("FileReader error in hidden input:", e);
                setAlert({
                  message: 'Error reading file',
                  severity: 'error'
                });
              };
              
              reader.readAsText(file);
              
              // Reset the file input
              event.target.value = '';
            }}
          />
          
          <Button
            id="json-import-button-hidden"
            onClick={() => {
              console.log("Hidden json-import-button clicked");
              const fileInput = document.getElementById('hidden-json-file-input') as HTMLInputElement;
              if (fileInput) {
                console.log("Clicking hidden file input");
                fileInput.click();
              } else {
                console.error("Hidden file input not found");
              }
            }}
          >
            Import JSON (Hidden)
          </Button>
        </Box>
      </Box>
      
      {/* Debug console */}
      {showDebug && <DebugLogs logs={debugLogs} />}
      
      {/* Alert notifications */}
      <Snackbar
        open={!!alert}
        autoHideDuration={5000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {alert ? (
          <Alert 
            onClose={() => setAlert(null)} 
            severity={alert.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {alert.message}
          </Alert>
        ) : (
          <Alert
            onClose={() => setAlert(null)}
            severity="info"
            variant="filled"
            sx={{ width: '100%' }}
          >
            No alerts
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}

/**
 * Root App component that sets up routing
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/api-tester" element={<AppContent />} />
        <Route path="/main-menu" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/main-menu" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
