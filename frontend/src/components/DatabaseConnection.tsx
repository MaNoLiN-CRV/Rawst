import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';

/**
 * Props for the DatabaseConnection component
 */
interface Props {
  onConnect: (config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) => void;
  loading?: boolean;
  error?: string;
}

/**
 * Component for connecting to a MariaDB database
 */
const DatabaseConnection: React.FC<Props> = ({ onConnect, loading, error }) => {
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(3306);
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect({ host, port, user, password, database });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>MariaDB Connection</Typography>
      <TextField label="Host" value={host} onChange={e => setHost(e.target.value)} fullWidth margin="normal" required />
      <TextField label="Port" type="number" value={port} onChange={e => setPort(Number(e.target.value))} fullWidth margin="normal" required />
      <TextField label="Username" value={user} onChange={e => setUser(e.target.value)} fullWidth margin="normal" required />
      <TextField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth margin="normal" />
      <TextField label="Database" value={database} onChange={e => setDatabase(e.target.value)} fullWidth margin="normal" required />
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ mt: 2 }}>
        {loading ? 'Connecting...' : 'Connect'}
      </Button>
    </Box>
  );
};

export default DatabaseConnection; 