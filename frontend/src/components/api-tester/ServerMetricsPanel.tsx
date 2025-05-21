import { memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';
import { ServerMetrics } from './types'; 
import { formatDuration, formatTimestamp } from '../../utils/formatters';

interface ServerMetricsPanelProps {
  metrics: ServerMetrics | null;
  isLoading: boolean;
}

const ServerMetricsPanel = memo(({ metrics, isLoading }: ServerMetricsPanelProps) => {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!metrics) {
    return (
      <Alert severity="info">
        No metrics available. The server may not be running.
      </Alert>
    );
  }
  
  const successRate = metrics.request_count > 0
    ? ((metrics.request_count - metrics.error_count) / metrics.request_count) * 100
    : 100;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Server Metrics</Typography>
      
      <Grid container spacing={3}>
        <Grid>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>Status Overview</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Server Status" 
                  secondary={metrics.is_running ? "Running" : "Stopped"} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                  secondaryTypographyProps={{ color: metrics.is_running ? 'success.main' : 'error' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Uptime" 
                  secondary={formatDuration(metrics.uptime_seconds)} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Start Time" 
                  secondary={formatTimestamp(metrics.start_time)} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Current Time" 
                  secondary={formatTimestamp(metrics.current_time)} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid >
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>Request Statistics</Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Total Requests" 
                  secondary={metrics.request_count} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Error Count" 
                  secondary={metrics.error_count} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                  secondaryTypographyProps={{ color: metrics.error_count > 0 ? 'error' : undefined }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Success Rate" 
                  secondary={`${successRate.toFixed(1)}%`} 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                  secondaryTypographyProps={{ 
                    color: successRate < 95 
                      ? (successRate < 80 ? 'error' : 'warning.main') 
                      : 'success.main' 
                  }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Requests Per Minute" 
                  secondary={metrics.uptime_seconds > 60 
                    ? (metrics.request_count / (metrics.uptime_seconds / 60)).toFixed(2)
                    : "N/A (need > 1 minute of uptime)"
                  } 
                  primaryTypographyProps={{ fontWeight: 'medium' }} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
});

ServerMetricsPanel.displayName = 'ServerMetricsPanel';
export default ServerMetricsPanel;
