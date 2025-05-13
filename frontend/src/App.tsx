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
  useMediaQuery
} from '@mui/material';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

// Icons
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MenuIcon from '@mui/icons-material/Menu';

// Component imports
import DatabaseConnection from './components/DatabaseConnection';
import EntitySelector from './components/EntitySelector';
import EntityConfig, { EntityFieldConfig } from './components/EntityConfig';
import JsonPreview from './components/JsonPreview';
import ApiTester from './components/ApiTester';
import NavigationDrawer from './components/NavigationDrawer';
import DebugLogs from './components/DebugLogs';
import StepperComponent from './components/Stepper';

// Custom hooks
import { useDatabaseOperations } from './hooks/useDatabaseOperations';

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
    saveConfiguration
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
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  /**
   * Handle actions at each step
   */
  const onConnectSuccess = async (success: boolean) => {
    if (success) {
      setStep(1);
    }
  };

  const onSelectTablesSuccess = async (success: boolean) => {
    if (success) {
      setStep(2);
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
          port: 8080
        },
        database: dbConfig,
        entities_basic: Object.entries(fallbackConfig).map(([table, cfg]) => ({
          name: cfg.name,
          table_name: cfg.table_name,
          fields: cfg.fields?.map(field => ({
            name: field.name,
            column_name: field.column_name,
            data_type: field.data_type,
            required: field.required,
            unique: field.unique,
            searchable: field.searchable,
            default_value: null,
            description: null
          })) || [],
          relationships: [],
          endpoints: {
            generate_create: cfg.endpoints?.generate_create || true,
            generate_read: cfg.endpoints?.generate_read || true,
            generate_update: cfg.endpoints?.generate_update || true,
            generate_delete: cfg.endpoints?.generate_delete || true,
            generate_list: cfg.endpoints?.generate_list || true,
            custom_routes: []
          },
          authentication: cfg.authentication || false,
          authorization: {
            active: cfg.authorization?.active || false,
            roles: cfg.authorization?.roles || [],
            permissions: cfg.authorization?.permissions || []
          },
          validations: cfg.validations || [],
          pagination: {
            default_page_size: 10,
            max_page_size: 100,
            page_param_name: "page",
            size_param_name: "size"
          }
        }))
      };
      
      console.log(`JSON generated with fallback: ${result.entities_basic.length} entities`);
      return result;
    }
    
    // Normal configuration
    const result = {
      api_version: "1.0",
      api_prefix: "/api",
      server: {
        host: "localhost",
        port: 8080
      },
      database: dbConfig,
      entities_basic: Object.entries(entityConfig).map(([table, cfg]) => {
        console.log(`Generating entity for table ${table} with ${cfg.fields.length} fields`);
        return {
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
        };
      })
    };
    
    console.log(`Final JSON generated with ${result.entities_basic.length} entities`);
    return result;
  }, [entityConfig, dbConfig, tableFields, step]);

  /**
   * Save the configuration to the backend
   */
  const handleSaveConfig = async () => {
    await saveConfiguration(configJson);
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
          <JsonPreview json={configJson} />
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

  // Determine if we're on the home page
  const isHomePage = location.pathname === '/';
  
  // Page content - includes stepper for the main workflow
  const pageContent = (
    <Box sx={{ p: 3, width: '100%' }}>
      {isHomePage && (
        <StepperComponent
          steps={steps}
          activeStep={step}
          loading={loading}
          handleBack={handleBack}
          handleNext={handleNext}
          selectedTables={selectedTables}
        />
      )}
    </Box>
  );

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
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RusterAPI
          </Typography>
          
          <Button 
            color="inherit" 
            onClick={() => setShowDebug(!showDebug)}
            size="small"
          >
            {showDebug ? 'Hide Debug' : 'Show Debug'}
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
        {isHomePage ? pageContent : <ApiTester />}
      </Box>
      
      {/* Debug console */}
      {showDebug && <DebugLogs logs={debugLogs} />}
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
      </Routes>
    </Router>
  );
}

export default App;
