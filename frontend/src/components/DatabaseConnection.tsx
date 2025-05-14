import React, { useState } from 'react';
import { TextField, Button, Box, Typography, FormControlLabel, Switch, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

/**
 * Props for the DatabaseConnection component
 */
interface Props {
  onConnect: (config: {
    host: string;
    port: number;
    username: string;
    password: string;
    database_name: string;
    db_type: "PostgreSQL" | "MySQL" | "SQLite" | "MongoDB";
    connection_string: string;
    ssl_enabled: boolean;
    max_connections?: number;
    timeout_seconds?: number;
  }) => void;
  loading?: boolean;
  error?: string;
}

/**
 * Component for connecting to a database
 */
const DatabaseConnection: React.FC<Props> = ({ onConnect, loading, error }) => {
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(3306);
  const [username, setUsername] = useState('root');
  const [password, setPassword] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [dbType, setDbType] = useState<"PostgreSQL" | "MySQL" | "SQLite" | "MongoDB">("MySQL");
  const [sslEnabled, setSslEnabled] = useState(false);
  const [maxConnections, setMaxConnections] = useState(10);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect({ 
      host, 
      port, 
      username, 
      password, 
      database_name: databaseName,
      db_type: dbType,
      connection_string: `mysql://${username}:${password}@${host}:${port}/${databaseName}`,
      ssl_enabled: sslEnabled,
      max_connections: maxConnections,
      timeout_seconds: timeoutSeconds
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>Database Connection</Typography>
      <TextField label="Host" value={host} onChange={e => setHost(e.target.value)} fullWidth margin="normal" required />
      <TextField label="Port" type="number" value={port} onChange={e => setPort(Number(e.target.value))} fullWidth margin="normal" required />
      <TextField label="Username" value={username} onChange={e => setUsername(e.target.value)} fullWidth margin="normal" required />
      <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth margin="normal" />
      <TextField label="Database Name" value={databaseName} onChange={e => setDatabaseName(e.target.value)} fullWidth margin="normal" required />
      <FormControl fullWidth margin="normal">
        <InputLabel>Database Type</InputLabel>
        <Select
          value={dbType}
          label="Database Type"
          onChange={e => setDbType(e.target.value as "PostgreSQL" | "MySQL" | "SQLite" | "MongoDB")}
        >
          <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
          <MenuItem value="MySQL">MySQL</MenuItem>
          <MenuItem value="SQLite">SQLite</MenuItem>
          <MenuItem value="MongoDB">MongoDB</MenuItem>
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Switch checked={sslEnabled} onChange={e => setSslEnabled(e.target.checked)} />}
        label="SSL Enabled"
      />
      <TextField label="Max Connections" type="number" value={maxConnections} onChange={e => setMaxConnections(Number(e.target.value))} fullWidth margin="normal" />
      <TextField label="Timeout (seconds)" type="number" value={timeoutSeconds} onChange={e => setTimeoutSeconds(Number(e.target.value))} fullWidth margin="normal" />
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
        {loading ? 'Connecting...' : 'Connect'}
      </Button>
    </Box>
  );
};

export default DatabaseConnection; 