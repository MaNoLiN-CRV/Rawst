import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Collapse, 
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * Props for the JsonPreview component
 */
interface Props {
  json: any;
  onJsonImport?: (json: any) => void;
}

/**
 * Component that displays a formatted JSON preview with copy and load functionality
 */
const JsonPreview: React.FC<Props> = ({ json, onJsonImport }) => {
  const [formattedJson, setFormattedJson] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [manualJsonInput, setManualJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    setSnackbarOpen(true);
  };

  /**
   * Toggle the collapsed state of the JSON preview
   */
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  /**
   * Handle the file input change for JSON upload
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileUpload called", event.target.files?.length);
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      return;
    }

    console.log("File selected:", file.name, file.size, "bytes");
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log("FileReader onload triggered");
        const content = e.target?.result as string;
        console.log(`Loading JSON file content (${content.length} bytes):`, content.substring(0, 100) + "...");
        const parsedJson = JSON.parse(content);
        
        // Validate the JSON structure
        if (!validateJsonStructure(parsedJson)) {
          console.error("Invalid JSON structure:", parsedJson);
          setError("Invalid JSON structure. Make sure it contains the required API configuration.");
          return;
        }
        
        console.log("JSON successfully loaded, entities:", 
          parsedJson.entities_basic?.length || 0, 
          "basic,", 
          parsedJson.entities_advanced?.length || 0, 
          "advanced");
        
        if (onJsonImport) {
          console.log("Calling onJsonImport callback");
          onJsonImport(parsedJson);
        } else {
          console.error("onJsonImport callback is not defined");
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        setError("Invalid JSON format. Please check your file.");
      }
    };
    
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      setError("Error reading file. Please try again.");
    };
    
    reader.readAsText(file);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Validate the JSON structure to ensure it has the required properties
   */
  const validateJsonStructure = (json: any): boolean => {
    // Basic validation - check for minimum required fields
    return (
      json &&
      typeof json === 'object' &&
      (json.entities_basic || json.entities_advanced)
    );
  };

  /**
   * Handle manual JSON import
   */
  const handleManualJsonImport = () => {
    try {
      const parsedJson = JSON.parse(manualJsonInput);
      
      // Validate the JSON structure
      if (!validateJsonStructure(parsedJson)) {
        setError("Invalid JSON structure. Make sure it contains the required API configuration.");
        return;
      }
      
      if (onJsonImport) {
        onJsonImport(parsedJson);
      }
      
      setImportDialogOpen(false);
      setManualJsonInput('');
    } catch (error) {
      console.error("Error parsing manual JSON input:", error);
      setError("Invalid JSON format. Please check your input.");
    }
  };

  // Check if JSON has content in the entities_basic array
  const hasEntitiesBasic = json?.entities_basic && Array.isArray(json.entities_basic) && json.entities_basic.length > 0;
  const hasEntitiesAdvanced = json?.entities_advanced && Array.isArray(json.entities_advanced) && json.entities_advanced.length > 0;
  const totalEntities = (hasEntitiesBasic ? json.entities_basic.length : 0) + 
                         (hasEntitiesAdvanced ? json.entities_advanced.length : 0);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          JSON Preview 
          {totalEntities > 0 ? 
            <Typography component="span" color="success.main" sx={{ ml: 1 }}>
              (✓ {totalEntities} {totalEntities !== 1 ? 'entities' : 'entity'})
            </Typography> : 
            <Typography component="span" color="error.main" sx={{ ml: 1 }}>
              (✗ No entities)
            </Typography>
          }
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={toggleCollapse} 
            startIcon={collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            size="small"
            sx={{ mr: 1 }}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={copyToClipboard}
            startIcon={<ContentCopyIcon />}
            size="small"
            sx={{ mr: 1 }}
          >
            Copy
          </Button>
          {onJsonImport && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<FileUploadIcon />}
              onClick={() => {
                console.log("Import JSON button clicked");
                if (fileInputRef.current) {
                  console.log("Triggering file input click");
                  fileInputRef.current.click();
                } else {
                  console.error("File input reference is null");
                }
              }}
              size="small"
              id="json-import-button"
            >
              Import JSON
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(event) => {
              console.log("File input change detected");
              handleFileUpload(event);
            }}
            accept=".json"
            style={{ display: 'none' }}
          />
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      <Collapse in={!collapsed}>
        <Paper 
          sx={{ 
            p: 2, 
            maxHeight: '400px', 
            overflow: 'auto',
            backgroundColor: 'rgba(245, 245, 245, 0.9)',
            '& pre': {
              margin: 0,
              fontFamily: '"Roboto Mono", monospace',
              fontSize: '0.875rem',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            },
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <pre>{formattedJson}</pre>
        </Paper>
      </Collapse>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        {onJsonImport && (
          <Button 
            variant="text" 
            color="primary" 
            onClick={() => setImportDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Paste JSON Manually
          </Button>
        )}
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.href = '#/api-tester'}
          sx={{
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: 'var(--secondary-color)',
            },
          }}
        >
          Test API
        </Button>
      </Box>
      
      {/* Manual JSON import dialog */}
      <Dialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Import JSON Configuration</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={10}
            variant="outlined"
            fullWidth
            placeholder="Paste your JSON configuration here..."
            value={manualJsonInput}
            onChange={(e) => setManualJsonInput(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleManualJsonImport} variant="contained" color="primary">
            Import
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="JSON copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default JsonPreview; 