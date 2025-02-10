import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  IconButton,
  TextField,
  Button,
  Chip,
  Avatar,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Comment as CommentIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import TaskTimer from './TaskTimer';
import { TaskService } from '../../services/TaskService';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '../../context/ToastContext';

const TaskDetails = ({ task, projectId, onUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [progress, setProgress] = useState(task.progress || 0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState('');

  const handleTimeUpdate = async (taskId, duration) => {
    try {
      const timeEntry = {
        duration,
        timestamp: new Date().toISOString(),
        userId: user.uid
      };
      await TaskService.addTimeEntry(projectId, taskId, timeEntry);
      showToast('Time entry added successfully', 'success');
    } catch (error) {
      showToast('Failed to update time entry', 'error');
    }
  };

  const handleSubtaskToggle = async (index) => {
    const updatedSubtasks = [...subtasks];
    updatedSubtasks[index].completed = !updatedSubtasks[index].completed;
    
    // Calculate progress based on completed subtasks
    const completedCount = updatedSubtasks.filter(st => st.completed).length;
    const newProgress = Math.round((completedCount / updatedSubtasks.length) * 100);
    
    try {
      await TaskService.updateTaskProgress(projectId, task.id, newProgress);
      setSubtasks(updatedSubtasks);
      setProgress(newProgress);
      onUpdate && onUpdate();
    } catch (error) {
      showToast('Failed to update subtask', 'error');
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    
    const newSubtaskItem = {
      title: newSubtask,
      completed: false,
      createdAt: new Date().toISOString(),
      createdBy: user.uid
    };

    try {
      await TaskService.addSubtask(projectId, task.id, newSubtaskItem);
      setSubtasks([...subtasks, newSubtaskItem]);
      setNewSubtask('');
      showToast('Subtask added successfully', 'success');
    } catch (error) {
      showToast('Failed to add subtask', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      text: newComment,
      userId: user.uid,
      timestamp: new Date().toISOString(),
      userName: user.name
    };

    try {
      await TaskService.addComment(projectId, task.id, comment);
      setComments([...comments, comment]);
      setNewComment('');
      showToast('Comment added successfully', 'success');
    } catch (error) {
      showToast('Failed to add comment', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5">{task.title}</Typography>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <MoreVertIcon />
              </IconButton>
            </Box>
            
            <Typography color="text.secondary" gutterBottom>
              {task.description}
            </Typography>

            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Progress ({progress}%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <TaskTimer taskId={task.id} onTimeUpdate={handleTimeUpdate} />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subtasks
            </Typography>
            <List>
              {subtasks.map((subtask, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end">
                      <MoreVertIcon />
                    </IconButton>
                  }
                >
                  <Checkbox
                    edge="start"
                    checked={subtask.completed}
                    onChange={() => handleSubtaskToggle(index)}
                  />
                  <ListItemText 
                    primary={subtask.title}
                    secondary={`Created ${formatDistanceToNow(new Date(subtask.createdAt))} ago`}
                  />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add new subtask"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddSubtask}
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Assigned to
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Avatar src={task.assigneePhotoURL} alt={task.assigneeName}>
                  {task.assigneeName?.charAt(0)}
                </Avatar>
                <Typography>{task.assigneeName}</Typography>
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Due Date
              </Typography>
              <Typography sx={{ mt: 1 }}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Time Tracked
              </Typography>
              <Typography sx={{ mt: 1 }}>
                {Math.floor(task.timeSpent / 3600)}h {Math.floor((task.timeSpent % 3600) / 60)}m
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            <List>
              {comments.map((comment, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(comment.timestamp))} ago
                        </Typography>
                      </Box>
                    }
                    secondary={comment.text}
                  />
                </ListItem>
              ))}
            </List>
            
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <Button
                variant="contained"
                startIcon={<CommentIcon />}
                onClick={handleAddComment}
              >
                Add
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem>Edit Task</MenuItem>
        <MenuItem>Delete Task</MenuItem>
        <MenuItem>Move Task</MenuItem>
      </Menu>
    </Box>
  );
};

export default TaskDetails; 