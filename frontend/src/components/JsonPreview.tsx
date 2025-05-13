import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Collapse } from '@mui/material';

interface Props {
  json: any;
}

const JsonPreview: React.FC<Props> = ({ json }) => {
  const [formattedJson, setFormattedJson] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    try {
      setFormattedJson(JSON.stringify(json, null, 2));
    } catch (e) {
      setFormattedJson('Error parsing JSON');
    }
  }, [json]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedJson);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Check if JSON has content in the entities_basic array
  const hasEntitiesBasic = json?.entities_basic && Array.isArray(json.entities_basic) && json.entities_basic.length > 0;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Vista Previa JSON 
          {hasEntitiesBasic ? 
            <Typography component="span" color="success.main" sx={{ ml: 1 }}>
              (✓ {json.entities_basic.length} entidad{json.entities_basic.length !== 1 ? 'es' : ''})
            </Typography> : 
            <Typography component="span" color="error.main" sx={{ ml: 1 }}>
              (✗ Sin entidades)
            </Typography>
          }
        </Typography>
        <Box>
          <Button variant="outlined" onClick={toggleCollapse} sx={{ mr: 1 }}>
            {collapsed ? 'Expandir' : 'Colapsar'}
          </Button>
          <Button variant="outlined" onClick={copyToClipboard}>
            Copiar al Portapapeles
          </Button>
        </Box>
      </Box>
      <Collapse in={!collapsed}>
        <Paper 
          sx={{ 
            p: 2, 
            maxHeight: '400px', 
            overflow: 'auto',
            backgroundColor: '#f5f5f5',
            '& pre': {
              margin: 0,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }
          }}
        >
          <pre>{formattedJson}</pre>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default JsonPreview; 