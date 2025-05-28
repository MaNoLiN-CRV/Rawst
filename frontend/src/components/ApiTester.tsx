import React from 'react';
import { Box, Divider, Alert } from '@mui/material';
import { useApiConfiguration } from '../hooks/useApiConfiguration';
import { useServerStatus } from '../hooks/useServerStatus';
import { useApiTester } from '../hooks/useApiTester';
import { useMonitoring } from '../hooks/useMonitoring';
import HeroSection from './api-tester/HeroSection';
import DatabaseTestSection from './api-tester/DatabaseTestSection';
import ServerMonitoringAccordion from './api-tester/ServerMonitoringAccordion';
import LoadingStates from './api-tester/LoadingStates';
import ServerErrorStates from './api-tester/ServerErrorStates';
import ApiTestingInterface from './api-tester/ApiTestingInterface';
import EntitySelector from './api-tester/EntitySelector';
import ServerControls from './api-tester/ServerControls';
import RequestDataDialog from './api-tester/RequestDataDialog';

/**
 * Main ApiTester component - Refactored for better modularity
 */
const ApiTester: React.FC = () => {
  // Custom hooks for different concerns
  const {
    serverStatus,
    serverMessage,
    serverMetrics,
    serverLogs,
    isLoadingMetrics,
    isLoadingLogs,
    errorCount,
    checkServerStatus,
    fetchServerMetrics,
    fetchServerLogs,
    startApiServer,
    stopApiServer,
    restartApiServer
  } = useServerStatus();
  
  const {
    entities,
    selectedEntityName,
    selectedEndpoint,
    endpoints,
    isLoadingConfig,
    error: apiConfigError,
    apiUrl,
    createEndpointsForEntity,
    generateSampleBody,
    manualRefreshConfig,
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError: setApiConfigError
  } = useApiConfiguration(serverStatus);


  const { tabValue: monitoringTabValue, handleTabChange: handleMonitoringTabChange } = useMonitoring({
    fetchServerMetrics,
    fetchServerLogs,
  });

  const {
    requestBody,
    response,
    isSendingRequest,
    tabValue,
    currentFullUrl,
    getMethodColor,
    handleEntityChange,
    handleEndpointChange,
    handleTabChange,
    handleRequestBodyChange,
    handleSendRequest,
    handleTestDatabaseConnection,
    showRequestDialog,
    setShowRequestDialog,
    handleDialogSubmit,
  } = useApiTester({
    entities,
    selectedEntityName,
    monitoringTabValue,
    selectedEndpoint,
    apiUrl,
    createEndpointsForEntity,
    generateSampleBody,
    setSelectedEntityName,
    setSelectedEndpoint,
    setEndpoints,
    setError: setApiConfigError,
    fetchServerMetrics
  });

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <Box sx={{ 
        py: { xs: 2, sm: 4 }, 
        px: { xs: 1, sm: 3 },
      }}>
        {/* Hero Section */}
        <HeroSection />

        <Divider sx={{ mb: 4 }} />

        {/* Server Controls */}
        <ServerControls
          status={serverStatus}
          metrics={serverMetrics}
          onStart={startApiServer}
          onStop={stopApiServer}
          onRestart={restartApiServer}
          onRefresh={checkServerStatus}
          message={serverMessage}
        />

        {/* Database Test Section */}
        <DatabaseTestSection
          serverStatus={serverStatus}
          onTestConnection={handleTestDatabaseConnection}
        />

        {/* Server Monitoring Accordion */}
        <ServerMonitoringAccordion
          errorCount={errorCount}
          tabValue={monitoringTabValue}
          onTabChange={handleMonitoringTabChange}
          serverMetrics={serverMetrics}
          serverLogs={serverLogs}
          isLoadingMetrics={isLoadingMetrics}
          isLoadingLogs={isLoadingLogs}
          onRefreshLogs={fetchServerLogs}
        />

        {/* Loading States */}
        <LoadingStates
          isLoadingConfig={isLoadingConfig}
          serverStatus={serverStatus}
          onForceRefresh={manualRefreshConfig}
        />

        {/* Server Error States */}
        <ServerErrorStates
          isLoadingConfig={isLoadingConfig}
          serverStatus={serverStatus}
          serverMessage={serverMessage}
          apiConfigError={apiConfigError}
          onClearError={() => setApiConfigError(null)}
        />

        {/* Main Content Container */}
        {!isLoadingConfig && entities.length > 0 && (
          <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto' }}>
            {/* Entity Selector */}
            <EntitySelector
              entities={entities}
              selectedEntityName={selectedEntityName}
              isLoadingConfig={isLoadingConfig}
              serverStatus={serverStatus}
              onEntityChange={handleEntityChange}
            />

            {/* API Testing Interface */}
            <ApiTestingInterface
              selectedEntityName={selectedEntityName}
              endpoints={endpoints}
              selectedEndpoint={selectedEndpoint}
              entities={entities}
              tabValue={tabValue}
              requestBody={requestBody}
              response={response}
              isSendingRequest={isSendingRequest}
              currentFullUrl={currentFullUrl}
              serverStatus={serverStatus}
              getMethodColor={getMethodColor}
              onEndpointSelect={handleEndpointChange}
              onTabChange={handleTabChange}
              onRequestBodyChange={handleRequestBodyChange}
              onSendRequest={handleSendRequest}
            />
            
            {/* No Endpoints Alert */}
            {!isLoadingConfig && entities.length > 0 && selectedEntityName && endpoints.length === 0 && (
              <Alert 
                severity="info" 
                sx={{
                  mt: 3,
                  background: 'rgba(59, 130, 246, 0.15) !important',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 2,
                  color: '#000000',
                  '& .MuiAlert-icon': {
                    color: '#3b82f6',
                  }
                }}
              >
                No endpoints are configured or generated for the selected entity "{selectedEntityName}".
              </Alert>
            )}
          </Box>
        )}

        {/* Add the Request Data Dialog */}
        <RequestDataDialog
          open={showRequestDialog}
          entity={entities.find(e => e.name === selectedEntityName)}
          method={selectedEndpoint?.method || 'POST'}
          onClose={() => setShowRequestDialog(false)}
          onSubmit={handleDialogSubmit}
        />
      </Box>
    </Box>
  );
};

export default React.memo(ApiTester);
