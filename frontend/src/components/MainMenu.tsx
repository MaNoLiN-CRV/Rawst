import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid,
  Container,
  Paper,
  Link,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import StorageIcon from '@mui/icons-material/Storage';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface MainMenuProps {
  onImportJson: () => void;
  onConnectDatabase: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onImportJson, onConnectDatabase }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
        className="fade-in"
      >
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          Welcome to RusterAPI
        </Typography>
        <Typography variant="body1" align="center" sx={{ mb: 4 }}>
          Create, configure, and test RESTful APIs quickly and easily
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        <Grid component="div">
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }
            }}
            className="fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                <FileUploadIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Import JSON
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} align="center">
                Load an existing API configuration from a JSON file
              </Typography>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={onImportJson}
                startIcon={<FileUploadIcon />}
                sx={{ mt: 2 }}
              >
                Load JSON
              </Button>
              <Link 
                href="/sample_config.json" 
                download="sample_config.json"
                underline="hover"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mt: 2,
                  fontSize: '0.875rem' 
                }}
              >
                <FileDownloadIcon fontSize="small" sx={{ mr: 0.5 }} />
                Download Sample Config
              </Link>
            </CardContent>
          </Card>
        </Grid>

        <Grid component="div">
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }
            }}
            className="fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                <StorageIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Connect Database
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} align="center">
                Connect to your database and generate API endpoints
              </Typography>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={onConnectDatabase}
                startIcon={<StorageIcon />}
                sx={{ mt: 2 }}
              >
                Connect
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid component="div">
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }
            }}
            className="fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                <PlayArrowIcon sx={{ fontSize: 60 }} />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Test API
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} align="center">
                Test and interact with your generated API endpoints
              </Typography>
              <Box sx={{ flexGrow: 1 }}></Box>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={() => navigate('/api-tester')}
                startIcon={<PlayArrowIcon />}
                sx={{ mt: 2 }}
              >
                Test API
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper 
        elevation={1} 
        sx={{ mt: 6, mb: 4, p: 3, borderRadius: 2 }}
        className="fade-in"
        style={{ animationDelay: '0.4s' }}
      >
        <Typography variant="h6" gutterBottom align="center">
          Quick Documentation
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid component="div">
            <Typography variant="subtitle1" color="primary" gutterBottom>
              1. Import or Connect
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Either import an existing API configuration JSON file or connect to your database to start.
            </Typography>
          </Grid>
          <Grid component="div">
            <Typography variant="subtitle1" color="primary" gutterBottom>
              2. Configure
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize your API endpoints, fields, and validation rules through the intuitive interface.
            </Typography>
          </Grid>
          <Grid component="div">
            <Typography variant="subtitle1" color="primary" gutterBottom>
              3. Test
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Test your API directly from the application with the built-in API testing tools.
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default MainMenu; 