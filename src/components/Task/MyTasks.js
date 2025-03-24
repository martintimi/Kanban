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
  LinearProgress,
  Button,
  Tab,
  Tabs,
  Divider,
  CardActions,
  Tooltip,
  Badge,
  CircularProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckIcon from '@mui/icons-material/Check';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CustomLoader from '../CustomLoader';
import { useToast } from '../../context/ToastContext';
import { TaskService } from '../../services/TaskService';
import TaskView from './TaskView';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { NotificationService } from '../../services/NotificationService';
import TaskTimer from './TaskTimer';
import AdminTaskView from './AdminTaskView';

const MyTasks = () => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabValue, setTabValue] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.uid || !selectedOrg?.id) return;
      
      try {
        setLoading(true);
        console.log('Fetching tasks for user:', user.uid, 'in organization:', selectedOrg.id);
        
        // Get all projects from the organization
        const projectsRef = collection(db, 'projects');
        const projectsQuery = query(projectsRef, where('organizationId', '==', selectedOrg.id));
        const projectsSnapshot = await getDocs(projectsQuery);
        
        const myTasks = [];
        let projectsProcessed = 0;
        
        projectsSnapshot.forEach(doc => {
          const project = { id: doc.id, ...doc.data() };
          projectsProcessed++;
          
          console.log(`Processing project ${projectsProcessed}:`, project.name || project.id);
          
          // Check if project has tasks array
          if (project.tasks && Array.isArray(project.tasks)) {
            // Filter tasks assigned to current user - match both assignedTo and assignee fields
            const userTasks = project.tasks.filter(task => {
              // Ensure task has an ID
              if (!task.id) {
                task.id = uuidv4(); // Generate ID if missing
              }
              
              const isAssignedTo = task.assignedTo === user.uid;
              const isAssignee = task.assignee && 
                (task.assignee === user.uid || 
                (typeof task.assignee === 'object' && task.assignee.uid === user.uid));
              
              return isAssignedTo || isAssignee;
            });
            
            console.log(`Found ${userTasks.length} tasks assigned to user in project ${project.name || project.id}`);
            
            // Add project info to each task and ensure assignee is properly set
            userTasks.forEach(task => {
              // Ensure task has all required fields
              const enhancedTask = {
                id: task.id,
                name: task.name || 'Untitled Task',
                description: task.description || '',
                status: task.status || 'To Do',
                priority: task.priority || 'medium',
                progress: task.progress || 0,
                projectId: project.id,
                projectName: project.name || 'Untitled Project'
              };
              
              // Make sure task.assignee is set if only assignedTo is available
              if (!task.assignee && task.assignedTo === user.uid) {
                enhancedTask.assignee = user.uid;
                enhancedTask.assignedTo = user.uid;
              } else {
                enhancedTask.assignee = task.assignee;
                enhancedTask.assignedTo = task.assignedTo;
              }
              
              // Copy over all other properties
              for (const key in task) {
                if (!enhancedTask[key]) {
                  enhancedTask[key] = task[key];
                }
              }
              
              myTasks.push(enhancedTask);
            });
          }
        });
        
        console.log(`Total tasks found for user: ${myTasks.length}`);
        
        // Add user data to tasks for display
        const tasksWithOwner = myTasks.map(task => {
          // Only replace string assignee with object
          let finalAssignee = task.assignee;
          
          // If assignee is the current user's ID, replace with user object
          if (finalAssignee === user.uid || task.assignedTo === user.uid) {
            finalAssignee = {
              uid: user.uid,
              photoURL: user.photoURL,
              name: user.displayName || user.email,
              email: user.email
            };
          }
          
          return {
            ...task,
            assignee: finalAssignee
          };
        });

        console.log('Final processed tasks:', tasksWithOwner);
        setTasks(tasksWithOwner);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        showToast('Failed to load your tasks', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user?.uid, selectedOrg?.id, showToast]);

  // Check if the user is an admin when component loads
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user?.uid || !selectedOrg?.id) return;
      
      try {
        // Check if user is in the admins array of the organization
        const orgDoc = await db.collection('organizations').doc(selectedOrg.id).get();
        if (orgDoc.exists) {
          const orgData = orgDoc.data();
          const isUserAdmin = orgData.admins && orgData.admins.includes(user.uid);
          setIsAdmin(isUserAdmin);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      }
    };
    
    checkUserRole();
  }, [user?.uid, selectedOrg?.id]);

  const handleUpdateTaskStatus = async (task, newStatus) => {
    try {
      setUpdatingTaskId(task.id);
      console.log(`Updating task status for task ID: ${task.id}, new status: ${newStatus}`);
      
      // If we're moving to "In Progress", start the timer
      if (newStatus === 'In Progress' && task.status !== 'In Progress') {
        try {
          await TaskService.startTaskTimer(task.projectId, task.id, user.uid);
          console.log(`Timer started for task: ${task.id}`);
          
          // Send detailed notification to admins
          const notification = {
            type: 'task_started',
            taskId: task.id,
            taskName: task.name,
            projectId: task.projectId,
            projectName: task.project?.name,
            userId: user.uid,
            userName: user.displayName || user.email,
            createdAt: new Date().toISOString(),
            message: `${user.displayName || user.email} started working on task "${task.name}"`,
            taskDetails: {
              priority: task.priority,
              dueDate: task.dueDate,
              description: task.description
            }
          };
          
          await NotificationService.sendNotificationToAdmins(notification);
          console.log('Notification sent to admins');
        } catch (error) {
          console.error('Error starting timer or sending notification:', error);
        }
      }
      
      // If we're moving from "In Progress" to "Done", stop the timer and notify admins with time info
      if (task.status === 'In Progress' && newStatus === 'Done') {
        try {
          const timerResult = await TaskService.stopTaskTimer(task.projectId, task.id, user.uid, newStatus);
          console.log(`Timer stopped for task: ${task.id}`);
          
          const timeSpent = timerResult.totalTimeSpent ? 
            TaskService.formatTimeSpent(timerResult.totalTimeSpent) : 
            'Unknown time';
          
          // Show time spent message to user
          showToast(`Task completed! You spent ${timeSpent} on this task.`, 'success');
          
          // Send notification to admins about task completion with time data
          const notification = {
            type: 'task_completed',
            taskId: task.id,
            taskName: task.name,
            projectId: task.projectId,
            projectName: task.project?.name,
            userId: user.uid,
            userName: user.displayName || user.email,
            createdAt: new Date().toISOString(),
            message: `${user.displayName || user.email} completed task "${task.name}" (Time spent: ${timeSpent})`,
            timeData: {
              totalTimeSpent: timerResult.totalTimeSpent,
              formattedTime: timeSpent,
              entries: timerResult.timeEntries?.slice(-5) || []
            }
          };
          
          await NotificationService.sendNotificationToAdmins(notification);
        } catch (error) {
          console.error('Error stopping timer or sending notification:', error);
        }
      }
      
      // If we're moving to any other status, send appropriate notification to admins
      if (newStatus !== 'In Progress' && task.status !== 'In Progress' && newStatus !== 'Done') {
        try {
          const notification = {
            type: 'task_status_changed',
            taskId: task.id,
            taskName: task.name,
            projectId: task.projectId,
            projectName: task.project?.name,
            userId: user.uid,
            userName: user.displayName || user.email,
            createdAt: new Date().toISOString(),
            message: `${user.displayName || user.email} changed task "${task.name}" status from ${task.status} to ${newStatus}`,
            statusChange: {
              from: task.status,
              to: newStatus
            }
          };
          
          await NotificationService.sendNotificationToAdmins(notification);
        } catch (error) {
          console.error('Error sending status change notification:', error);
        }
      }
      
      // Try updating the task in the project array first
      try {
        const statusHistory = {
          previousStatus: task.status,
          newStatus: newStatus,
          updatedBy: user.uid,
          timestamp: new Date().toISOString()
        };
        
        const updatedTask = await TaskService.updateTaskInProjectArray(
          task.projectId,
          task.id,
          { status: newStatus, statusHistory: [...(task.statusHistory || []), statusHistory] }
        );
        
        console.log('Task updated in project array:', updatedTask);
        
        // Update the local task
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id ? { ...t, status: newStatus } : t
          )
        );
        
        showToast('Task status updated successfully', 'success');
      } catch (error) {
        console.error('Error updating task in project array:', error);
        console.log('Falling back to standard task update method');
        
        // Fallback to the regular update method
        const updatedTask = await TaskService.updateTask(task.id, { status: newStatus });
        console.log('Task updated with standard method:', updatedTask);
        
        // Update the local task
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id ? { ...t, status: newStatus } : t
          )
        );
        
        showToast('Task status updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      showToast('Failed to update task status', 'error');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedTask(null);
  };

  const handleTimerUpdate = (updatedTask) => {
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === updatedTask.id ? { ...t, ...updatedTask } : t
      )
    );
  };

  // Filter tasks based on selected tab
  const filteredTasks = tasks.filter(task => {
    if (tabValue === 'all') return true;
    if (tabValue === 'todo') return task.status === 'To Do';
    if (tabValue === 'inprogress') return task.status === 'In Progress';
    if (tabValue === 'paused') return task.status === 'On Hold';
    if (tabValue === 'done') return task.status === 'Done';
    return true;
  });

  // Count tasks by status
  const taskCounts = {
    todo: tasks.filter(task => task.status === 'To Do').length,
    inprogress: tasks.filter(task => task.status === 'In Progress').length,
    paused: tasks.filter(task => task.status === 'On Hold').length,
    done: tasks.filter(task => task.status === 'Done').length
  };

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
      
      {/* Task filtering tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
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
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>To Do </Typography>
                {taskCounts.todo > 0 && (
                  <Badge
                    color="primary"
                    badgeContent={taskCounts.todo}
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>In Progress </Typography>
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
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Done </Typography>
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
        </Tabs>
      </Box>
      
      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader
                  title={task.name}
                  subheader={`Project: ${task.projectName}`}
                  action={
                    <IconButton onClick={() => handleViewTask(task)}>
                      <VisibilityIcon />
                    </IconButton>
                  }
                />
                <CardContent>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 2, 
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {task.description || 'No description provided'}
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={task.status || 'To Do'} 
                      size="small"
                      color={
                        task.status === 'Done' ? 'success' :
                        task.status === 'In Progress' ? 'secondary' :
                        task.status === 'On Hold' ? 'warning' : 'default'
                      }
                    />
                    <Chip 
                      label={task.priority || 'medium'} 
                      size="small"
                      color={
                        task.priority === 'high' ? 'error' : 
                        task.priority === 'medium' ? 'warning' : 'default'
                      }
                    />
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" color="text.secondary">
                      Assigned to: {typeof task.assignee === 'object' 
                        ? (task.assignee.name || task.assignee.email) 
                        : (user?.displayName || user?.email || 'You')}
                    </Typography>
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
                  
                  {/* Only show in development mode */}
                  {process.env.NODE_ENV === 'development' && (
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '10px' }}>
                      <Typography variant="caption" component="div">
                        Task ID: {task.id}<br />
                        Project ID: {task.projectId}<br />
                        Assignment Type: {typeof task.assignee}<br />
                        User ID: {user?.uid}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 2, justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                  {task.status === 'To Do' && (
                    <LoadingButton
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      loading={actionLoading}
                      onClick={() => handleUpdateTaskStatus(task, 'In Progress')}
                      sx={{ flexGrow: 1 }}
                    >
                      Start Working
                    </LoadingButton>
                  )}
                  
                  {task.status === 'In Progress' && (
                    <>
                      <LoadingButton
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckIcon />}
                        loading={actionLoading}
                        onClick={() => handleUpdateTaskStatus(task, 'Done')}
                        sx={{ flexGrow: 1 }}
                      >
                        Complete
                      </LoadingButton>
                      <LoadingButton
                        variant="outlined"
                        color="warning"
                        size="small"
                        startIcon={<PauseIcon />}
                        loading={actionLoading}
                        onClick={() => handleUpdateTaskStatus(task, 'On Hold')}
                      >
                        Pause
                      </LoadingButton>
                    </>
                  )}
                  
                  {task.status === 'On Hold' && (
                    <LoadingButton
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      loading={actionLoading}
                      onClick={() => handleUpdateTaskStatus(task, 'In Progress')}
                      sx={{ flexGrow: 1 }}
                    >
                      Resume Work
                    </LoadingButton>
                  )}
                  
                  {task.status === 'Done' && (
                    <LoadingButton
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<RestartAltIcon />}
                      loading={actionLoading}
                      onClick={() => handleUpdateTaskStatus(task, 'To Do')}
                    >
                      Reopen Task
                    </LoadingButton>
                  )}
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
      
      {/* Task View Dialog */}
      {selectedTask && (
        isAdmin ? (
          <AdminTaskView
            open={viewDialogOpen}
            onClose={handleCloseViewDialog}
            task={selectedTask}
            projectId={selectedTask.projectId}
            onTaskUpdated={(updatedTask) => {
              setTasks(prevTasks => 
                prevTasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
              );
            }}
          />
        ) : (
          <TaskView
            open={viewDialogOpen}
            onClose={handleCloseViewDialog}
            task={selectedTask}
            projectId={selectedTask.projectId}
            onUpdate={(updatedTask) => {
              setTasks(prevTasks => 
                prevTasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
              );
            }}
          />
        )
      )}
    </Box>
  );
};

export default MyTasks; 