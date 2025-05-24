import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tabs,
  Tab,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WarningIcon from '@mui/icons-material/Warning';
import ServerMetricsPanel from './ServerMetricsPanel';
import ServerLogsPanel from './ServerLogsPanel';
import TabPanel from '../common/TabPanel';
import { ServerLogEntry, ServerMetrics } from './types';

interface ServerMonitoringAccordionProps {
  errorCount: number;
  tabValue: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  serverMetrics: ServerMetrics | null;
  serverLogs: ServerLogEntry[];
  isLoadingMetrics: boolean;
  isLoadingLogs: boolean;
  onRefreshLogs: () => void;
}

/**
 * Server monitoring accordion component
 */
const ServerMonitoringAccordion: React.FC<ServerMonitoringAccordionProps> = ({
  errorCount,
  tabValue,
  onTabChange,
  serverMetrics,
  serverLogs,
  isLoadingMetrics,
  isLoadingLogs,
  onRefreshLogs,
}) => {
  return (
    <Accordion 
      defaultExpanded={false} 
      sx={{ 
        mb: 4,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 2,
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: 'rgba(0, 0, 0, 0.7)' }} />}
        aria-controls="server-monitoring-content"
        id="server-monitoring-header"
        sx={{ 
          backgroundColor: '#f9f9f9',
          borderRadius: 2,
          minHeight: 64,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: '#000000',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <BarChartIcon sx={{ color: 'rgba(99, 102, 241, 0.8)' }} />
            Server Monitoring
          </Typography>
          {errorCount > 0 && (
            <Badge 
              badgeContent={errorCount} 
              color="error" 
              sx={{ 
                mr: 4,
                '& .MuiBadge-badge': {
                  background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                  boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)',
                }
              }}
            >
              <WarningIcon sx={{ color: '#ff6b6b' }} />
            </Badge>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, backgroundColor: '#ffffff' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={onTabChange}
            aria-label="Server monitoring tabs"
            indicatorColor="primary"
            textColor="primary"
            sx={{
              '& .MuiTab-root': {
                color: '#000000',
                fontWeight: 500,
                borderRadius: 2,
                mx: 0.5,
                '&.Mui-selected': {
                  color: 'rgba(99, 102, 241, 0.9)',
                  background: 'rgba(99, 102, 241, 0.1)',
                }
              },
              '& .MuiTabs-indicator': {
                background: 'rgba(99, 102, 241, 0.8)',
                height: 3,
                borderRadius: 1.5,
              }
            }}
          >
            <Tab
              icon={<BarChartIcon />}
              iconPosition="start"
              label="Metrics"
              id="monitoring-tab-0"
              aria-controls="monitoring-tabpanel-0"
            />
            <Tab
              icon={<Badge badgeContent={errorCount} color="error" invisible={errorCount === 0}>
                <ListAltIcon />
              </Badge>}
              iconPosition="start"
              label="Logs"
              id="monitoring-tab-1"
              aria-controls="monitoring-tabpanel-1"
            />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <ServerMetricsPanel metrics={serverMetrics} isLoading={isLoadingMetrics} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ServerLogsPanel
            logs={serverLogs}
            isLoading={isLoadingLogs}
            onRefresh={onRefreshLogs}
          />
        </TabPanel>
      </AccordionDetails>
    </Accordion>
  );
};

export default React.memo(ServerMonitoringAccordion);
