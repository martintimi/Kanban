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
  CircularProgress,
  Chip,
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
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  HourglassEmpty,
  Cancel,
  MoreVert,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import { styled } from "@mui/material/styles";
import { ArrowBack } from "@mui/icons-material";
import CustomButton from "./CustomButton";
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects } from '../context/ProjectContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { DatePicker } from '@mui/lab';
import DeleteIcon from '@mui/icons-material/Delete';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { useAuth } from '../context/AuthContext';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import LinkIcon from '@mui/icons-material/Link';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Snackbar } from '@mui/material';
import { NotificationService, subscribeToNotifications } from '../services/notification.service';
import { UserService } from '../services/user.service';

const TaskColumn = () => {
  const { projectId } = useParams();
  const { projects, updateProject } = useProjects();
  const { user: currentUser } = useAuth();
  const [currentProject, setCurrentProject] = useState(null);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [open, setOpen] = React.useState(false);
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
  const [availableUsers, setAvailableUsers] = useState([]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const taskData = {
      'task-summary': formData['task-summary'],
      'acceptance-criteria': formData['acceptance-criteria'],
      'task-status': formData['task-status'] || 'To Do',
      priority: formData.priority || 'medium',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      assignee: assignee || '',
      timeEstimate: formData.timeEstimate
    };

    if (selectedTask) {
      handleUpdateTask(selectedTask.id, taskData);
    } else {
      handleAddTask(taskData);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedTask(null);
  };

  const handleOpenDeleteDialog = (task) => {
    setSelectedTask(task);
    setOpenDeleteDialog(true);
    setAnchorEl(null);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedTask(null);
  };

  const handleDelete = async () => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== selectedTask.id);
      await updateProject(projectId, {
        ...currentProject,
        tasks: updatedTasks
      });
      setTasks(updatedTasks);
      handleCloseDeleteDialog();
    } catch (error) {
      setError('Failed to delete task: ' + error.message);
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
      const users = await UserService.getAllUsers();
      setAvailableUsers(users);
    };
    loadUsers();
  }, []);

  // Add task handler
  const handleAddTask = async (taskData) => {
    if (!currentProject) {
      setError('Project not found');
      return;
    }

    try {
      const newTask = {
        id: Date.now().toString(),
        name: taskData['task-summary'],
        description: taskData['acceptance-criteria'],
        status: taskData['task-status'] || 'To Do',
        priority: taskData.priority || 'Medium',
        dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
        assignee: taskData.assignee || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        progress: taskData.progress || 0,
        subtasks: taskData.subtasks || [],
      };

      const updatedTasks = [...(currentProject.tasks || []), newTask];
      
      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });

      setTasks(updatedTasks);
      handleClose();
    } catch (error) {
      setTasks(currentProject.tasks || []);
      setError('Failed to create task: ' + error.message);
    }
  };

  // Update task handler
  const handleUpdateTask = async (taskId, updatedData) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === taskId ? { 
          ...task, 
          name: updatedData['task-summary'],
          description: updatedData['acceptance-criteria'],
          status: updatedData['task-status'],
          updatedAt: new Date().toISOString(),
          progress: updatedData.progress || 0,
          subtasks: updatedData.subtasks || [],
        } : task
      );
      
      await updateProject(projectId, {
        ...currentProject,
        tasks: updatedTasks
      });

      setTasks(updatedTasks);
      handleCloseModal();
    } catch (error) {
      setError('Failed to update task: ' + error.message);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (taskId) => {
    try {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      
      await updateProject(projectId, {
        ...currentProject,
        tasks: updatedTasks
      });
      
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting task:', error);
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

  // Add drag and drop handler
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
  const TaskMenu = ({ task }) => {
    return (
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
          handleSaveChanges(task.id);
          handleMenuClose();
        }}>
          <SaveIcon sx={{ mr: 1 }} />
          Save Changes
        </MenuItem>
        <MenuItem onClick={() => {
          handleOpenDeleteDialog(task);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Delete Task
        </MenuItem>
      </Menu>
    );
  };

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
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const updatedTask = { ...task, status: newStatus };
      
      if (newStatus === 'Done') {
        await NotificationService.notifyTaskComplete(updatedTask);
      }

      const updatedTasks = tasks.map(t => 
        t.id === taskId ? updatedTask : t
      );

      await updateProject(currentProject.id, {
        ...currentProject,
        tasks: updatedTasks
      });

      setTasks(updatedTasks);
      handleMenuClose();
      
      setSnackbar({
        open: true,
        message: `Task marked as ${newStatus}`,
        severity: 'success'
      });
    } catch (error) {
      setError('Failed to update task status: ' + error.message);
    }
  };

  // Update the notification subscription useEffect
  useEffect(() => {
    let cleanup = () => {};

    const setupNotifications = async () => {
      if (currentUser?.uid) {
        try {
          const unsubscribe = await subscribeToNotifications(
            currentUser.uid, 
            (notification) => {
              setSnackbar({
                open: true,
                message: notification.body,
                severity: notification.type === 'due_date' ? 'warning' : 'info'
              });
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: { sm: "space-between" },
            alignItems: "center",
            padding: "20px",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" }, 
              alignItems: "center",
              paddingY: "30px",
            }}
          >
            <TextField
              variant="outlined"
              placeholder="Search tasks..."
              sx={{
                marginRight: { sm: 2, xs: 0 },
                mb: { xs: 2, sm: 0 },
                height: "40px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderRadius: "4px",
                  },
                  "& input": {
                    padding: "8px",
                  },
                },
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <CustomButton
              label="Create Task"
              onClick={handleOpen}
              startIcon={<AddIcon />}
              sx={{
                marginTop: { xs: 0, }, 
                mb: { xs: 2, sm: 0 }, 
                width: { xs: "100%", sm: "auto" }, 
              }}
            />
          </Box>
          <CustomButton
            label="Go Back"
            onClick={() => navigate("/dashboard")}
            startIcon={<ArrowBack />}
            variant="outlined" 
          />
        </Box>
      )}

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2">
            Add Task
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="task-summary"
              label="Task Summary"
              name="task-summary"
              value={formData['task-summary']}
              onChange={handleFormChange('task-summary')}
              autoFocus
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="acceptance-criteria"
              label="Acceptance Criteria"
              name="acceptance-criteria"
              value={formData['acceptance-criteria']}
              onChange={handleFormChange('acceptance-criteria')}
              multiline
              rows={3}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Select Status"
              fullWidth
              sx={{ mb: 2 }}
              id="task-status"
              name="task-status"
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Due Date"
              fullWidth
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />
            <TextField
              select
              label="Priority"
              fullWidth
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              select
              label="Assignee"
              fullWidth
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                // Send notification when assigning
                if (e.target.value) {
                  NotificationService.sendTaskNotification(e.target.value, {
                    title: 'New Task Assigned',
                    body: `You have been assigned to task: ${formData['task-summary']}`,
                    type: 'task_assigned',
                    taskId: selectedTask?.id
                  });
                }
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {availableUsers.map(user => (
                <MenuItem key={user.uid} value={user.uid}>
                  {user.email} ({user.role})
                </MenuItem>
              ))}
            </TextField>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              <CustomButton
                label="Close"
                onClick={handleClose}
                variant="text"
                sx={{ color: "gray" }}
              />
              <CustomButton
                label="Create Task"
                type="submit"
                variant="contained"
                color="primary"
              />
            </Box>
          </form>
        </Box>
      </Modal>

      <Grid container spacing={2}>
        {["To Do", "In Progress", "Done"].map((status) => (
          <Grid item xs={12} sm={4} key={status}>
            <Card
              sx={{
                backgroundColor: (theme) => 
                  theme.palette.mode === 'dark' ? 'background.paper' : '#f0efed',
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark' 
                    ? '0 4px 8px rgba(0, 0, 0, 0.5)'
                    : '0 4px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ fontSize: "1.25rem" }}
                >
                  {status} ({getTaskCountByStatus(status)})
                </Typography>
                <AnimatePresence>
                  {filteredAndSortedTasks
                    .filter((task) => task.status === status)
                    .map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card
                          sx={{
                            marginBottom: 2,
                            backgroundColor: 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: (theme) => 
                                theme.palette.mode === 'dark' 
                                  ? '0 8px 16px rgba(0, 0, 0, 0.4)'
                                  : '0 8px 16px rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              {getStatusIcon(task.status)}
                              <Box sx={{ marginLeft: 2, flex: 1 }}>
                                <Typography variant="h6">{task.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Due: {new Date(task.dueDate).toLocaleDateString()}
                                </Typography>
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {task.priority && (
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: task.priority === 'high' ? 'error.main' : 
                                               task.priority === 'medium' ? 'text.secondary' : 
                                               'success.main'
                                      }}
                                    >
                                      {task.priority}
                                    </Typography>
                                  )}
                                  {task.assignee && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      • {task.assignee}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuClick(e, task);
                                }}
                                sx={{ marginLeft: "auto" }}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={task.progress || 0}
                                sx={{ mb: 1, height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                Progress: {task.progress || 0}%
                              </Typography>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Subtasks
                              </Typography>
                              <List dense>
                                {task.subtasks?.map((subtask) => (
                                  <ListItem key={subtask.id} disablePadding>
                                    <ListItemIcon>
                                      <Checkbox
                                        edge="start"
                                        checked={subtask.completed}
                                        onChange={() => handleSubtaskToggle(task.id, subtask.id)}
                                      />
                                    </ListItemIcon>
                                    <ListItemText 
                                      primary={subtask.title}
                                      sx={{
                                        textDecoration: subtask.completed ? 'line-through' : 'none',
                                        color: subtask.completed ? 'text.secondary' : 'text.primary'
                                      }}
                                    />
                                    <ListItemSecondaryAction>
                                      <IconButton 
                                        edge="end" 
                                        size="small"
                                        onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </ListItemSecondaryAction>
                                  </ListItem>
                                ))}
                              </List>
                              
                              {/* Add subtask input */}
                              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <TextField
                                  size="small"
                                  placeholder="New subtask"
                                  value={newSubtask}
                                  onChange={(e) => setNewSubtask(e.target.value)}
                                  fullWidth
                                />
                                <IconButton 
                                  onClick={() => handleAddSubtask(task.id)}
                                  color="primary"
                                >
                                  <AddTaskIcon />
                                </IconButton>
                              </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Time Tracking
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                  label="Estimate (hours)"
                                  type="number"
                                  size="small"
                                  value={timeEstimate}
                                  onChange={(e) => setTimeEstimate(e.target.value)}
                                />
                                <TextField
                                  label="Time Spent (hours)"
                                  type="number"
                                  size="small"
                                  value={timeSpent}
                                  onChange={(e) => setTimeSpent(e.target.value)}
                                />
                              </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Comments
                              </Typography>
                              <List>
                                {task.comments?.map((comment) => (
                                  <ListItem key={comment.id}>
                                    <ListItemText
                                      primary={comment.text}
                                      secondary={`${comment.user} - ${new Date(comment.timestamp).toLocaleString()}`}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  size="small"
                                  placeholder="Add a comment"
                                  value={taskComments[task.id] || ''}
                                  onChange={(e) => handleCommentChange(task.id, e.target.value)}
                                  fullWidth
                                />
                                <Button
                                  variant="contained"
                                  onClick={() => handleAddComment(task.id)}
                                >
                                  Comment
                                </Button>
                              </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Attachments
                              </Typography>
                              <input
                                type="file"
                                id={`file-upload-${task.id}`}
                                hidden
                                onChange={(e) => handleFileUpload(e, task.id)}
                              />
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {task.attachments?.map((attachment) => (
                                  <Chip
                                    key={attachment.id}
                                    label={attachment.name}
                                    onClick={() => window.open(attachment.url)}
                                    onDelete={() => handleDeleteAttachment(task.id, attachment.id)}
                                    icon={<AttachFileIcon />}
                                  />
                                ))}
                                <Button
                                  component="label"
                                  htmlFor={`file-upload-${task.id}`}
                                  startIcon={<AttachFileIcon />}
                                  size="small"
                                >
                                  Add File
                                </Button>
                              </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Dependencies
                              </Typography>
                              <TextField
                                select
                                fullWidth
                                size="small"
                                value=""
                                onChange={(e) => handleAddDependency(task.id, e.target.value)}
                              >
                                {tasks
                                  .filter(t => t.id !== task.id)
                                  .map(t => (
                                    <MenuItem key={t.id} value={t.id}>
                                      {t.name}
                                    </MenuItem>
                                  ))}
                              </TextField>
                              <Box sx={{ mt: 1 }}>
                                {task.dependencies?.map(depId => {
                                  const depTask = tasks.find(t => t.id === depId);
                                  return (
                                    <Chip
                                      key={depId}
                                      label={depTask?.name}
                                      onDelete={() => handleRemoveDependency(task.id, depId)}
                                      icon={<LinkIcon />}
                                      sx={{ m: 0.5 }}
                                    />
                                  );
                                })}
                              </Box>
                            </Box>
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Notifications
                              </Typography>
                              <FormGroup>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={task.notifications?.dueDate}
                                      onChange={() => handleNotificationToggle(task.id, 'dueDate')}
                                    />
                                  }
                                  label="Due Date Reminders"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={task.notifications?.mentions}
                                      onChange={() => handleNotificationToggle(task.id, 'mentions')}
                                    />
                                  }
                                  label="@Mentions"
                                />
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={task.notifications?.statusChanges}
                                      onChange={() => handleNotificationToggle(task.id, 'statusChanges')}
                                    />
                                  }
                                  label="Status Changes"
                                />
                              </FormGroup>
                            </Box>
                            <TaskMenu task={task} />
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            padding: 4,
            backgroundColor: 'background.paper',
            color: 'text.primary',
            borderRadius: 2,
            boxShadow: 24,
            width: "400px",
            '& .MuiTextField-root': {
              '& .MuiInputLabel-root': {
                color: 'text.secondary',
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
              },
            },
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Update Task
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Task ID"
              fullWidth
              value={selectedTask ? selectedTask.id : ""}
              InputProps={{
                readOnly: true,
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Task Summary"
              required
              fullWidth
              name="task-summary"
              value={formData['task-summary']}
              onChange={handleFormChange('task-summary')}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Acceptance Criteria"
              required
              fullWidth
              multiline
              rows={3}
              name="acceptance-criteria"
              value={formData['acceptance-criteria']}
              onChange={handleFormChange('acceptance-criteria')}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Status"
              fullWidth
              name="task-status"
              value={formData['task-status'] || 'To Do'}
              onChange={handleFormChange('task-status')}
              sx={{ mb: 2 }}
            >
              <MenuItem value="To Do">To Do</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Done">Done</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Due Date"
              fullWidth
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
              inputProps={{
                min: new Date().toISOString().split('T')[0]
              }}
            />
            <TextField
              select
              label="Priority"
              fullWidth
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </TextField>
            <TextField
              select
              label="Assignee"
              fullWidth
              value={assignee}
              onChange={(e) => {
                setAssignee(e.target.value);
                // Send notification when assigning
                if (e.target.value) {
                  NotificationService.sendTaskNotification(e.target.value, {
                    title: 'New Task Assigned',
                    body: `You have been assigned to task: ${formData['task-summary']}`,
                    type: 'task_assigned',
                    taskId: selectedTask?.id
                  });
                }
              }}
              sx={{ mb: 2 }}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {availableUsers.map(user => (
                <MenuItem key={user.uid} value={user.uid}>
                  {user.email} ({user.role})
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
              <CustomButton
                label="Close"
                onClick={handleCloseModal}
                variant="text"
                sx={{ color: "gray" }}
              />
              <CustomButton
                label="Update Task"
                type="submit"
                variant="contained"
                color="primary"
              />
            </Box>
          </form>
        </Box>
      </Modal>

      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Are you sure?"}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Do you really want to delete this task? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <CustomButton
            label="Delete"
            onClick={handleDelete}
            color="error"
            variant="text"
            sx={{ color: "red" }}
          />
          <Box sx={{ flex: '1 0 0' }} />
          <CustomButton
            label="Cancel"
            onClick={handleCloseDeleteDialog}
            color="primary"
            variant="text"
          />
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
        severity={snackbar.severity}
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          select
          label="Filter Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="small"
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="To Do">To Do</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Done">Done</MenuItem>
        </TextField>
        <TextField
          select
          label="Sort By"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          size="small"
        >
          <MenuItem value="newest">Newest First</MenuItem>
          <MenuItem value="oldest">Oldest First</MenuItem>
          <MenuItem value="priority">Priority</MenuItem>
        </TextField>
      </Box>
    </Box>
  );
};

export default TaskColumn;
