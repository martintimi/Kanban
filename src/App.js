import React, { useState } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from './components/Dashboard';
import SideNav from './components/SideNav';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import TaskColumn from './components/TaskColumn';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { ProjectProvider } from './context/ProjectContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import LogoutIcon from '@mui/icons-material/Logout';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import MyTasks from './components/MyTasks';
import CreateTask from './components/CreateTask';
import Projects from './components/Projects';
import { ActivityProvider } from './context/ActivityContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner message="Setting up your workspace..." />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function AppContent() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/sign_up';

  if (loading) {
    return <LoadingSpinner message="Setting up your workspace..." />;
  }

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100%'
    }}>
      {!isAuthPage && (
        <>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            sx={{
              display: { xs: 'block', sm: 'none' },
              position: 'fixed',
              top: '20px',
              left: '1px',
              zIndex: 1200
            }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="nav"
            sx={{
              width: { sm: 240 },
              flexShrink: 0,
            }}
          >
            <Drawer
              variant="temporary"
              open={drawerOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true,
              }}
              sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': {
                  width: 200,
                },
              }}
            >
              <SideNav onClose={handleDrawerToggle} />
            </Drawer>
            <Box
              sx={{
                display: { xs: 'none', sm: 'block' },
                width: 240,
                height: '100%',
              }}
            >
              <SideNav />
            </Box>
          </Box>
          <TopNav />
        </>
      )}
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - 240px)` },
          minHeight: '100vh',
          pt: isAuthPage ? 0 : '64px',
          overflow: 'hidden',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={
            <PageTransition>
              <Login />
            </PageTransition>
          } />
          <Route path="/sign_up" element={
            <PageTransition>
              <SignUp />
            </PageTransition>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/task-column/:projectId" element={
            <ProtectedRoute>
              <PageTransition>
                <TaskColumn />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/my-tasks" element={<MyTasks />} />
          <Route path="/create-task" element={
            <ProtectedRoute>
              <CreateTask />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <ProjectProvider>
            <ActivityProvider>
              <AppWithTheme />
            </ActivityProvider>
          </ProjectProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

function AppWithTheme() {
  const { darkMode } = useTheme();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#0052CC',
      },
      background: {
        default: darkMode ? '#1a1a1a' : '#f5f5f5',
        paper: darkMode ? '#2d2d2d' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#555555',
        secondary: darkMode ? '#b3b3b3' : '#757575',
      }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode 
                ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                : '0 8px 16px rgba(0, 0, 0, 0.1)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s ease',
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <Box sx={{ 
        bgcolor: 'background.default', 
        minHeight: '100vh',
        transition: 'all 0.3s ease'
      }}>
        <AppContent />
      </Box>
    </MuiThemeProvider>
  );
}

export default App;