import React from 'react';
import { Box, Typography, Checkbox, FormGroup, FormControlLabel, Divider, Paper } from '@mui/material';

export interface EntityFieldConfig {
  fields: string[];
  endpoints: string[];
}

interface Props {
  entities: { [table: string]: string[] }; // tabla: campos[]
  config: { [table: string]: EntityFieldConfig };
  onChange: (config: { [table: string]: EntityFieldConfig }) => void;
}

const endpointOptions = ['GET', 'POST', 'PUT', 'DELETE'];

const EntityConfig: React.FC<Props> = ({ entities, config, onChange }) => {
  const handleFieldToggle = (table: string, field: string) => {
    const prev = config[table]?.fields || [];
    const newFields = prev.includes(field)
      ? prev.filter(f => f !== field)
      : [...prev, field];
    onChange({
      ...config,
      [table]: {
        ...config[table],
        fields: newFields,
        endpoints: config[table]?.endpoints || [],
      },
    });
  };

  const handleEndpointToggle = (table: string, endpoint: string) => {
    const prev = config[table]?.endpoints || [];
    const newEndpoints = prev.includes(endpoint)
      ? prev.filter(e => e !== endpoint)
      : [...prev, endpoint];
    onChange({
      ...config,
      [table]: {
        ...config[table],
        fields: config[table]?.fields || [],
        endpoints: newEndpoints,
      },
    });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>Configura cada entidad</Typography>
      {Object.entries(entities).map(([table, fields]) => (
        <Paper key={table} sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1">{table}</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">Campos a exponer:</Typography>
          <FormGroup row>
            {fields.map(field => (
              <FormControlLabel
                key={field}
                control={
                  <Checkbox
                    checked={config[table]?.fields?.includes(field) || false}
                    onChange={() => handleFieldToggle(table, field)}
                  />
                }
                label={field}
              />
            ))}
          </FormGroup>
          <Typography variant="body2" sx={{ mt: 2 }}>Endpoints:</Typography>
          <FormGroup row>
            {endpointOptions.map(endpoint => (
              <FormControlLabel
                key={endpoint}
                control={
                  <Checkbox
                    checked={config[table]?.endpoints?.includes(endpoint) || false}
                    onChange={() => handleEndpointToggle(table, endpoint)}
                  />
                }
                label={endpoint}
              />
            ))}
          </FormGroup>
        </Paper>
      ))}
    </Box>
  );
};

export default EntityConfig; 