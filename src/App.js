import React, { useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from './components/Dashboard';
import SideNav from './components/SideNav';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import TaskColumn from './components/Task/TaskColumn';
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
import TopNav from './components/TopNav';
import MyTasks from './components/Task/MyTasks';
import CreateTask from './components/Task/CreateTask';
import Projects from './components/Projects/Projects';
import { ActivityProvider } from './context/ActivityContext';
import { ToastProvider } from './context/ToastContext';
import { sessionManager } from './utils/sessionManager';
import SessionWarningDialog from './components/SessionWarningDialog';
import { SoundManager } from './utils/soundManager';
import Settings from './components/Settings/Settings';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import ResourceDashboard from './components/ResourceManagement/ResourceDashboard';
import ProjectCalendar from './components/Calendar/ProjectCalendar';

const ProtectedRoute = ({ children, authRequired = true }) => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    // Handle session timeout
    const handleInactivity = () => {
      setShowWarning(false);
      logout();
      navigate('/login');
    };

    const handleWarning = () => {
      setShowWarning(true);
    };

    const handleActivity = () => {
      sessionManager.resetTimer(handleInactivity, handleWarning);
    };

    // Set up event listeners for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize session timer
    sessionManager.resetTimer(handleInactivity, handleWarning);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      sessionManager.clearTimer();
    };
  }, [logout, navigate]);
  
  const handleContinueSession = () => {
    setShowWarning(false);
    sessionManager.extendSession();
  };

  const handleLogoutNow = () => {
    setShowWarning(false);
    logout();
    navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner message="Setting up your workspace..." />;
  }
  
  if (authRequired && !user) {
    return <Navigate to="/login" />;
  }
  
  // Redirect to dashboard if user is logged in and tries to access auth pages
  if (!authRequired && user) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }
  
  return (
    <>
      {children}
      <SessionWarningDialog
        open={showWarning}
        onContinue={handleContinueSession}
        onLogout={handleLogoutNow}
      />
    </>
  );
};

// Add this helper function for role-based route protection
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

function AppContent() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { loading } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/sign_up';

  useEffect(() => {
    SoundManager.preloadSounds();
  }, []);

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
            <ProtectedRoute authRequired={false}>
              <PageTransition>
                <Login />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/sign_up" element={
            <ProtectedRoute authRequired={false}>
              <PageTransition>
                <SignUp />
              </PageTransition>
            </ProtectedRoute>
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
          <Route path="/my-tasks" element={
            <ProtectedRoute>
              <MyTasks />
            </ProtectedRoute>
          } />
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
          <Route path="/settings" element={
            <ProtectedRoute>
              <PageTransition>
                <Settings />
              </PageTransition>
            </ProtectedRoute>
          } />
          <Route path="/resources" element={
            <RoleProtectedRoute allowedRoles={['admin', 'project_manager']}>
              <PageTransition>
                <ResourceDashboard />
              </PageTransition>
            </RoleProtectedRoute>
          } />
          <Route path="/calendar" element={
            <RoleProtectedRoute allowedRoles={['admin', 'project_manager', 'developer']}>
              <PageTransition>
                <ProjectCalendar />
              </PageTransition>
            </RoleProtectedRoute>
          } />
        </Routes>
      </Box>
    </Box>
  );
}

function AppWithTheme() {
  const { darkMode } = useTheme();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? '#b3b3b3' : '#666666',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        transition: 'all 0.3s ease'
      }}>
        <AppContent />
      </Box>
    </MuiThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ProjectProvider>
              <ActivityProvider>
                <AppWithTheme />
              </ActivityProvider>
            </ProjectProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;