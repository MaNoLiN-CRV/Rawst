import React, { memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  useTheme,
  IconButton,
  Grid,
  LinearProgress,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { ServerStatus, ServerMetrics } from './types';
import { formatDuration } from '../../utils/formatters';

interface ServerControlsProps {
  status: ServerStatus;
  metrics: ServerMetrics | null;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRefresh: () => void;
  message: string;
}

const ServerControls = memo(({ 
  status, 
  metrics, 
  onStart, 
  onStop, 
  onRestart, 
  onRefresh, 
  message 
}: ServerControlsProps) => {
  const theme = useTheme();
  
  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Server Control
        </Typography>
        <Tooltip title="Refresh server status">
          <IconButton onClick={onRefresh} size="small" aria-label="Refresh server status">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Grid container spacing={2} alignItems="center">
        <Grid>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color={status === 'running' ? 'success' : 'primary'}
              onClick={onStart}
              disabled={status === 'starting' || status === 'running' || status === 'restarting'}
              startIcon={status === 'starting' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              aria-label={status === 'running' ? 'API Server is running' : 'Start API Server'}
            >
              {status === 'running' ? 'Server Running' : (status === 'starting' ? 'Starting...' : 'Start Server')}
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              onClick={onStop}
              disabled={status !== 'running'}
              startIcon={<StopIcon />}
              aria-label="Stop API Server"
            >
              Stop Server
            </Button>
            
            <Button
              variant="outlined"
              color="warning"
              onClick={onRestart}
              disabled={status !== 'running'}
              startIcon={<RestartAltIcon />}
              aria-label="Restart API Server"
            >
              Restart
            </Button>
          </Box>
        </Grid>
        
        <Grid >
          <Box>
            <Typography 
              variant="body2" 
              color={
                status === 'error' ? 'error' : 
                (status === 'running' ? 'success.main' : 
                (status === 'starting' || status === 'restarting' ? 'warning.main' : 'text.secondary'))
              }
              sx={{ mb: 1 }}
            >
              <strong>Status:</strong> {message || status.toUpperCase()}
            </Typography>
            
            {metrics && status === 'running' && (
              <Typography variant="body2" color="text.secondary">
                <strong>Uptime:</strong> {formatDuration(metrics.uptime_seconds)} | 
                <strong> Requests:</strong> {metrics.request_count} | 
                <strong> Errors:</strong> {metrics.error_count}
              </Typography>
            )}
            
            {(status === 'starting' || status === 'restarting') && (
              <LinearProgress sx={{ mt: 1 }} />
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
});

ServerControls.displayName = 'ServerControls';
export default ServerControls;
