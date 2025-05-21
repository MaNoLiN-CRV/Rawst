import React, { memo, useCallback } from 'react';
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
      case 'ERROR': return theme.palette.error.main;
      case 'WARNING': return theme.palette.warning.main;
      case 'INFO': return theme.palette.info.main;
      case 'DEBUG': return theme.palette.text.secondary;
      default: return theme.palette.text.primary;
    }
  }, [theme]);
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Server Logs</Typography>
        <Tooltip title="Refresh logs">
          <IconButton onClick={onRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Alert severity="info">No logs available.</Alert>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            maxHeight: '400px', 
            overflow: 'auto', 
            bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50' 
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
                          color: theme.palette.getContrastText(getLogColor(log.level)),
                          width: 70,
                          fontSize: '0.7rem'
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        component="span" 
                        sx={{ fontWeight: log.level.toUpperCase() === 'ERROR' ? 'bold' : 'normal' }}
                      >
                        {log.message}
                      </Typography>
                    </Box>
                  }
                  secondary={formatTimestamp(log.timestamp)}
                  secondaryTypographyProps={{ 
                    variant: 'caption',
                    sx: { color: theme.palette.text.secondary }
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
