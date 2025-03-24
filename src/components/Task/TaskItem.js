import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  LinearProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import { MoreVert, Edit, Delete } from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '@mui/material/Avatar';
import { Draggable } from '@hello-pangea/dnd';

const TaskItem = ({ task, index, projectId, onEdit, onDelete, onOpenDetails }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { showToast } = useToast();

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

  const handleConfirmDelete = () => {
    setDeleteDialogOpen(false);
    onDelete(task.id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Done':
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            boxShadow: snapshot.isDragging ? 8 : 1,
            cursor: 'grab',
            '&:hover': {
              boxShadow: 3,
            },
          }}
          onClick={() => onOpenDetails(task)}
        >
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="h6">{task.title || task.name}</Typography>
              <IconButton onClick={handleMenuClick} size="small">
                <MoreVert />
              </IconButton>
            </Box>

            <Typography color="textSecondary" variant="body2" sx={{ mt: 1, mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {task.description}
            </Typography>

            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={task.status} 
                size="small"
                color={getStatusColor(task.status)}
              />
              <Chip 
                label={task.priority} 
                size="small"
                color={getPriorityColor(task.priority)}
              />
              {task.dueDate && (
                <Chip
                  label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                  size="small"
                  color={new Date(task.dueDate) < new Date() ? 'error' : 'default'}
                />
              )}
            </Box>

            {task.progress !== undefined && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={task.progress || 0} 
                  sx={{ height: 6, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {task.progress || 0}% Complete
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {task.assignedTo && task.assignedToUser && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    src={task.assignedToUser.photoURL} 
                    alt={task.assignedToUser.displayName} 
                    sx={{ width: 24, height: 24, mr: 1 }}
                  />
                  <Typography variant="caption">{task.assignedToUser.displayName}</Typography>
                </Box>
              )}
              {task.createdAt && (
                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                </Typography>
              )}
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEditClick}>
                <Edit fontSize="small" sx={{ mr: 1 }} />
                Edit
              </MenuItem>
              <MenuItem onClick={handleDeleteClick}>
                <Delete fontSize="small" sx={{ mr: 1 }} />
                Delete
              </MenuItem>
            </Menu>

            <Dialog
              open={deleteDialogOpen}
              onClose={() => setDeleteDialogOpen(false)}
            >
              <DialogTitle>Delete Task</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete this task? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmDelete} color="error" autoFocus>
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default TaskItem; 