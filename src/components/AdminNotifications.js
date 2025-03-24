import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Divider,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Error,
  Info,
  Notifications,
  Person,
  PlayArrow,
  Stop,
  Timer,
  Done,
  Close,
  Star,
  MarkAsUnread,
  MoreVert,
  NotificationsActive,
  Event
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import TaskView from './Task/TaskView';
import { formatDistance } from 'date-fns';
import { useAuth } from '../context/AuthContext';

// Define severity colors
const severityColors = {
  success: '#22c55e', // bright green
  error: '#ef4444',   // bright red
  info: '#1976d2',    // bright blue
  warning: '#f59e0b'  // bright yellow/orange
};

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Query for task-related notifications
      const q = query(
        collection(db, 'notifications'),
        where('type', 'in', ['taskStart', 'taskComplete', 'taskStatusChange', 'taskReview']),
        orderBy('createdAt', 'desc')
      );
      
      const notificationsSnapshot = await getDocs(q);
      const notificationsData = [];
      
      // We'll need to fetch additional data for each notification
      const userIds = new Set();
      
      notificationsSnapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.userId) userIds.add(data.userId);
        if (data.targetUserId) userIds.add(data.targetUserId);
        notificationsData.push(data);
      });
      
      // Fetch user data for all users we need
      const usersData = {};
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          usersData[userId] = userDoc.data();
        }
      }
      
      setUsers(usersData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: new Date()
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date() } 
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleViewTask = async (notification) => {
    try {
      // If we have task details directly in the notification
      if (notification.taskData) {
        setSelectedTask(notification.taskData);
        setOpenTaskDialog(true);
        return;
      }
      
      // Otherwise fetch the task
      if (notification.taskId) {
        const taskDoc = await getDoc(doc(db, 'tasks', notification.taskId));
        if (taskDoc.exists()) {
          setSelectedTask({ id: taskDoc.id, ...taskDoc.data() });
          setOpenTaskDialog(true);
          
          // Mark as read if viewed
          if (!notification.read) {
            handleMarkAsRead(notification.id);
          }
        }
      }
    } catch (error) {
      console.error('Error viewing task:', error);
    }
  };
  
  // Format time spent
  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds) return '0h 0m';
    
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };
  
  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'taskStart':
        return <PlayArrow sx={{ color: severityColors.info }} />;
      case 'taskComplete':
        return <CheckCircle sx={{ color: severityColors.success }} />;
      case 'taskStatusChange':
        return <Info sx={{ color: severityColors.warning }} />;
      case 'taskReview':
        return <Star sx={{ color: severityColors.warning }} />;
      default:
        return <Notifications sx={{ color: severityColors.info }} />;
    }
  };
  
  // Get notification message
  const getNotificationMessage = (notification) => {
    const { type, userId, taskName, targetUserId, oldStatus, newStatus, timeSpent } = notification;
    const userName = users[userId]?.displayName || 'Someone';
    
    switch (type) {
      case 'taskStart':
        return (
          <>
            <Typography variant="body1">
              <strong>{userName}</strong> started working on <strong>{taskName}</strong>
            </Typography>
            {timeSpent && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Active timer started
                </Typography>
              </Box>
            )}
          </>
        );
        
      case 'taskComplete':
        return (
          <>
            <Typography variant="body1">
              <strong>{userName}</strong> completed <strong>{taskName}</strong>
            </Typography>
            {timeSpent && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <Timer fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Time spent: <strong>{formatTime(timeSpent)}</strong>
                </Typography>
              </Box>
            )}
          </>
        );
        
      case 'taskStatusChange':
        return (
          <>
            <Typography variant="body1">
              <strong>{userName}</strong> changed <strong>{taskName}</strong> from{' '}
              <Chip size="small" label={oldStatus} sx={{ fontSize: '0.7rem' }} /> to{' '}
              <Chip size="small" label={newStatus} sx={{ fontSize: '0.7rem' }} />
            </Typography>
            {timeSpent && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Tracked time: <strong>{formatTime(timeSpent)}</strong>
                </Typography>
              </Box>
            )}
          </>
        );
        
      case 'taskReview':
        return (
          <>
            <Typography variant="body1">
              <strong>{userName}</strong> reviewed <strong>{taskName}</strong>
            </Typography>
            {notification.rating && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                <Star fontSize="small" color="warning" />
                <Typography variant="body2" color="text.secondary">
                  Rating: <strong>{notification.rating}/5</strong>
                </Typography>
              </Box>
            )}
            {notification.reviewComment && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                "{notification.reviewComment}"
              </Typography>
            )}
          </>
        );
        
      default:
        return <Typography variant="body1">New notification</Typography>;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0}
      variant="outlined"
      sx={{ 
        height: '100%', 
        overflow: 'auto',
        borderRadius: 2
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsActive color="primary" />
          Admin Notifications
        </Typography>
        <Button size="small" onClick={fetchNotifications}>Refresh</Button>
      </Box>
      
      {notifications.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No notifications to display</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                alignItems="flex-start"
                sx={{ 
                  py: 2,
                  backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.04)',
                  transition: 'background-color 0.2s'
                }}
                secondaryAction={
                  <Box>
                    {!notification.read && (
                      <Tooltip title="Mark as read">
                        <IconButton size="small" onClick={() => handleMarkAsRead(notification.id)}>
                          <Done fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View task">
                      <IconButton size="small" onClick={() => handleViewTask(notification)}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemIcon>
                  {!notification.read ? (
                    <Badge
                      variant="dot"
                      color="primary"
                      overlap="circular"
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Badge>
                  ) : (
                    getNotificationIcon(notification.type)
                  )}
                </ListItemIcon>
                
                <ListItemText
                  primary={getNotificationMessage(notification)}
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      {notification.createdAt?.toDate 
                        ? formatDistance(notification.createdAt.toDate(), new Date(), { addSuffix: true })
                        : 'Just now'}
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
      
      {/* Task Dialog */}
      <Dialog
        open={openTaskDialog}
        onClose={() => setOpenTaskDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Task Details
          <IconButton
            onClick={() => setOpenTaskDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <TaskView 
              task={selectedTask} 
              isAdmin={true}
              onClose={() => setOpenTaskDialog(false)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminNotifications; 