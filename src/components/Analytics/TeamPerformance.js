import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Tooltip,
  IconButton,
  Avatar,
  CircularProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Insights,
  Person,
  AccessTime,
  CheckCircle,
  SpeedDial,
  CalendarMonth,
  Info,
  Download
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { addDays, subDays, format, parseISO, isAfter, isBefore } from 'date-fns';
import { CSVLink } from 'react-csv';
import { useOrganization } from '../../context/OrganizationContext';
import LoadingSpinner from '../LoadingSpinner';

const TeamPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeFrame, setTimeFrame] = useState('month');
  const [projectFilter, setProjectFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [userPerformance, setUserPerformance] = useState([]);
  const [teamStats, setTeamStats] = useState({
    totalTasksCompleted: 0,
    avgCompletionTime: 0,
    onTimeDelivery: 0,
    tasksByStatus: []
  });
  const [exportData, setExportData] = useState([]);
  const { selectedOrg } = useOrganization();
  const organizationId = selectedOrg?.id;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    if (organizationId) {
      loadData();
    }
  }, [organizationId]);

  useEffect(() => {
    if (tasks.length > 0 && users.length > 0) {
      calculatePerformanceMetrics();
    }
  }, [tasks, users, timeFrame, projectFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load organization users
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }
      
      const orgData = orgDoc.data();
      const memberIds = [...(orgData.members || []), ...(orgData.admins || [])];
      
      // Get user data
      const usersData = [];
      for (const userId of memberIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          usersData.push({
            id: userDoc.id,
            ...userDoc.data()
          });
        }
      }
      setUsers(usersData);
      
      // Load projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('organizationId', '==', organizationId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
      
      // Load tasks across all projects
      const allTasks = [];
      for (const project of projectsData) {
        // Get tasks from tasks subcollection
        const tasksQuery = query(
          collection(db, 'projects', project.id, 'tasks')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        
        tasksSnapshot.docs.forEach(doc => {
          allTasks.push({
            id: doc.id,
            projectId: project.id,
            projectName: project.name,
            ...doc.data()
          });
        });
        
        // Also check for tasks in project.tasks array
        if (project.tasks && Array.isArray(project.tasks)) {
          project.tasks.forEach(task => {
            allTasks.push({
              ...task,
              projectId: project.id,
              projectName: project.name
            });
          });
        }
      }
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = () => {
    // Filter tasks based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeFrame) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case 'quarter':
        startDate = subDays(now, 90);
        break;
      case 'year':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    // Filter tasks by date and project
    let filteredTasks = tasks.filter(task => {
      const completedDate = task.completedAt ? 
        (task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt)) 
        : null;
      
      if (!completedDate) return false;
      
      const isInTimeFrame = isAfter(completedDate, startDate) && isBefore(completedDate, now);
      const isInProject = projectFilter === 'all' || task.projectId === projectFilter;
      
      return isInTimeFrame && isInProject;
    });
    
    // Calculate team stats
    const totalTasksCompleted = filteredTasks.length;
    
    // Calculate average completion time
    let totalCompletionTime = 0;
    let tasksWithCompletionTime = 0;
    
    filteredTasks.forEach(task => {
      if (task.createdAt && task.completedAt) {
        const createdDate = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
        const completedDate = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
        const completionTime = completedDate - createdDate;
        
        totalCompletionTime += completionTime;
        tasksWithCompletionTime++;
      }
    });
    
    const avgCompletionTime = tasksWithCompletionTime > 0 ? 
      totalCompletionTime / tasksWithCompletionTime / (1000 * 60 * 60 * 24) : 0; // in days
    
    // Calculate on-time delivery percentage
    let onTimeCount = 0;
    filteredTasks.forEach(task => {
      if (task.dueDate && task.completedAt) {
        const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
        const completedDate = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
        
        if (completedDate <= dueDate) {
          onTimeCount++;
        }
      }
    });
    
    const onTimeDelivery = totalTasksCompleted > 0 ? (onTimeCount / totalTasksCompleted) * 100 : 0;
    
    // Group tasks by status
    const tasksByStatus = {};
    tasks.forEach(task => {
      const status = task.status || 'Unknown';
      if (!tasksByStatus[status]) {
        tasksByStatus[status] = 0;
      }
      tasksByStatus[status]++;
    });
    
    const tasksByStatusArray = Object.entries(tasksByStatus).map(([name, value]) => ({ name, value }));
    
    // Update team stats
    setTeamStats({
      totalTasksCompleted,
      avgCompletionTime,
      onTimeDelivery,
      tasksByStatus: tasksByStatusArray
    });
    
    // Calculate individual performance
    const userPerf = users.map(user => {
      // Tasks assigned to this user
      const userTasks = filteredTasks.filter(task => task.assignedTo === user.id);
      const completedTasks = userTasks.filter(task => task.status === 'Done' || task.status === 'Completed');
      
      // Calculate completion rate
      const completionRate = userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0;
      
      // Calculate average time to complete
      let totalUserCompletionTime = 0;
      let userTasksWithCompletionTime = 0;
      
      completedTasks.forEach(task => {
        if (task.createdAt && task.completedAt) {
          const createdDate = task.createdAt.toDate ? task.createdAt.toDate() : new Date(task.createdAt);
          const completedDate = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
          const completionTime = completedDate - createdDate;
          
          totalUserCompletionTime += completionTime;
          userTasksWithCompletionTime++;
        }
      });
      
      const avgTimeToComplete = userTasksWithCompletionTime > 0 ? 
        totalUserCompletionTime / userTasksWithCompletionTime / (1000 * 60 * 60 * 24) : 0; // in days
      
      // Calculate on-time delivery
      let userOnTimeCount = 0;
      completedTasks.forEach(task => {
        if (task.dueDate && task.completedAt) {
          const dueDate = task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
          const completedDate = task.completedAt.toDate ? task.completedAt.toDate() : new Date(task.completedAt);
          
          if (completedDate <= dueDate) {
            userOnTimeCount++;
          }
        }
      });
      
      const userOnTimeRate = completedTasks.length > 0 ? (userOnTimeCount / completedTasks.length) * 100 : 0;
      
      // Calculate rating based on reviews
      let totalRating = 0;
      let ratingCount = 0;
      
      completedTasks.forEach(task => {
        if (task.review && task.review.rating) {
          totalRating += task.review.rating;
          ratingCount++;
        }
      });
      
      const avgRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      
      // Calculate total time spent
      let totalTimeSpent = 0;
      userTasks.forEach(task => {
        if (task.timeSpent) {
          totalTimeSpent += task.timeSpent;
        }
      });
      
      // Performance score (weighted average of metrics)
      const performanceScore = (
        (completionRate * 0.3) + 
        (userOnTimeRate * 0.3) + 
        (avgRating / 5 * 100 * 0.4)
      );
      
      return {
        id: user.id,
        name: user.displayName || user.email || 'Unknown User',
        photoURL: user.photoURL,
        tasksAssigned: userTasks.length,
        tasksCompleted: completedTasks.length,
        completionRate,
        avgTimeToComplete,
        onTimeRate: userOnTimeRate,
        avgRating,
        totalTimeSpent,
        performanceScore: Math.round(performanceScore)
      };
    });
    
    // Sort by performance score
    userPerf.sort((a, b) => b.performanceScore - a.performanceScore);
    
    setUserPerformance(userPerf);
    
    // Prepare export data
    const exportRows = [
      ['Name', 'Tasks Assigned', 'Tasks Completed', 'Completion Rate (%)', 
       'Avg Time to Complete (days)', 'On-time Delivery (%)', 'Avg Rating', 
       'Total Time Spent (hrs)', 'Performance Score']
    ];
    
    userPerf.forEach(user => {
      exportRows.push([
        user.name,
        user.tasksAssigned,
        user.tasksCompleted,
        user.completionRate.toFixed(2),
        user.avgTimeToComplete.toFixed(2),
        user.onTimeRate.toFixed(2),
        user.avgRating.toFixed(2),
        (user.totalTimeSpent / (1000 * 60 * 60)).toFixed(2),
        user.performanceScore
      ]);
    });
    
    setExportData(exportRows);
  };

  const handleTimeFrameChange = (event) => {
    setTimeFrame(event.target.value);
  };

  const handleProjectFilterChange = (event) => {
    setProjectFilter(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <LoadingSpinner message="Loading performance data..." />;
  }

  return (
    <Box sx={{ flexGrow: 1, }}>
      <Grid container spacing={3}>
        {/* Header with filters */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Insights color="primary" />
              Team Performance Analytics
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Time Frame</InputLabel>
                <Select
                  value={timeFrame}
                  onChange={handleTimeFrameChange}
                  label="Time Frame"
                >
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                  <MenuItem value="quarter">Last 90 Days</MenuItem>
                  <MenuItem value="year">Last 365 Days</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Project</InputLabel>
                <Select
                  value={projectFilter}
                  onChange={handleProjectFilterChange}
                  label="Project"
                >
                  <MenuItem value="all">All Projects</MenuItem>
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Tooltip title="Export Data">
                <IconButton>
                  <CSVLink 
                    data={exportData} 
                    filename="team-performance.csv" 
                    style={{ display: 'flex', alignItems: 'center', color: 'inherit' }}
                  >
                    <Download />
                  </CSVLink>
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Grid>
        
        {/* KPI Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Tasks Completed
              </Typography>
              <Typography variant="h4" component="div" color="primary" sx={{ mb: 1 }}>
                {teamStats.totalTasksCompleted}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                in selected time period
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Avg. Completion Time
              </Typography>
              <Typography variant="h4" component="div" color="primary" sx={{ mb: 1 }}>
                {teamStats.avgCompletionTime.toFixed(1)} days
              </Typography>
              <Typography variant="body2" color="text.secondary">
                from task creation to completion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                On-Time Delivery
              </Typography>
              <Typography variant="h4" component="div" color="primary" sx={{ mb: 1 }}>
                {teamStats.onTimeDelivery.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                tasks completed before deadline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Tabs for different views */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label="Team Overview" />
              <Tab label="Individual Performance" />
              <Tab label="Time Tracking" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {/* Team Overview Tab */}
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Task Status Distribution</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={teamStats.tasksByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {teamStats.tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Team Performance Score</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={userPerformance.slice(0, 5)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <RechartsTooltip />
                        <Bar dataKey="performanceScore" fill="#1976d2" name="Performance Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
              )}
              
              {/* Individual Performance Tab */}
              {tabValue === 1 && (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Team Member</TableCell>
                        <TableCell align="right">Tasks Assigned</TableCell>
                        <TableCell align="right">Completion Rate</TableCell>
                        <TableCell align="right">On-Time Delivery</TableCell>
                        <TableCell align="right">Avg. Rating</TableCell>
                        <TableCell align="right">Performance Score</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {userPerformance.map((user) => (
                        <TableRow key={user.id} hover>
                          <TableCell component="th" scope="row" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={user.photoURL} sx={{ width: 32, height: 32 }}>
                              {user.name.charAt(0)}
                            </Avatar>
                            {user.name}
                          </TableCell>
                          <TableCell align="right">{user.tasksAssigned}</TableCell>
                          <TableCell align="right">{user.completionRate.toFixed(1)}%</TableCell>
                          <TableCell align="right">{user.onTimeRate.toFixed(1)}%</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                              <Rating value={user.avgRating} precision={0.5} readOnly size="small" />
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                ({user.avgRating.toFixed(1)})
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                              <CircularProgress
                                variant="determinate"
                                value={user.performanceScore}
                                size={40}
                                color={
                                  user.performanceScore >= 80 ? 'success' :
                                  user.performanceScore >= 60 ? 'primary' :
                                  user.performanceScore >= 40 ? 'warning' : 'error'
                                }
                              />
                              <Box
                                sx={{
                                  top: 0,
                                  left: 0,
                                  bottom: 0,
                                  right: 0,
                                  position: 'absolute',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography variant="caption" component="div" color="text.secondary">
                                  {user.performanceScore}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Time Tracking Tab */}
              {tabValue === 2 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Time Spent by User</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={userPerformance}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => `${(value / (1000 * 60 * 60)).toFixed(2)} hours`} />
                        <Bar dataKey="totalTimeSpent" fill="#1976d2" name="Time Spent (hrs)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Average Completion Time</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={userPerformance.filter(u => u.avgTimeToComplete > 0)}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => `${value.toFixed(2)} days`} />
                        <Bar dataKey="avgTimeToComplete" fill="#00C49F" name="Avg. Days to Complete" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeamPerformance; 