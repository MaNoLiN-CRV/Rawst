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
        <CircularProgress sx={{ color: 'rgba(99, 102, 241, 0.8)' }} />
      </Box>
    );
  }
  
  if (!metrics) {
    return (
      <Alert 
        severity="info"
        sx={{
          background: 'rgba(59, 130, 246, 0.15) !important',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 2,
          color: 'rgba(255,255,255,0.9)',
          '& .MuiAlert-icon': {
            color: '#3b82f6',
          }
        }}
      >
        No metrics available. The server may not be running.
      </Alert>
    );
  }
  
  const successRate = metrics.request_count > 0
    ? ((metrics.request_count - metrics.error_count) / metrics.request_count) * 100
    : 100;
  
  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 600,
          mb: 3,
        }}
      >
        Server Metrics
      </Typography>
      
      <Grid container spacing={3}>
        <Grid>
          <Paper 
            sx={{ 
              p: 2, 
              height: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
              }}
            >
              Status Overview
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Server Status" 
                  secondary={metrics.is_running ? "Running" : "Stopped"} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: metrics.is_running ? '#10b981' : '#ef4444' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Uptime" 
                  secondary={formatDuration(metrics.uptime_seconds)} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Start Time" 
                  secondary={formatTimestamp(metrics.start_time)} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Current Time" 
                  secondary={formatTimestamp(metrics.current_time)} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid >
          <Paper 
            sx={{ 
              p: 2, 
              height: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 2,
            }}
          >
            <Typography 
              variant="subtitle1" 
              gutterBottom
              sx={{
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 600,
              }}
            >
              Request Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Total Requests" 
                  secondary={metrics.request_count} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Error Count" 
                  secondary={metrics.error_count} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: metrics.error_count > 0 ? '#ef4444' : 'rgba(255,255,255,0.8)' }}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Success Rate" 
                  secondary={`${successRate.toFixed(1)}%`} 
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ 
                    color: successRate < 95 
                      ? (successRate < 80 ? '#ef4444' : '#f59e0b') 
                      : '#10b981' 
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
                  primaryTypographyProps={{ fontWeight: 'medium', color: 'rgba(255,255,255,0.9)' }} 
                  secondaryTypographyProps={{ color: 'rgba(255,255,255,0.8)' }}
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
