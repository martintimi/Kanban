import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  DialogActions,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { format } from 'date-fns';
import { TaskService } from '../../services/TaskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import TaskTimer from './TaskTimer';
import { Rating } from '@mui/material';
import { TextField } from '@mui/material';

const TaskView = ({ open, onClose, task, projectId, onUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [localTask, setLocalTask] = useState(null);
  const [error, setError] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 0, comment: '' });
  
  // Update local task state when prop changes
  useEffect(() => {
    if (task) {
      setLocalTask(task);
    }
  }, [task]);
  
  if (!localTask) return null;

  const getProgress = () => {
    if (!localTask.subtasks?.length) return 0;
    return Math.round((localTask.subtasks.filter(st => st.completed).length / localTask.subtasks.length) * 100);
  };
  
  const handleStatusUpdate = async (newStatus) => {
    if (!projectId || !localTask.id) {
      showToast('Missing project ID or task ID', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      // If we're moving to "In Progress", start the timer
      if (newStatus === 'In Progress' && localTask.status !== 'In Progress') {
        try {
          await TaskService.startTaskTimer(projectId, localTask.id, user.uid);
          console.log('Timer started');
        } catch (timerError) {
          console.error('Error starting timer:', timerError);
        }
      }
      
      // If we're moving from "In Progress" to something else, stop the timer
      if (localTask.status === 'In Progress' && newStatus !== 'In Progress') {
        try {
          await TaskService.stopTaskTimer(projectId, localTask.id, user.uid, newStatus);
          console.log('Timer stopped');
        } catch (timerError) {
          console.error('Error stopping timer:', timerError);
        }
      }
      
      // First try to update the task in the project array
      try {
        const statusHistory = {
          previousStatus: localTask.status,
          newStatus: newStatus,
          updatedBy: user.uid,
          timestamp: new Date().toISOString()
        };
        
        const updatedTask = await TaskService.updateTaskInProjectArray(
          projectId,
          localTask.id,
          { 
            status: newStatus, 
            statusHistory: [...(localTask.statusHistory || []), statusHistory] 
          }
        );
        
        console.log('Task updated in project array:', updatedTask);
        
        // Update local task state
        setLocalTask(prev => ({ ...prev, status: newStatus }));
        
        // Notify parent component
        if (onUpdate) {
          onUpdate({ ...localTask, status: newStatus });
        }
        
        showToast(`Task moved to ${newStatus}`, 'success');
      } catch (error) {
        console.error('Error updating task in project array:', error);
        console.log('Falling back to standard update method');
        
        // Fallback to standard method
        await TaskService.updateTask(localTask.id, { status: newStatus });
        
        // Update local task state
        setLocalTask(prev => ({ ...prev, status: newStatus }));
        
        // Notify parent component
        if (onUpdate) {
          onUpdate({ ...localTask, status: newStatus });
        }
        
        showToast(`Task moved to ${newStatus}`, 'success');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      setError(`Failed to update task status: ${error.message}`);
      showToast('Failed to update task status', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Check if the current user is assigned to this task
  const isAssignedToMe = 
    (localTask.assignee?.uid === user?.uid) || 
    (typeof localTask.assignee === 'string' && localTask.assignee === user?.uid) ||
    (localTask.assignedTo === user?.uid);

  // Format the due date safely
  const formatDueDate = (dateStr) => {
    try {
      if (!dateStr) return 'No due date';
      const date = new Date(dateStr);
      return format(date, 'MMMM d, yyyy');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const handleReviewTask = async () => {
    if (!projectId || !localTask.id) {
      showToast('Missing project ID or task ID', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await TaskService.reviewTask(projectId, localTask.id, reviewData.rating, reviewData.comment);
      showToast('Task review submitted successfully', 'success');
      setReviewDialogOpen(false);
      setReviewData({ rating: 0, comment: '' });
      handleStatusUpdate('Done');
    } catch (error) {
      console.error('Error submitting task review:', error);
      setError(`Failed to submit task review: ${error.message}`);
      showToast('Failed to submit task review', 'error');
    } finally {
      setLoading(false);
    }
  };

  // In the JSX, add admin review option for completed tasks
  const isAdmin = user?.role === 'admin';
  if (localTask.status === 'Done' && isAdmin && !localTask.review) {
    return (
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="subtitle1" gutterBottom>
          Task Completed - Ready for Review
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<ThumbUpIcon />}
          onClick={() => setReviewDialogOpen(true)}
        >
          Review & Approve
        </Button>
      </Box>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{localTask.name || 'Untitled Task'}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            {localTask.description || 'No description provided'}
          </Typography>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Status: ${localTask.status || 'To Do'}`} 
            color={
              localTask.status === 'Done' ? 'success' :
              localTask.status === 'In Progress' ? 'primary' :
              localTask.status === 'On Hold' ? 'warning' : 'default'
            }
          />
          <Chip 
            label={`Priority: ${localTask.priority || 'Medium'}`}
            color={
              localTask.priority === 'high' ? 'error' : 
              localTask.priority === 'medium' ? 'warning' : 'default'
            }
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Assigned To
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={
                typeof localTask.assignee === 'object' 
                  ? localTask.assignee?.photoURL 
                  : user?.photoURL
              }
            >
              {(
                typeof localTask.assignee === 'object' 
                  ? localTask.assignee?.name 
                  : user?.displayName || 'U'
              ).charAt(0)}
            </Avatar>
            <Typography>
              {typeof localTask.assignee === 'object' 
                ? (localTask.assignee?.name || localTask.assignee?.email) 
                : (user?.displayName || user?.email || 'Unassigned')}
            </Typography>
          </Box>
        </Box>

        {localTask.dueDate && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Due Date
          </Typography>
          <Typography display="flex" alignItems="center" gap={1}>
            <AccessTimeIcon fontSize="small" />
              {formatDueDate(localTask.dueDate)}
          </Typography>
        </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={localTask.progress || getProgress()} 
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {localTask.progress || getProgress()}% Complete
          </Typography>
        </Box>

        {localTask.subtasks?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Subtasks
            </Typography>
            {localTask.subtasks.map((subtask, index) => (
              <Box key={subtask.id || index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip 
                  size="small"
                  label={subtask.completed ? 'Done' : 'Pending'}
                  color={subtask.completed ? 'success' : 'default'}
                />
                <Typography>{subtask.title}</Typography>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Debug info - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>Debug Info</Typography>
            <Typography variant="caption" component="div">
              Task ID: {localTask.id}<br />
              Project ID: {projectId || localTask.projectId}<br />
              Assignment Type: {typeof localTask.assignee}<br />
              Assignment Value: {
                typeof localTask.assignee === 'object' 
                  ? JSON.stringify(localTask.assignee) 
                  : localTask.assignee
              }<br />
              Assigned To: {localTask.assignedTo}<br />
              Is Assigned To Me: {isAssignedToMe ? 'Yes' : 'No'}
            </Typography>
          </Box>
        )}
        
        {/* Task actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2, 
          mt: 3 
        }}>
          {/* Status buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {localTask.status !== 'To Do' && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestartAltIcon />}
                onClick={() => handleStatusUpdate('To Do')}
              >
                Move to To Do
              </Button>
            )}
            
            {localTask.status !== 'In Progress' && (
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={() => handleStatusUpdate('In Progress')}
              >
                {localTask.status === 'To Do' ? 'Start Working' : 'Resume Working'}
              </Button>
            )}
            
            {localTask.status !== 'Done' && (
              <Button
                variant="contained"
                size="small"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => handleStatusUpdate('Done')}
              >
                Mark Complete
              </Button>
            )}
          </Box>
          
          {/* Task Timer */}
          <TaskTimer
            task={localTask}
            projectId={projectId}
            onTimerUpdate={(updatedTask) => {
              setLocalTask(prev => ({ ...prev, ...updatedTask }));
              if (updatedTask.status !== localTask.status) {
                onUpdate({ ...localTask, ...updatedTask });
              }
            }}
          />
        </Box>

        {/* Add dialog for reviewing completed tasks */}
        <Dialog 
          open={reviewDialogOpen} 
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Review Task: {localTask.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
              <Typography variant="subtitle1">
                Time spent: {TaskService.formatTimeSpent(localTask.totalTimeSpent || 0)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography>Rating:</Typography>
                <Rating
                  value={reviewData.rating}
                  onChange={(event, newValue) => {
                    setReviewData(prev => ({ ...prev, rating: newValue }));
                  }}
                  precision={0.5}
                />
              </Box>
              
              <TextField
                label="Feedback"
                multiline
                rows={4}
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                fullWidth
                variant="outlined"
                placeholder="Provide feedback on this task..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleReviewTask} 
              variant="contained" 
              color="primary"
              disabled={reviewData.rating === 0}
            >
              Submit Review
            </Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskView; 