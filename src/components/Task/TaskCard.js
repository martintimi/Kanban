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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import format from 'date-fns/format';
import { useAuth } from '../../context/AuthContext';
import { ProjectService } from '../Projects/project.service';
import SubtaskList from './SubtaskList';

const TaskCard = ({ task, projectId, onEdit, onDelete, onUpdate }) => {
  const { user } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
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
          }
        }}
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
            <Chip 
              label={task.status}
              size="small"
              color={getStatusColor(task.status)}
            />
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
    </>
  );
};

export default TaskCard; 