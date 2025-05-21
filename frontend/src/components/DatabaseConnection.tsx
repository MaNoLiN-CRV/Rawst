import React, { useState, useCallback, useMemo, useEffect } from 'react'; // Added useCallback, useMemo, useEffect
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  FormControlLabel, 
  Switch, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  SelectChangeEvent,
  CircularProgress, // Added CircularProgress
  Alert, // Added Alert
  Grid // Added Grid for layout
} from '@mui/material';

// --- START TYPE DEFINITIONS ---

/**
 * Supported database types.
 */
export type DatabaseType = "PostgreSQL" | "MySQL" | "SQLite" | "MongoDB";

/**
 * Configuration for database connection.
 * This interface defines the data structure expected by the `onConnect` callback.
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password?: string; // Password can be optional depending on DB auth
  database_name: string;
  db_type: DatabaseType;
  connection_string?: string; // Can be auto-generated or manually entered
  ssl_enabled: boolean;
  max_connections?: number;
  timeout_seconds?: number;
  // Add other relevant fields like ca_cert, client_key, client_cert for SSL if needed
}

/**
 * Props for the DatabaseConnection component.
 */
interface DatabaseConnectionProps {
  /**
   * Callback function invoked when the user submits the connection form.
   * @param config - The database connection configuration object.
   */
  onConnect: (config: DatabaseConfig) => Promise<void> | void; // Allow async onConnect
  /**
   * Indicates if the connection process is ongoing.
   * Disables the form and shows a loading indicator on the button.
   */
  loading?: boolean;
  /**
   * An error message to display if the connection attempt failed.
   */
  error?: string | null;
  /**
   * Optional initial configuration to pre-fill the form.
   */
  initialConfig?: Partial<DatabaseConfig>;
}

// --- END TYPE DEFINITIONS ---

const defaultPorts: Record<DatabaseType, number> = {
  MySQL: 3306,
  PostgreSQL: 5432,
  MongoDB: 27017,
  SQLite: 0, // Port is not typically used for SQLite file-based connections
};

/**
 * `DatabaseConnection` is a form component that allows users to input
 * database connection parameters and initiate a connection.
 */
