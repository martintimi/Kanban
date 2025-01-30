import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const ProjectAnalytics = ({ projects }) => {
  // Calculate statistics across all projects
  const stats = {
    totalProjects: projects?.length || 0,
    totalTasks: projects?.reduce((total, project) => total + (project.tasks?.length || 0), 0) || 0,
    completedTasks: projects?.reduce((total, project) => 
      total + (project.tasks?.filter(t => t.status === 'Done' || t.status === 'Completed').length || 0), 0) || 0,
    inProgressTasks: projects?.reduce((total, project) => 
      total + (project.tasks?.filter(t => t.status === 'In Progress' || t.status === 'InProgress').length || 0), 0) || 0,
    pendingTasks: projects?.reduce((total, project) => 
      total + (project.tasks?.filter(t => t.status === 'To Do' || t.status === 'ToDo').length || 0), 0) || 0,
    progress: Math.round(
      (projects?.reduce((total, project) => 
        total + (project.tasks?.filter(t => t.status === 'Done' || t.status === 'Completed').length || 0), 0) /
      (projects?.reduce((total, project) => total + (project.tasks?.length || 0), 0) || 1)) * 100
    )
  };

  const statusData = [
    { name: 'Done', value: stats.completedTasks },
    { name: 'In Progress', value: stats.inProgressTasks },
    { name: 'To Do', value: stats.pendingTasks }
  ];

  const priorityData = [
    { name: 'High', tasks: projects?.reduce((total, project) => 
      total + (project.tasks?.filter(t => t.priority === 'high').length || 0), 0) || 0 },
    { name: 'Medium', tasks: projects?.reduce((total, project) => 
      total + (project.tasks?.filter(t => t.priority === 'medium').length || 0), 0) || 0 },
    { name: 'Low', tasks: projects?.reduce((total, project) => 
      total + (project.tasks?.filter(t => t.priority === 'low').length || 0), 0) || 0 }
  ];

  return (
    <Box>
      {/* Statistics Cards - Moved to top */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Typography variant="h6">Total Projects</Typography>
              <Typography variant="h3">{stats.totalProjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Typography variant="h6">Total Tasks</Typography>
              <Typography variant="h3">{stats.totalTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Typography variant="h6">In Progress</Typography>
              <Typography variant="h3">{stats.inProgressTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' }
          }}>
            <CardContent>
              <Typography variant="h6">Overall Progress</Typography>
              <Typography variant="h3">{stats.progress}%</Typography>
              <LinearProgress 
                variant="determinate" 
                value={stats.progress} 
                sx={{ mt: 1, bgcolor: 'rgba(0,0,0,0.1)' }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Task Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Tasks by Priority</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectAnalytics; 