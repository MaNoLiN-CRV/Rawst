import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { ApiEntity, EntityField } from './types';

interface RequestDataDialogProps {
  open: boolean;
  entity: ApiEntity | undefined;
  method: string;
  onClose: () => void;
  onSubmit: (data: Record<string, any>) => void;
}

/**
 * Interactive dialog for entering request data for POST/PUT/PATCH requests
 * Enhanced with proper TypeScript typing and performance optimizations
 */
const RequestDataDialog: React.FC<RequestDataDialogProps> = ({
  open,
  entity,
  method,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when dialog opens or entity changes
  useEffect(() => {
    if (entity?.fields && open) {
      const initialData: Record<string, any> = {};
      entity.fields.forEach((field) => {
        if (field?.name) {
          initialData[field.name] = getDefaultValueForField(field);
        }
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [entity, open]);

  /**
   * Gets the default value for a field based on its data type
   */
  const getDefaultValueForField = useCallback((field: EntityField): any => {
    const dataType = field.data_type?.toLowerCase();
    switch (dataType) {
      case 'string':
      case 'varchar':
      case 'text':
      case 'longtext':
        return '';
      case 'integer':
      case 'number':
      case 'int':
      case 'bigint':
      case 'smallint':
      case 'tinyint':
      case 'mediumint':
        return 0;
      case 'float':
      case 'double':
      case 'decimal':
      case 'numeric':
        return 0.0;
      case 'boolean':
      case 'bool':
      case 'tinyint(1)':
        return false;
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'datetime':
      case 'timestamp':
        return new Date().toISOString().slice(0, 16);
      default:
        return '';
    }
  }, []);

  /**
   * Handles field value changes and clears validation errors
   */
  const handleFieldChange = useCallback((fieldName: string, value: any): void => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  }, [errors]);

  /**
   * Validates form data and returns whether the form is valid
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    
    entity?.fields?.forEach((field) => {
      if (!field?.name) return;
      
      const value = formData[field.name];
      const dataType = field.data_type?.toLowerCase();
      
      // Check if required field is empty
      if (field.required && (value === '' || value === null || value === undefined)) {
        newErrors[field.name] = 'Este campo es requerido';
        return;
      }
      
      // Type validation
      if (value !== '' && value !== null && value !== undefined) {
        switch (dataType) {
          case 'integer':
          case 'number':
          case 'int':
          case 'bigint':
          case 'smallint':
          case 'tinyint':
          case 'mediumint':
            if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
              newErrors[field.name] = 'Debe ser un número entero válido';
            }
            break;
          case 'float':
          case 'double':
          case 'decimal':
          case 'numeric':
            if (isNaN(Number(value))) {
              newErrors[field.name] = 'Debe ser un número válido';
            }
            break;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [entity?.fields, formData]);

  /**
   * Handles form submission
   */
  const handleSubmit = useCallback((): void => {
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  }, [validateForm, onSubmit, formData, onClose]);

  /**
   * Renders appropriate input field based on data type
   */
  const renderField = useCallback((field: EntityField) => {
    if (!field?.name) return null;
    
    const dataType = field.data_type?.toLowerCase();
    const value = formData[field.name] || '';
    const hasError = !!errors[field.name];
    
    const commonTextFieldProps = {
      fullWidth: true,
      label: field.name,
      error: hasError,
      helperText: errors[field.name],
      required: field.required,
      sx: { mb: 2 },
    };
    
    switch (dataType) {
      case 'boolean':
      case 'bool':
      case 'tinyint(1)':
        return (
          <FormControlLabel
            key={field.name}
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#1976d2',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#1976d2',
                  },
                }}
              />
            }
            label={field.name}
            sx={{ 
              mb: 2,
              '& .MuiFormControlLabel-label': {
                color: 'rgba(0, 0, 0, 0.87) !important',
              },
            }}
          />
        );
      
      case 'date':
        return (
          <TextField
            key={field.name}
            {...commonTextFieldProps}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'datetime':
      case 'timestamp':
        return (
          <TextField
            key={field.name}
            {...commonTextFieldProps}
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'integer':
      case 'number':
      case 'int':
      case 'bigint':
      case 'smallint':
      case 'tinyint':
      case 'mediumint':
        return (
          <TextField
            key={field.name}
            {...commonTextFieldProps}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            inputProps={{ step: 1 }}
          />
        );
      
      case 'float':
      case 'double':
      case 'decimal':
      case 'numeric':
        return (
          <TextField
            key={field.name}
            {...commonTextFieldProps}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            inputProps={{ step: 0.01 }}
          />
        );
      
      default:
        return (
          <TextField
            key={field.name}
            {...commonTextFieldProps}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            multiline={dataType === 'text' || dataType === 'longtext'}
            rows={dataType === 'text' || dataType === 'longtext' ? 3 : 1}
          />
        );
    }
  }, [formData, errors, handleFieldChange]);

  const dialogTitle = method === 'POST' ? 'Crear nuevo' : 'Actualizar';
  const hasFields = entity?.fields && entity.fields.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          backgroundColor: '#ffffff !important',
          backgroundImage: 'none !important',
          border: 'none !important',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12) !important',
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.5) !important',
        }
      }}
      aria-labelledby="request-data-dialog-title"
      aria-describedby="request-data-dialog-description"
    >
      <DialogTitle
        id="request-data-dialog-title"
        sx={{
          backgroundColor: '#ffffff !important',
          color: 'rgba(0, 0, 0, 0.87) !important',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        }}
      >
        <Typography variant="h6" component="div" sx={{ color: 'rgba(0, 0, 0, 0.87) !important' }}>
          {dialogTitle} {entity?.name}
        </Typography>
        <Typography 
          variant="body2" 
          id="request-data-dialog-description"
          sx={{ color: 'rgba(0, 0, 0, 0.6) !important', mt: 1 }}
        >
          Complete los datos para enviar la solicitud {method}
        </Typography>
      </DialogTitle>
      
      <DialogContent 
        dividers 
        sx={{ 
          py: 3,
          backgroundColor: '#ffffff !important',
          color: 'rgba(0, 0, 0, 0.87) !important',
        }}
      >
        {hasFields ? (
          <Box>
            {entity.fields.map((field, index) => (
              <Box key={field?.name || index}>
                {renderField(field)}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography 
            align="center" 
            sx={{ 
              py: 4,
              color: 'rgba(0, 0, 0, 0.6) !important',
            }}
          >
            No hay campos configurados para esta entidad
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions 
        sx={{ 
          p: 3, 
          gap: 1,
          backgroundColor: '#ffffff !important',
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        }}
      >
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{
            color: 'rgba(0, 0, 0, 0.87) !important',
            backgroundColor: 'transparent !important',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04) !important',
            },
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!hasFields}
          sx={{
            backgroundColor: '#1976d2 !important',
            color: '#ffffff !important',
            '&:hover': {
              backgroundColor: '#1565c0 !important',
            },
            '&:disabled': {
              backgroundColor: 'rgba(0, 0, 0, 0.12) !important',
              color: 'rgba(0, 0, 0, 0.26) !important',
            },
          }}
        >
          Enviar {method}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RequestDataDialog.displayName = 'RequestDataDialog';

export default RequestDataDialog;