import { useState, useEffect, useCallback, useMemo } from "react";
import { SelectChangeEvent, useTheme } from "@mui/material";
import {
  EndpointConfig,
  HttpMethodWithBody,
  ApiEntity,
} from "../components/api-tester/types";
import {
  makeApiRequest,
  testDatabaseConnection,
  handlePathParameters,
} from "../utils/api-utils";
import {
  METHODS_WITH_BODY,
  DEFAULT_METHOD_COLORS,
  TAB_INDICES,
} from "../constants/api-constants";

interface UseApiTesterProps {
  entities: ApiEntity[];
  selectedEntityName: string;
  selectedEndpoint: EndpointConfig | null;
  monitoringTabValue: number;
  apiUrl: string;
  createEndpointsForEntity: (entity: ApiEntity) => EndpointConfig[];
  generateSampleBody: (entity: ApiEntity | undefined) => string;
  setSelectedEntityName: (name: string) => void;
  setSelectedEndpoint: (endpoint: EndpointConfig | null) => void;
  setEndpoints: (endpoints: EndpointConfig[]) => void;
  setError: (error: string | null) => void;
  fetchServerMetrics: () => void;
}

export const useApiTester = ({
  entities,
  selectedEntityName,
  selectedEndpoint,
  monitoringTabValue,
  apiUrl,
  createEndpointsForEntity,
  generateSampleBody,
  setSelectedEntityName,
  setSelectedEndpoint,
  setEndpoints,
  setError,
  fetchServerMetrics,
}: UseApiTesterProps) => {
  const theme = useTheme();

  // Local state
  const [requestBody, setRequestBody] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<number>(0);

  // Add new state for the dialog
  const [showRequestDialog, setShowRequestDialog] = useState<boolean>(false);

  // Effect to update request body when endpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      if (
        METHODS_WITH_BODY.includes(
          selectedEndpoint.method as HttpMethodWithBody
        )
      ) {
        const currentEntity = entities.find(
          (e) => e.name === selectedEntityName
        );
        setRequestBody(generateSampleBody(currentEntity));
      } else {
        setRequestBody("");
      }
    } else {
      setRequestBody("");
    }
  }, [selectedEndpoint, selectedEntityName, entities, generateSampleBody]);

  // Memoized values
  const getMethodColor = useCallback(
    (method: string): string => {
      const colorMap: Record<string, string> = {
        GET: theme.palette.info.main,
        POST: theme.palette.success.main,
        PUT: theme.palette.warning.main,
        DELETE: theme.palette.error.main,
        PATCH: theme.palette.secondary.main,
        ...DEFAULT_METHOD_COLORS,
      };
      return colorMap[method.toUpperCase()] || theme.palette.grey[700];
    },
    [theme]
  );

  const currentFullUrl = useMemo(() => {
    if (!selectedEndpoint) return apiUrl;
    return `${apiUrl}${selectedEndpoint.path}`;
  }, [apiUrl, selectedEndpoint]);

  // Event handlers
  const handleEntityChange = useCallback(
    (event: SelectChangeEvent<string>): void => {
      const entityName = event.target.value;
      setSelectedEntityName(entityName);
      setResponse("");

      const entity = entities.find((e) => e.name === entityName);
      if (entity) {
        const newEndpoints = createEndpointsForEntity(entity);
        setEndpoints(newEndpoints);
        if (newEndpoints.length > 0) {
          setSelectedEndpoint(newEndpoints[0]);
        } else {
          setSelectedEndpoint(null);
        }
      } else {
        setEndpoints([]);
        setSelectedEndpoint(null);
      }
    },
    [
      entities,
      createEndpointsForEntity,
      setSelectedEntityName,
      setEndpoints,
      setSelectedEndpoint,
    ]
  );

  const handleEndpointChange = useCallback(
    (endpoint: EndpointConfig): void => {
      setSelectedEndpoint(endpoint);
      setResponse("");
      setTabValue(TAB_INDICES.REQUEST);
    },
    [setSelectedEndpoint]
  );

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number): void => {
      setTabValue(newValue);
    },
    []
  );

  const handleRequestBodyChange = useCallback((value: string): void => {
    setRequestBody(value);
  }, []);

  /**
   * Makes an API request with proper error handling
   */
  const handleSendRequest = useCallback(async (): Promise<void> => {
    if (!selectedEndpoint) return;

    try {
      setIsSendingRequest(true);
      setResponse('');
      setTabValue(TAB_INDICES.RESPONSE);

      let processedUrl = apiUrl + selectedEndpoint.path;

      // Handle path parameters
      try {
        processedUrl = handlePathParameters(processedUrl);
      } catch (paramError) {
        const errorMessage = paramError instanceof Error ? paramError.message : String(paramError);
        setResponse(`Parameter Error: ${errorMessage}`);
        return;
      }

      // For POST/PUT/PATCH methods, show dialog to collect data
      if (METHODS_WITH_BODY.includes(selectedEndpoint.method as HttpMethodWithBody)) {
        // Instead of sending immediately, show the dialog
        setShowRequestDialog(true);
        return;
      }

      // For GET/DELETE, send immediately
      const result = await makeApiRequest({
        url: processedUrl,
        method: selectedEndpoint.method,
        body: null,
      });

      setResponse(result);
    } catch (error) {
      console.error('Error sending request:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResponse(`Request Error: ${errorMessage}`);
    } finally {
      setIsSendingRequest(false);
    }
  }, [selectedEndpoint, apiUrl]);

  // Add new function to handle dialog submission
  const handleDialogSubmit = useCallback(async (formData: Record<string, any>): Promise<void> => {
    if (!selectedEndpoint) return;

    try {
      setIsSendingRequest(true);
      setShowRequestDialog(false);
      setTabValue(TAB_INDICES.RESPONSE);

      let processedUrl = apiUrl + selectedEndpoint.path;

      // Handle path parameters
      try {
        processedUrl = handlePathParameters(processedUrl);
      } catch (paramError) {
        const errorMessage = paramError instanceof Error ? paramError.message : String(paramError);
        setResponse(`Parameter Error: ${errorMessage}`);
        return;
      }

      // Send request with form data
      const result = await makeApiRequest({
        url: processedUrl,
        method: selectedEndpoint.method,
        body: JSON.stringify(formData),
      });

      setResponse(result);
    } catch (error) {
      console.error('Error sending request:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setResponse(`Request Error: ${errorMessage}`);
    } finally {
      setIsSendingRequest(false);
    }
  }, [selectedEndpoint, apiUrl]);

  /**
   * Tests database connection with error handling
   */
  const handleTestDatabaseConnection = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const result = await testDatabaseConnection();
      setError(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    }
  }, [setError]);

  return {
    // State
    requestBody,
    response,
    isSendingRequest,
    tabValue,
    showRequestDialog,

    // Computed values
    currentFullUrl,
    getMethodColor,

    // Handlers
    handleEntityChange,
    handleEndpointChange,
    handleTabChange,
    handleRequestBodyChange,
    handleSendRequest,
    handleTestDatabaseConnection,
    setShowRequestDialog,
    handleDialogSubmit,
  };
};
