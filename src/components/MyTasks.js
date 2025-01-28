import React, { useState, useEffect } from 'react';
import { UserService } from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Grid
} from '@mui/material';

const MyTasks = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyTasks = async () => {
      if (user?.uid) {
        const tasks = await UserService.getUserTasks(user.uid);
        setMyTasks(tasks);
        setLoading(false);
      }
    };
    loadMyTasks();
  }, [user]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        My Tasks
      </Typography>
      
      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={2}>
          {myTasks.map(task => (
            <Grid item xs={12} md={6} lg={4} key={task.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{task.name}</Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Project: {task.projectName}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Chip 
                      label={task.status} 
                      color={
                        task.status === 'Done' ? 'success' :
                        task.status === 'In Progress' ? 'warning' : 
                        'default'
                      }
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                      size="small"
                      color={
                        new Date(task.dueDate) < new Date() ? 'error' : 'default'
                      }
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {task.description}
                    </Typography>
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