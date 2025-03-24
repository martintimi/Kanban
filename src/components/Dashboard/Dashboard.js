import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/lab';
import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useProjects } from '../../context/ProjectContext';
import LoadingSpinner from '../LoadingSpinner';

const Dashboard = () => {
  const { projects, loading } = useProjects();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'primary';
      case 'On Hold': return 'warning';
      case 'Not Started': return 'error';
      default: return 'grey';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircleIcon />;
      case 'In Progress': return <PlayArrowIcon />;
      case 'On Hold': return <ScheduleIcon />;
      case 'Not Started': return <FlagIcon />;
      default: return <FlagIcon />;
    }
  };

  const calculateProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(task => task.status === 'Done').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  if (loading) {
    return <LoadingSpinner message="Setting up your workspace..." />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Project Timeline
        </Typography>
        <Card>
          <CardContent>
            {!projects || projects.length === 0 ? (
              <Typography color="text.secondary" align="center" py={3}>
                No projects found
              </Typography>
            ) : (
              <Timeline position="alternate">
                {projects.map((project) => (
                  <TimelineItem key={project.id}>
                    <TimelineSeparator>
                      <TimelineDot color={getStatusColor(project.status)}>
                        {getStatusIcon(project.status)}
                      </TimelineDot>
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" component="div">
                            {project.name}
                          </Typography>
                          <Typography color="text.secondary" gutterBottom>
                            {format(new Date(project.startDate), 'MMM dd, yyyy')} - 
                            {format(new Date(project.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12}>
                                <Tooltip title={`${calculateProgress(project)}% Complete`}>
                                  <Box sx={{ width: '100%' }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={calculateProgress(project)}
                                      sx={{ height: 8, borderRadius: 5 }}
                                    />
                                  </Box>
                                </Tooltip>
                              </Grid>
                            </Grid>
                          </Box>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">
                              Tasks: {project.tasks?.length || 0}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Progress: {calculateProgress(project)}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;