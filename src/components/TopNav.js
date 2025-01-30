import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Menu, MenuItem, ListItemIcon, AppBar, Toolbar, Button } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import format from 'date-fns/format';
import { subscribeToNotifications } from '../services/notification.service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationBell from './NotificationBell';

const TopNav = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleClose();
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getAvatarContent = () => {
    if (user?.photoURL) {
      return <Avatar src={user.photoURL} alt={user.name || user.email} />;
    }
    return (
      <Avatar sx={{ 
        bgcolor: darkMode ? 'primary.dark' : 'primary.main',
        color: 'white',
      }}>
        {user?.email?.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  useEffect(() => {
    let cleanup = () => {};

    const setupNotifications = async () => {
      if (user?.uid) {
        try {
          const unsubscribe = await subscribeToNotifications(
            user.uid, 
            (notification) => {
              setNotifications(prev => [{
                id: Date.now().toString(),
                ...notification,
                read: false,
                timestamp: new Date().toISOString()
              }, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          );
          cleanup = unsubscribe;
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    };

    setupNotifications();
    return () => cleanup();
  }, [user]);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: 1300,
        left: '240px',
        width: 'calc(100% - 240px)',
        bgcolor: darkMode ? '#1e1e1e' : '#fff',
        color: darkMode ? '#fff' : '#555',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        height: '64px',
      }}
    >
      <Toolbar sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '64px !important',
        padding: '0 20px',
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          flex: 1,
        }}>
          {user?.role === 'developer' && (
            <Button 
              color="inherit" 
              component={Link} 
              to="/my-tasks"
              startIcon={<AssignmentIcon />}
              sx={{ 
                fontWeight: 500,
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              My Tasks
            </Button>
          )}
          
          {(user?.role === 'admin' || user?.role === 'project_manager') && (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/dashboard"
                startIcon={<DashboardIcon />}
                sx={{ 
                  fontWeight: 500,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Projects
              </Button>
              <Button 
                color="inherit" 
                component={Link} 
                to="/team"
                startIcon={<PeopleIcon />}
                sx={{ 
                  fontWeight: 500,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                }}
              >
                Team
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
        }}>
          <NotificationBell />

          <IconButton 
            sx={{ ml: 1 }} 
            onClick={toggleTheme} 
            color="inherit"
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <IconButton 
            onClick={handleAvatarClick}
            sx={{
              p: 0.5,
              '&:hover': { transform: 'scale(1.1)' },
              transition: 'transform 0.2s',
            }}
          >
            {getAvatarContent()}
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              bgcolor: darkMode ? '#1e1e1e' : '#fff',
              color: darkMode ? '#fff' : '#555',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {user?.role}
            </Typography>
          </Box>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav; 