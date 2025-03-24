import React, { useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './App.css';
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from './components/Dashboard';
import SideNav from './components/SideNav';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Routes, Route, useLocation, Navigate, useNavigate, useParams } from 'react-router-dom';
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
import { OrganizationProvider, useOrganization } from './context/OrganizationContext';
import Button from '@mui/material/Button';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { OrganizationManagement } from './components/Organization';
import CustomLoader from './components/CustomLoader';
import MeetingRoom from './components/Meeting/MeetingRoom';
import JoinPage from './components/Join/JoinPage';
import PrivateRoute from './components/Auth/PrivateRoute';
import { AIAssistantProvider } from './context/AIAssistantContext';
import AIAssistant from './components/AIAssistant/AIAssistant';

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
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CustomLoader message="Setting up your workspace..." />
      </Box>
    );
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

const MeetingWrapper = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams();

  const handleLeave = () => {
    // Close the tab if it was opened in a new tab
    if (window.opener) {
      window.close();
    } else {
      // Otherwise navigate back
      navigate('/organization-management');
    }
  };

  return (
    <MeetingRoom 
      roomId={meetingId}
      onLeave={handleLeave}
    />
  );
};

function AppContent() {
  const location = useLocation();
  const { user, loading } = useAuth();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CustomLoader message="Setting up your workspace..." />
      </Box>
    );
  }

  // For auth pages, render without navigation
  if (isAuthPage) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/login" element={
            <ProtectedRoute authRequired={false}>
              <Login />
            </ProtectedRoute>
          } />
          <Route path="/signup" element={
            <ProtectedRoute authRequired={false}>
              <SignUp />
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    );
  }

  // For authenticated pages with navigation
  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100%',
      position: 'relative'
    }}>
      <SideNav />
      <TopNav />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          minHeight: '100vh',
          pt: '64px',
          transition: 'margin-left 0.3s',
          overflow: 'hidden',
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
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
          <Route path="/organization-management" element={
            <ProtectedRoute>
              <OrganizationManagement />
            </ProtectedRoute>
          } />
          <Route path="/meetings/:meetingId" element={
            <ProtectedRoute>
              <MeetingWrapper />
            </ProtectedRoute>
          } />
          <Route path="/join" element={
            <ProtectedRoute authRequired={false}>
              <JoinPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Box>
    </Box>
  );
}

function AppWithTheme() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3f51b5', // Material UI blue
        light: '#757de8',
        dark: '#303f9f',
      },
      secondary: {
        main: '#f50057', // Pink accent for buttons/highlights
        light: '#ff4081',
        dark: '#c51162',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? '#b3b3b3' : '#666666',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 700,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: 1.5,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        lineHeight: 1.5,
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
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
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
        {user && !isAuthPage && <AIAssistant />}
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
            <OrganizationProvider>
              <ProjectProvider>
                <ActivityProvider>
                  <AIAssistantProvider>
                    <AppWithTheme />
                  </AIAssistantProvider>
                </ActivityProvider>
              </ProjectProvider>
            </OrganizationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;