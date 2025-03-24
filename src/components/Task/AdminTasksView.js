import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Avatar,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { db } from '../../firebase/config';
import { TaskService } from '../../services/TaskService';
import AdminTaskView from './AdminTaskView';
import CustomLoader from '../CustomLoader';

const AdminTasksView = () => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Fetch all team members and their tasks
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid || !selectedOrg?.id) return;
      
      try {
        setLoading(true);
        
        // Get all users in the organization
        const orgDoc = await db.collection('organizations').doc(selectedOrg.id).get();
        if (!orgDoc.exists) {
          showToast('Organization not found', 'error');
          setLoading(false);
          return;
        }
        
        const orgData = orgDoc.data();
        const memberIds = orgData.members || [];
        
        if (memberIds.length === 0) {
          setLoading(false);
          return;
        }
        
        // Get user details
        const userPromises = memberIds.map(userId => 
          db.collection('users').doc(userId).get()
        );
        
        const userDocs = await Promise.all(userPromises);
        const teamUsers = userDocs
          .filter(doc => doc.exists)
          .map(doc => ({ id: doc.id, ...doc.data() }));
        
        setUsers(teamUsers);
        
        // Get all projects from the organization
        const projectsSnapshot = await db.collection('projects')
          .where('organizationId', '==', selectedOrg.id)
          .get();
        
        const allTasks = [];
        
        for (const projectDoc of projectsSnapshot.docs) {
          const project = { id: projectDoc.id, ...projectDoc.data() };
          
          // Check embedded tasks in project document
          if (project.tasks && Array.isArray(project.tasks)) {
            const projectTasks = project.tasks.map(task => ({
              ...task,
              projectId: project.id,
              projectName: project.name || 'Untitled Project'
            }));
            
            allTasks.push(...projectTasks);
          }
        }
        
        // Add user information to each task
        const tasksWithUserInfo = allTasks.map(task => {
          // Find the assigned user
          let assigneeInfo = null;
          
          if (task.assignee) {
            const assigneeId = typeof task.assignee === 'string' 
              ? task.assignee 
              : task.assignee.uid;
              
            assigneeInfo = teamUsers.find(u => u.id === assigneeId) || null;
          } else if (task.assignedTo) {
            assigneeInfo = teamUsers.find(u => u.id === task.assignedTo) || null;
          }
          
          return {
            ...task,
            assigneeInfo
          };
        });
        
        // Filter out tasks without assignees
        const assignedTasks = tasksWithUserInfo.filter(task => task.assigneeInfo);
        
        setTasks(assignedTasks);
      } catch (error) {
        console.error('Error fetching team tasks:', error);
        showToast('Failed to load team tasks', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.uid, selectedOrg?.id, showToast]);
  
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  const handleViewTask = (task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTask(null);
  };
  
  const handleTaskUpdated = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
    );
  };
  
  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter(task => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'inprogress') return task.status === 'In Progress';
    if (selectedTab === 'done') return task.status === 'Done';
    if (selectedTab === 'review') return task.status === 'Done' && !task.review;
    if (selectedTab === 'reviewed') return task.status === 'Reviewed';
    return true;
  });
  
  // Count tasks by status for badges
  const taskCounts = {
    inprogress: tasks.filter(task => task.status === 'In Progress').length,
    done: tasks.filter(task => task.status === 'Done').length,
    review: tasks.filter(task => task.status === 'Done' && !task.review).length,
    reviewed: tasks.filter(task => task.status === 'Reviewed').length
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  if (loading) {
    return <CustomLoader message="Loading team tasks..." />;
  }
  
  if (!selectedOrg?.id) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', mt: 5 }}>
        <Typography variant="h6" color="text.secondary">
          Please select an organization to view team tasks.
        </Typography>
      </Box>
    );
  }
  
  if (tasks.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', mt: 5 }}>
        <Typography variant="h6" color="text.secondary">
          No tasks assigned to team members yet.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Team Tasks</Typography>
      
      {/* Filtering tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: '120px',
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
            },
            '& .Mui-selected': {
              color: '#1976d2',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#1976d2',
            }
          }}
        >
          <Tab
            value="all"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>All Tasks</Typography>
                <Badge
                  color="primary"
                  badgeContent={tasks.length}
                  sx={{ ml: 1 }}
                />
              </Box>
            }
          />
          <Tab
            value="inprogress"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>In Progress</Typography>
                {taskCounts.inprogress > 0 && (
                  <Badge
                    color="secondary"
                    badgeContent={taskCounts.inprogress}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            value="done"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Completed</Typography>
                {taskCounts.done > 0 && (
                  <Badge
                    color="success"
                    badgeContent={taskCounts.done}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            value="review"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Need Review</Typography>
                {taskCounts.review > 0 && (
                  <Badge
                    color="error"
                    badgeContent={taskCounts.review}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            value="reviewed"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Reviewed</Typography>
                {taskCounts.reviewed > 0 && (
                  <Badge
                    color="info"
                    badgeContent={taskCounts.reviewed}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>
      
      {/* Tasks table */}
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table sx={{ minWidth: 650 }} aria-label="team tasks table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell><Typography fontWeight="bold">Task</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Assignee</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Project</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Status</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Priority</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Time Spent</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Due Date</Typography></TableCell>
              <TableCell><Typography fontWeight="bold">Actions</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow 
                key={task.id}
                hover
                sx={{ 
                  '&:hover': { 
                    cursor: 'pointer',
                    bgcolor: 'action.hover' 
                  }
                }}
              >
                <TableCell>
                  <Typography fontWeight="medium" noWrap>
                    {task.name}
                  </Typography>
                  {task.review && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={`Rating: ${task.review.rating}/5`}
                      color="success"
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      sx={{ width: 24, height: 24 }}
                      src={task.assigneeInfo?.photoURL}
                    >
                      {task.assigneeInfo?.displayName?.charAt(0) || 
                        task.assigneeInfo?.email?.charAt(0) || 
                        <PersonIcon fontSize="small" />}
                    </Avatar>
                    <Typography variant="body2">
                      {task.assigneeInfo?.displayName || 
                       task.assigneeInfo?.email || 
                       'Unknown'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap>
                    {task.projectName || 'Unknown'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status || 'To Do'}
                    size="small"
                    color={
                      task.status === 'Done' ? 'success' :
                      task.status === 'In Progress' ? 'secondary' :
                      task.status === 'Reviewed' ? 'info' :
                      'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<PriorityHighIcon />}
                    label={task.priority || 'Medium'}
                    size="small"
                    color={getPriorityColor(task.priority)}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={task.timeTracking?.isActive ? 'Timer is active' : ''}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon 
                        fontSize="small" 
                        color={task.timeTracking?.isActive ? 'secondary' : 'action'} 
                        sx={{ mr: 0.5 }}
                      />
                      <Typography variant="body2">
                        {task.totalTimeSpent ? 
                          TaskService.formatTimeSpent(task.totalTimeSpent) : 
                          '00:00:00'}
                      </Typography>
                      {task.timeTracking?.isActive && <CircularProgress size={10} sx={{ ml: 1 }} />}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2"
                    color={
                      task.dueDate && new Date(task.dueDate) < new Date() && 
                      task.status !== 'Done' && task.status !== 'Reviewed' ?
                      'error.main' : 'text.secondary'
                    }
                  >
                    {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewTask(task);
                    }}
                    color="primary"
                    size="small"
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Task details dialog */}
      {selectedTask && (
        <AdminTaskView
          open={dialogOpen}
          onClose={handleCloseDialog}
          task={selectedTask}
          projectId={selectedTask.projectId}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
    </Box>
  );
};

export default AdminTasksView; 