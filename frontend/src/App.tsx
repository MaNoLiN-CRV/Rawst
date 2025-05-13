import { useState, useMemo, useEffect } from 'react'
import { Box, Button, Container, Fade, Slide } from '@mui/material'
import DatabaseConnection from './components/DatabaseConnection'
import EntitySelector from './components/EntitySelector'
import EntityConfig, { EntityFieldConfig } from './components/EntityConfig'
import JsonPreview from './components/JsonPreview'
import MainMenu from './components/MainMenu'
import { invoke } from '@tauri-apps/api/core'
import './styles/global.css'

interface TableInfo {
  name: string
}

interface DbConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
}

function App() {
  const [showMenu, setShowMenu] = useState(true)
  const [step, setStep] = useState(0)
  const [dbConfig, setDbConfig] = useState<DbConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [tables, setTables] = useState<string[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [tableFields, setTableFields] = useState<{ [table: string]: string[] }>({})
  const [entityConfig, setEntityConfig] = useState<{ [table: string]: EntityFieldConfig }>({})

  // Use useEffect to log the entityConfig whenever it changes
  useEffect(() => {
    console.log("EntityConfig state updated:", entityConfig);
    console.log("EntityConfig keys:", Object.keys(entityConfig));
  }, [entityConfig]);

  const handleStart = () => {
    setShowMenu(false)
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
  }

  const handleNext = () => {
    setStep(prev => prev + 1)
  }

  // Step 1: Connect to the database and get tables
  const handleConnect = async (config: DbConfig) => {
    setLoading(true)
    setError(undefined)
    try {
      const result = await invoke<TableInfo[]>('get_mariadb_tables', { config })
      setTables(result.map(t => t.name))
      setDbConfig(config)
      setStep(1)
    } catch (e: any) {
      setError(e?.toString() || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Get fields for each selected table
  const handleSelectTables = async (selected: string[]) => {
    setSelectedTables(selected)
    if (selected.length > 0 && dbConfig) {
      setLoading(true)
      setError(undefined)
      try {
        const fieldsResult: { [table: string]: string[] } = {}
        for (const table of selected) {
          const columns = await invoke<string[]>('get_mariadb_table_columns', { 
            config: dbConfig,
            table 
          })
          fieldsResult[table] = columns
        }
        setTableFields(fieldsResult)
        
        // Create initial configuration with all fields selected by default
        const initialConfig: { [table: string]: EntityFieldConfig } = {}
        for (const table of selected) {
          initialConfig[table] = {
            name: table,
            table_name: table,
            fields: fieldsResult[table].map(field => ({
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
          }
        }
        
        // Set the configuration and move to the next step
        setEntityConfig(initialConfig);
        setStep(2);
        
      } catch (e: any) {
        setError(e?.toString() || 'Error obteniendo campos')
      } finally {
        setLoading(false)
      }
    }
  }

  // Step 3: Entity configuration
  const handleConfigChange = (config: { [table: string]: EntityFieldConfig }) => {
    console.log("Configuration changed:", config);
    setEntityConfig(config);
  }

  // Generate final JSON as a memoized value
  const configJson = useMemo(() => {
    console.log("Computing configJson with entityConfig:", entityConfig);
    return {
      api_version: "1.0",
      api_prefix: "/api",
      server: {
        host: "localhost",
        port: 8080
      },
      database: dbConfig,
      entities_basic: Object.entries(entityConfig).map(([table, cfg]) => {
        console.log(`Generating entity for table ${table}:`, cfg);
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
  }, [entityConfig, dbConfig]);

  const handleSaveConfig = async () => {
    setLoading(true);
    setError(undefined);
    try {
      console.log("Saving configuration:", configJson);
      // Uncomment the below line when ready to save to the backend
      const result = await invoke<string>('save_configuration', { config: configJson });
      console.log("Save result:", result);
      alert("Configuración guardada con éxito: " + result);
    } catch (e: any) {
      console.error("Error saving configuration:", e);
      setError(e?.toString() || 'Error guardando configuración');
      alert("Error al guardar la configuración: " + e?.toString());
    } finally {
      setLoading(false);
    }
  };

  if (showMenu) {
    return <MainMenu onStart={handleStart} />
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: { xs: 2, md: 4 },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Fade in={true} timeout={500}>
        <Box 
          className="step-container glass-effect"
          sx={{
            width: '100%',
            maxWidth: '800px',
            margin: '0 auto',
            padding: 3,
            borderRadius: 2,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Slide direction="right" in={step === 0} mountOnEnter unmountOnExit>
            <Box>
              <DatabaseConnection onConnect={handleConnect} loading={loading} error={error} />
            </Box>
          </Slide>

          <Slide direction="right" in={step === 1} mountOnEnter unmountOnExit>
            <Box>
              <EntitySelector tables={tables} selected={selectedTables} onChange={handleSelectTables} />
            </Box>
          </Slide>

          <Slide direction="right" in={step === 2} mountOnEnter unmountOnExit>
            <Box>
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
                  }}
                >
                  Guardar Configuración
                </Button>
              </Box>
            </Box>
          </Slide>
          
          <Box 
            className="navigation-buttons"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mt: 3
            }}
          >
            {step > 0 && (
              <Button 
                className="nav-button"
                onClick={handleBack}
                disabled={loading}
                variant="outlined"
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  '&:hover': {
                    borderColor: 'var(--secondary-color)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  },
                }}
              >
                Atrás
              </Button>
            )}
            {step < 2 && (
              <Button 
                className="nav-button"
                onClick={handleNext}
                disabled={loading || (step === 1 && selectedTables.length === 0)}
                variant="contained"
                sx={{
                  backgroundColor: 'var(--primary-color)',
                  '&:hover': {
                    backgroundColor: 'var(--secondary-color)',
                  },
                }}
              >
                Siguiente
              </Button>
            )}
          </Box>
        </Box>
      </Fade>
    </Container>
  )
}

export default App
