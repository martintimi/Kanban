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
  CircularProgress,
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    projects, 
    loading, 
    error, 
    createProject, 
    updateProject, 
    deleteProject, 
    recentActivities,
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
    if (!recentActivities?.length) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No recent activities
        </Typography>
      );
    }

    return (
      <Timeline>
        {recentActivities.map((activity, index) => (
          <TimelineItem key={activity.id}>
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
                {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} Project
              </Typography>
              <Typography variant="body2" color="text.secondary">
                "{activity.projectName}" - {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
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
          <CircularProgress 
            variant="determinate" 
            value={projects.length > 0 
              ? (projects.filter(p => p.status === 'completed').length / projects.length) * 100
              : 0} 
            size={40}
          />
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

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
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

        <Box sx={{ 
          p: 3, 
          mb: 4,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(to right, #1a1a1a, #2d2d2d)'
            : 'linear-gradient(to right, #ffffff, #f5f5f5)',
          borderRadius: 2,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 2px 4px rgba(0,0,0,0.2)'
            : '0 2px 4px rgba(0,0,0,0.05)',
          color: theme.palette.mode === 'dark' ? '#fff' : '#000'
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 500,
              color: theme.palette.mode === 'dark' ? '#fff' : '#000',
              mb: 1 
            }}
          >
            {`${greeting}, ${user?.fullName || user?.name || user?.email?.split('@')[0] || 'User'}!`}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary'
            }}
          >
            Welcome to your dashboard. Here's an overview of your projects and tasks.
          </Typography>
        </Box>

        {error && (
          <MuiAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </MuiAlert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statisticsCards.map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(to right, #1a1a1a, #2d2d2d)'
                  : 'linear-gradient(to right, #ffffff, #f5f5f5)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 2px 4px rgba(0,0,0,0.2)'
                  : '0 2px 4px rgba(0,0,0,0.05)',
              }}>
                <CardContent>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom
                    sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}
                  >
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="h4" 
                    component="div"
                    sx={{ color: theme.palette.mode === 'dark' ? '#fff' : 'text.primary' }}
                  >
                    {item.value}
                  </Typography>
                  {item.content}
                </CardContent>
              </Card>
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
            onClick={handleOpen}
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
            {renderRecentActivities()}
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

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && filteredProjects.length === 0 && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Typography color="text.secondary">
              {searchQuery 
                ? "No projects match your search" 
                : "No projects yet. Create your first project!"}
            </Typography>
            <CustomButton
              label="Create Project"
              onClick={handleOpen}
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
      </Box>
    </Box>
  );
}
