// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Calendar from './pages/Calendar';
import DayView from './pages/DayView';
import Admin from './pages/Admin';

// Create a custom theme with love-themed colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#ff4d6d',
      light: '#ff758f',
      dark: '#c9184a',
      contrastText: '#fff',
    },
    secondary: {
      main: '#4361ee',
      light: '#4cc9f0',
      dark: '#3a0ca3',
      contrastText: '#fff',
    },
    background: {
      default: '#fff5f7',
    },
  },
  typography: {
    fontFamily: [
      'Poppins',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

// PrivateRoute component to protect routes
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/" />;
}

// Add this function near your existing PrivateRoute function
function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Check if user is admin (either of your email addresses)
  const isAdmin = currentUser && 
    (currentUser.email === "andrewjshowers@gmail.com" || 
     currentUser.email === "showersa@mail.gvsu.edu");
  
  return isAdmin ? children : <Navigate to="/calendar" />;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route 
              path="/calendar" 
              element={
                <PrivateRoute>
                  <Calendar />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/day/:date" 
              element={
                <PrivateRoute>
                  <DayView />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
