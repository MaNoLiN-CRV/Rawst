import React from 'react';
import { Box, Typography, Button, TextField, Stack } from '@mui/material';

interface Props {
  json: object;
}

const JsonPreview: React.FC<Props> = ({ json }) => {
  const jsonString = JSON.stringify(json, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>JSON de configuración generado</Typography>
      <TextField
        multiline
        fullWidth
        minRows={10}
        value={jsonString}
        InputProps={{ readOnly: true }}
        variant="outlined"
        sx={{ mb: 2 }}
      />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" color="primary" onClick={handleCopy}>Copiar</Button>
        <Button variant="outlined" color="primary" onClick={handleDownload}>Descargar</Button>
      </Stack>
    </Box>
  );
};

export default JsonPreview; 