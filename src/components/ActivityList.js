import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Skeleton
} from '@mui/material';
import { format } from 'date-fns';
import { useActivities } from '../context/ActivityContext';
import TaskIcon from '@mui/icons-material/Assignment';
import ProjectIcon from '@mui/icons-material/Folder';
import CommentIcon from '@mui/icons-material/Comment';

const ActivityList = () => {
  const { activities, loading } = useActivities();

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_created':
      case 'task_updated':
      case 'task_completed':
        return <TaskIcon />;
      case 'project_created':
      case 'project_updated':
        return <ProjectIcon />;
      case 'comment_added':
        return <CommentIcon />;
      default:
        return <TaskIcon />;
    }
  };

  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={60} sx={{ my: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {activities.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No recent activities
        </Typography>
      ) : (
        activities.map((activity) => (
          <ListItem
            key={activity.id}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'primary.main' }}>
              {getActivityIcon(activity.type)}
            </ListItemIcon>
            <ListItemText
              primary={activity.details}
              secondary={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                  <Chip 
                    label={activity.projectName} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(activity.timestamp), 'PPp')}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
        ))
      )}
    </List>
  );
};

export default ActivityList; 