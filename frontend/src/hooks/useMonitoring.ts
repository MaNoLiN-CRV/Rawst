import { useState, useCallback } from 'react';

interface UseMonitoringProps {
  fetchServerMetrics: () => void;
  fetchServerLogs: () => void;
}

export const useMonitoring = ({ fetchServerMetrics, fetchServerLogs }: UseMonitoringProps) => {
  const [tabValue, setTabValue] = useState<number>(0);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
    if (newValue === 0) fetchServerMetrics();
    else if (newValue === 1) fetchServerLogs();
  }, [fetchServerMetrics, fetchServerLogs]);

  return {
    tabValue,
    handleTabChange,
  };
};
