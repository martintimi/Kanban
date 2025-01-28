import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  LinearProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from '../context/AuthContext';
import { ProjectService } from '../services/project.service';
import { useNavigate } from 'react-router-dom';
import EmptyState from './EmptyState';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    category: '',
    deadline: ''
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjects();
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading projects for user:', user?.uid);
      
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const userProjects = await ProjectService.getUserProjects(user.uid);
      console.log('Loaded projects:', userProjects);
      setProjects(userProjects || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      console.log('Creating project with data:', projectData);
      const newProject = await ProjectService.createProject(projectData, user.uid);
      console.log('Created project:', newProject);
      setProjects(prev => [newProject, ...prev]);
      setOpenDialog(false);
      setProjectData({
        name: '',
        description: '',
        category: '',
        deadline: ''
      });

      // Add activity
      await ProjectService.addActivity(newProject.id, {
        type: 'project_created',
        userId: user.uid,
        userName: user.name || user.email,
        details: `Created project: ${newProject.name}`
      });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/task-column/${projectId}`);
  };

  const handleMenuOpen = (event, project) => {
    setAnchorEl(event.currentTarget);
    setSelectedProject(project);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <EmptyState
          icon={<AddIcon sx={{ fontSize: 60 }} />}
          title="No Projects Yet"
          description="Create your first project to get started"
          action={
            <Button
              variant="contained"
              onClick={() => setOpenDialog(true)}
            >
              Create Project
            </Button>
          }
        />
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}>
                    <Typography 
                      variant="h6" 
                      onClick={() => handleProjectClick(project.id)}
                    >
                      {project.name}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, project)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                  
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {project.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={project.category || 'No Category'} 
                      size="small"
                    />
                    <Chip 
                      label={`${project.tasks?.length || 0} Tasks`}
                      size="small"
                    />
                    {project.deadline && (
                      <Chip 
                        label={`Due: ${new Date(project.deadline).toLocaleDateString()}`}
                        size="small"
                        color={
                          new Date(project.deadline) < new Date() 
                            ? 'error' 
                            : 'default'
                        }
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={projectData.name}
              onChange={(e) => setProjectData(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={projectData.description}
              onChange={(e) => setProjectData(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
            <TextField
              fullWidth
              label="Category"
              value={projectData.category}
              onChange={(e) => setProjectData(prev => ({
                ...prev,
                category: e.target.value
              }))}
            />
            <TextField
              fullWidth
              type="date"
              label="Deadline"
              value={projectData.deadline}
              onChange={(e) => setProjectData(prev => ({
                ...prev,
                deadline: e.target.value
              }))}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleCreateProject}
            disabled={!projectData.name}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleProjectClick(selectedProject?.id);
          handleMenuClose();
        }}>
          View Tasks
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>Edit Project</MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete Project
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Projects; 