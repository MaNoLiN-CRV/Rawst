import { invoke } from '@tauri-apps/api/core';
import { ApiRequestParams } from '../components/api-tester/types';

/**
 * Makes an API request with proper error handling
 */
export const makeApiRequest = async (params: ApiRequestParams): Promise<string> => {
  try {
    const result = await invoke<string>('test_api_endpoint', params);
    
    try {
      const parsedResult = JSON.parse(result);
      return JSON.stringify(parsedResult, null, 2);
    } catch (parseError) {
      return result;
    }
  } catch (error) {
    console.error('Error making API request:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return JSON.stringify({ error: 'API Request Failed', details: errorMessage }, null, 2);
  }
};

/**
 * Tests database connection with error handling
 */
export const testDatabaseConnection = async (): Promise<string> => {
  try {
    const result = await invoke<string>('test_database_connection');
    return `Database Test Success: ${result}`;
  } catch (error) {
    console.error('Error testing database connection:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Database Test Failed: ${errorMessage}`;
  }
};

/**
 * Handles path parameters in URL paths
 */
export const handlePathParameters = (urlPath: string): string => {
  // Find all path parameters in the format {paramName}
  const parameterPattern = /\{([^}]+)\}/g;
  let processedPath = urlPath;
  let match;
  
  // Process each parameter found
  while ((match = parameterPattern.exec(urlPath)) !== null) {
    const fullMatch = match[0]; // e.g., "{id}"
    const paramName = match[1]; // e.g., "id"
    
    // Prompt user for the parameter value
    const defaultValue = paramName === 'id' ? '1' : '';
    const paramValue = prompt(
      `Enter value for path parameter {${paramName}}:`, 
      defaultValue
    );
    
    if (paramValue !== null && paramValue.trim() !== '') {
      processedPath = processedPath.replace(fullMatch, encodeURIComponent(paramValue.trim()));
    } else {
      throw new Error(`Value for parameter {${paramName}} is required for this endpoint and was not provided.`);
    }
  }
  
  return processedPath;
};
