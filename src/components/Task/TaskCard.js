import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Chip,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import format from 'date-fns/format';
import { useAuth } from '../../context/AuthContext';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/TaskService';
import SubtaskList from './SubtaskList';
import TaskStatus from './TaskStatus';
import { useToast } from '../../context/ToastContext';
import TaskView from './TaskView';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const TaskCard = ({ task, projectId, onEdit, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  
  const isAssignedToTask = task.assignee === user?.uid;
  
  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = () => {
    handleMenuClose();
    onEdit(task);
  };

  const handleDeleteClick = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await ProjectService.deleteTask(projectId, task.id);
      setDeleteDialogOpen(false);
      onDelete(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);
      await TaskService.updateTaskStatus(projectId, task.id, newStatus, user.uid);
      showToast(`Task status updated to ${newStatus}`, 'success');
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do':
        return 'default';
      case 'In Progress':
        return 'primary';
      case 'Done':
        return 'success';
      default:
        return 'default';
    }
  };

  // Calculate progress based on completed subtasks
  const progress = task.subtasks?.length 
    ? (task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100
    : 0;

  const handleCardClick = () => {
    setViewOpen(true);
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            boxShadow: 3,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s'
          },
          cursor: 'pointer'
        }}
        onClick={handleCardClick}
      >
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2 
          }}>
            <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word' }}>
              {task.name}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleMenuClick}
              sx={{ 
                ml: 1,
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            {task.description}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip 
              label={task.priority}
              size="small"
              color={getPriorityColor(task.priority)}
            />
            <TaskStatus status={task.status} />
          </Box>

          {task.dueDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </Typography>
            </Box>
          )}

          {task.subtasks?.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Progress
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {Math.round(progress)}% Complete
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {task.assignee && (
              <Tooltip title={`Assigned to ${task.assignee.name || 'User'}`}>
                <AvatarGroup max={3}>
                  <Avatar 
                    src={task.assignee.photoURL}
                    sx={{ width: 24, height: 24 }}
                  >
                    {task.assignee.name?.charAt(0)}
                  </Avatar>
                </AvatarGroup>
              </Tooltip>
            )}
          </Box>

          <SubtaskList 
            projectId={projectId}
            taskId={task.id}
            subtasks={task.subtasks || []}
            onUpdate={onUpdate}
          />

          {/* Status update buttons for assigned users */}
          {task.assignee === user?.uid && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {task.status === 'To Do' && (
                <LoadingButton
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('In Progress');
                  }}
                  loading={loading}
                  startIcon={<PlayArrowIcon />}
                  sx={{ 
                    boxShadow: 2,
                    '&:hover': { boxShadow: 4 }
                  }}
                >
                  Start Working
                </LoadingButton>
              )}
              
              {task.status === 'In Progress' && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%' }}>
                  <LoadingButton
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate('Done');
                    }}
                    loading={loading}
                    startIcon={<CheckIcon />}
                    sx={{ 
                      boxShadow: 2,
                      flexGrow: 1,
                      '&:hover': { boxShadow: 4 }
                    }}
                  >
                    Complete Task
                  </LoadingButton>
                  <LoadingButton
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate('On Hold');
                    }}
                    loading={loading}
                    startIcon={<PauseIcon />}
                  >
                    Pause
                  </LoadingButton>
                </Box>
              )}
              
              {task.status === 'On Hold' && (
                <LoadingButton
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('In Progress');
                  }}
                  loading={loading}
                  startIcon={<PlayArrowIcon />}
                >
                  Resume
                </LoadingButton>
              )}
              
              {task.status === 'Done' && (
                <LoadingButton
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusUpdate('To Do');
                  }}
                  loading={loading}
                  startIcon={<RestartAltIcon />}
                >
                  Reopen
                </LoadingButton>
              )}
            </Box>
          )}

          {/* Verification button for project managers */}
          {user?.role === 'project_manager' && task.status === 'Done' && (
            <Box sx={{ mt: 2 }}>
              <LoadingButton
                size="small"
                variant="contained"
                color="success"
                onClick={() => handleStatusUpdate('Verified')}
                loading={loading}
              >
                Verify Task
              </LoadingButton>
            </Box>
          )}
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{task.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <TaskView
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        task={task}
        assignee={task.assignee}
      />
    </>
  );
};

export default TaskCard; 