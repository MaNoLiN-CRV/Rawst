import { useState, useCallback, useEffect } from 'react';
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
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>('http://localhost:8000/api');

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
      switch (field.data_type) {
        case 'String': defaultValue = `Sample ${field.name}`; break;
        case 'Integer': case 'Number': defaultValue = 0; break;
        case 'Boolean': defaultValue = false; break;
        case 'Date': defaultValue = new Date().toISOString().split('T')[0]; break;
        default: defaultValue = null;
      }
      sampleBody[field.name] = defaultValue;
    });
    return JSON.stringify(sampleBody, null, 2);
  }, []);

  const fetchApiConfiguration = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingConfig(true);
      setError(null);
      const config = await invoke<ApiConfiguration | null>('get_current_configuration');
      
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
    } finally {
      setIsLoadingConfig(false);
    }
  }, [createEndpointsForEntity]);

  useEffect(() => {
    if (serverStatus === 'running') {
      fetchApiConfiguration();
    }
  }, [serverStatus, fetchApiConfiguration]);

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
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError
  };
};
