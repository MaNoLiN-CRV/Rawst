import { useState, useCallback, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
    ApiEntity, 
    EndpointConfig, 
    ApiConfiguration, 
    CustomRoute,
    ServerStatus 
} from '../components/api-tester/types'; 

/**
 * Custom hook to manage API configuration and endpoints
 */
export const useApiConfiguration = (serverStatus: ServerStatus) => {
  const [entities, setEntities] = useState<ApiEntity[]>([]);
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig | null>(null);
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(false); // Changed to false initially
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api');
  const isFetchingRef = useRef<boolean>(false); // Prevent multiple simultaneous fetches

  const createEndpointsForEntity = useCallback((entity: ApiEntity): EndpointConfig[] => {
    const entityName = entity.name;
    let newEndpoints: EndpointConfig[] = [];

    if (!entity.endpoints || Object.keys(entity.endpoints).length === 0) {
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

  const generateSampleBody = useCallback((entity: ApiEntity | undefined): string => {
    if (!entity || !entity.fields || entity.fields.length === 0) {
      return JSON.stringify({ id: 0, sample_field: "sample_value" }, null, 2);
    }
    const sampleBody: { [key: string]: any } = {};
    entity.fields.forEach((field) => {
      if (!field || !field.name) return;
      let defaultValue: any;
      // Handle different possible formats of data_type
      const dataType = field.data_type?.toLowerCase();
      switch (dataType) {
        case 'string':
          defaultValue = `Sample ${field.name}`;
          break;
        case 'integer':
        case 'number':
        case 'int':
        case 'bigint':
        case 'smallint':
        case 'tinyint':
        case 'mediumint':
          defaultValue = 1;
          break;
        case 'float':
        case 'double':
        case 'decimal':
        case 'numeric':
          defaultValue = 1.0;
          break;
        case 'boolean':
        case 'bool':
        case 'tinyint(1)':
          defaultValue = false;
          break;
        case 'date':
          defaultValue = new Date().toISOString().split('T')[0];
          break;
        case 'datetime':
        case 'timestamp':
          defaultValue = new Date().toISOString();
          break;
        case 'json':
          defaultValue = {};
          break;
        default:
          // For unknown types, try to infer from field name
          if (field.name.toLowerCase().includes('id') || field.name.toLowerCase().includes('count')) {
            defaultValue = 1;
          } else if (field.name.toLowerCase().includes('date') || field.name.toLowerCase().includes('time')) {
            defaultValue = new Date().toISOString().split('T')[0];
          } else if (field.name.toLowerCase().includes('price') || field.name.toLowerCase().includes('amount')) {
            defaultValue = 1.0;
          } else {
            defaultValue = `Sample ${field.name}`;
          }
      }
      sampleBody[field.name] = defaultValue;
    });
    return JSON.stringify(sampleBody, null, 2);
  }, []);

  const fetchApiConfiguration = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Configuration fetch already in progress, skipping...');
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoadingConfig(true);
      setError(null);
      
      console.log('Starting configuration fetch...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Configuration fetch timeout')), 10000)
      );
      
      const configPromise = invoke<ApiConfiguration | null>('get_current_configuration');
      
      const config = await Promise.race([configPromise, timeoutPromise]);
      
      console.log('Configuration fetch completed:', config);
      
      if (config && config.entities_basic && config.entities_basic.length > 0) {
        setEntities(config.entities_basic);
        const firstEntity = config.entities_basic[0];
        if (firstEntity?.name) {
          setSelectedEntityName(firstEntity.name);
          const newEndpoints = createEndpointsForEntity(firstEntity);
          setEndpoints(newEndpoints);
          if (newEndpoints.length > 0) {
            setSelectedEndpoint(newEndpoints[0]);
          } else {
            setSelectedEndpoint(null);
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
        setError("No API entities found in configuration.");
      }
    } catch (err: unknown) {
      console.error('Error fetching API configuration:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Unknown error loading API configuration');
      // Reset entities state on error
      setEntities([]);
      setSelectedEntityName('');
      setEndpoints([]);
      setSelectedEndpoint(null);
    } finally {
      setIsLoadingConfig(false);
      isFetchingRef.current = false;
    }
  }, [createEndpointsForEntity]);

  useEffect(() => {
    // Always try to fetch configuration on mount, regardless of server status
    fetchApiConfiguration();
    
    // Also fetch when server becomes running
    if (serverStatus === 'running') {
      // Small delay to ensure server is fully ready
      const timer = setTimeout(fetchApiConfiguration, 1000);
      return () => clearTimeout(timer);
    }
    
    // Clear loading state if server has error or is stopped
    if (serverStatus === 'error' || serverStatus === 'stopped') {
      setIsLoadingConfig(false);
    }
  }, [serverStatus]); // Removed fetchApiConfiguration from dependencies to prevent infinite loop

  const manualRefreshConfig = useCallback(async (): Promise<void> => {
    console.log('Manual refresh triggered');
    isFetchingRef.current = false; // Reset the flag to allow manual refresh
    await fetchApiConfiguration();
  }, [fetchApiConfiguration]);

  return {
    entities,
    selectedEntityName,
    selectedEndpoint,
    endpoints,
    isLoadingConfig,
    error,
    apiUrl,
    createEndpointsForEntity,
    generateSampleBody,
    fetchApiConfiguration,
    manualRefreshConfig,
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError
  };
};
