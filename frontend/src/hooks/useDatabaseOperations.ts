import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { EntityFieldConfig } from '../components/EntityConfig';

// Types
export interface TableInfo {
  name: string;
}

export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
  db_type: "PostgreSQL" | "MySQL" | "SQLite" | "MongoDB";
  connection_string: string;
  ssl_enabled: boolean;
  max_connections?: number;
  timeout_seconds?: number;
}

/**
 * Custom hook for database operations
 */
export const useDatabaseOperations = (addLog: (message: string) => void) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [dbConfig, setDbConfig] = useState<DbConfig | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableFields, setTableFields] = useState<{ [table: string]: string[] }>({});
  const [entityConfig, setEntityConfig] = useState<{ [table: string]: EntityFieldConfig }>({});

  /**
   * Connect to database and fetch tables
   */
  const handleConnect = async (config: DbConfig) => {
    setLoading(true);
    setError(undefined);
    
    try {
      addLog(`Connecting to ${config.host}:${config.port}/${config.database_name}...`);
      // Create a connection config object for Tauri
      const connectionConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database_name: config.database_name,
        db_type: config.db_type,
        connection_string: config.connection_string,
        ssl_enabled: config.ssl_enabled,
        max_connections: config.max_connections || 10,
        timeout_seconds: config.timeout_seconds || 30
      };
      const result = await invoke<TableInfo[]>('get_mariadb_tables', { config: connectionConfig });
      
      addLog(`Connection successful. Tables found: ${result.length}`);
      setTables(result.map(t => t.name));
      setDbConfig(config);
      return true;
    } catch (e: any) {
      const errorMsg = e?.toString() || 'Connection error';
      addLog(`ERROR: ${errorMsg}`);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Select tables and fetch their columns
   */
  const handleSelectTables = async (selected: string[]) => {
    addLog(`Selected tables: ${selected.join(', ')}`);
    setSelectedTables(selected);
    
    // Do nothing if no tables selected
    if (selected.length === 0) {
      addLog("No tables selected");
      return false;
    }
    
    if (dbConfig) {
      setLoading(true);
      setError(undefined);
      
      try {
        const fieldsResult: { [table: string]: string[] } = {};
        
        // Create a connection config object for Tauri
        const connectionConfig = {
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database_name: dbConfig.database_name,
          db_type: dbConfig.db_type,
          connection_string: dbConfig.connection_string,
          ssl_enabled: dbConfig.ssl_enabled,
          max_connections: dbConfig.max_connections || 10,
          timeout_seconds: dbConfig.timeout_seconds || 30
        };
        
        // Fetch columns for each selected table
        for (const table of selected) {
          addLog(`Getting columns for table: ${table}...`);
          
          const request = {
            config: connectionConfig,
            table: table
          };
          
          const columns = await invoke<string[]>('get_mariadb_table_columns', { request });
          
          addLog(`Columns for ${table}: ${columns.length} columns`);
          fieldsResult[table] = columns;
        }
        
        addLog(`Total columns fetched for ${Object.keys(fieldsResult).length} tables`);
        
        // Update table fields
        setTableFields(fieldsResult);
        
        // Create initial configuration for each table
        const initialConfig: { [table: string]: EntityFieldConfig } = {};
        
        for (const table of selected) {
          const fields = fieldsResult[table];
          
          if (!fields || fields.length === 0) {
            addLog(`⚠️ Warning: No columns found for table ${table}`);
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
        
        // Verify that at least one configuration was created
        const configCount = Object.keys(initialConfig).length;
        
        if (configCount === 0) {
          addLog("❌ Error: Could not create any configuration");
          setError("Could not get columns for the selected tables");
          return false;
        }
        
        addLog(`Initial configuration created with ${configCount} entities`);
        
        // Ensure entityConfig is updated
        setEntityConfig(initialConfig);
        return true;
        
      } catch (e: any) {
        const errorMsg = e?.toString() || 'Error getting columns';
        addLog(`ERROR: ${errorMsg}`);
        setError(errorMsg);
        return false;
      } finally {
        setLoading(false);
      }
    } else {
      addLog("❌ Error: No database configuration");
      setError("No database configuration");
      return false;
    }
  };

  /**
   * Handle entity configuration changes
   */
  const handleConfigChange = (config: { [table: string]: EntityFieldConfig }) => {
    console.log("Configuration changed. New config:", config);
    
    // Verify the configuration has entities
    if (Object.keys(config).length > 0) {
      // Create a new object to ensure React detects the state change
      setEntityConfig({...config});
      
      // Log information about each entity for verification
      Object.entries(config).forEach(([table, entityConfig]) => {
        console.log(`Entity ${table}:`, entityConfig);
        console.log(`Fields for ${table}:`, entityConfig.fields.length);
      });
      return true;
    } else {
      console.error("Error: No entities in received configuration");
      return false;
    }
  };

  /**
   * Save the configuration to the backend
   */
  const saveConfiguration = async (configJson: any) => {
    setLoading(true);
    setError(undefined);
    try {
      addLog("Saving JSON configuration...");
      
      // Log the current JSON state
      console.log("Configuration to save:", 
        "database:", Boolean(configJson.database), 
        "entities_basic:", Array.isArray(configJson.entities_basic) ? configJson.entities_basic.length : 0);
      
      // Deep copy to avoid modifying the original
      const configToSave = JSON.parse(JSON.stringify(configJson));
      
      // Verify that entities exist in the configuration
      if (!configToSave.entities_basic || !Array.isArray(configToSave.entities_basic) || configToSave.entities_basic.length === 0) {
        console.error("No entities found in configuration");
        addLog("⚠️ WARNING: JSON has no entities");
        return false;
      }
      
      // Verify each entity has the required properties
      let isValid = true;
      configToSave.entities_basic.forEach((entity: any, index: number) => {
        if (!entity.name || !entity.table_name || !Array.isArray(entity.fields)) {
          console.error(`Entity at index ${index} is missing required properties:`, entity);
          addLog(`⚠️ ERROR: Entity at index ${index} is invalid`);
          isValid = false;
        }
      });
      
      if (!isValid) {
        addLog("⚠️ ERROR: Configuration contains invalid entities");
        setError("Configuration contains invalid entities");
        return false;
      }
      
      // Show a preview of the JSON to be saved
      addLog("📝 Sending JSON:");
      addLog(`- API: ${configToSave.api_version}`);
      addLog(`- Entities: ${configToSave.entities_basic.length}`);
      if (configToSave.entities_basic.length > 0) {
        configToSave.entities_basic.forEach((entity: any, i: number) => {
          addLog(`  [${i+1}] ${entity.name}: ${entity.fields.length} fields`);
        });
      }
      
      // Save to the backend
      console.log("Invoking save_configuration Tauri command...");
      const result = await invoke<string>('save_configuration', { config: configToSave });
      console.log("Save result:", result);
      addLog(`✅ Configuration saved: ${result}`);
      return true;
    } catch (e: any) {
      const errorMsg = e?.toString() || 'Error saving configuration';
      console.error("Error saving configuration:", e);
      addLog(`ERROR: ${errorMsg}`);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};

export default useDatabaseOperations; 