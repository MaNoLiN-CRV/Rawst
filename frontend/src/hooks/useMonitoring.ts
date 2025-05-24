import { useState, useCallback } from 'react';

interface UseMonitoringProps {
  fetchServerMetrics: () => void;
  fetchServerLogs: () => void;
}

export const useMonitoring = ({ fetchServerLogs }: UseMonitoringProps) => {
  const [tabValue, setTabValue] = useState<number>(0);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
    // Only logs tab now, so always fetch logs
    if (newValue === 0) fetchServerLogs();
  }, [fetchServerLogs]);

  return {
    tabValue,
    handleTabChange,
  };
};
