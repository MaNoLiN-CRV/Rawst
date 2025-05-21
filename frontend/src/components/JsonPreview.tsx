import React, { useState, useRef, useMemo, useCallback } from 'react';
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

// Define a basic structure for entities if known, otherwise use a generic object
// For now, allowing any structure within an entity.
// If a more specific structure is known, it should be defined here.
interface Entity {
  [key: string]: any;
}

/**
 * Defines the expected structure of the JSON configuration object.
 */
interface ApiConfigJson {
  entities_basic?: Entity[];
  entities_advanced?: Entity[];
  // Allow other top-level properties that might exist in the config
  [key: string]: any;
}

/**
 * Props for the JsonPreview component
 */
interface Props {
  json: ApiConfigJson | null | undefined; // Allow null or undefined for initial states
  onJsonImport?: (json: ApiConfigJson) => void;
}

/**
 * Component that displays a formatted JSON preview with copy and load functionality
 */
const JsonPreview: React.FC<Props> = ({ json, onJsonImport }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [manualJsonInput, setManualJsonInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Memoized formatted JSON string.
   * Recalculates only when the `json` prop changes.
   */
  const formattedJson = useMemo(() => {
    if (!json) {
      // Handle cases where json might be null or undefined, e.g., during initial load or error states.
      // Displaying a message or empty string based on desired behavior.
      console.warn("⚠️ JSON data is null or undefined in JsonPreview.");
      return 'No data to display or error in data structure.';
    }
    try {
      // Debugging log for incoming JSON structure
      const hasEntitiesBasic = json?.entities_basic && Array.isArray(json.entities_basic);
      const hasEntitiesAdvanced = json?.entities_advanced && Array.isArray(json.entities_advanced);
      console.log(
        `JsonPreview received data: Basic entities: ${hasEntitiesBasic ? json.entities_basic!.length : 'N/A'}, Advanced entities: ${hasEntitiesAdvanced ? json.entities_advanced!.length : 'N/A'}`
      );

      if (hasEntitiesBasic && json.entities_basic!.length > 0) {
        console.log("Basic Entities in JSON:", json.entities_basic);
      }
      if (hasEntitiesAdvanced && json.entities_advanced!.length > 0) {
        console.log("Advanced Entities in JSON:", json.entities_advanced);
      }
      if (!hasEntitiesBasic && !hasEntitiesAdvanced) {
        console.warn("⚠️ JSON has no basic or advanced entities or is empty");
      }
      
      return JSON.stringify(json, null, 2);
    } catch (e) {
      console.error("Error formatting JSON:", e);
      return 'Error parsing JSON';
    }
  }, [json]);

  /**
   * Copy JSON content to clipboard
   */
  const copyToClipboard = useCallback((): void => {
    navigator.clipboard.writeText(formattedJson);
    setSnackbarOpen(true);
  }, [formattedJson]);

  /**
   * Toggle the collapsed state of the JSON preview
   */
  const toggleCollapse = useCallback((): void => {
    setCollapsed(prevCollapsed => !prevCollapsed);
  }, []);

  /**
   * Validate the JSON structure to ensure it has the required properties
   */
  const validateJsonStructure = useCallback((parsedJson: any): parsedJson is ApiConfigJson => {
    // Basic validation - check for minimum required fields
    // This ensures that the parsed JSON conforms to what we expect for ApiConfigJson.
    return (
      parsedJson &&
      typeof parsedJson === 'object' &&
      (Array.isArray(parsedJson.entities_basic) || Array.isArray(parsedJson.entities_advanced) || 
       // Allow if it's an empty object or has other top-level keys defined in ApiConfigJson
       // This part might need refinement based on stricter requirements for what constitutes a "valid" config.
       // For now, we are somewhat lenient if it's an object.
       Object.keys(parsedJson).length > 0 || (parsedJson.entities_basic === undefined && parsedJson.entities_advanced === undefined))
    );
  }, []);

  /**
   * Handle the file input change for JSON upload
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    console.log("handleFileUpload called", event.target.files?.length);
    const file = event.target.files?.[0];
    if (!file) {
      console.error("No file selected");
      setError("No file was selected. Please choose a JSON file.");
      return;
    }

    console.log("File selected:", file.name, file.size, "bytes");
    setError(null); // Clear previous errors
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log("FileReader onload triggered");
        const content = e.target?.result as string;
        console.log(`Loading JSON file content (${content.length} bytes):`, content.substring(0, 100) + "...");
        const parsedJson = JSON.parse(content);
        
        if (!validateJsonStructure(parsedJson)) {
          console.error("Invalid JSON structure:", parsedJson);
          setError("Invalid JSON structure. The file does not seem to be a valid API configuration. It should contain 'entities_basic' or 'entities_advanced' arrays.");
          return;
        }
        
        console.log("JSON successfully loaded, basic entities:", 
          parsedJson.entities_basic?.length ?? 0, 
          "advanced entities:", 
          parsedJson.entities_advanced?.length ?? 0);
        
        if (onJsonImport) {
          console.log("Calling onJsonImport callback");
          onJsonImport(parsedJson);
        } else {
          console.error("onJsonImport callback is not defined");
          setError("Import functionality is not properly configured (onJsonImport is missing).");
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        setError("Invalid JSON format. Please ensure the file contains valid JSON.");
      }
    };
    
    reader.onerror = (e) => {
      console.error("FileReader error:", e);
      setError("Error reading file. Please try again.");
    };
    
    reader.readAsText(file);
    
    // Reset the file input to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  }, [onJsonImport, validateJsonStructure]);


  /**
   * Handle manual JSON import
   */
  const handleManualJsonImport = useCallback((): void => {
    setError(null); // Clear previous errors
    try {
      const parsedJson = JSON.parse(manualJsonInput);
      
      if (!validateJsonStructure(parsedJson)) {
        setError("Invalid JSON structure. Make sure it contains the required API configuration (e.g., 'entities_basic' or 'entities_advanced' arrays).");
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
  }, [manualJsonInput, onJsonImport, validateJsonStructure]);

  const handleImportButtonClick = useCallback(() => {
    console.log("Import JSON button clicked");
    if (fileInputRef.current) {
      console.log("Triggering file input click");
      fileInputRef.current.click();
    } else {
      console.error("File input reference is null");
      setError("Could not initiate file import: file input not available.");
    }
  }, []);

  // Calculate total entities for display
  const totalEntities = useMemo(() => {
    if (!json) return 0;
    const basicCount = (json.entities_basic && Array.isArray(json.entities_basic)) ? json.entities_basic.length : 0;
    const advancedCount = (json.entities_advanced && Array.isArray(json.entities_advanced)) ? json.entities_advanced.length : 0;
    return basicCount + advancedCount;
  }, [json]);

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          JSON Preview 
          {json && totalEntities > 0 ? 
            <Typography component="span" color="success.main" sx={{ ml: 1, fontWeight: 'medium' }}>
              (✓ {totalEntities} {totalEntities !== 1 ? 'entities' : 'entity'} loaded)
            </Typography> : 
            <Typography component="span" color={json ? "text.secondary" : "error.main"} sx={{ ml: 1, fontStyle: 'italic' }}>
              ({json ? (totalEntities === 0 ? '✗ No entities in current config' : 'Loading...') : '✗ No JSON data'})
            </Typography>
          }
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={toggleCollapse} 
            startIcon={collapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            size="small"
            sx={{ mr: 1, textTransform: 'none' }}
            aria-label={collapsed ? 'Expand JSON preview' : 'Collapse JSON preview'}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={copyToClipboard}
            startIcon={<ContentCopyIcon />}
            size="small"
            sx={{ mr: 1, textTransform: 'none' }}
            aria-label="Copy JSON to clipboard"
            disabled={!json || formattedJson === 'Error parsing JSON' || formattedJson === 'No data to display or error in data structure.'}
          >
            Copy
          </Button>
          {onJsonImport && (
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<FileUploadIcon />}
              onClick={handleImportButtonClick}
              size="small"
              id="json-import-button" // Keep ID if it's used by App.tsx for direct click
              sx={{ textTransform: 'none' }}
              aria-label="Import JSON from file"
            >
              Import JSON
            </Button>
          )}
          {/* Hidden file input, controlled by the button above */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,application/json" // Be more specific with accept types
            style={{ display: 'none' }}
            aria-hidden="true" // Hide from accessibility tree as it's controlled by a button
          />
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)} // Allow dismissing the error
        >
          {error}
        </Alert>
      )}
      
      <Collapse in={!collapsed}>
        <Paper 
          elevation={2} // Add a bit more elevation for better visual separation
          sx={{ 
            p: 2, 
            maxHeight: '400px', 
            overflow: 'auto',
            backgroundColor: 'var(--mui-palette-background-default, #f9f9f9)', // Use theme variable or a light grey
            border: '1px solid var(--mui-palette-divider, #e0e0e0)', // Add a subtle border
            '& pre': {
              margin: 0,
              fontFamily: '"Roboto Mono", "Consolas", "Menlo", monospace', // Common monospace fonts
              fontSize: '0.875rem',
              overflowX: 'auto', // Ensure horizontal scroll for long lines
              whiteSpace: 'pre-wrap', // Wrap lines but preserve spaces
              wordBreak: 'break-all', // Break long words if necessary to prevent overflow
            },
            borderRadius: '8px', // Consistent border radius
            // boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' // Optional inset shadow for depth
          }}
        >
          <pre>{formattedJson}</pre>
        </Paper>
      </Collapse>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mt: 2, gap: 2 }}>
        {onJsonImport && (
          <Button 
            variant="text" 
            color="secondary" // Use secondary color for less emphasis than primary actions
            onClick={() => { setError(null); setImportDialogOpen(true); }} // Clear error before opening
            sx={{ textTransform: 'none' }}
          >
            Paste JSON Manually...
          </Button>
        )}
        
        {/* This button seems to navigate. Consider if it belongs here or at a higher level.
            If it's a primary action related to the JSON preview (e.g., after config is set), it's fine.
        */}
        <Button 
          variant="outlined" // Changed to outlined to differentiate from primary import
          color="primary" 
          onClick={() => window.location.href = '#/api-tester'} // Direct href navigation is okay for simple cases
                                                              // but consider using react-router's useNavigate for SPA navigation
          sx={{
            textTransform: 'none',
            // Using theme colors is better if primary/secondary are defined in your theme
            // borderColor: 'var(--primary-color)', 
            // color: 'var(--primary-color)',
            // '&:hover': {
            //   backgroundColor: 'rgba(var(--primary-color-rgb), 0.04)', // Example hover for outlined
            // },
          }}
          disabled={!json || totalEntities === 0} // Disable if no JSON or no entities
        >
          Test API with this Configuration
        </Button>
      </Box>
      
      {/* Manual JSON import dialog */}
      <Dialog 
        open={importDialogOpen} 
        onClose={() => { setImportDialogOpen(false); setError(null); }} // Clear error on close
        maxWidth="md"
        fullWidth
        PaperProps={{ component: 'form' }} // Use form for semantic correctness
        onSubmit={(e: React.FormEvent<HTMLDivElement>) => { // Type the event
          e.preventDefault(); // Prevent default form submission
          handleManualJsonImport();
        }}
      >
        <DialogTitle>Import JSON Configuration Manually</DialogTitle>
        <DialogContent>
          {error && ( // Show error inside the dialog as well for context
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            multiline
            rows={10}
            variant="outlined"
            fullWidth
            placeholder="Paste your JSON configuration here..."
            value={manualJsonInput}
            onChange={(e) => setManualJsonInput(e.target.value)}
            sx={{ mt: 1 }} // Reduced margin top as error alert might be there
            aria-label="Manual JSON input"
          />
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}> {/* Add some padding */}
          <Button onClick={() => { setImportDialogOpen(false); setError(null); }}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary"> {/* type="submit" */}
            Import
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success notification for copy */}
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