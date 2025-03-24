import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Timeline,
  People,
  Assessment,
  Notifications,
  Settings,
  Add,
  CheckCircle,
  Error,
  BarChart,
  AccessTime,
  CalendarMonth,
  Star,
  ArrowUpward,
  Download,
  ArrowRight,
  ArrowForward
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import TeamPerformance from './Analytics/TeamPerformance';
import ProjectHistory from './ProjectHistory';
import ResourceManagement from './ResourceManagement';
import AdminNotifications from './AdminNotifications';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    totalTime: 0,
    activeIssues: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [completionTrend, setCompletionTrend] = useState([]);
  const { currentUser } = useAuth();
  const { selectedOrg } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedOrg?.id) {
      loadDashboardData();
    }
  }, [selectedOrg]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get organization data
      const orgDoc = await getDoc(doc(db, 'organizations', selectedOrg.id));
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }
      
      const orgData = orgDoc.data();
      
      // Get projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('organizationId', '==', selectedOrg.id)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get recent projects
      const recentProjectsQuery = query(
        collection(db, 'projects'),
        where('organizationId', '==', selectedOrg.id),
        orderBy('updatedAt', 'desc'),
        limit(5)
      );
      const recentProjectsSnapshot = await getDocs(recentProjectsQuery);
      const recentProjectsData = recentProjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Count tasks across all projects
      let totalTasks = 0;
      let completedTasks = 0;
      let totalTime = 0;
      
      for (const project of projectsData) {
        // Get tasks from tasks subcollection
        const tasksQuery = query(
          collection(db, 'projects', project.id, 'tasks')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        
        totalTasks += tasksSnapshot.size;
        
        tasksSnapshot.docs.forEach(doc => {
          const taskData = doc.data();
          if (taskData.status === 'Done' || taskData.status === 'Completed') {
            completedTasks++;
          }
          if (taskData.timeSpent) {
            totalTime += taskData.timeSpent;
          }
        });
        
        // Also check for tasks in project.tasks array
        if (project.tasks && Array.isArray(project.tasks)) {
          totalTasks += project.tasks.length;
          
          project.tasks.forEach(task => {
            if (task.status === 'Done' || task.status === 'Completed') {
              completedTasks++;
            }
            if (task.timeSpent) {
              totalTime += task.timeSpent;
            }
          });
        }
      }
      
      // Calculate active projects
      const activeProjects = projectsData.filter(p => p.status === 'active').length;
      
      // Count members
      const totalMembers = orgData.members ? orgData.members.length : 0;
      
      // Get active issues
      const issuesQuery = query(
        collection(db, 'issues'),
        where('organizationId', '==', selectedOrg.id),
        where('status', 'in', ['open', 'in_progress'])
      );
      const issuesSnapshot = await getDocs(issuesQuery);
      const activeIssues = issuesSnapshot.size;
      
      // Update stats
      setStats({
        totalProjects: projectsData.length,
        activeProjects,
        totalTasks,
        completedTasks,
        totalMembers,
        totalTime,
        activeIssues
      });
      
      setRecentProjects(recentProjectsData);
      
      // Mock completion trend data for now
      // This would normally come from a more complex query
      setCompletionTrend([
        { month: 'Jan', completed: 12 },
        { month: 'Feb', completed: 19 },
        { month: 'Mar', completed: 15 },
        { month: 'Apr', completed: 22 },
        { month: 'May', completed: 30 },
        { month: 'Jun', completed: 28 }
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatTime = (timeInMs) => {
    const totalHours = Math.floor(timeInMs / (1000 * 60 * 60));
    return `${totalHours} hours`;
  };

  // Admin tool cards config
  const adminTools = [
    {
      title: 'Team Performance',
      description: 'Track team productivity, task completion rates, and performance analytics.',
      icon: <Assessment fontSize="large" color="primary" />,
      path: '/admin/team-performance',
      color: '#1976d2'
    },
    {
      title: 'Resource Management',
      description: 'Manage team member allocations across projects and monitor workloads.',
      icon: <People fontSize="large" color="secondary" />,
      path: '/admin/resource-management',
      color: '#9c27b0'
    },
    {
      title: 'Project History',
      description: 'View detailed project timelines, activity logs, and change history.',
      icon: <Timeline fontSize="large" style={{ color: '#2e7d32' }} />,
      path: '/admin/project-history',
      color: '#2e7d32'
    },
    {
      title: 'System Settings',
      description: 'Configure global application settings and organization preferences.',
      icon: <Settings fontSize="large" style={{ color: '#ed6c02' }} />,
      path: '/settings',
      color: '#ed6c02'
    }
  ];

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DashboardIcon color="primary" />
              Admin Tools
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" paragraph>
            Welcome to the admin dashboard. Here you can manage and monitor your organization's projects, 
            resources, and performance metrics.
          </Typography>
        </Grid>
        
        {/* Admin Tools Grid */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {adminTools.map((tool, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3,
                      cursor: 'pointer'
                    },
                    borderTop: `4px solid ${tool.color}`
                  }}
                  onClick={() => navigate(tool.path)}
                >
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      {tool.icon}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {tool.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ flexGrow: 1 }}>
                      {tool.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto', color: tool.color }}>
                      <Typography variant="button">
                        Access
                      </Typography>
                      <ArrowForward fontSize="small" sx={{ ml: 1 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 