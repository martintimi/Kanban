import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { ProjectService } from '../components/Projects/project.service';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip
} from '@mui/material';

const TaskColumn = () => {
  const { projectId } = useParams();
  const { projects, loading: projectsLoading } = useProjects();
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        // First try to find the project in the projects array
        const projectFromContext = projects.find(p => p.id === projectId);
        
        if (projectFromContext) {
          setCurrentProject(projectFromContext);
        } else {
          // If not found in context, fetch it directly
          const fetchedProject = await ProjectService.getProject(projectId);
          setCurrentProject(fetchedProject);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadProject();
    }
  }, [projectId, projects]);

  if (loading || projectsLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  if (!currentProject) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Project not found</Typography>
      </Box>
    );
  }

  const tasksByStatus = {
    'To Do': currentProject.tasks?.filter(task => task.status === 'To Do') || [],
    'In Progress': currentProject.tasks?.filter(task => task.status === 'In Progress') || [],
    'Done': currentProject.tasks?.filter(task => task.status === 'Done') || [],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {currentProject.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          {currentProject.description}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Chip 
            label={currentProject.status} 
            color={currentProject.status === 'active' ? 'success' : 'default'}
            sx={{ mr: 1 }}
          />
          <Chip 
            label={currentProject.priority} 
            color={
              currentProject.priority === 'high' ? 'error' :
              currentProject.priority === 'medium' ? 'warning' : 'default'
            }
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
          <Grid item xs={12} md={4} key={status}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {status} ({tasks.length})
                </Typography>
                {tasks.map(task => (
                  <Card key={task.id} sx={{ mb: 2, bgcolor: 'background.paper' }}>
                    <CardContent>
                      <Typography variant="subtitle1">{task.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {task.description}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TaskColumn; 