import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Avatar,
  Typography
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const CreateTaskModal = ({ open, onClose, onSubmit, task = null, projectMembers }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'To Do',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
    assignee: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        assignee: task.assignee || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'To Do',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        assignee: ''
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const dataToSubmit = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate,
      assignee: formData.assignee
    };

    if (task) {
      onSubmit(task.id, dataToSubmit);
    } else {
      onSubmit(dataToSubmit);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Task Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <MenuItem value="To Do">To Do</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority}
                label="Priority"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={formData.assignee}
                label="Assign To"
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {projectMembers?.map((member) => (
                  <MenuItem key={member.id} value={member.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar 
                        src={member.photoURL} 
                        sx={{ width: 24, height: 24 }}
                      >
                        {member.name?.charAt(0)}
                      </Avatar>
                      <Typography>
                        {member.name || member.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateTaskModal; 