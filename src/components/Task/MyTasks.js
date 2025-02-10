import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useAuth } from '../../context/AuthContext';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/TaskService';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../LoadingSpinner';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  const loadTasks = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const projects = await ProjectService.getUserProjects(user.uid);
      
      const assignedTasks = [];
      projects.forEach(project => {
        const projectTasks = project.tasks || [];
        projectTasks.forEach(task => {
          if (task.assignee === user.uid) {
            assignedTasks.push({
              ...task,
              projectId: project.id,
              projectName: project.name
            });
          }
        });
      });

      setTasks(assignedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user]);

  const handleUpdateStatus = async (taskId, projectId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);
      
      // Get the project first
      const project = await ProjectService.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      // Find the task in the project
      const task = project.tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Update the task status
      await ProjectService.updateTaskStatus(projectId, taskId, newStatus);
      
      showToast(`Task status updated to ${newStatus}`, 'success');
      await loadTasks(); // Reload tasks after update
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task status', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>

      {tasks.length === 0 ? (
        <Typography color="text.secondary">No tasks assigned to you yet.</Typography>
      ) : (
        <Grid container spacing={3}>
          {tasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {task.name}
                  </Typography>
                  
                  <Typography color="text.secondary" gutterBottom>
                    Project: {task.projectName}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {task.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={task.status || 'To Do'}
                      color={
                        task.status === 'Done' ? 'success' :
                        task.status === 'In Progress' ? 'warning' :
                        'default'
                      }
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    {(!task.status || task.status === 'To Do') && (
                      <LoadingButton
                        variant="contained"
                        color="primary"
                        onClick={() => handleUpdateStatus(task.id, task.projectId, 'In Progress')}
                        loading={updatingTaskId === task.id}
                      >
                        Start Working
                      </LoadingButton>
                    )}

                    {task.status === 'In Progress' && (
                      <LoadingButton
                        variant="contained"
                        color="success"
                        onClick={() => handleUpdateStatus(task.id, task.projectId, 'Done')}
                        loading={updatingTaskId === task.id}
                      >
                        Mark as Complete
                      </LoadingButton>
                    )}
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