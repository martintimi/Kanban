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
import { useOrganization } from '../../context/OrganizationContext';
import { OrganizationService } from '../../services/organization.service';

const CreateTaskModal = ({ open, onClose, onSubmit, task = null }) => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'To Do',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    assignedTo: ''
  });

  // Fetch organization members
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedOrg?.id) return;
      
      try {
        setLoadingMembers(true);
        const orgMembers = await OrganizationService.getOrganizationMembers(selectedOrg.id);
        console.log('Loaded members:', orgMembers); // Debug log
        setMembers(orgMembers);
      } catch (error) {
        console.error('Error loading members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    if (open) {
      loadMembers();
    }
  }, [selectedOrg?.id, open]);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        status: task.status || 'To Do',
        priority: task.priority || 'medium',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        assignedTo: task.assignedTo || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'To Do',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
        assignedTo: ''
      });
    }
  }, [task]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare task data with all required fields
    const taskData = {
      name: formData.name,
      description: formData.description || '',
      status: formData.status || 'To Do',
      priority: formData.priority || 'medium',
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: formData.assignedTo || null,
      assignee: formData.assignedTo || null, // Add assignee field for backward compatibility
      organizationId: selectedOrg?.id,
      createdBy: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      comments: [],
      attachments: [],
      progress: 0,
      timeSpent: 0,
      timeEstimate: 0
    };

    console.log("Submitting task with data:", taskData);

    if (task) {
      onSubmit(task.id, taskData);
    } else {
      onSubmit(taskData);
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
                value={formData.assignedTo}
                label="Assign To"
                onChange={(e) => {
                  console.log('Selected member:', e.target.value); // Debug log
                  setFormData({ ...formData, assignedTo: e.target.value });
                }}
                disabled={loadingMembers}
              >
                {members.map((member) => (
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