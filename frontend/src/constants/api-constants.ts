import { HttpMethodWithBody } from '../components/api-tester/types';

/**
 * HTTP methods that require a request body
 */
export const METHODS_WITH_BODY: HttpMethodWithBody[] = ['POST', 'PUT'];

/**
 * Default HTTP method colors for UI display
 */
export const DEFAULT_METHOD_COLORS: Record<string, string> = {
  'GET': '#2196f3',     // blue
  'POST': '#4caf50',    // green
  'PUT': '#ff9800',     // orange
  'DELETE': '#f44336',  // red
  'PATCH': '#9c27b0',   // purple
};

/**
 * Tab indices for the main application tabs
 */
export const TAB_INDICES = {
  REQUEST: 0,
  RESPONSE: 1,
} as const;

/**
 * Monitoring tab indices
 */
export const MONITORING_TAB_INDICES = {
  METRICS: 0,
  LOGS: 1,
} as const;
