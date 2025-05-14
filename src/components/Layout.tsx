import React, { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Container, 
  Toolbar, 
  Typography, 
  Link,
} from '@mui/material';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={3}>
        <Toolbar>
          <Container maxWidth="lg" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
            <Link 
              component={RouterLink} 
              to="/" 
              color="inherit" 
              underline="none"
              sx={{ display: 'block' }}
            >
              <Typography variant="h5" component="h1" fontWeight="bold">
                HYROX Customer Support
              </Typography>
            </Link>
            <Typography variant="subtitle2" color="white" sx={{ opacity: 0.8 }}>
              Queue Management System
            </Typography>
          </Container>
        </Toolbar>
      </AppBar>
      
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      
      <Box 
        component="footer" 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText', 
          p: 2, 
          mt: 'auto',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2">
          &copy; {currentYear} HYROX Customer Support
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout; 