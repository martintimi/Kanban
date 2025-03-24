import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  TextField,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { format } from 'date-fns';
import { TaskService } from '../../services/TaskService';
import { NotificationService } from '../../services/NotificationService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import TaskTimer from './TaskTimer';

const AdminTaskView = ({ open, onClose, task, projectId, onTaskUpdated }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [localTask, setLocalTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  
  useEffect(() => {
    if (task) {
      setLocalTask(task);
    }
  }, [task]);
  
  if (!localTask) {
    return null;
  }
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      setLoading(true);
      
      const newComment = {
        id: Date.now().toString(),
        text: comment,
        userId: user.uid,
        userName: user.displayName || user.email,
        createdAt: new Date().toISOString()
      };
      
      const updatedComments = [...(localTask.comments || []), newComment];
      
      // Update task with new comment
      await TaskService.updateTaskInProjectArray(projectId, localTask.id, {
        comments: updatedComments
      });
      
      // Update local state
      setLocalTask(prev => ({
        ...prev,
        comments: updatedComments
      }));
      
      // Notify the assignee
      if (localTask.assignee && localTask.assignee !== user.uid) {
        const notification = {
          type: 'new_comment',
          taskId: localTask.id,
          taskName: localTask.name,
          projectId: projectId,
          userId: user.uid,
          userName: user.displayName || user.email,
          recipientId: localTask.assignee,
          message: `${user.displayName || user.email} commented on task "${localTask.name}"`,
          comment: comment
        };
        
        await NotificationService.sendDirectNotification(notification);
      }
      
      setComment('');
      showToast('Comment added successfully', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showToast('Failed to add comment', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTimerUpdate = (updatedTask) => {
    setLocalTask(prev => ({ ...prev, ...updatedTask }));
    
    if (onTaskUpdated) {
      onTaskUpdated(updatedTask);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{localTask.name}</Typography>
          <Chip 
            label={localTask.status} 
            color={
              localTask.status === 'Done' ? 'success' : 
              localTask.status === 'In Progress' ? 'secondary' : 
              localTask.status === 'Reviewed' ? 'info' : 
              'default'
            }
          />
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Task details section */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Description
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body1">
                  {localTask.description || 'No description provided'}
                </Typography>
              </Paper>
            </Box>
            
            {/* Time tracking section */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Time Tracking
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <TaskTimer 
                  task={localTask} 
                  projectId={projectId} 
                  onTimerUpdate={handleTimerUpdate} 
                  isAdmin={true}
                />
                
                {localTask.timeEntries && localTask.timeEntries.length > 0 && (
                  <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        Time Entries ({localTask.timeEntries.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense sx={{ width: '100%', maxHeight: 200, overflow: 'auto' }}>
                        {localTask.timeEntries.map((entry, index) => (
                          <ListItem key={index} divider={index < localTask.timeEntries.length - 1}>
                            <ListItemIcon>
                              <AccessTimeIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={TaskService.formatTimeSpent(entry.duration)}
                              secondary={`${formatDate(entry.startTime)} ${
                                entry.manual ? '(Manual entry)' : ''
                              }`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Paper>
            </Box>
            
            {/* Status history section */}
            {localTask.statusHistory && localTask.statusHistory.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Status History
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense sx={{ width: '100%' }}>
                    {localTask.statusHistory.map((status, index) => (
                      <ListItem key={index} divider={index < localTask.statusHistory.length - 1}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Changed from ${status.previousStatus || 'N/A'} to ${status.newStatus}`}
                          secondary={formatDate(status.timestamp)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}
            
            {/* Comments section */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                Comments
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {localTask.comments && localTask.comments.length > 0 ? (
                  <List>
                    {localTask.comments.map((comment) => (
                      <ListItem key={comment.id} alignItems="flex-start" divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {comment.userName?.charAt(0).toUpperCase() || 'U'}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="subtitle2">
                                {comment.userName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(comment.createdAt)}
                              </Typography>
                            </Box>
                          }
                          secondary={comment.text}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" align="center" py={2}>
                    No comments yet
                  </Typography>
                )}
                
                <Box mt={2}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Add a comment..."
                    variant="outlined"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAddComment}
                      disabled={loading || !comment.trim()}
                      startIcon={loading && <CircularProgress size={16} />}
                    >
                      Add Comment
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* Task info sidebar */}
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default',
                height: '100%'
              }}
            >
              <List disablePadding>
                <ListItem divider>
                  <ListItemIcon>
                    <AssignmentIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Project"
                    secondary={localTask.project?.name || 'Unknown project'}
                  />
                </ListItem>
                
                <ListItem divider>
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Assignee"
                    secondary={localTask.assigneeName || 'Unassigned'}
                  />
                </ListItem>
                
                <ListItem divider>
                  <ListItemIcon>
                    <PriorityHighIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Priority"
                    secondary={
                      <Chip 
                        size="small" 
                        label={localTask.priority || 'Normal'} 
                        color={getPriorityColor(localTask.priority)}
                      />
                    }
                  />
                </ListItem>
                
                <ListItem divider>
                  <ListItemIcon>
                    <CalendarTodayIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Created On"
                    secondary={formatDate(localTask.createdAt)}
                  />
                </ListItem>
                
                {localTask.dueDate && (
                  <ListItem divider>
                    <ListItemIcon>
                      <CalendarTodayIcon color={
                        new Date(localTask.dueDate) < new Date() && 
                        localTask.status !== 'Done' && 
                        localTask.status !== 'Reviewed' ? 
                        'error' : 'primary'
                      } />
                    </ListItemIcon>
                    <ListItemText
                      primary="Due Date"
                      secondary={formatDate(localTask.dueDate)}
                    />
                  </ListItem>
                )}
                
                {localTask.timeTracking && (
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Last Activity"
                      secondary={formatDate(
                        localTask.timeTracking.lastUpdated || 
                        localTask.timeTracking.startTime
                      )}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminTaskView; 