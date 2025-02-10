import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  ListItemAvatar,
  ListItemText,
  Divider,
  FormGroup,
  FormControlLabel,
  Switch
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../context/AuthContext';
import { NotificationService } from '../services/notification.service';
import { format, isValid } from 'date-fns';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import CommentIcon from '@mui/icons-material/Comment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UpdateIcon from '@mui/icons-material/Update';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import SettingsIcon from '@mui/icons-material/Settings';
import Collapse from '@mui/material/Collapse';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    taskAssignment: true,
    comments: true,
    statusUpdates: true,
    dueDateReminders: true,
    mentions: true
  });
  const theme = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  // Enhanced notification sound with different sounds for different types
  const playNotificationSound = (type) => {
    try {
      const soundMap = {
        taskAssignment: '/sounds/task-assigned.mp3',
        comment: '/sounds/comment.mp3',
        mention: '/sounds/mention.mp3',
        default: '/sounds/notification.mp3'
      };
      const audio = new Audio(soundMap[type] || soundMap.default);
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <CommentIcon />;
      case 'task_assigned':
        return <AssignmentIcon />;
      case 'status_update':
        return <UpdateIcon />;
      case 'due_soon':
        return <PriorityHighIcon color="warning" />;
      default:
        return <NotificationsIcon />;
    }
  };

  useEffect(() => {
    let unsubscribe = () => {};

    const setupNotifications = async () => {
      if (user?.uid) {
        try {
          // Get initial notifications
          const initialNotifications = await NotificationService.getUserNotifications(user.uid);
          setNotifications(initialNotifications);
          setUnreadCount(initialNotifications.filter(n => !n.read).length);

          // Subscribe to real-time updates
          unsubscribe = NotificationService.subscribeToNotifications(user.uid, (newNotification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
          });
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    };

    setupNotifications();
    return () => unsubscribe();
  }, [user]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await NotificationService.markAsRead(user.uid, notification.id);
    }
    // Navigate to relevant page based on notification type
    handleClose();
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    // Ensure we have a valid date
    const date = new Date(notification.createdAt || notification.timestamp);
    if (!isValid(date)) {
      console.warn('Invalid date for notification:', notification);
      return groups;
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(notification);
    return groups;
  }, {});

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleClick}
        component={motion.button}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          component={motion.div}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            overflow: 'auto',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Notifications</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small" 
                onClick={() => setShowSettings(!showSettings)}
                sx={{ 
                  transform: showSettings ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s'
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setNotifications([])}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Collapse in={showSettings}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Notification Settings</Typography>
              <FormGroup>
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size="small"
                        checked={value}
                        onChange={(e) => setNotificationSettings(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }))}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Typography>
                    }
                  />
                ))}
              </FormGroup>
            </Box>
          </Collapse>
        </Box>

        <AnimatePresence>
          {Object.entries(groupedNotifications).map(([date, notifications]) => (
            <Box key={date}>
              <Typography
                variant="overline"
                sx={{
                  px: 2,
                  py: 1,
                  display: 'block',
                  bgcolor: 'background.default'
                }}
              >
                {isValid(new Date(date)) ? format(new Date(date), 'MMMM d, yyyy') : 'Invalid Date'}
              </Typography>

              {notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  sx={{
                    bgcolor: notification.read ? 'inherit' : 'action.hover',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={notification.from?.photoURL}
                      sx={{
                        bgcolor: notification.read ? 'grey.400' : 'primary.main'
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {notification.body}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(notification.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </MenuItem>
              ))}
            </Box>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <Box
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <NotificationsOffIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 