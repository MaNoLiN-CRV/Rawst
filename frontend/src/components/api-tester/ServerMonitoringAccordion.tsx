import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Tabs,
  Tab,
  Button,
  Grid,
  Paper,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BarChartIcon from '@mui/icons-material/BarChart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ServerLogsPanel from './ServerLogsPanel';
import ServerMetricsModal from './ServerMetricsModal';
import TabPanel from '../common/TabPanel';
import { ServerLogEntry, ServerMetrics } from './types';
import { formatDuration } from '../../utils/formatters';

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
 * Server monitoring accordion component with metrics modal
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
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);

  const handleOpenMetrics = () => {
    setMetricsModalOpen(true);
  };

  const handleCloseMetrics = () => {
    setMetricsModalOpen(false);
  };

  return (
    <>
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
          {/* Quick Metrics Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid>
              <Paper
                sx={{
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  📊 Quick Overview
                </Typography>
                {serverMetrics ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Status</Typography>
                      <Chip 
                        label={serverMetrics.is_running ? 'Running' : 'Stopped'}
                        color={serverMetrics.is_running ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Uptime</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatDuration(serverMetrics.uptime_seconds)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Requests</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {serverMetrics.request_count.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">Errors</Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600,
                          color: serverMetrics.error_count > 0 ? '#ef4444' : '#10b981'
                        }}
                      >
                        {serverMetrics.error_count}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography color="textSecondary">
                    No metrics available - server may not be running
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid>
              <Button
                variant="contained"
                fullWidth
                startIcon={<TrendingUpIcon />}
                onClick={handleOpenMetrics}
                sx={{
                  height: '100%',
                  minHeight: 120,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8, #6b46c1)',
                  },
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                View Detailed Metrics
              </Button>
            </Grid>
          </Grid>

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
                icon={<Badge badgeContent={errorCount} color="error" invisible={errorCount === 0}>
                  <ListAltIcon />
                </Badge>}
                iconPosition="start"
                label="Server Logs"
                id="monitoring-tab-0"
                aria-controls="monitoring-tabpanel-0"
              />
            </Tabs>
          </Box>
          <TabPanel value={tabValue} index={0}>
            <ServerLogsPanel
              logs={serverLogs}
              isLoading={isLoadingLogs}
              onRefresh={onRefreshLogs}
            />
          </TabPanel>
        </AccordionDetails>
      </Accordion>

      {/* Metrics Modal */}
      <ServerMetricsModal
        open={metricsModalOpen}
        onClose={handleCloseMetrics}
        metrics={serverMetrics}
        isLoading={isLoadingMetrics}
      />
    </>
  );
};

export default React.memo(ServerMonitoringAccordion);
