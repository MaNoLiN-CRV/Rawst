import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Box, Button, Container, Fade, Slide, Typography, Paper } from '@mui/material'
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

// Componente para mostrar logs en pantalla
const DebugLogs = ({ logs }: { logs: string[] }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);
  
  return (
    <Paper 
      sx={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        zIndex: 9999,
        padding: 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}
    >
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>Debug Console:</Typography>
      {logs.map((log, i) => (
        <Box key={i} sx={{ mb: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {log}
        </Box>
      ))}
      <div ref={logsEndRef} />
    </Paper>
  );
};

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
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);

  // Función para agregar logs que se verán en la interfaz - ahora es useCallback
  const addLog = useCallback((message: string) => {
    setDebugLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    // También enviamos a console.log normal
    console.log(message);
  }, []);

  // Use useEffect to log the entityConfig whenever it changes
  useEffect(() => {
    if (Object.keys(entityConfig).length > 0) {
      addLog(`EntityConfig actualizado: ${Object.keys(entityConfig).length} entidades`);
      addLog(`EntityConfig keys: ${Object.keys(entityConfig)}`);
    }
  }, [entityConfig, addLog]);

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
      addLog(`Conectando a ${config.host}:${config.port}/${config.database}...`);
      const result = await invoke<TableInfo[]>('get_mariadb_tables', { config })
      addLog(`Conexión exitosa. Tablas encontradas: ${result.length}`);
      setTables(result.map(t => t.name))
      setDbConfig(config)
      setStep(1)
    } catch (e: any) {
      const errorMsg = e?.toString() || 'Error de conexión';
      addLog(`ERROR: ${errorMsg}`);
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Get fields for each selected table
  const handleSelectTables = async (selected: string[]) => {
    addLog(`Tablas seleccionadas: ${selected.join(', ')}`);
    setSelectedTables(selected);
    
    // Si no hay tablas seleccionadas, no hacer nada
    if (selected.length === 0) {
      addLog("No se seleccionaron tablas");
      return;
    }
    
    if (dbConfig) {
      setLoading(true);
      setError(undefined);
      
      try {
        const fieldsResult: { [table: string]: string[] } = {};
        
        // Obtener campos para cada tabla seleccionada
        for (const table of selected) {
          addLog(`Obteniendo campos para tabla: ${table}...`);
          
          // Estructura el request correctamente según lo que espera el backend
          const request = {
            config: dbConfig,
            table: table
          };
          
          const columns = await invoke<string[]>('get_mariadb_table_columns', { request });
          
          addLog(`Campos para ${table}: ${columns.length} columnas`);
          fieldsResult[table] = columns;
        }
        
        addLog(`Total campos obtenidos para ${Object.keys(fieldsResult).length} tablas`);
        
        // Actualizar los campos de tablas
        setTableFields(fieldsResult);
        
        // Crear configuración inicial para cada tabla
        const initialConfig: { [table: string]: EntityFieldConfig } = {};
        
        for (const table of selected) {
          const fields = fieldsResult[table];
          
          if (!fields || fields.length === 0) {
            addLog(`⚠️ Advertencia: No se encontraron campos para la tabla ${table}`);
            continue;
          }
          
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
        }
        
        // Verificar que se haya creado al menos una configuración
        const configCount = Object.keys(initialConfig).length;
        
        if (configCount === 0) {
          addLog("❌ Error: No se pudo crear ninguna configuración");
          setError("No se pudieron obtener los campos de las tablas seleccionadas");
          return;
        }
        
        addLog(`Configuración inicial creada con ${configCount} entidades`);
        
        // Asegurar que entityConfig se actualice antes de cambiar de paso
        setEntityConfig(initialConfig);
        
        // Esperar un momento para que el estado se actualice antes de cambiar de paso
        setTimeout(() => {
          // Avanzar al siguiente paso
          setStep(2);
        }, 100);
        
      } catch (e: any) {
        const errorMsg = e?.toString() || 'Error obteniendo campos';
        addLog(`ERROR: ${errorMsg}`);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    } else {
      addLog("❌ Error: No hay configuración de base de datos");
      setError("No hay configuración de base de datos");
    }
  }

  // Step 3: Entity configuration
  const handleConfigChange = (config: { [table: string]: EntityFieldConfig }) => {
    console.log("Configuration changed. New config:", config);
    console.log("Configuration keys:", Object.keys(config));
    
    // Verificamos que la configuración tenga entidades
    if (Object.keys(config).length > 0) {
      // Important: create a new object to ensure React detects the state change
      setEntityConfig({...config});
      
      // Imprimimos información de cada entidad para verificar
      Object.entries(config).forEach(([table, entityConfig]) => {
        console.log(`Entidad ${table}:`, entityConfig);
        console.log(`Campos de ${table}:`, entityConfig.fields.length);
      });
    } else {
      console.error("Error: No hay entidades en la configuración recibida");
    }
  }

  // Generate final JSON as a memoized value
  const configJson = useMemo(() => {
    // Verificación de entidades
    const entityCount = Object.keys(entityConfig).length;
    const message = `Generando JSON con ${entityCount} entidades`;
    console.log(message); // Solo usamos console.log aquí, no addLog
    
    if (entityCount === 0 && step === 2) {
      console.log("⚠️ No hay entidades configuradas para generar el JSON");
    }
    
    // Intento direct fallback para generar entities_basic si está vacío
    if (entityCount === 0 && Object.keys(tableFields).length > 0 && step === 2) {
      console.log("🔄 Usando tableFields como fallback para generar la configuración");
      // Crear configuración fallback desde tableFields
      const fallbackConfig: { [table: string]: EntityFieldConfig } = {};
      
      Object.entries(tableFields).forEach(([table, fields]) => {
        console.log(`Creando fallback para tabla: ${table} con ${fields.length} campos`);
        fallbackConfig[table] = {
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
      
      // Solo para debugging - no modifica el estado real
      console.log(`Configuración fallback generada: ${Object.keys(fallbackConfig).length} entidades`);
      
      // Generar JSON con la configuración fallback
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
            custom_routes: []
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
        }))
      };
      
      console.log(`JSON generado con fallback: ${result.entities_basic.length} entidades`);
      return result;
    }
    
    // Configuración normal
    const result = {
      api_version: "1.0",
      api_prefix: "/api",
      server: {
        host: "localhost",
        port: 8080
      },
      database: dbConfig,
      entities_basic: Object.entries(entityConfig).map(([table, cfg]) => {
        console.log(`Generando entidad para tabla ${table} con ${cfg.fields.length} campos`);
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
    
    console.log(`JSON final generado con ${result.entities_basic.length} entidades`);
    return result;
  }, [entityConfig, dbConfig, tableFields, step]);

  const handleSaveConfig = async () => {
    setLoading(true);
    setError(undefined);
    try {
      addLog("Guardando configuración JSON...");
      
      if (configJson.entities_basic.length === 0) {
        addLog("⚠️ ADVERTENCIA: El JSON no tiene entidades, verificando datos...");
        addLog(`EntityConfig tiene ${Object.keys(entityConfig).length} entidades`);
        addLog(`TableFields tiene ${Object.keys(tableFields).length} tablas`);
        
        if (Object.keys(entityConfig).length === 0 && Object.keys(tableFields).length > 0) {
          addLog("Intentando recrear la configuración desde tableFields antes de guardar");
          
          // Recrear configuración
          const tempConfig: { [table: string]: EntityFieldConfig } = {};
          Object.entries(tableFields).forEach(([table, fields]) => {
            tempConfig[table] = {
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
          
          addLog(`Recreada configuración con ${Object.keys(tempConfig).length} entidades`);
          setEntityConfig(tempConfig);
          
          // No guardar ahora, dejar que se actualice el estado y el useMemo
          setLoading(false);
          return;
        }
      }
      
      // Mostrar una vista previa del JSON que se va a guardar
      addLog("📝 Enviando JSON:");
      addLog(`- API: ${configJson.api_version}`);
      addLog(`- Entidades: ${configJson.entities_basic.length}`);
      if (configJson.entities_basic.length > 0) {
        configJson.entities_basic.forEach((entity, i) => {
          addLog(`  [${i+1}] ${entity.name}: ${entity.fields.length} campos`);
        });
      }
      
      // Uncomment the below line when ready to save to the backend
      const result = await invoke<string>('save_configuration', { config: configJson });
      addLog(`✅ Configuración guardada: ${result}`);
      alert("Configuración guardada con éxito: " + result);
    } catch (e: any) {
      const errorMsg = e?.toString() || 'Error guardando configuración';
      addLog(`❌ Error al guardar: ${errorMsg}`);
      console.error("Error saving configuration:", e);
      setError(errorMsg);
      alert("Error al guardar la configuración: " + errorMsg);
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
      {showDebug && <DebugLogs logs={debugLogs} />}
      
      {/* Botón para mostrar/ocultar logs */}
      <Button 
        variant="outlined" 
        size="small"
        onClick={() => setShowDebug(!showDebug)}
        sx={{ 
          position: 'fixed', 
          bottom: '10px', 
          left: '10px',
          zIndex: 9999
        }}
      >
        {showDebug ? 'Ocultar Debug' : 'Mostrar Debug'}
      </Button>
      
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
