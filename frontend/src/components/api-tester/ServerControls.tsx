import { memo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
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
  
  return (
    <Box 
      sx={{ 
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 3,
        p: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.6), rgba(139, 92, 246, 0.6))',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography 
          variant="h6" 
          component="h2"
          sx={{ 
            fontWeight: 600,
            color: 'rgba(255,255,255,0.9)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box 
            sx={{ 
              width: 3, 
              height: 20, 
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: 1.5,
            }} 
          />
          Server Control
        </Typography>
        <Tooltip title="Refresh server status">
          <IconButton 
            onClick={onRefresh} 
            size="small" 
            aria-label="Refresh server status"
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255,255,255,0.8)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
                transform: 'rotate(180deg)',
                color: 'rgba(255,255,255,1)',
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3, 
          alignItems: { md: 'center' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', flex: 1 }}>
          <Button
            variant="contained"
            onClick={onStart}
            disabled={status === 'starting' || status === 'running' || status === 'restarting'}
            startIcon={status === 'starting' ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
            aria-label={status === 'running' ? 'API Server is running' : 'Start API Server'}
            sx={{
              minWidth: 140,
              height: 42,
              fontWeight: 600,
              background: status === 'running' 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              boxShadow: status === 'running' 
                ? '0 4px 15px rgba(16, 185, 129, 0.3)' 
                : '0 4px 15px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: status === 'running' 
                  ? '0 8px 25px rgba(16, 185, 129, 0.4)' 
                  : '0 8px 25px rgba(59, 130, 246, 0.4)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.4)',
                boxShadow: 'none',
              }
            }}
          >
            {status === 'running' ? 'Server Running' : (status === 'starting' ? 'Starting...' : 'Start Server')}
          </Button>
          
          <Button
            variant="outlined"
            onClick={onStop}
            disabled={status !== 'running'}
            startIcon={<StopIcon />}
            aria-label="Stop API Server"
            sx={{
              minWidth: 120,
              height: 42,
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'rgba(239, 68, 68, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(239, 68, 68, 0.3)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Stop Server
          </Button>
          
          <Button
            variant="outlined"
            onClick={onRestart}
            disabled={status !== 'running'}
            startIcon={<RestartAltIcon />}
            aria-label="Restart API Server"
            sx={{
              minWidth: 110,
              height: 42,
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 2,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'rgba(245, 158, 11, 0.2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            Restart
          </Button>
        </Box>
        
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            p: 2,
            minWidth: { md: 250 },
          }}
        >
          <Box 
            sx={{ 
              mb: 1,
              fontWeight: 600,
              color: status === 'error' ? '#ef4444' : 
                    (status === 'running' ? '#10b981' : 
                    (status === 'starting' || status === 'restarting' ? '#f59e0b' : 'rgba(255,255,255,0.6)')),
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontSize: '0.875rem',
            }}
          >
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%',
                background: status === 'error' ? '#ef4444' : 
                           (status === 'running' ? '#10b981' : 
                           (status === 'starting' || status === 'restarting' ? '#f59e0b' : 'rgba(255,255,255,0.3)')),
                boxShadow: status === 'running' ? '0 0 8px #10b98140' : 
                          (status === 'error' ? '0 0 8px #ef444440' : 'none'),
              }} 
            />
            <Typography component="span" sx={{ fontWeight: 600 }}>Status:</Typography> 
            <Typography component="span">{message || status.toUpperCase()}</Typography>
          </Box>
          
          {metrics && status === 'running' && (
            <Box 
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.8rem',
                lineHeight: 1.4,
              }}
            >
              <Typography component="span" sx={{ fontWeight: 600 }}>Uptime:</Typography> 
              <Typography component="span"> {formatDuration(metrics.uptime_seconds)}</Typography>
              <br />
              <Typography component="span" sx={{ fontWeight: 600 }}>Requests:</Typography> 
              <Typography component="span"> {metrics.request_count} | </Typography>
              <Typography component="span" sx={{ fontWeight: 600 }}>Errors:</Typography> 
              <Typography component="span"> {metrics.error_count}</Typography>
            </Box>
          )}
          
          {(status === 'starting' || status === 'restarting') && (
            <LinearProgress 
              sx={{ 
                mt: 1,
                height: 4,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                  borderRadius: 2,
                }
              }} 
            />
          )}
        </Box>
      </Box>
    </Box>
  );
});

ServerControls.displayName = 'ServerControls';
export default ServerControls;
