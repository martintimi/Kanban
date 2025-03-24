import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Alert as MuiAlert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Box as MuiBox,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  Chip,
  ListItemIcon,
  Button
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useProjects } from '../context/ProjectContext';
import CustomButton from "./CustomButton";
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/Warning";
import SearchIcon from "@mui/icons-material/Search";
import { BarChart, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';
import { useTheme } from '@mui/material/styles';
import format from 'date-fns/format';
import formatDistanceToNow from 'date-fns/formatDistanceToNowStrict';
import DeleteIcon from "@mui/icons-material/Delete";
import { ProjectService } from '../services/project.service';
import { useActivities } from "../context/ActivityContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from '../context/ToastContext';
import ProjectForm from './Projects/ProjectForm';
import NotificationList from './NotificationList';
import { useOrganization } from '../context/OrganizationContext';
import { LoadingButton } from '@mui/lab';
import CustomLoader from './CustomLoader';

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    updateProject, 
    deleteProject, 
    recentActivities = [],
    setProjects
  } = useProjects();
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: '',
    priority: 'medium',
    deadline: '',
    status: 'active'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [projectProgressData, setProjectProgressData] = useState([
    { name: 'Completed', completed: 400, pending: 240 },
    { name: 'Pending', completed: 300, pending: 139 },
    { name: 'Abandoned', completed: 200, pending: 98 },
    { name: 'In Progress', completed: 278, pending: 190 },
  ]);
  const theme = useTheme();
  const { darkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const { refreshActivities } = useActivities();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const { selectedOrg } = useOrganization();
  const [isCreating, setIsCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return '🌅 Good morning';
      if (hour < 18) return '☀️ Good afternoon';
      return '🌙 Good evening';
    };

    setGreeting(getGreeting());
  }, []);

  const handleOpen = () => {
    setFormData({ name: "", description: "", category: '', priority: 'medium', deadline: '', status: 'active' });
    setEditMode(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProject(null);
  };

  const showNotification = (message, severity = 'success') => {
    showToast(message, severity);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selectedProject) {
        await updateProject(selectedProject.id, formData);
        showToast('Project updated successfully', 'success');
      } else {
        await createProject(formData);
        showToast('Project created successfully', 'success');
      }
      handleClose();
    } catch (err) {
      console.error("Error submitting project:", err);
      showToast(err.message, 'error');
    }
  };

  const handleEdit = (project) => {
    setFormData({
      name: project.name,
      description: project.description,
      category: project.category,
      priority: project.priority,
      deadline: project.deadline,
      status: project.status
    });
    setSelectedProject(project);
    setEditMode(true);
    setEditConfirmOpen(true);
    setAnchorEl(null);
  };

  const handleConfirmEdit = () => {
    setEditConfirmOpen(false);
    setOpen(true);
  };

  const handleCancelEdit = () => {
    setEditConfirmOpen(false);
    setSelectedProject(null);
    setEditMode(false);
  };

  const handleDeleteProject = async () => {
    try {
      if (!selectedProject?.id) {
        showToast('No project selected', 'error');
        return;
      }

      await ProjectService.addActivity(selectedProject.id, {
        type: 'project_deleted',
        entityType: 'project',
        userId: user.uid,
        userName: user.name || user.email,
        details: `Deleted project: ${selectedProject.name}`,
        projectName: selectedProject.name
      });

      await ProjectService.deleteProject(selectedProject.id);
      setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
    setDeleteConfirmOpen(false);
      showToast('Project deleted successfully', 'success');
      await refreshActivities();
    } catch (error) {
      showToast(error.message || 'Failed to delete project', 'error');
    } finally {
      setSelectedProject(null);
    }
  };

  const handleOpenDeleteDialog = (project) => {
    setSelectedProject(project);
    setDeleteConfirmOpen(true);
  };

  const handleMenuClick = (event, project) => {
    setSelectedProject(project);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleViewTasks = (projectId) => {
    navigate(`/task-column/${projectId}`);
    setAnchorEl(null);
  };

  const handleStatusChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handlePriorityChange = (event) => {
    setPriority(event.target.value);
  };

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
    
    const matchesPriority = priority === 'all' || project.priority === priority;
    
    const matchesDate = (() => {
      if (dateRange === 'all') return true;
      const today = new Date();
      const projectDate = new Date(project.createdAt);
      switch (dateRange) {
        case 'today':
          return projectDate.toDateString() === today.toDateString();
        case 'week':
          const weekAgo = new Date(today.setDate(today.getDate() - 7));
          return projectDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
          return projectDate >= monthAgo;
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return 0;
    }
  });

  const renderRecentActivities = () => {
    if (!recentActivities || !recentActivities.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No recent activities
        </Typography>
      );
    }

    return (
      <Timeline>
        {recentActivities.map((activity, index) => (
          <TimelineItem key={activity.id || index}>
            <TimelineSeparator>
              <TimelineDot 
                sx={{ 
                  bgcolor: 
                    activity.action === 'created' ? 'success.main' :
                    activity.action === 'updated' ? 'info.main' :
                    'error.main'
                }} 
              />
              {index < recentActivities.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2">
                {activity.action ? (activity.action.charAt(0).toUpperCase() + activity.action.slice(1)) : ''} Project
              </Typography>
              <Typography variant="body2" color="text.secondary">
                "{activity.projectName}" - {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : ''}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    );
  };

  const calculateProjectProgress = (projects) => {
    return [
      {
        name: 'Completed',
        completed: projects.filter(p => p.status === 'completed').length,
        active: 0
      },
      {
        name: 'Active',
        completed: 0,
        active: projects.filter(p => p.status === 'active').length
      },
      {
        name: 'Total',
        completed: projects.filter(p => p.status === 'completed').length,
        active: projects.filter(p => p.status === 'active').length
      }
    ];
  };

  const progressData = calculateProjectProgress(projects);

  const statisticsCards = [
    {
      title: "Total Projects",
      value: projects.length,
      content: (
        <LinearProgress 
          variant="determinate" 
          value={projects.length > 0 ? 100 : 0} 
          sx={{ mt: 2 }}
        />
      )
    },
    {
      title: "Active Projects",
      value: projects.filter(p => p.status === 'active').length,
      content: (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <TrendingUpIcon color="success" />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {projects.length > 0 
              ? `${((projects.filter(p => p.status === 'active').length / projects.length) * 100).toFixed(0)}% of total`
              : '0% of total'
          }
          </Typography>
        </Box>
      )
    },
    {
      title: "Tasks Due Today",
      value: projects.reduce((acc, project) => 
        acc + (project.tasks?.filter(task => 
          new Date(task.dueDate).toDateString() === new Date().toDateString()
        ).length || 0), 0),
      content: (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <WarningIcon color={projects.some(p => p.tasks?.some(t => 
            new Date(t.dueDate).toDateString() === new Date().toDateString()
          )) ? "error" : "success"} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {projects.some(p => p.tasks?.some(t => 
              new Date(t.dueDate).toDateString() === new Date().toDateString()
            )) ? "Requires attention" : "No urgent tasks"}
          </Typography>
        </Box>
      )
    },
    {
      title: "Completion Rate",
      value: `${projects.length > 0 
        ? ((projects.filter(p => p.status === 'completed').length / projects.length) * 100).toFixed(0)
        : 0}%`,
      content: (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Box sx={{ 
            position: 'relative',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: `conic-gradient(
              ${theme.palette.primary.main} ${projects.length > 0 
                ? (projects.filter(p => p.status === 'completed').length / projects.length) * 100
                : 0}%, 
              ${theme.palette.background.paper} 0
            )`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: theme.palette.background.paper
            }
          }}>
            <Typography
              variant="caption"
              sx={{ 
                position: 'relative', 
                zIndex: 1,
                fontWeight: 'bold' 
              }}
            >
              {projects.length > 0 
                ? Math.round((projects.filter(p => p.status === 'completed').length / projects.length) * 100)
                : 0}%
            </Typography>
          </Box>
        </Box>
      )
    }
  ];

  const getStatusChip = (status) => {
    return (
      <Chip
        label={status || 'active'}
        size="small"
        sx={{
          color: status === 'active' ? '#10B981' : '#EF4444',
          backgroundColor: status === 'active' 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          borderRadius: '6px',
          fontWeight: 500,
          textTransform: 'capitalize',
          border: 'none'
        }}
      />
    );
  };

  const handleCreateProject = async (projectData) => {
    if (!selectedOrg?.id) {
      showToast('Please select an organization first', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const newProject = await ProjectService.createProject({
        name: projectData.name,
        description: projectData.description,
        priority: projectData.priority,
        deadline: projectData.deadline,
        organizationId: selectedOrg.id,
        createdBy: user.uid,
        owner: user.uid,
        category: projectData.category || 'No Category'
      });
      
      showToast('Project created successfully');
      setProjects(prev => [...prev, newProject]);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating project:', error);
      showToast(error.message || 'Failed to create project', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <CustomLoader message="Loading your dashboard..." />;
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5',
      padding: '0px',
      paddingTop: '64px',
    }}>
      <Box sx={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        padding: '24px',
      }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>

        <Box 
          sx={{ 
            mb: 4,
            p: 3,
            borderRadius: 2,
            background: theme => theme.palette.mode === 'dark' 
              ? 'linear-gradient(to right, rgba(63, 81, 181, 0.1), rgba(63, 81, 181, 0.05))' 
              : 'linear-gradient(to right, rgba(63, 81, 181, 0.1), rgba(63, 81, 181, 0.02))',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  fontWeight: 'bold',
                  mb: 1
                }}
              >
                Welcome back, {user?.name || 'User'}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, sm: 0 } }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/create-task')}
                sx={{ 
                  bgcolor: '#3f51b5',
                  '&:hover': { bgcolor: '#303f9f' }
                }}
              >
                New Task
              </Button>
              <Button 
                variant="outlined"
                onClick={() => navigate('/projects')}
              >
                View Projects
              </Button>
            </Box>
          </Box>
        </Box>

        {error && (
          <MuiAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </MuiAlert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { title: 'Total Projects', value: '1', icon: 'folder' },
            { title: 'Total Tasks', value: '2', icon: 'task' },
            { title: 'In Progress', value: '0', icon: 'hourglass' },
            { title: 'Overall Progress', value: '0%', icon: 'chart' },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  boxShadow: theme => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme => theme.palette.mode === 'dark' ? '0 8px 25px rgba(0,0,0,0.3)' : '0 8px 25px rgba(0,0,0,0.12)',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary" variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.title}
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 0, fontSize: { xs: '2rem', md: '2.5rem' } }}>
                  {stat.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search projects..."
            value={searchQuery}
            onChange={handleSearch}
            size="small"
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
              minWidth: { sm: '200px' },
              maxWidth: { sm: '300px' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
              }
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={filterStatus}
              onChange={handleStatusChange}
              displayEmpty
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="on-hold">On Hold</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={priority}
              onChange={handlePriorityChange}
              displayEmpty
            >
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={dateRange}
              onChange={handleDateRangeChange}
              displayEmpty
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={sortBy}
              onChange={handleSortChange}
              displayEmpty
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="name-asc">Name (A-Z)</MenuItem>
              <MenuItem value="name-desc">Name (Z-A)</MenuItem>
              <MenuItem value="priority">Priority</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <CustomButton
            label="Create Project"
            onClick={() => setCreateDialogOpen(true)}
            startIcon={<AddIcon />}
            sx={{
              mb: 3,
              backgroundColor: '#0052CC',
              color: 'white',
              '&:hover': {
                backgroundColor: '#0043A4',
              }
            }}
          />
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                '& th': { 
                  fontWeight: 600,
                  // color: theme.palette.mode === 'dark' ? 'primary.light' : 'primary.main',
                  borderBottom: `2px solid ${theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'}`,
                  padding: '16px',
                }
              }}>
                <TableCell>Project Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.length > 0 ? (
                <AnimatePresence>
                  {filteredProjects.map((project, index) => (
                    <motion.tr
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.1 }}
                    >
                      <TableCell>{project.name}</TableCell>
                      <TableCell>{project.description}</TableCell>
                      <TableCell>
                        {getStatusChip(project.status)}
                      </TableCell>
                      <TableCell>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={(e) => handleMenuClick(e, project)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                    <Typography color="text.secondary">
                      {searchQuery 
                        ? "No projects match your search criteria" 
                        : "No projects available"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleViewTasks(selectedProject?.id)}>
            View Tasks
          </MenuItem>
          <MenuItem onClick={() => handleEdit(selectedProject)}>
            Edit Project
          </MenuItem>
          <MenuItem
            onClick={() => handleOpenDeleteDialog(selectedProject)}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Delete
          </MenuItem>
        </Menu>

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-title"
        >
          <Box sx={{
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
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {editMode ? "Update Project" : "Create New Project"}
            </Typography>
            <form onSubmit={handleSubmit}>
              <Box sx={{ pt: 2 }}>
                <ProjectForm 
                  formData={formData}
                  setFormData={setFormData}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                <CustomButton
                  label="Close"
                  onClick={handleClose}
                  variant="text"
                  sx={{ color: "gray", marginRight: { xs: "50px", sm: "" } }}
                />
                <CustomButton
                  label={editMode ? "Update Project" : "Create Project"}
                  type="submit"
                  variant="contained"
                  color="primary"
                />
              </Box>
            </form>
          </Box>
        </Modal>

        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: 'background.paper',
              color: 'text.primary',
            }
          }}
        >
          <DialogTitle id="alert-dialog-title">{"Are you sure?"}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Do you really want to delete "{selectedProject?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <CustomButton
              label="Delete"
              onClick={handleDeleteProject}
              color="error"
              variant="text"
              sx={{ color: "red" }}
            />
            <Box sx={{ flex: '1 0 0' }} />
            <CustomButton
              label="Cancel"
              onClick={() => setDeleteConfirmOpen(false)}
              color="primary"
              variant="text"
            />
          </DialogActions>
        </Dialog>

        <Dialog
          open={editConfirmOpen}
          onClose={handleCancelEdit}
          aria-labelledby="edit-dialog-title"
        >
          <DialogTitle id="edit-dialog-title">{"Are you sure?"}</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Do you really want to edit "{selectedProject?.name}"? You can review changes before saving.
            </Typography>
          </DialogContent>
          <DialogActions>
            <CustomButton
              label="Edit"
              onClick={handleConfirmEdit}
              color="primary"
              variant="text"
            />
            <Box sx={{ flex: '1 0 0' }} />
            <CustomButton
              label="Cancel"
              onClick={handleCancelEdit}
              color="primary"
              variant="text"
            />
          </DialogActions>
        </Dialog>

        <Card sx={{ 
          mt: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to right, #1a1a1a, #2d2d2d)'
            : 'linear-gradient(to right, #ffffff, #f5f5f5)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 4px rgba(0,0,0,0.2)'
            : '0 2px 4px rgba(0,0,0,0.05)',
        }}>
          <CardHeader 
            title="Recent Activity" 
            sx={{ 
              '& .MuiCardHeader-title': { 
                fontSize: '1.25rem',
                fontWeight: 500,
                color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary'
              } 
            }}
          />
          <CardContent>
            <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <Box 
                    key={index}
                    sx={{
                      display: 'flex',
                      mb: 2,
                      pb: 2,
                      borderBottom: index < recentActivities.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#3f51b5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        mr: 2,
                        flexShrink: 0
                      }}
                    >
                      {/* Icon based on activity type */}
                    </Box>
                    
                    <Box>
                      <Typography variant="body1">{activity.description}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No recent activity</Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2,
              color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary'
            }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { transform: 'translateY(-4px)' },
                  transition: 'transform 0.2s',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(to right, #1a1a1a, #2d2d2d)'
                    : 'linear-gradient(to right, #ffffff, #f5f5f5)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 2px 4px rgba(0,0,0,0.2)'
                    : '0 2px 4px rgba(0,0,0,0.05)',
                }}
                onClick={() => handleOpen()}
              >
                <CardContent>
                  <AddIcon 
                    color="primary" 
                    sx={{ fontSize: 40 }} 
                  />
                  <Typography 
                    variant="h6"
                    sx={{ color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary' }}
                  >
                    New Project
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* More quick action cards */}
          </Grid>
        </Box>

        <Card sx={{ 
          mt: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to right, #1a1a1a, #2d2d2d)'
            : 'linear-gradient(to right, #ffffff, #f5f5f5)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 4px rgba(0,0,0,0.2)'
            : '0 2px 4px rgba(0,0,0,0.05)',
        }}>
          <CardHeader 
            title="Project Progress Overview" 
            sx={{ 
              '& .MuiCardHeader-title': { 
                fontSize: '1.25rem',
                fontWeight: 500,
                color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary'
              } 
            }}
          />
          <CardContent>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart
                  data={progressData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="completed" 
                    name="Completed Projects" 
                    fill="#4CAF50"  // Green color for completed
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="active" 
                    name="Active Projects" 
                    fill="#2196F3"  // Blue color for active
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {!loading && filteredProjects.length === 0 && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography color="text.secondary">
              {searchQuery 
                ? "No projects match your search" 
                : "No projects yet. Create your first project!"}
            </Typography>
            <CustomButton
              label="Create Project"
              onClick={() => setCreateDialogOpen(true)}
              variant="contained"
              sx={{ mt: 2 }}
            />
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* Your main content */}
          </Grid>
          <Grid item xs={12} md={4}>
            <NotificationList />
          </Grid>
        </Grid>

        <Dialog 
          open={createDialogOpen} 
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category || 'Development'}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                value={formData.priority || 'Medium'}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Deadline"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.deadline || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <LoadingButton 
              onClick={() => handleCreateProject(formData)}
              loading={isCreating}
              variant="contained"
            >
              Create Project
            </LoadingButton>
          </DialogActions>
        </Dialog>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: theme => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.08)',
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Task Status Distribution
              </Typography>
              {/* Your pie chart component */}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: theme => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.08)',
                height: '100%',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Tasks by Priority
              </Typography>
              {/* Your bar chart component */}
            </Box>
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: theme => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
            Recent Activity
          </Typography>
          
          <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <Box 
                  key={index}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    pb: 2,
                    borderBottom: index < recentActivities.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: '#3f51b5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mr: 2,
                      flexShrink: 0
                    }}
                  >
                    {/* Icon based on activity type */}
                  </Box>
                  
                  <Box>
                    <Typography variant="body1">{activity.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activity.timestamp}
                    </Typography>
                  </Box>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No recent activity</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
