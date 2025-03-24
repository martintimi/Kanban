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
  Alert,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemAvatar,
  ListItemText,
  List,
  ListItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ViewListIcon from '@mui/icons-material/ViewList';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../context/AuthContext';
import { useProjects } from '../../context/ProjectContext';
import { ProjectService } from '../../services/project.service';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '../../context/ActivityContext';
import EmptyState from '../EmptyState';
import { useToast } from '../../context/ToastContext';
import ProjectAnalytics from './ProjectAnalytics';
import ProjectTimeline from './ProjectTimeline';
import ProjectForm from './ProjectForm';
import { useOrganization } from '../../context/OrganizationContext';
import CustomLoader from '../CustomLoader';

const Projects = () => {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const { 
    createProject, 
    projects, 
    loading, 
    error,
    setError,
    setProjects,
    updateProject,
    deleteProject 
  } = useProjects();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    category: '',
    priority: 'medium',
    deadline: '',
    status: 'active'
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { activities, loadActivities, refreshActivities } = useActivities();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { showToast } = useToast();

  // Only show create project button for admin/PM
  const canCreateProject = selectedOrg?.roles?.[user.uid] === 'admin' || 
                          selectedOrg?.roles?.[user.uid] === 'project_manager';

  const handleCreateProject = async () => {
    try {
      if (!selectedOrg) {
        showToast('Please select an organization first', 'error');
        return;
      }

      const newProject = {
        ...projectData,
        organizationId: selectedOrg.id,
        createdBy: user.uid,
        members: [user.uid],
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await createProject(newProject);
      setOpenDialog(false);
      setProjectData({
        name: '',
        description: '',
        category: '',
        priority: 'medium',
        deadline: '',
        status: 'active'
      });
      showToast('Project created successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to create project', 'error');
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

  const handleEditProject = async () => {
    try {
      await ProjectService.updateProject(selectedProject.id, selectedProject);
      
      await ProjectService.addActivity(selectedProject.id, {
        type: 'project_updated',
        entityType: 'project',
        userId: user.uid,
        userName: user.name || user.email,
        details: `Updated project: ${selectedProject.name}`,
        projectName: selectedProject.name,
        changes: ['details', 'name']
      });

      setProjects(prev => prev.map(p => 
        p.id === selectedProject.id ? selectedProject : p
      ));
      setEditDialogOpen(false);
      showToast('Project updated successfully', 'success');
      await refreshActivities();
    } catch (error) {
      showToast(error.message || 'Failed to update project', 'error');
    }
  };

  const handleShareProject = async () => {
    try {
      await ProjectService.inviteMember(selectedProject.id, {
        email: inviteEmail,
        role: inviteRole
      });

      await ProjectService.addActivity(selectedProject.id, {
        type: 'project_shared',
        entityType: 'project',
        userId: user.uid,
        userName: user.name || user.email,
        details: `Shared project with ${inviteEmail}`,
        projectName: selectedProject.name,
        sharedWith: inviteEmail,
        role: inviteRole
      });

      setShareDialogOpen(false);
      setInviteEmail('');
      showToast('Project shared successfully', 'success');
      await refreshActivities();
    } catch (error) {
      showToast(error.message || 'Failed to share project', 'error');
    }
  };

  const handleOpenDeleteDialog = (project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
    setAnchorEl(null);
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
      setDeleteDialogOpen(false);
      showToast('Project deleted successfully', 'success');
      await refreshActivities();
    } catch (error) {
      setError(error.message);
      showToast(error.message || 'Failed to delete project', 'error');
    } finally {
      setSelectedProject(null);
      setAnchorEl(null);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await ProjectService.removeMember(selectedProject.id, memberId);
      setSelectedProject(prev => ({
        ...prev,
        members: prev.members.filter(m => m.id !== memberId)
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <CustomLoader message="Loading projects..." />;

  return (
    <Box sx={{ p: 5 }}>
      {/* Analytics at the top */}
      <ProjectAnalytics projects={projects} />

      {/* Project Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        mt: 4
      }}>
        <Typography variant="h4">Projects</Typography>
        {canCreateProject && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            New Project
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        mb: 3,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <TextField
          placeholder="Search projects..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="on-hold">On Hold</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label="Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All Priority</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </TextField>
      </Box>

      {projects.length === 0 ? (
        <EmptyState 
          type="projects" 
          onAction={handleCreateProject}
          currentModule="Project"
        />
      ) : (
        <Grid container spacing={3} sx={{ mt: 3 }}>
          {projects
            .filter(project => {
              const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description?.toLowerCase().includes(searchTerm.toLowerCase());
              const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
              const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
              return matchesSearch && matchesStatus && matchesPriority;
            })
            .map(project => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    height: '100%',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
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
                        color="text.primary"
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
                    
                    <Typography 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      {project.description}
                    </Typography>

                    <Box sx={{ mt: 2, mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {project.tasks?.filter(t => t.status === 'Done').length || 0}/{project.tasks?.length || 0} tasks
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={
                          project.tasks?.length 
                            ? (project.tasks.filter(t => t.status === 'Done').length / project.tasks.length) * 100
                            : 0
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {project.members?.slice(0, 3).map((member, index) => (
                        <Avatar
                          key={member.id}
                          src={member.photoURL}
                          sx={{ width: 30, height: 30 }}
                        >
                          {member.name?.charAt(0)}
                        </Avatar>
                      ))}
                      {project.members?.length > 3 && (
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main' }}>
                          +{project.members.length - 3}
                        </Avatar>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={project.category || 'No Category'} 
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${project.tasks?.length || 0} Tasks`}
                        size="small"
                        color={project.tasks?.length ? 'info' : 'default'}
                      />
                      {project.deadline && (
                        <Chip 
                          label={`Due: ${new Date(project.deadline).toLocaleDateString()}`}
                          size="small"
                          color={
                            new Date(project.deadline) < new Date() 
                              ? 'error' 
                              : 'success'
                          }
                          icon={<AccessTimeIcon />}
                        />
                      )}
                      <Chip
                        label={project.priority || 'Medium'}
                        size="small"
                        color={
                          project.priority === 'High' ? 'error' :
                          project.priority === 'Medium' ? 'warning' :
                          'default'
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}

      {/* Timeline */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>Project Timeline</Typography>
        <ProjectTimeline 
          tasks={projects.reduce((allTasks, project) => 
            [...allTasks, ...(project.tasks || [])], 
          [])} 
        />
      </Box>

      {/* Create Project Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <ProjectForm 
              formData={projectData}
              setFormData={setProjectData}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained">
            Create Project
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary'
          }
        }}
      >
        <MenuItem onClick={() => {
          handleProjectClick(selectedProject?.id);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ViewListIcon sx={{ color: 'text.primary' }} />
          </ListItemIcon>
          View Tasks
        </MenuItem>
        <MenuItem onClick={() => {
          setEditDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon sx={{ color: 'text.primary' }} />
          </ListItemIcon>
          Edit Project
        </MenuItem>
        <MenuItem onClick={() => {
          setShareDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <ShareIcon sx={{ color: 'text.primary' }} />
          </ListItemIcon>
          Share Project
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => handleOpenDeleteDialog(selectedProject)}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Project Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={selectedProject?.name || ''}
              onChange={(e) => setSelectedProject(prev => ({
                ...prev,
                name: e.target.value
              }))}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={selectedProject?.description || ''}
              onChange={(e) => setSelectedProject(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
            <TextField
              fullWidth
              select
              label="Priority"
              value={selectedProject?.priority || 'Medium'}
              onChange={(e) => setSelectedProject(prev => ({
                ...prev,
                priority: e.target.value
              }))}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Deadline"
              value={selectedProject?.deadline || ''}
              onChange={(e) => setSelectedProject(prev => ({
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
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleEditProject}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Project Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Project</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Email Address"
              placeholder="Enter email to invite"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <TextField
              select
              fullWidth
              label="Role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Box>
          {/* Current Members List */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Current Members
            </Typography>
            <List>
              {selectedProject?.members?.map(member => (
                <ListItem
                  key={member.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleRemoveMember(member.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={member.photoURL}>{member.name?.charAt(0)}</Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={member.name} 
                    secondary={member.role}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleShareProject}
            disabled={!inviteEmail}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            color="error"
            variant="contained"
            onClick={handleDeleteProject}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Projects; 