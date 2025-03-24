import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating, IconButton } from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { TaskService } from '../../services/TaskService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NotificationService } from '../../services/NotificationService';

const TaskTimer = ({ task, projectId, onTimerUpdate, isAdmin = false }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [customTimeOpen, setCustomTimeOpen] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 0,
    comment: '',
  });
  
  // Initialize timer state from task data
  useEffect(() => {
    if (task) {
      const timeTracking = task.timeTracking || {};
      setIsActive(timeTracking.isActive || false);
      
      // Calculate total time spent
      let totalTime = task.totalTimeSpent || 0;
      
      // If timer is active, add the time since it started
      if (timeTracking.isActive && timeTracking.startTime) {
        const startTime = typeof timeTracking.startTime === 'string' 
          ? new Date(timeTracking.startTime) 
          : timeTracking.startTime.toDate?.() || timeTracking.startTime;
          
        totalTime += (new Date() - startTime);
      }
      
      setTimeSpent(totalTime);
    }
  }, [task]);
  
  // Set up timer interval when active
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setTimeSpent(prevTime => prevTime + 1000);
      }, 1000);
      
      setTimerInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isActive]);
  
  const handleStartTimer = async () => {
    if (!projectId || !task?.id) {
      console.error('Missing project ID or task ID');
      return;
    }
    
    try {
      setLoading(true);
      
      // Track time in the database
      const result = await TaskService.startTaskTimer(projectId, task.id, user.uid);
      
      // Update local state
      setIsActive(true);
      
      // Notify parent component
      if (onTimerUpdate) {
        onTimerUpdate({
          ...task,
          timeTracking: result.timeTracking,
          status: 'In Progress'
        });
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      showToast('Failed to start timer', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStopTimer = async (newStatus = null) => {
    if (!projectId || !task?.id) {
      console.error('Missing project ID or task ID');
      return;
    }
    
    try {
      setLoading(true);
      
      // Stop timer in the database
      const result = await TaskService.stopTaskTimer(projectId, task.id, user.uid, newStatus);
      
      // Update local state
      setIsActive(false);
      
      // Set the accumulated time spent
      if (result.totalTimeSpent) {
        setTimeSpent(result.totalTimeSpent);
      }
      
      // Notify parent component
      if (onTimerUpdate) {
        onTimerUpdate({
          ...task,
          timeTracking: result.timeTracking,
          timeEntries: result.timeEntries,
          totalTimeSpent: result.totalTimeSpent,
          status: newStatus || task.status
        });
      }
      
      // Show success message with time spent
      if (newStatus === 'Done') {
        const timeSpentFormatted = TaskService.formatTimeSpent(result.totalTimeSpent);
        showToast(`Task completed! Time spent: ${timeSpentFormatted}`, 'success');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      showToast('Failed to stop timer', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Add custom time entry
  const handleAddCustomTime = async () => {
    if (!projectId || !task?.id || !customTime) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Parse the time format HH:MM:SS to milliseconds
      const [hours, minutes, seconds] = customTime.split(':').map(Number);
      const timeInMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
      
      if (isNaN(timeInMs) || timeInMs <= 0) {
        showToast('Invalid time format. Use HH:MM:SS', 'error');
        return;
      }
      
      // Add a manual time entry
      const result = await TaskService.addManualTimeEntry(projectId, task.id, user.uid, timeInMs);
      
      // Update local state
      setTimeSpent(prevTime => prevTime + timeInMs);
      
      // Notify parent component
      if (onTimerUpdate) {
        onTimerUpdate({
          ...task,
          timeEntries: result.timeEntries,
          totalTimeSpent: result.totalTimeSpent
        });
      }
      
      setCustomTimeOpen(false);
      setCustomTime('');
      showToast('Manual time entry added', 'success');
    } catch (error) {
      console.error('Error adding manual time:', error);
      showToast('Failed to add time entry', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Review and approve task (admin only)
  const handleReviewTask = async () => {
    if (!projectId || !task?.id || !isAdmin) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Update task with review data
      await TaskService.updateTaskInProjectArray(projectId, task.id, {
        review: {
          reviewerId: user.uid,
          reviewerName: user.displayName || user.email,
          rating: reviewData.rating,
          comment: reviewData.comment,
          reviewedAt: new Date().toISOString()
        },
        status: 'Reviewed'
      });
      
      // Send notification to task assignee
      if (task.assignee) {
        const notification = {
          type: 'task_reviewed',
          taskId: task.id,
          taskName: task.name,
          projectId: projectId,
          projectName: task.project?.name,
          userId: user.uid,
          userName: user.displayName || user.email,
          recipientId: task.assignee,
          createdAt: new Date().toISOString(),
          message: `${user.displayName || user.email} reviewed your task "${task.name}"`,
          review: {
            rating: reviewData.rating,
            comment: reviewData.comment
          }
        };
        
        await NotificationService.sendDirectNotification(notification);
      }
      
      // Notify parent component
      if (onTimerUpdate) {
        onTimerUpdate({
          ...task,
          review: {
            reviewerId: user.uid,
            reviewerName: user.displayName || user.email,
            rating: reviewData.rating,
            comment: reviewData.comment,
            reviewedAt: new Date().toISOString()
          },
          status: 'Reviewed'
        });
      }
      
      setReviewDialogOpen(false);
      showToast('Task review submitted', 'success');
    } catch (error) {
      console.error('Error reviewing task:', error);
      showToast('Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Format time for display (HH:MM:SS)
  const formatTime = (milliseconds) => {
    return TaskService.formatTimeSpent(milliseconds);
  };
  
  // Get a list of time entries for display in a tooltip
  const getTimeEntriesText = () => {
    if (!task.timeEntries || task.timeEntries.length === 0) {
      return 'No time entries yet';
    }
    
    return task.timeEntries
      .slice(-5) // Show only the last 5 entries
      .map(entry => {
        const startTime = new Date(entry.startTime);
        const endTime = new Date(entry.endTime);
        const duration = formatTime(entry.duration);
        
        return `${format(startTime, 'MM/dd HH:mm')} - ${format(endTime, 'HH:mm')} (${duration})`;
      })
      .join('\n') + 
      (task.timeEntries.length > 5 ? `\n...and ${task.timeEntries.length - 5} more entries` : '');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Tooltip title={getTimeEntriesText()} arrow placement="top">
        <Chip
          icon={<TimerIcon />}
          label={formatTime(timeSpent)}
          color={isActive ? 'secondary' : 'default'}
          variant={isActive ? 'filled' : 'outlined'}
      sx={{ 
            px: 1,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            backgroundColor: isActive ? '#1976d2' : 'transparent',
            borderColor: '#1976d2',
            color: isActive ? 'white' : '#1976d2'
          }}
        />
          </Tooltip>
      
      {loading ? (
        <CircularProgress size={24} />
        ) : (
          <>
          {/* Regular user buttons */}
          {!isAdmin && (
            <>
              {isActive ? (
                <Button
                  size="small"
                  variant="contained"
                  color="warning"
                  onClick={() => handleStopTimer()}
                  startIcon={<PauseIcon />}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={handleStartTimer}
                  startIcon={<PlayArrowIcon />}
                  disabled={task.status === 'Done' || task.status === 'Reviewed'}
                >
                  {task.status === 'To Do' ? 'Start Working' : 'Resume'}
                </Button>
              )}
              
              <Tooltip title="Log manual time">
                <IconButton 
                  size="small" 
                  onClick={() => setCustomTimeOpen(true)}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            </>
          )}
          
          {/* Admin review button */}
          {isAdmin && task.status === 'Done' && !task.review && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              onClick={() => setReviewDialogOpen(true)}
              startIcon={<ThumbUpIcon />}
            >
              Review & Approve
            </Button>
          )}
          
          {/* Show review badge if reviewed */}
          {task.review && (
            <Tooltip 
              title={`Reviewed by ${task.review.reviewerName}: ${task.review.rating}/5 - "${task.review.comment}"`}
              arrow
            >
              <Chip
                icon={<CheckCircleIcon />}
                label={`Reviewed: ${task.review.rating}/5`}
                color="success"
                size="small"
              />
            </Tooltip>
          )}
          </>
        )}
      
      {/* Custom Time Dialog */}
      <Dialog open={customTimeOpen} onClose={() => setCustomTimeOpen(false)}>
        <DialogTitle>Add Time Manually</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Time (HH:MM:SS)"
            type="text"
            fullWidth
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            placeholder="00:30:00"
            helperText="Enter time in format: hours:minutes:seconds"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomTimeOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCustomTime} variant="contained" color="primary">
            Add Time
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Task: {task.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
            <Typography variant="subtitle1">Time spent: {formatTime(timeSpent)}</Typography>
            
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
        </Box>
  );
};

export default TaskTimer; 