import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ServerStatus, ServerMetrics, ServerLogEntry } from '../components/api-tester/types'; // Adjust path as necessary

/**
 * Custom hook to manage server status, metrics, and logs
 */
export const useServerStatus = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus>('stopped');
  const [serverMessage, setServerMessage] = useState<string>('');
  const [serverMetrics, setServerMetrics] = useState<ServerMetrics | null>(null);
  const [serverLogs, setServerLogs] = useState<ServerLogEntry[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const metricsIntervalRef = useRef<number | null>(null);

  const fetchServerMetrics = useCallback(async (): Promise<void> => {
    if (serverStatus !== 'running') {
      setServerMetrics(null);
      return;
    }
    
    try {
      setIsLoadingMetrics(true);
      const metrics = await invoke<ServerMetrics>('get_server_metrics');
      setServerMetrics(metrics);
    } catch (err: unknown) {
      console.error('Error fetching server metrics:', err);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [serverStatus]);
  
  const fetchServerLogs = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingLogs(true);
      const logs = await invoke<ServerLogEntry[]>('get_server_logs', { limit: 50 });
      setServerLogs(logs);
    } catch (err: unknown) {
      console.error('Error fetching server logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  const checkServerStatus = useCallback(async (): Promise<void> => {
    try {
      const statusResult = await invoke<string>('get_server_status');
      if (statusResult.startsWith('error:')) {
        setServerStatus('error');
        setServerMessage(statusResult.substring(6));
      } else if (statusResult === 'running' || statusResult === 'stopped' || statusResult === 'starting') {
        setServerStatus(statusResult as ServerStatus);
        setServerMessage(statusResult === 'running' ? 'Server is running' : (statusResult === 'starting' ? 'Server is starting...' : 'Server is stopped.'));
      } else {
        setServerStatus('error');
        setServerMessage(`Unknown server status: ${statusResult}`);
      }
      
      if (statusResult === 'running') {
        fetchServerMetrics();
        fetchServerLogs();
      }
    } catch (err: unknown) {
      console.error('Error checking server status:', err);
      setServerStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setServerMessage(errorMessage || 'Error checking server status');
    }
  }, [fetchServerMetrics, fetchServerLogs]);

  const startApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('starting');
      setServerMessage('Attempting to start API server...');
      const result = await invoke<string>('start_api_server');
      if (result.toLowerCase().includes("error") || result.toLowerCase().includes("fail")) {
          setServerStatus('error');
          setServerMessage(result || 'Failed to start API server.');
      } else {
          setServerStatus('running'); 
          setServerMessage(result || 'Server start initiated. Checking status...');
      }
      setTimeout(checkServerStatus, 1500);
    } catch (err: unknown) {
      console.error('Error invoking start_api_server:', err);
      setServerStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setServerMessage(`Failed to start API server: ${errorMessage || 'Unknown error'}`);
    }
  }, [checkServerStatus]);
  
  const stopApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('stopping');
      setServerMessage('Stopping API server...');
      await invoke<string>('stop_api_server');
      setTimeout(checkServerStatus, 1000);
    } catch (err: unknown) {
      console.error('Error stopping API server:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setServerMessage(`Failed to stop server: ${errorMessage || 'Unknown error'}`);
      setTimeout(checkServerStatus, 1000);
    }
  }, [checkServerStatus]);
  
  const restartApiServer = useCallback(async (): Promise<void> => {
    try {
      setServerStatus('restarting');
      setServerMessage('Restarting API server...');
      await invoke<string>('restart_api_server');
      setServerMetrics(null);
      setTimeout(checkServerStatus, 2000);
    } catch (err: unknown) {
      console.error('Error restarting API server:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setServerMessage(`Failed to restart server: ${errorMessage || 'Unknown error'}`);
      setTimeout(checkServerStatus, 1000);
    }
  }, [checkServerStatus]);

  useEffect(() => {
    checkServerStatus();
    const statusInterval = setInterval(checkServerStatus, 5000);
    return () => {
      clearInterval(statusInterval);
      if (metricsIntervalRef.current !== null) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [checkServerStatus]);

  useEffect(() => {
    if (metricsIntervalRef.current !== null) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
    if (serverStatus === 'running') {
      metricsIntervalRef.current = window.setInterval(fetchServerMetrics, 3000) as unknown as number;
    }
    return () => {
      if (metricsIntervalRef.current !== null) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, [serverStatus, fetchServerMetrics]);

  const errorCount = useMemo(() => {
    return serverLogs.filter(log => log.level.toUpperCase() === 'ERROR').length;
  }, [serverLogs]);

  return {
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
  };
};
