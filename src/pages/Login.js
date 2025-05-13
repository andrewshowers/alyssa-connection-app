// src/pages/Login.js
import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { signInWithGoogle } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/calendar');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      // Navigation happens in useEffect
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          backgroundImage: 'linear-gradient(to bottom right, #ffccd5, #ffc8dd)',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#590d22' }}>
          Love Connection
        </Typography>
        
        <Typography variant="body1" align="center" sx={{ mb: 4, color: '#590d22' }}>
          A daily dose of love while you're away ❤️
        </Typography>
        
        <Box sx={{ width: '100%', mt: 2 }}>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleLogin} 
            sx={{ 
              bgcolor: '#ff758f', 
              '&:hover': { bgcolor: '#ff4d6d' }, 
              py: 1.5
            }}
          >
            Sign in with Google
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Login;
