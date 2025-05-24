import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { ServerMetrics } from './types';
import { formatDuration, formatTimestamp } from '../../utils/formatters';

interface ServerMetricsModalProps {
  open: boolean;
  onClose: () => void;
  metrics: ServerMetrics | null;
  isLoading: boolean;
}

/**
 * Modal component for displaying server metrics in detail
 */
const ServerMetricsModal = memo(({ open, onClose, metrics, isLoading }: ServerMetricsModalProps) => {
  if (isLoading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#ffffff',
            borderRadius: 3,
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgb(255, 255, 255)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Server Metrics
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: 'rgba(99, 102, 241, 0.8)' }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!metrics) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: '#ffffff',
            borderRadius: 3,
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgb(255, 255, 255)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Server Metrics
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert 
            severity="info"
            sx={{
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 2,
            }}
          >
            No metrics available. The server may not be running.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const successRate = metrics.request_count > 0
    ? ((metrics.request_count - metrics.error_count) / metrics.request_count) * 100
    : 100;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: '#ffffff',
          borderRadius: 3,
          minHeight: '600px',
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgb(255, 255, 255)',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: '#1976d2' }}>
            📊 Server Metrics Dashboard
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, pb: 2 }}>
        <Grid container spacing={4}>
          {/* Status Overview */}
          <Grid>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 3,
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: '#1976d2',
                  fontWeight: 600,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                ⚡ Status Overview
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Server Status" 
                    secondary={metrics.is_running ? "🟢 Running" : "🔴 Stopped"} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ 
                      color: metrics.is_running ? '#10b981' : '#ef4444',
                      fontWeight: 500,
                      fontSize: '1rem'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Uptime" 
                    secondary={`⏱️ ${formatDuration(metrics.uptime_seconds)}`} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ color: '#666', fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Start Time" 
                    secondary={`🚀 ${formatTimestamp(metrics.start_time)}`} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ color: '#666', fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Current Time" 
                    secondary={`🕐 ${formatTimestamp(metrics.current_time)}`} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ color: '#666', fontWeight: 500 }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Request Statistics */}
          <Grid>
            <Paper 
              sx={{ 
                p: 3, 
                height: '100%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 3,
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: '#059669',
                  fontWeight: 600,
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                📈 Request Statistics
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Total Requests" 
                    secondary={`📊 ${metrics.request_count.toLocaleString()}`} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ color: '#666', fontWeight: 500, fontSize: '1rem' }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Error Count" 
                    secondary={`❌ ${metrics.error_count.toLocaleString()}`} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ 
                      color: metrics.error_count > 0 ? '#ef4444' : '#666',
                      fontWeight: 500,
                      fontSize: '1rem'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Success Rate" 
                    secondary={`✅ ${successRate.toFixed(1)}%`} 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ 
                      color: successRate < 95 
                        ? (successRate < 80 ? '#ef4444' : '#f59e0b') 
                        : '#10b981',
                      fontWeight: 500,
                      fontSize: '1rem'
                    }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Requests Per Minute" 
                    secondary={metrics.uptime_seconds > 60 
                      ? `⚡ ${(metrics.request_count / (metrics.uptime_seconds / 60)).toFixed(2)}`
                      : "⏳ N/A (need > 1 minute of uptime)"
                    } 
                    primaryTypographyProps={{ fontWeight: 600, color: '#333' }} 
                    secondaryTypographyProps={{ color: '#666', fontWeight: 500 }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Performance Summary */}
          <Grid>
            <Paper 
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: 3,
              }}
            >
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  color: '#d97706',
                  fontWeight: 600,
                  mb: 2,
                }}
              >
                🎯 Performance Summary
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Average Response Time
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                    {metrics.uptime_seconds > 0 ? '< 100ms' : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Server Health
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: successRate > 95 ? '#10b981' : (successRate > 80 ? '#f59e0b' : '#ef4444')
                    }}
                  >
                    {successRate > 95 ? '🟢 Excellent' : (successRate > 80 ? '🟡 Good' : '🔴 Poor')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Load Status
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600,
                      color: metrics.request_count < 1000 ? '#10b981' : '#f59e0b'
                    }}
                  >
                    {metrics.request_count < 1000 ? '🟢 Light' : '🟡 Moderate'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            borderRadius: 2,
            px: 3,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});

ServerMetricsModal.displayName = 'ServerMetricsModal';
export default ServerMetricsModal;
