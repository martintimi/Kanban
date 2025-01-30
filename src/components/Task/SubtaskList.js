import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  TextField,
  Button,
  Box,
  Typography,
  Collapse,
  Avatar,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { ProjectService } from '../Projects/project.service';
import { useAuth } from '../../context/AuthContext';

const SubtaskList = ({ projectId, taskId, subtasks, onUpdate }) => {
  const { user } = useAuth();
  const [newSubtask, setNewSubtask] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    try {
      await ProjectService.addSubtask(projectId, taskId, {
        name: newSubtask,
        assignee: user.uid
      });
      setNewSubtask('');
      setShowAddForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  const handleToggleSubtask = async (subtaskId, completed) => {
    try {
      const updatedSubtasks = subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed } : st
      );
      await ProjectService.updateTask(projectId, taskId, { subtasks: updatedSubtasks });
      onUpdate();
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const updatedSubtasks = subtasks.filter(st => st.id !== subtaskId);
      await ProjectService.updateTask(projectId, taskId, { subtasks: updatedSubtasks });
      onUpdate();
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">Subtasks</Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={() => setShowAddForm(true)}
        >
          Add Subtask
        </Button>
      </Box>

      <Collapse in={showAddForm}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            fullWidth
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Enter subtask name"
          />
          <Button onClick={handleAddSubtask}>Add</Button>
          <Button onClick={() => setShowAddForm(false)}>Cancel</Button>
        </Box>
      </Collapse>

      <List dense>
        {subtasks.map((subtask) => (
          <ListItem
            key={subtask.id}
            sx={{
              bgcolor: subtask.completed ? 'action.hover' : 'inherit',
              borderRadius: 1,
              mb: 0.5
            }}
          >
            <Checkbox
              checked={subtask.completed}
              onChange={(e) => handleToggleSubtask(subtask.id, e.target.checked)}
            />
            <ListItemText
              primary={subtask.name}
              secondary={subtask.description}
              sx={{
                textDecoration: subtask.completed ? 'line-through' : 'none'
              }}
            />
            {subtask.assignee && (
              <Tooltip title={subtask.assignee.name || 'Assigned user'}>
                <Avatar
                  src={subtask.assignee.photoURL}
                  sx={{ width: 24, height: 24, mr: 1 }}
                >
                  {subtask.assignee.name?.charAt(0)}
                </Avatar>
              </Tooltip>
            )}
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                onClick={() => handleDeleteSubtask(subtask.id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default SubtaskList; 