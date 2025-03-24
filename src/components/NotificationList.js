import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  IconButton,
  Badge,
  Avatar,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { NotificationService } from '../services/notification.service';
import { useAuth } from '../context/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CustomLoader from './CustomLoader';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = null;

    const setupNotifications = async () => {
      if (user?.uid) {
        try {
          // Use the existing subscribeToUserNotifications method
          unsubscribe = NotificationService.subscribeToUserNotifications(user.uid, (notifications) => {
            setNotifications(notifications);
            setLoading(false);
          });
        } catch (error) {
          console.error('Error setting up notifications:', error);
          setLoading(false);
        }
      }
    };

    setupNotifications();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user]);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await NotificationService.markAsRead(user.uid, notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const formatNotificationDate = (timestamp) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const groupNotificationsByDate = (notifications) => {
    const groups = {};
    notifications.forEach(notification => {
      const date = formatNotificationDate(notification.createdAt || notification.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  if (loading) {
    return (
      <Box sx={{ height: '100%', p: 2 }}>
        <CustomLoader message="Loading notifications..." />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: '100%',
        maxHeight: 'calc(100vh - 200px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ 
        p: 2, 
        borderBottom: 1, 
        borderColor: 'divider', 
        bgcolor: 'background.default',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <Typography variant="h6" component="div">
          Notifications
        </Typography>
      </Box>

      <List 
        sx={{ 
          overflow: 'auto',
          flex: 1,
          p: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }}
      >
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
            <React.Fragment key={date}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge badgeContent={dateNotifications.filter(n => !n.read).length} color="error">
                  <NotificationsIcon />
                </Badge>
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {date.toUpperCase()}
                </Typography>
              </Box>
              <List>
                {dateNotifications.map((notification) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        py: 2,
                        px: 3,
                        backgroundColor: notification.read ? 'transparent' : 'action.hover',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        position: 'relative',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <NotificationsIcon color={notification.read ? 'disabled' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ pr: 8 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: notification.read ? 'normal' : 'medium',
                                color: notification.read ? 'text.secondary' : 'text.primary',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.4,
                                mb: 0.5,
                              }}
                            >
                              {notification.title}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true })}
                          </Typography>
                        }
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          gap: 1,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          p: 0.5,
                        }}
                      >
                        {!notification.read && (
                          <Tooltip title="Mark as read">
                            <IconButton
                              edge="end"
                              aria-label="mark as read"
                              onClick={() => handleNotificationClick(notification)}
                              size="small"
                            >
                              <CheckCircleIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleNotificationClick(notification)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );
};

export default NotificationList; 