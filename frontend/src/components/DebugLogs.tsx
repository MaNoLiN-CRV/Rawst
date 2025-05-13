import { Paper, Typography, Box, useTheme } from '@mui/material';

interface DebugLogsProps {
  logs: string[];
}

/**
 * Debug console component to display logs in the UI
 */
const DebugLogs = ({ logs }: DebugLogsProps) => {
  const theme = useTheme();
  
  return (
    <Paper 
      sx={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        zIndex: 9999,
        padding: 2,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: theme.shape.borderRadius,
        boxShadow: theme.shadows[10]
      }}
    >
      <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>Debug Console:</Typography>
      {logs.map((log, i) => (
        <Box key={i} sx={{ mb: 0.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {log}
        </Box>
      ))}
    </Paper>
  );
};

export default DebugLogs; 