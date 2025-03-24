import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  IconButton,
  LinearProgress
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CustomLoader from '../CustomLoader';

const MyTasks = () => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.uid || !selectedOrg?.id) return;
      
      try {
        setLoading(true);
        // Get all projects from the organization
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(projectsRef, where('organizationId', '==', selectedOrg.id));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const myTasks = [];
        
        projectsSnapshot.forEach(doc => {
          const project = { id: doc.id, ...doc.data() };
          
          // Check if project has tasks array
          if (project.tasks && Array.isArray(project.tasks)) {
            // Filter tasks assigned to current user
            const userTasks = project.tasks.filter(task => 
              task.assignedTo === user.uid || task.assignee === user.uid
            );
            
            // Add project info to each task
            userTasks.forEach(task => {
              myTasks.push({
                ...task,
                projectId: project.id,
                projectName: project.name
              });
            });
          }
        });

        console.log('Fetched tasks:', myTasks);
        setTasks(myTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user?.uid, selectedOrg?.id]);

  if (loading) {
    return <CustomLoader message="Loading your tasks..." />;
  }

  if (!selectedOrg?.id) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', mt: 5 }}>
        <Typography variant="h6" color="text.secondary">
          Please select an organization to view your tasks.
        </Typography>
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', mt: 5 }}>
        <Typography variant="h6" color="text.secondary">
          No tasks assigned to you yet.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Tasks assigned to you will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>My Tasks</Typography>
      <Grid container spacing={3}>
        {tasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <Card>
              <CardHeader
                title={task.name}
                subheader={`Project: ${task.projectName}`}
                action={
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                }
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {task.description}
                </Typography>
                
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip 
                    label={task.status} 
                    size="small"
                    color={task.status === 'Done' ? 'success' : 'default'}
                  />
                  <Chip 
                    label={task.priority} 
                    size="small"
                    color={task.priority === 'high' ? 'error' : 
                           task.priority === 'medium' ? 'warning' : 'default'}
                  />
                </Box>

                {task.dueDate && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" display="flex" alignItems="center" gap={1}>
                      <AccessTimeIcon fontSize="small" />
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}

                {task.progress !== undefined && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Progress ({task.progress}%)
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={task.progress}
                      sx={{ height: 6, borderRadius: 1 }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MyTasks; 