const DatabaseConnection: React.FC<DatabaseConnectionProps> = ({ 
  onConnect,
  loading = false, // Default loading to false
  error = null,    // Default error to null
  initialConfig = {} // Default initialConfig to empty object
}) => {
  const [host, setHost] = useState<string>(initialConfig.host || 'localhost');
  const [port, setPort] = useState<number | ''> (initialConfig.port || defaultPorts.MySQL);
  const [username, setUsername] = useState<string>(initialConfig.username || 'root');
  const [password, setPassword] = useState<string>(initialConfig.password || '');
  const [databaseName, setDatabaseName] = useState<string>(initialConfig.database_name || '');
  const [dbType, setDbType] = useState<DatabaseType>(initialConfig.db_type || "MySQL");
  const [sslEnabled, setSslEnabled] = useState<boolean>(initialConfig.ssl_enabled || false);
  const [maxConnections, setMaxConnections] = useState<number | ''> (initialConfig.max_connections || 10);
  const [timeoutSeconds, setTimeoutSeconds] = useState<number | ''> (initialConfig.timeout_seconds || 30);
  // Optional: For manual connection string input, if needed
  // const [manualConnectionString, setManualConnectionString] = useState<string>(initialConfig.connection_string || '');
  // const [useManualConnectionString, setUseManualConnectionString] = useState<boolean>(!!initialConfig.connection_string);

  // Update port when dbType changes and it's a known type with a default port
  useEffect(() => {
    if (initialConfig.port === undefined) { // Only change if port wasn't explicitly set by initialConfig
        setPort(defaultPorts[dbType] || '');
    }
  }, [dbType, initialConfig.port]);

  /**
   * Generates a connection string based on the current form inputs.
   * This is a memoized function that re-calculates only when relevant inputs change.
   */
  const generatedConnectionString = useMemo((): string => {
    if (dbType === 'SQLite') {
      return `sqlite://${databaseName}`; // SQLite typically uses a file path for databaseName
    }
    const creds = username ? `${encodeURIComponent(username)}${password ? `:${encodeURIComponent(password)}` : ''}@` : '';
    const portNumber = typeof port === 'number' && port > 0 ? `:${port}` : '';
    const dbSuffix = databaseName ? `/${encodeURIComponent(databaseName)}` : '';
    
    let protocol = dbType.toLowerCase();
    if (dbType === 'PostgreSQL') protocol = 'postgresql'; // Common alias

    return `${protocol}://${creds}${host}${portNumber}${dbSuffix}`;
  }, [host, port, username, password, databaseName, dbType]);

  /**
   * Handles the form submission.
   * Prevents default form action and calls the `onConnect` prop with the configuration.
   */
  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const currentPort = typeof port === 'number' ? port : defaultPorts[dbType] || 0;
    const currentMaxConnections = typeof maxConnections === 'number' ? maxConnections : undefined;
    const currentTimeoutSeconds = typeof timeoutSeconds === 'number' ? timeoutSeconds : undefined;

    const config: DatabaseConfig = {
      host,
      port: currentPort,
      username,
      password,
      database_name: databaseName,
      db_type: dbType,
      // connection_string: useManualConnectionString ? manualConnectionString : generatedConnectionString,
      connection_string: generatedConnectionString, // Simplified to always use generated for now
      ssl_enabled: sslEnabled,
      max_connections: currentMaxConnections,
      timeout_seconds: currentTimeoutSeconds,
    };
    await onConnect(config);
  }, [
    onConnect,
    host,
    port,
    username,
    password,
    databaseName,
    dbType,
    generatedConnectionString,
    sslEnabled,
    maxConnections,
    timeoutSeconds,
    // useManualConnectionString, manualConnectionString // If manual string input is used
  ]);

  const handlePortChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setPort(value === '' ? '' : Number(value));
  }, []);

  const handleMaxConnectionsChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMaxConnections(value === '' ? '' : Number(value));
  }, []);

  const handleTimeoutChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTimeoutSeconds(value === '' ? '' : Number(value));
  }, []);

  const handleDbTypeChange = useCallback((event: SelectChangeEvent<DatabaseType>) => {
    const newDbType = event.target.value as DatabaseType;
    setDbType(newDbType);
    // If port was not part of initialConfig, update to default for the new DB type
    if (initialConfig.port === undefined && defaultPorts[newDbType] !== undefined) {
      setPort(defaultPorts[newDbType] || '');
    }
  }, [initialConfig.port]);

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit} 
      sx={{ 
        maxWidth: 500, 
        mx: 'auto', 
        mt: { xs: 2, sm: 4 }, 
        p: { xs: 2, sm: 3 },
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        boxShadow: 1
      }}
      aria-labelledby="db-connection-title"
    >
      <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center' }} id="db-connection-title">
        Database Connection
      </Typography>
      
      {/* Optional: Manual Connection String Toggle 
      <FormControlLabel
        control={<Switch checked={useManualConnectionString} onChange={(e) => setUseManualConnectionString(e.target.checked)} />}
        label="Use Manual Connection String"
        sx={{ mb: 1 }}
      />
      {useManualConnectionString ? (
        <TextField 
          label="Connection String" 
          value={manualConnectionString} 
          onChange={e => setManualConnectionString(e.target.value)} 
          fullWidth 
          margin="normal" 
          required={useManualConnectionString}
          disabled={loading}
        />
      ) : ( */} 
      <Grid container spacing={2}>
        <Grid>
          <TextField 
            label="Host / Server Address" 
            value={host} 
            onChange={e => setHost(e.target.value)} 
            fullWidth 
            margin="normal" 
            required 
            disabled={loading || dbType === 'SQLite'}
            size="small"
          />
        </Grid>
        <Grid >
          <TextField 
            label="Port" 
            type="number" 
            value={port} 
            onChange={handlePortChange} 
            fullWidth 
            margin="normal" 
            required 
            disabled={loading || dbType === 'SQLite'}
            InputProps={{ inputProps: { min: 0, max: 65535 } }}
            size="small"
          />
        </Grid>
        <Grid>
          <TextField 
            label="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            fullWidth 
            margin="normal" 
            // required // Not always required (e.g. SQLite, or some MongoDB setups)
            disabled={loading || dbType === 'SQLite'}
            size="small"
          />
        </Grid>
        <Grid>
          <TextField 
            label="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            fullWidth 
            margin="normal" 
            disabled={loading || dbType === 'SQLite'}
            size="small"
          />
        </Grid>
        <Grid>
          <TextField 
            label={dbType === 'SQLite' ? "Database File Path" : "Database Name"} 
            value={databaseName} 
            onChange={e => setDatabaseName(e.target.value)} 
            fullWidth 
            margin="normal" 
            required 
            disabled={loading}
            size="small"
            helperText={dbType === 'SQLite' ? "e.g., /path/to/your/database.db or just filename.db" : ""}
          />
        </Grid>
        {dbType !== 'SQLite' && (
          <Grid>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="db-type-label">Database Type</InputLabel>
              <Select
                labelId="db-type-label"
                value={dbType}
                label="Database Type"
                onChange={handleDbTypeChange}
                disabled={loading}
              >
                <MenuItem value="MySQL">MySQL</MenuItem>
                <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
                <MenuItem value="MongoDB">MongoDB</MenuItem>
                <MenuItem value="SQLite">SQLite</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        {/* If SQLite is selected, show the DB Type selector as full width or hide it if it's fixed to SQLite */}
        {dbType === 'SQLite' && (
             <Grid>
                <FormControl fullWidth margin="normal" size="small">
                    <InputLabel id="db-type-label-sqlite">Database Type</InputLabel>
                    <Select value={dbType} label="Database Type" onChange={handleDbTypeChange} disabled={loading}>
                        <MenuItem value="SQLite">SQLite</MenuItem>
                        {/* Optionally allow changing from SQLite to others if needed */}
                        {/* <MenuItem value="MySQL">MySQL</MenuItem> ... */}
                    </Select>
                </FormControl>
            </Grid>
        )}

        <Grid>
          <TextField 
            label="Max Connections (optional)" 
            type="number" 
            value={maxConnections} 
            onChange={handleMaxConnectionsChange} 
            fullWidth 
            margin="normal" 
            disabled={loading}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Grid>
        <Grid>
          <TextField 
            label="Timeout (seconds, optional)" 
            type="number" 
            value={timeoutSeconds} 
            onChange={handleTimeoutChange} 
            fullWidth 
            margin="normal" 
            disabled={loading}
            InputProps={{ inputProps: { min: 1 } }}
            size="small"
          />
        </Grid>
        <Grid>
          <FormControlLabel
            control={<Switch checked={sslEnabled} onChange={e => setSslEnabled(e.target.checked)} disabled={loading || dbType === 'SQLite'} />}
            label="Enable SSL/TLS"
            sx={{ mt: 1 }}
          />
        </Grid>
      </Grid>
      {/* )} End of conditional rendering for manual connection string */}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 1 }} role="alert">
          {error}
        </Alert>
      )}
      
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        fullWidth 
        disabled={loading}
        sx={{ mt: 3, py: 1.5 }} // Larger button
        aria-label={loading ? 'Connecting to database' : 'Connect to database'}
      >
        {loading ? <CircularProgress size={24} color="inherit" sx={{mr: 1}} /> : null}
        {loading ? 'Connecting...' : 'Connect'}
      </Button>

      {/* Display generated connection string for user reference (optional) */}
      {!loading && dbType !== 'SQLite' && (
        <Box sx={{mt: 2, p:1, backgroundColor: 'grey[100]', borderRadius: 1, border: '1px solid', borderColor: 'divider'}}>
            <Typography variant="caption" display="block" gutterBottom>Generated URI (for reference):</Typography>
            <Typography variant="caption" sx={{wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem'}}>{generatedConnectionString}</Typography>
        </Box>
      )}
       {dbType === 'SQLite' && (
        <Box sx={{mt: 2, p:1, backgroundColor: 'grey[100]', borderRadius: 1, border: '1px solid', borderColor: 'divider'}}>
            <Typography variant="caption" display="block" gutterBottom>SQLite Path (for reference):</Typography>
            <Typography variant="caption" sx={{wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem'}}>{databaseName}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default DatabaseConnection;