import React from 'react';
import { Box } from '@mui/material';
import { TabPanelProps } from '../api-tester/types';

/**
 * A simple panel component to display content for a selected tab.
 */
export function TabPanel(props: TabPanelProps): React.ReactElement | null {
  const { children, value, index, ...other } = props;

  if (value !== index) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`common-tabpanel-${index}`}
      aria-labelledby={`common-tab-${index}`}
      {...other}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {children}
      </Box>
    </div>
  );
}

export default TabPanel;
