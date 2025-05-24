import { useState } from 'react';

export interface ApiTesterState {
  monitoringTabValue: number;
  setMonitoringTabValue: (value: number) => void;
}

export const useApiTesterState = (): ApiTesterState => {
  const [monitoringTabValue, setMonitoringTabValue] = useState<number>(0);

  return {
    monitoringTabValue,
    setMonitoringTabValue,
  };
};
