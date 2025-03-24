import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { formatDistanceToNow } from 'date-fns';
import CustomLoader from '../common/CustomLoader';

const NotificationList = ({ notifications, loading, onMarkAsRead, onDelete }) => {
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
          notifications.map((notification) => (
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
                        {notification.message}
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
                        onClick={() => onMarkAsRead(notification.id)}
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
                      onClick={() => onDelete(notification.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))
        )}
      </List>
    </Paper>
  );
};

export default NotificationList; 