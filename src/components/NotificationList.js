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
  Avatar
} from '@mui/material';
import { format } from 'date-fns';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { NotificationService } from '../services/notification.service';
import { useAuth } from '../context/AuthContext';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe = null;

    const setupNotifications = async () => {
      if (user?.uid) {
        try {
          // Use the existing subscribeToUserNotifications method
          unsubscribe = NotificationService.subscribeToUserNotifications(user.uid, (notifications) => {
            setNotifications(notifications);
          });
        } catch (error) {
          console.error('Error setting up notifications:', error);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
          <NotificationsIcon />
        </Badge>
        <Typography variant="h6" sx={{ ml: 1 }}>Notifications</Typography>
      </Box>

      {Object.keys(groupedNotifications).length === 0 ? (
        <Typography color="text.secondary">No notifications</Typography>
      ) : (
        Object.entries(groupedNotifications).map(([date, dateNotifications]) => (
          <Box key={date}>
            <Typography
              variant="subtitle2"
              sx={{
                bgcolor: 'background.default',
                px: 2,
                py: 1,
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}
            >
              {date.toUpperCase()}
            </Typography>
            <List>
              {dateNotifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                    cursor: 'pointer'
                  }}
                >
                  <ListItemIcon>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'primary.main'
                      }}
                    >
                      {notification.type === 'TASK_ASSIGNED' ? 'T' : 'N'}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(notification.createdAt || notification.timestamp), 'h:mm a')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))
      )}
    </Box>
  );
};

export default NotificationList; 