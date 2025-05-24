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
    if (!selectedEndpoint) {
      setError("No endpoint selected.");
      return;
    }

    setIsSendingRequest(true);
    setError(null);
    setResponse("");

    try {
      let urlPath = selectedEndpoint.path;

      // Handle path parameters
      urlPath = handlePathParameters(urlPath);

      const fullUrl = `${apiUrl}${urlPath}`;
      const requestParams = {
        url: fullUrl,
        method: selectedEndpoint.method,
        body: METHODS_WITH_BODY.includes(
          selectedEndpoint.method as HttpMethodWithBody
        )
          ? requestBody
          : null,
      };

      const result = await makeApiRequest(requestParams);
      setResponse(result);
      setTabValue(TAB_INDICES.RESPONSE);

      // Refresh metrics if monitoring tab is active
      if (monitoringTabValue === 0) {
        fetchServerMetrics();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setResponse(
        JSON.stringify(
          { error: "API Request Failed", details: errorMessage },
          null,
          2
        )
      );
      setError(`API Request Failed: ${errorMessage}`);
      setTabValue(TAB_INDICES.RESPONSE);
    } finally {
      setIsSendingRequest(false);
    }
  }, [
    selectedEndpoint,
    apiUrl,
    requestBody,
    fetchServerMetrics,
    setError,
    monitoringTabValue,
  ]);

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
  };
};
