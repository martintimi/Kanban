import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, TextField, MenuItem } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ProjectService } from './Projects/project.service';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { useToast } from '../context/ToastContext';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyTasks();
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      // Get all projects
      const projects = await ProjectService.getUserProjects(user.uid);
      
      // Extract tasks assigned to current user from all projects
      const myTasks = projects.reduce((acc, project) => {
        const projectTasks = project.tasks || [];
        const assignedTasks = projectTasks
          .filter(task => task.assignee === user.uid)
          .map(task => ({
            ...task,
            projectId: project.id,
            projectName: project.name
          }));
        return [...acc, ...assignedTasks];
      }, []);

      setTasks(myTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
      showToast('Error fetching your tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Manage and track your assigned tasks
      </Typography>

      <Box sx={{ my: 3, display: 'flex', gap: 2 }}>
        <TextField
          label="Search tasks"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300 }}
        />
        <TextField
          select
          label="Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="small"
          sx={{ width: 150 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="To Do">To Do</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Done">Done</MenuItem>
        </TextField>
      </Box>

      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No Tasks Yet"
          description="You haven't been assigned any tasks yet."
          icon="task"
        />
      ) : (
        <Grid container spacing={3}>
          {filteredTasks.map((task) => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {task.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {task.description}
                  </Typography>
                  <Typography variant="caption" display="block" gutterBottom>
                    Project: {task.projectName}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Chip 
                      label={task.status} 
                      color={
                        task.status === 'Done' ? 'success' :
                        task.status === 'In Progress' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                    <Chip 
                      label={task.priority} 
                      color={
                        task.priority === 'high' ? 'error' :
                        task.priority === 'medium' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyTasks; 