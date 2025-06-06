import React from 'react';
import { Box } from '@mui/material';
import { TabPanelProps } from './types';

/**
 * Reusable TabPanel component for organizing content in tabs
 */
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

TabPanel.displayName = 'TabPanel';

export default TabPanel;
