import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { format } from 'date-fns';

const ProjectTimeline = ({ tasks }) => {
  // Sort tasks by start date
  const sortedTasks = [...tasks].sort((a, b) => 
    new Date(a.startDate || a.createdAt) - new Date(b.startDate || b.createdAt)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
        return 'success';
      case 'In Progress':
        return 'primary';
      case 'To Do':
        return 'grey';
      default:
        return 'grey';
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Project Timeline</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Timeline position="alternate">
          {sortedTasks.map((task) => (
            <TimelineItem key={task.id}>
              <TimelineSeparator>
                <TimelineDot color={getStatusColor(task.status)} />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  boxShadow: 1
                }}>
                  <Typography variant="subtitle1">{task.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(new Date(task.startDate || task.createdAt), 'MMM dd, yyyy')}
                  </Typography>
                  {task.dueDate && (
                    <Typography variant="body2" color="text.secondary">
                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                    </Typography>
                  )}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'inline-block',
                      mt: 1,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      bgcolor: getStatusColor(task.status) + '.light',
                      color: getStatusColor(task.status) + '.dark'
                    }}
                  >
                    {task.status}
                  </Typography>
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default ProjectTimeline; 