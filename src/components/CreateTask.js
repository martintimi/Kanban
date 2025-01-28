import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ProjectService } from '../services/project.service';
import { NotificationService } from '../services/notification.service';

const CreateTask = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectId: '',
    priority: 'medium',
    estimatedHours: '',
    dueDate: '',
    tags: []
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProjects = async () => {
      const projectList = await ProjectService.getProjects();
      setProjects(projectList);
    };
    loadProjects();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        createdBy: user.uid,
        status: 'To Do',
        createdAt: new Date().toISOString(),
        assignee: user.uid // Developer creates task for themselves
      };

      await ProjectService.createTask(formData.projectId, taskData);
      
      // Notify project manager
      const project = projects.find(p => p.id === formData.projectId);
      if (project?.managerId) {
        await NotificationService.sendTaskNotification(project.managerId, {
          title: 'New Task Created',
          body: `${user.name} created a new task: ${formData.name}`,
          type: 'task_created'
        });
      }

      setSuccess(true);
      setFormData({
        name: '',
        description: '',
        projectId: '',
        priority: 'medium',
        estimatedHours: '',
        dueDate: '',
        tags: []
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New Task
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Task created successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Project"
                  value={formData.projectId}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    projectId: e.target.value
                  }))}
                  required
                >
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    priority: e.target.value
                  }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Hours"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    estimatedHours: e.target.value
                  }))}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dueDate: e.target.value
                  }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  size="large"
                >
                  Create Task
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateTask; 