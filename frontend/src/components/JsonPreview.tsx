import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Collapse } from '@mui/material';

/**
 * Props for the JsonPreview component
 */
interface Props {
  json: any;
}

/**
 * Component that displays a formatted JSON preview with copy and collapse functionality
 */
const JsonPreview: React.FC<Props> = ({ json }) => {
  const [formattedJson, setFormattedJson] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    try {
      // Check if there are entities for debugging
      const hasEntities = json?.entities_basic && Array.isArray(json.entities_basic);
      console.log(`JsonPreview received data: ${hasEntities ? 'YES' : 'NO'}, entities: ${hasEntities ? json.entities_basic.length : 0}`);
      
      if (hasEntities && json.entities_basic.length > 0) {
        console.log("Entities in JSON:", json.entities_basic);
      } else {
        console.warn("⚠️ JSON has no entities or is empty");
      }
      
      setFormattedJson(JSON.stringify(json, null, 2));
    } catch (e) {
      console.error("Error formatting JSON:", e);
      setFormattedJson('Error parsing JSON');
    }
  }, [json]);
  
  /**
   * Copy JSON content to clipboard
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedJson);
  };

  /**
   * Toggle the collapsed state of the JSON preview
   */
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Check if JSON has content in the entities_basic array
  const hasEntitiesBasic = json?.entities_basic && Array.isArray(json.entities_basic) && json.entities_basic.length > 0;

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          JSON Preview 
          {hasEntitiesBasic ? 
            <Typography component="span" color="success.main" sx={{ ml: 1 }}>
              (✓ {json.entities_basic.length} {json.entities_basic.length !== 1 ? 'entities' : 'entity'})
            </Typography> : 
            <Typography component="span" color="error.main" sx={{ ml: 1 }}>
              (✗ No entities)
            </Typography>
          }
        </Typography>
        <Box>
          <Button variant="outlined" onClick={toggleCollapse} sx={{ mr: 1 }}>
            {collapsed ? 'Expand' : 'Collapse'}
          </Button>
          <Button variant="outlined" onClick={copyToClipboard}>
            Copy to Clipboard
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
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.href = '#/api-tester'}
          sx={{
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: 'var(--secondary-color)',
            },
            mr: 2
          }}
        >
          Test API
        </Button>
      </Box>
    </Box>
  );
};

export default JsonPreview; 