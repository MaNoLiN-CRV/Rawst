/**
 * Represents a field within an API entity.
 */
export interface EntityField {
  name: string;
  data_type: 'String' | 'Integer' | 'Number' | 'Boolean' | 'Date' | string;
}

/**
 * Represents a custom route configuration for an entity.
 */
export interface CustomRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  handler?: string;
}

/**
 * Configuration for the standard CRUD and custom endpoints of an entity.
 */
export interface EntityEndpointsConfig {
  generate_list?: boolean;
  generate_read?: boolean;
  generate_create?: boolean;
  generate_update?: boolean;
  generate_delete?: boolean;
  custom_routes?: CustomRoute[];
}

/**
 * Represents an API entity with its configuration.
 */
export interface ApiEntity {
  name: string;
  fields: EntityField[];
  endpoints?: EntityEndpointsConfig;
}

/**
 * Configuration for the API server.
 */
export interface ServerConfig {
  host: string;
  port: number;
}

/**
 * Overall API configuration structure fetched from the backend.
 */
export interface ApiConfiguration {
  entities_basic?: ApiEntity[];
  entities_advanced?: ApiEntity[];
  server?: ServerConfig;
  api_prefix?: string;
}

/**
 * Configuration for a specific API endpoint to be tested.
 */
export interface EndpointConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | string;
  description: string;
}

/**
 * Server status types
 */
export type ServerStatus = 'stopped' | 'starting' | 'running' | 'error' | 'stopping' | 'restarting';

/**
 * Server metrics data structure
 */
export interface ServerMetrics {
  uptime_seconds: number;
  request_count: number;
  error_count: number;
  is_running: boolean;
  start_time: number;
  current_time: number;
}

/**
 * Server log entry structure
 */
export interface ServerLogEntry {
  timestamp: number;
  level: string;
  message: string;
}

/**
 * Properties for the TabPanel component.
 */
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
