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
import { LoadingButton } from '@mui/lab';
import { useOrganization } from '../../context/OrganizationContext';
import { OrganizationService } from '../../services/organization.service';

const TaskForm = ({ open, onClose, onSubmit, loading }) => {
  const { selectedOrg } = useOrganization();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    assignedTo: '',
    dueDate: ''
  });
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch organization members when form opens
  useEffect(() => {
    const loadOrganizationMembers = async () => {
      if (!selectedOrg?.id) return;
      
      try {
        setLoadingMembers(true);
        const orgMembers = await OrganizationService.getOrganizationMembers(selectedOrg.id);
        setMembers(orgMembers);
      } catch (error) {
        console.error('Error loading organization members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    if (open) {
      loadOrganizationMembers();
    }
  }, [selectedOrg?.id, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Task</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }} onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Task Name"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={4}
            margin="normal"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              label="Priority"
            >
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              label="Status"
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Assign To</InputLabel>
            <Select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              label="Assign To"
              disabled={loadingMembers}
            >
              {members.map(member => (
                <MenuItem key={member.id} value={member.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      src={member.photoURL} 
                      sx={{ width: 24, height: 24 }}
                    >
                      {member.name?.charAt(0) || member.email?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">
                        {member.name || member.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.role}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Due Date"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
            margin="normal"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton
          loading={loading}
          onClick={handleSubmit}
          variant="contained"
        >
          Create Task
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm; 