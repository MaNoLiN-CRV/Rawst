import React, { useState, useEffect } from 'react';
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

  const getDefaultValueForField = (field: EntityField): any => {
    const dataType = field.data_type?.toLowerCase();
    switch (dataType) {
      case 'string':
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
  };

  const handleFieldChange = (fieldName: string, value: any) => {
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
  };

  const validateForm = (): boolean => {
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
            if (isNaN(Number(value))) {
              newErrors[field.name] = 'Debe ser un número entero';
            }
            break;
          case 'float':
          case 'double':
          case 'decimal':
          case 'numeric':
            if (isNaN(Number(value))) {
              newErrors[field.name] = 'Debe ser un número';
            }
            break;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      onClose();
    }
  };

  const renderField = (field: EntityField) => {
    if (!field?.name) return null;
    
    const dataType = field.data_type?.toLowerCase();
    const value = formData[field.name] || '';
    const hasError = !!errors[field.name];
    
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
              />
            }
            label={field.name}
            sx={{ mb: 2 }}
          />
        );
      
      case 'date':
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.name}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={hasError}
            helperText={errors[field.name]}
            required={field.required}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
        );
      
      case 'datetime':
      case 'timestamp':
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.name}
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={hasError}
            helperText={errors[field.name]}
            required={field.required}
            sx={{ mb: 2 }}
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
            fullWidth
            label={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={hasError}
            helperText={errors[field.name]}
            required={field.required}
            sx={{ mb: 2 }}
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
            fullWidth
            label={field.name}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={hasError}
            helperText={errors[field.name]}
            required={field.required}
            sx={{ mb: 2 }}
            inputProps={{ step: 0.01 }}
          />
        );
      
      default:
        return (
          <TextField
            key={field.name}
            fullWidth
            label={field.name}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            error={hasError}
            helperText={errors[field.name]}
            required={field.required}
            sx={{ mb: 2 }}
            multiline={dataType === 'text' || dataType === 'longtext'}
            rows={dataType === 'text' || dataType === 'longtext' ? 3 : 1}
          />
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {method === 'POST' ? 'Crear nuevo' : 'Actualizar'} {entity?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete los datos para enviar la solicitud {method}
        </Typography>
      </DialogTitle>
      
      <DialogContent dividers sx={{ py: 3 }}>
        {entity?.fields && entity.fields.length > 0 ? (
          <Box>
            {entity.fields.map((field, index) => (
              <Box key={field?.name || index}>
                {renderField(field)}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No hay campos configurados para esta entidad
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!entity?.fields?.length}
        >
          Enviar {method}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RequestDataDialog;