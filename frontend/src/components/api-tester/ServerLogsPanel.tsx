import { memo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  Chip,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ServerLogEntry } from './types';
import { formatTimestamp } from '../../utils/formatters'; 

interface ServerLogsPanelProps {
  logs: ServerLogEntry[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ServerLogsPanel = memo(({ logs, isLoading, onRefresh }: ServerLogsPanelProps) => {
  const theme = useTheme();
  
  const getLogColor = useCallback((level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR': return '#ef4444';
      case 'WARNING': return '#f59e0b';
      case 'INFO': return '#3b82f6';
      case 'DEBUG': return 'rgba(255,255,255,0.6)';
      default: return 'rgba(255,255,255,0.8)';
    }
  }, []);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography 
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 600,
          }}
        >
          Server Logs
        </Typography>
        <Tooltip title="Refresh logs">
          <IconButton 
            onClick={onRefresh} 
            disabled={isLoading}
            sx={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255,255,255,0.8)',
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: 'rgba(99, 102, 241, 0.8)' }} />
        </Box>
      ) : logs.length === 0 ? (
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
          No logs available.
        </Alert>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            maxHeight: '400px', 
            overflow: 'auto', 
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
          }}
        >
          <List dense>
            {logs.map((log, index) => (
              <ListItem 
                key={`${log.timestamp}-${index}`} 
                divider={index < logs.length - 1}
                sx={{
                  borderLeft: `4px solid ${getLogColor(log.level)}`,
                  bgcolor: log.level.toUpperCase() === 'ERROR' 
                    ? theme.palette.error.main + '10' 
                    : undefined
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={log.level} 
                        size="small" 
                        sx={{ 
                          bgcolor: getLogColor(log.level),
                          color: log.level.toUpperCase() === 'DEBUG' ? '#000' : '#fff',
                          width: 70,
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        component="span" 
                        sx={{ 
                          fontWeight: log.level.toUpperCase() === 'ERROR' ? 'bold' : 'normal',
                          color: 'rgba(255,255,255,0.9)'
                        }}
                      >
                        {log.message}
                      </Typography>
                    </Box>
                  }
                  secondary={formatTimestamp(log.timestamp)}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { color: 'rgba(255,255,255,0.7)' }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
});

ServerLogsPanel.displayName = 'ServerLogsPanel';
export default ServerLogsPanel;
