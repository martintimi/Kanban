import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Breadcrumbs,
  Link,
  TextField,
  Modal,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListItemIcon,
  ListItemSecondaryAction,
  FormGroup,
  FormControlLabel,
  Switch,
  Avatar,
  ListItemAvatar,
  DialogContentText,
  Snackbar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Paper,
  Chip,
  CardActions
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  HourglassEmpty,
  Cancel,
  MoreVert,
  ArrowBack,
  AccessTime,
  Edit,
  Delete,
  Assignment
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import { styled } from "@mui/material/styles";
import CustomButton from "../CustomButton";
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../../context/ProjectContext';
import { useOrganization } from '../../context/OrganizationContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DatePicker } from '@mui/lab';
import TaskDetails from './TaskDetails';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { doc, getDoc, getDocs, updateDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import EmptyState from '../EmptyState';
import { useToast } from '../../context/ToastContext';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { TaskService } from '../../services/TaskService';
import LoadingSpinner from '../LoadingSpinner';
import { LoadingButton } from '@mui/lab';
import CustomLoader from '../CustomLoader';
import TaskTimer from './TaskTimer';
import { PlayArrow, Event, Star } from '@mui/icons-material';

// Define severity colors for consistent visual styling
const severityColors = {
  success: '#22c55e', // bright green
  error: '#ef4444',   // bright red
  info: '#1976d2',    // bright blue
  warning: '#f59e0b'  // bright yellow/orange
};

const TaskItem = ({ task, projectId, onEdit, onDelete }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { showToast } = useToast();

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="h6">{task.name}</Typography>
          <IconButton onClick={handleMenuClick} size="small">
            <MoreVert />
          </IconButton>
        </Box>

        <Typography color="textSecondary" variant="body2" sx={{ mt: 1 }}>
          {task.description}
        </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Chip 
            label={task.status} 
            size="small"
            color={
              task.status === 'Done' ? 'success' :
              task.status === 'In Progress' ? 'warning' :
              'default'
            }
          />
          <Chip 
            label={task.priority} 
            size="small"
            color={
              task.priority === 'high' ? 'error' :
              task.priority === 'medium' ? 'warning' :
              'default'
            }
          />
        </Box>

        {/* Progress bar */}
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={task.progress || 0} 
            sx={{ height: 6, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {task.progress || 0}% Complete
          </Typography>
        </Box>

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => {
            handleMenuClose();
            onEdit(task);
          }}>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit Task
          </MenuItem>
          <MenuItem onClick={() => {
            handleMenuClose();
            setDeleteDialogOpen(true);
          }} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Delete Task
          </MenuItem>
        </Menu>

        {/* Delete Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Delete Task</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{task.name}"?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                onDelete(task.id);
                setDeleteDialogOpen(false);
              }} 
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

const TaskColumn = () => {
  const { projectId } = useParams();
  const { projects, updateProject } = useProjects();
  const { user: currentUser } = useAuth();
  const { selectedOrg } = useOrganization();
  const [currentProject, setCurrentProject] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [page, setPage] = React.useState(0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [progress, setProgress] = useState(0);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [timeEstimate, setTimeEstimate] = useState('');
  const [timeSpent, setTimeSpent] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [notifications, setNotifications] = useState({
    dueDate: true,
    mentions: true,
    statusChanges: true
  });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    'task-summary': '',
    'acceptance-criteria': '',
    priority: 'medium',
    timeEstimate: ''
  });
  const [taskComments, setTaskComments] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [users, setUsers] = useState([]);
  const [taskData, setTaskData] = useState({
    name: '',
    description: '',
    status: 'To Do',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    assignee: ''
  });
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const { showToast } = useToast();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    assignee: '',
    priority: 'medium',
    dueDate: null
  });
  const [verifyingTaskId, setVerifyingTaskId] = useState(null);

  // Add role check
  const canAssignTasks = currentUser?.role === 'admin' || 
                        currentUser?.role === 'project_manager';

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "white",
    border: "2px solid #555555",
    boxShadow: 24,
    p: 4,
  };
  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setFormData({
      'task-summary': task?.name || '',
      'acceptance-criteria': task?.description || '',
      'task-status': task?.status || 'To Do',
      priority: task?.priority || 'medium',
    });
    setDueDate(task?.dueDate || new Date().toISOString().split('T')[0]);
    setAssignee(task?.assignee || '');
    setOpenModal(true);
    setAnchorEl(null);
  };

  const handleSubmit = async (taskData) => {
    try {
      if (selectedTask) {
        await handleUpdateTask(selectedTask.id, taskData);
      } else {
        await handleAddTask(taskData);
      }
      handleCloseModal();
    } catch (error) {
      showToast('Failed to save task: ' + error.message, 'error');
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedTask(null);
  };

  const handleOpenDeleteDialog = (task) => {
    setSelectedTask(task);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await TaskService.deleteTask(projectId, taskId);
      await loadTasks();
      showToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Done":
        return <CheckCircle sx={{ color: "green" }} />;
      case "In Progress":
        return <HourglassEmpty sx={{ color: "orange" }} />;
      case "To Do":
      default:
        return <Cancel sx={{ color: "red" }} />;
    }
  };

  const handleMenuClick = (event, task) => {
    setSelectedTask(task);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Load the current project
  useEffect(() => {
    setLoading(true);
    const loadProject = () => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
        setTasks(project.tasks || []);
      } else {
        setError('Project not found');
      }
      setLoading(false);
    };

    if (projects.length > 0) {
      loadProject();
    }
  }, [projectId, projects]);

  // Add this useEffect to load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const projectDoc = await ProjectService.getProject(projectId);
        const memberIds = projectDoc.members || [];
        const usersData = await Promise.all(
          memberIds.map(async (memberId) => {
            const userDoc = await UserService.getUser(memberId);
            return {
              id: memberId,
              ...userDoc
            };
          })
        );
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadUsers();
  }, [projectId]);

  // Add this useEffect to load project members
  const loadProjectMembers = async () => {
    try {
      if (!projectId) return;
      
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const projectData = projectDoc.data();
      
      if (projectData?.members) {
        // Load all member details
        const membersData = await Promise.all(
          projectData.members.map(async (memberId) => {
            const userDoc = await getDoc(doc(db, 'users', memberId));
            return {
              id: memberId,
              ...userDoc.data()
            };
          })
        );
        console.log('Loaded members:', membersData);
        setUsers(membersData);
      }
    } catch (error) {
      console.error('Error loading project members:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load team members',
        severity: 'error'
      });
    }
  };

  // Update the handleAddTask function
  const handleAddTask = async (taskData) => {
    try {
      setLoading(true);
      
      // Ensure all required fields are present
      const newTaskData = {
        ...taskData,
        organizationId: selectedOrg.id, // Add organization ID
        createdBy: currentUser.uid,
        assignedTo: taskData.assignedTo,
        assignee: taskData.assignedTo // For backward compatibility
      };

      console.log('Creating task with data:', newTaskData);
      
      await ProjectService.addTask(projectId, newTaskData);
      await loadTasks();
      
      showToast('Task created successfully!', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Failed to create task: ' + error.message, 'error');
    } finally {
      setLoading(false);
      handleCloseModal();
    }
  };

  // Update task handler
  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      setLoading(true);
      await ProjectService.updateTask(projectId, taskId, updatedData);

      // Add activity for task update
      await ProjectService.addActivity(projectId, {
        type: 'task_updated',
        entityType: 'task',
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        details: `Updated task: ${updatedData.name}`,
        taskId: taskId,
        taskName: updatedData.name
      });

      showToast('Task updated successfully!', 'success');
      await loadTasks();
    } catch (error) {
      showToast('Failed to update task: ' + error.message, 'error');
    } finally {
      setLoading(false);
      setSelectedTask(null);
    }
  };

  // Update the filteredTasks to use the actual tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  // Update the task drag and drop handler to notify admins
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const taskId = result.draggableId;
    const newStatus = destination.droppableId;

    try {
      const updatedTasks = [...tasks];
      const taskIndex = updatedTasks.findIndex(t => t.id === taskId);
      const [movedTask] = updatedTasks.splice(taskIndex, 1);
      
      const updatedTask = {
        ...movedTask,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      
      updatedTasks.splice(destination.index, 0, updatedTask);

      // Optimistic update
      setTasks(updatedTasks);

      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });

      // Add this after a task has been moved to a new status
      if (destination && source.droppableId !== destination.droppableId) {
        const task = updatedTasks.find(t => t.id === taskId);
        const newStatus = destination.droppableId;
        
        // Start timer if moved to "In Progress"
        if (newStatus === 'In Progress' && source.droppableId !== 'In Progress') {
          try {
            await TaskService.startTaskTimer(projectId, task.id, currentUser.uid);
            
            // Notify admins
            const notification = {
              type: 'task_started',
              taskId: task.id,
              taskName: task.name,
              projectId: projectId,
              projectName: currentProject.name,
              userId: currentUser.uid,
              userName: currentUser.displayName || currentUser.email,
              createdAt: new Date().toISOString(),
              message: `${currentUser.displayName || currentUser.email} started working on task "${task.name}"`,
              taskDetails: {
                priority: task.priority,
                dueDate: task.dueDate,
                description: task.description
              }
            };
            
            await NotificationService.sendNotificationToAdmins(notification);
            console.log('Notification sent to admins about task start');
          } catch (error) {
            console.error('Error sending notification or starting timer:', error);
          }
        }
        
        // Stop timer if moved from "In Progress"
        if (source.droppableId === 'In Progress' && newStatus !== 'In Progress') {
          try {
            const timerResult = await TaskService.stopTaskTimer(projectId, task.id, currentUser.uid, newStatus);
            
            // If complete, send notification with time data
            if (newStatus === 'Done') {
              const timeSpent = timerResult.totalTimeSpent ? 
                TaskService.formatTimeSpent(timerResult.totalTimeSpent) : 
                'Unknown time';
                
              // Notify admins about completion
              const notification = {
                type: 'task_completed',
                taskId: task.id,
                taskName: task.name,
                projectId: projectId,
                projectName: currentProject.name,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                createdAt: new Date().toISOString(),
                message: `${currentUser.displayName || currentUser.email} completed task "${task.name}" (Time spent: ${timeSpent})`,
                timeData: {
                  totalTimeSpent: timerResult.totalTimeSpent,
                  formattedTime: timeSpent,
                  entries: timerResult.timeEntries?.slice(-5) || []
                }
              };
              
              await NotificationService.sendNotificationToAdmins(notification);
              showToast(`Task completed! You spent ${timeSpent} on this task.`, 'success');
            }
          } catch (error) {
            console.error('Error stopping timer or sending notification:', error);
          }
        }
      }
    } catch (error) {
      setError('Failed to move task: ' + error.message);
      // Revert optimistic update
      setTasks(tasks);
    }
  };

  // Update task validation
  const validateTask = (taskData) => {
    const errors = {};
    if (!taskData['task-summary']?.trim()) {
      errors.summary = 'Task summary is required';
    }
    if (!taskData['acceptance-criteria']?.trim()) {
      errors.criteria = 'Acceptance criteria is required';
    }
    if (!taskData.dueDate) {
      errors.dueDate = 'Due date is required';
    } else if (new Date(taskData.dueDate) < new Date()) {
      errors.dueDate = 'Due date cannot be in the past';
    }
    return errors;
  };

  // Add this function to handle subtask toggling
  const handleSubtaskToggle = async (taskId, subtaskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.map(subtask => 
          subtask.id === subtaskId 
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        );
        
        // Calculate progress based on completed subtasks
        const completedCount = updatedSubtasks.filter(st => st.completed).length;
        const progress = Math.round((completedCount / updatedSubtasks.length) * 100);
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          progress
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    await updateProject(currentProject.id, {
      ...currentProject,
      tasks: updatedTasks
    });
  };

  // Add this function to add new subtask
  const handleAddSubtask = (taskId) => {
    if (!newSubtask.trim()) return;

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const newSubtaskItem = {
          id: Date.now().toString(),
          title: newSubtask,
          completed: false
        };
        return {
          ...task,
          subtasks: [...(task.subtasks || []), newSubtaskItem]
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    setNewSubtask('');
  };

  // Update the comment change handler
  const handleCommentChange = (taskId, value) => {
    setTaskComments(prev => ({
      ...prev,
      [taskId]: value
    }));
  };

  // Update the add comment function
  const handleAddComment = async (taskId) => {
    const commentText = taskComments[taskId];
    if (!commentText?.trim()) return;

    try {
      const newComment = {
        id: Date.now().toString(),
        text: commentText,
        user: currentUser?.email || 'Anonymous',
        timestamp: new Date().toISOString()
      };

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            comments: [...(task.comments || []), newComment]
          };
        }
        return task;
      });

      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });

      setTasks(updatedTasks);
      // Clear only this task's comment
      setTaskComments(prev => ({
        ...prev,
        [taskId]: ''
      }));
    } catch (error) {
      setError('Failed to add comment: ' + error.message);
    }
  };

  // Add this function to handle subtask deletion
  const handleDeleteSubtask = async (taskId, subtaskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
        // Recalculate progress
        const completedCount = updatedSubtasks.filter(st => st.completed).length;
        const progress = updatedSubtasks.length 
          ? Math.round((completedCount / updatedSubtasks.length) * 100)
          : 0;
        
        return {
          ...task,
          subtasks: updatedSubtasks,
          progress
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    await updateProject(currentProject.id, {
      ...currentProject,
      tasks: updatedTasks
    });
  };

  // Add file upload handler
  const handleFileUpload = async (event, taskId) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `tasks/${taskId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            attachments: [...(task.attachments || []), {
              id: Date.now().toString(),
              name: file.name,
              url: downloadURL,
              uploadedAt: new Date().toISOString()
            }]
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });
    } catch (error) {
      setError('Failed to upload file: ' + error.message);
    }
  };

  // Add dependency handler
  const handleAddDependency = (taskId, dependencyId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          dependencies: [...(task.dependencies || []), dependencyId]
        };
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  // Add notification toggle handler
  const handleNotificationToggle = (taskId, type) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          notifications: {
            ...(task.notifications || {}),
            [type]: !(task.notifications?.[type])
          }
        };
      }
      return task;
    });

    setTasks(updatedTasks);
  };

  // Add template handlers
  const handleSaveTemplate = (taskData) => {
    const newTemplate = {
      id: Date.now().toString(),
      name: taskData.name,
      description: taskData.description,
      priority: taskData.priority,
      estimatedTime: taskData.timeEstimate,
      createdAt: new Date().toISOString()
    };

    setTemplates([...templates, newTemplate]);
  };

  const handleLoadTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        'task-summary': template.name,
        'acceptance-criteria': template.description,
        priority: template.priority,
        timeEstimate: template.estimatedTime
      });
    }
  };

  const handleDeleteAttachment = async (taskId, attachmentId) => {
    try {
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            attachments: task.attachments.filter(att => att.id !== attachmentId)
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });
    } catch (error) {
      setError('Failed to delete attachment: ' + error.message);
    }
  };

  const handleRemoveDependency = async (taskId, dependencyId) => {
    try {
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            dependencies: task.dependencies.filter(depId => depId !== dependencyId)
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });
    } catch (error) {
      setError('Failed to remove dependency: ' + error.message);
    }
  };

  // Add form field change handler
  const handleFormChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Add this component for the task menu
  const TaskMenu = ({ task }) => (
    <Menu
      id={`task-menu-${task.id}`}
      anchorEl={anchorEl}
      open={Boolean(anchorEl) && selectedTask?.id === task.id}
      onClose={handleMenuClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <MenuItem onClick={() => {
        handleOpenModal(task);
        handleMenuClose();
      }}>
        <EditIcon sx={{ mr: 1 }} />
        Edit Task
      </MenuItem>
      <MenuItem onClick={() => {
        const newStatus = task.status === 'To Do' ? 'In Progress' : 
                         task.status === 'In Progress' ? 'Done' : 'To Do';
        handleUpdateTask(task.id, { ...task, status: newStatus });
        handleMenuClose();
      }}>
        <ListItemIcon>
          {task?.status === 'Done' ? <CheckCircle /> : <HourglassEmpty />}
        </ListItemIcon>
        Change Status
      </MenuItem>
      <MenuItem onClick={() => {
        navigator.clipboard.writeText(window.location.href + '/' + task.id);
        setSnackbar({
          open: true,
          message: 'Task link copied to clipboard',
          severity: 'success'
        });
        handleMenuClose();
      }}>
        <ListItemIcon>
          <LinkIcon fontSize="small" />
        </ListItemIcon>
        Copy Link
      </MenuItem>
      <Divider />
      <MenuItem 
        onClick={() => {
          handleOpenDeleteDialog(task);
          handleMenuClose();
        }}
        sx={{ color: 'error.main' }}
      >
        <ListItemIcon>
          <Delete />
        </ListItemIcon>
        Delete Task
      </MenuItem>
    </Menu>
  );

  // Add save changes functionality
  const handleSaveChanges = async (taskId) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: tasks
      });

      setSnackbar({
        open: true,
        message: 'Changes saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setError('Failed to save changes: ' + error.message);
    }
  };

  // Add this function
  const getTaskCountByStatus = (status) => {
    return tasks.filter(task => task.status === status).length;
  };

  // Add notification handling
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await ProjectService.updateTaskStatus(projectId, taskId, newStatus);
      
      // Add activity for status change
      await ProjectService.addActivity(projectId, {
        type: 'task_status_changed',
        entityType: 'task',
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        details: `Changed task status to ${newStatus}`,
        taskId: taskId,
        taskName: tasks.find(t => t.id === taskId)?.name,
        oldStatus: tasks.find(t => t.id === taskId)?.status,
        newStatus
      });

      showToast(`Task moved to ${newStatus}`, 'success');
      await loadTasks();
    } catch (error) {
      showToast('Failed to update task status: ' + error.message, 'error');
    }
  };

  // Update the notification subscription useEffect
  useEffect(() => {
    let cleanup = () => {};

    const setupNotifications = async () => {
      if (currentUser?.uid) {
        try {
          const unsubscribe = NotificationService.subscribeToUserNotifications(
            currentUser.uid, 
            (notifications) => {
              // Only show snackbar for the most recent notification
              if (notifications.length > 0) {
                const latestNotification = notifications[0];
                setSnackbar({
                  open: true,
                  message: latestNotification.message,
                  severity: latestNotification.type === 'due_date' ? 'warning' : 'info'
                });
              }
            }
          );
          cleanup = unsubscribe;
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    };

    setupNotifications();

    return () => {
      cleanup();
    };
  }, [currentUser]);

  // Update the task card to show assignment UI only for proper roles
  const TaskCard = ({ task }) => {
    // Format time spent
    const formatTime = (timeInSeconds) => {
      if (!timeInSeconds) return '0h 0m';
      
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      
      return `${hours}h ${minutes}m`;
    };
    
    // Get task priority color
    const getPriorityColor = (priority) => {
      switch(priority?.toLowerCase()) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'default';
      }
    };
    
    // Calculate due date status
    const getDueDateStatus = () => {
      if (!task.dueDate) return null;
      
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { color: 'error', text: 'Overdue' };
      if (diffDays === 0) return { color: 'error', text: 'Due today' };
      if (diffDays <= 2) return { color: 'warning', text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}` };
      return { color: 'default', text: `Due in ${diffDays} days` };
    };
    
    const dueStatus = getDueDateStatus();
  
    return (
      <Card 
        onClick={() => handleOpenModal(task)}
        sx={{ 
          cursor: 'pointer',
          '&:hover': { boxShadow: 3 },
          border: task.active ? `2px solid ${severityColors.info}` : 'none',
          position: 'relative'
        }}
      >
        {task.priority && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              width: 0, 
              height: 0, 
              borderStyle: 'solid',
              borderWidth: '0 25px 25px 0',
              borderColor: `transparent ${task.priority === 'high' ? '#ef4444' : 
                          task.priority === 'medium' ? '#f59e0b' : '#22c55e'} transparent transparent`,
              zIndex: 1
            }} 
          />
        )}
        
        <CardContent>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ mr: 4 }}>{task.name}</Typography>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(e, task);
              }}
              sx={{ zIndex: 2 }}
            >
              <MoreVert />
            </IconButton>
          </Box>

          {/* Description - truncate if too long */}
          {task.description && (
            <Typography 
              color="textSecondary" 
              gutterBottom
              sx={{
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2
              }}
            >
              {task.description}
            </Typography>
          )}

          {/* Progress Bar */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={task.progress || 0}
              sx={{ 
                height: 6, 
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: task.progress >= 100 ? severityColors.success : severityColors.info
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Progress: {task.progress || 0}%
            </Typography>
          </Box>

          {/* Time Tracking */}
          <Box sx={{ 
            mt: 2, 
            p: 1, 
            backgroundColor: 'rgba(0,0,0,0.03)', 
            borderRadius: 1,
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <AccessTime fontSize="small" color="action" />
                <Typography variant="body2" fontWeight="medium">Time</Typography>
              </Box>
              
              {task.active && (
                <Chip 
                  label="Active" 
                  color="primary" 
                  size="small"
                  icon={<PlayArrow fontSize="small" />}
                />
              )}
            </Box>
            
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                Spent: <b>{formatTime(task.timeSpent || 0)}</b>
              </Typography>
              
              {task.timeEstimate && (
                <Typography variant="body2">
                  Est: <b>{formatTime(task.timeEstimate)}</b>
                </Typography>
              )}
            </Box>
          </Box>

          {/* Footer Section */}
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* Assignee */}
            {task.assignee && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                backgroundColor: 'rgba(0,0,0,0.03)',
                borderRadius: 1,
                px: 1,
                py: 0.5
              }}>
                <Avatar 
                  src={users.find(u => u.id === task.assignee)?.photoURL}
                  sx={{ width: 24, height: 24 }}
                >
                  {users.find(u => u.id === task.assignee)?.name?.charAt(0) || 'U'}
                </Avatar>
                <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                  {users.find(u => u.id === task.assignee)?.name || 
                   users.find(u => u.id === task.assignee)?.email || 
                   'Unassigned'}
                </Typography>
              </Box>
            )}

            {/* Status Chip */}
            <Chip 
              label={task.status} 
              color={
                task.status === 'Done' ? 'success' : 
                task.status === 'In Progress' ? 'warning' : 
                'default'
              }
              size="small"
            />

            {/* Due Date */}
            {dueStatus && (
              <Chip
                icon={<Event fontSize="small" />}
                label={dueStatus.text}
                color={dueStatus.color}
                size="small"
              />
            )}
          </Box>

          {/* Admin Review Indicator */}
          {task.reviewed && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star fontSize="small" color="warning" />
              <Typography variant="body2" color="text.secondary">
                Reviewed: {task.rating}/5
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  // Add task assignment handler
  const handleAssignTask = async (taskId, assigneeId) => {
    try {
      // Call the ProjectService to assign the task
      await ProjectService.assignTask(projectId, taskId, assigneeId);
      
      // Show success message
      showToast('Task assigned successfully', 'success');
      
      // Reload tasks to get updated data
      await loadTasks();
    } catch (error) {
      console.error('Error assigning task:', error);
      showToast('Failed to assign task: ' + error.message, 'error');
    }
  };

  // Add this function to load all users
  const loadAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Add this function to handle member addition
  const handleAddMember = async (userId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const currentMembers = projectDoc.data()?.members || [];
      
      if (!currentMembers.includes(userId)) {
        await updateDoc(projectRef, {
          members: [...currentMembers, userId]
        });
        
        // Refresh project members
        loadProjectMembers();
        
        setSnackbar({
          open: true,
          message: 'Team member added successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      setSnackbar({
        open: true,
        message: 'Failed to add team member',
        severity: 'error'
      });
    }
  };

  // Add this function to handle member removal
  const handleRemoveMember = async (userId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const currentMembers = projectDoc.data()?.members || [];
      
      await updateDoc(projectRef, {
        members: currentMembers.filter(id => id !== userId)
      });
      
      // Refresh project members
      loadProjectMembers();
      
      setSnackbar({
        open: true,
        message: 'Team member removed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove team member',
        severity: 'error'
      });
    }
  };

  // Add this useEffect to load all users when team dialog opens
  useEffect(() => {
    if (teamDialogOpen) {
      loadAllUsers();
    }
  }, [teamDialogOpen]);

  // Add this function inside the TaskColumn component
  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log("Loading tasks for project:", projectId);
      const projectDoc = await ProjectService.getProject(projectId);
      
      if (projectDoc) {
        console.log("Project data:", {
          id: projectDoc.id,
          name: projectDoc.name,
          organizationId: projectDoc.organizationId,
          taskCount: projectDoc.tasks?.length || 0
        });
        
        const tasks = projectDoc.tasks || [];
        console.log("Project tasks:", tasks.map(t => ({
          id: t.id,
          name: t.name,
          assignedTo: t.assignedTo,
          assignee: t.assignee,
          organizationId: t.organizationId
        })));
        
        setTasks(tasks);
      } else {
        console.error("Project not found:", projectId);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      showToast('Failed to load tasks: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect to load tasks when the component mounts
  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setOpenModal(true);
  };

  // Update form handling
  const handleTaskFormChange = (field) => (event) => {
    setTaskForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  // Update the verify task handler
  const handleVerifyTask = async (taskId) => {
    try {
      setVerifyingTaskId(taskId);
      await TaskService.verifyTask(projectId, taskId, currentUser.uid);
      showToast('Task verified successfully', 'success');
      await loadTasks();
    } catch (error) {
      console.error('Error verifying task:', error);
      showToast('Failed to verify task', 'error');
    } finally {
      setVerifyingTaskId(null);
    }
  };

  if (loading) return <CustomLoader message="Loading tasks..." />;

  return (
    <Box sx={{ padding: "37px" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link 
          color="inherit" 
          onClick={() => navigate("/dashboard")}
          sx={{ cursor: 'pointer' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary">
          {currentProject?.name || 'Loading...'}
        </Typography>
      </Breadcrumbs>

      {loading ? (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,0.7)',
          zIndex: 1
        }}>
          <CustomLoader message="Processing..." />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Box sx={{ p: 3 }}>
          {/* Top Bar with Search and Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            gap: 2 
          }}>
            {/* Left side - Search and Filters */}
            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
              <TextField
                placeholder="Search tasks..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 200 }}
              />
              <TextField
                select
                size="small"
                label="Filter Status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="To Do">To Do</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
                <MenuItem value="priority">Priority</MenuItem>
              </TextField>
            </Box>

            {/* Right side - Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSelectedTask(null);
                  setTaskForm({
                    name: '',
                    description: '',
                    assignee: '',
                    priority: 'medium',
                    dueDate: null
                  });
                  setOpenModal(true);
                }}
              >
                Create Task
              </Button>
             
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate("/dashboard")}
              >
                Go Back
              </Button>
            </Box>
          </Box>

          {tasks.length === 0 ? (
            <EmptyState 
              type="tasks" 
              onAction={() => setCreateModalOpen(true)}
              currentModule="Task"
            />
          ) : (
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {filteredAndSortedTasks.map((task) => (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <TaskItem
                    task={task}
                    projectId={projectId}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      <CreateTaskModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        task={selectedTask}
        projectMembers={users}
      />

     

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />
    </Box>
  );
};

export default TaskColumn;
