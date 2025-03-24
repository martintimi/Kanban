import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  Add,
  Delete,
  Edit,
  Person,
  AccessTime,
  Warning,
  CheckCircle,
  CalendarMonth,
  Schedule,
  DragIndicator,
  Group,
  Star,
  FilterList
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, parseISO, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOrganization } from '../context/OrganizationContext';

const ResourceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [allocatedTime, setAllocatedTime] = useState(100);
  const [tabValue, setTabValue] = useState(0);
  const [memberFilter, setMemberFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { selectedOrg } = useOrganization();
  const organizationId = selectedOrg?.id;

  useEffect(() => {
    if (organizationId) {
      loadResources();
    }
  }, [organizationId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      
      // Load organization members
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }
      
      const orgData = orgDoc.data();
      const memberIds = [...(orgData.members || []), ...(orgData.admins || [])];
      
      // Get user data
      const membersData = [];
      for (const userId of memberIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          membersData.push({
            id: userDoc.id,
            ...userDoc.data(),
            allocation: 0, // Will track total allocation
            projects: [] // Will track assigned projects
          });
        }
      }
      
      // Load projects
      const projectsQuery = query(
        collection(db, 'projects'),
        where('organizationId', '==', organizationId),
        where('status', '==', 'active')
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const projectsData = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        members: [] // Will track assigned members
      }));
      
      // Load assignments
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('organizationId', '==', organizationId)
      );
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignmentsData = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate member allocations and update projects with assigned members
      assignmentsData.forEach(assignment => {
        // Update member allocation
        const memberIndex = membersData.findIndex(m => m.id === assignment.memberId);
        if (memberIndex !== -1) {
          membersData[memberIndex].allocation += assignment.allocation;
          membersData[memberIndex].projects.push({
            id: assignment.projectId,
            role: assignment.role,
            allocation: assignment.allocation
          });
        }
        
        // Update project members
        const projectIndex = projectsData.findIndex(p => p.id === assignment.projectId);
        if (projectIndex !== -1) {
          projectsData[projectIndex].members.push({
            id: assignment.memberId,
            role: assignment.role,
            allocation: assignment.allocation
          });
        }
      });
      
      setMembers(membersData);
      setProjects(projectsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading resources:', error);
      showToast('Failed to load resources: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember || !selectedProject || !selectedRole) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    try {
      // Check if member already assigned to this project
      const existingAssignment = assignments.find(
        a => a.memberId === selectedMember.id && a.projectId === selectedProject.id
      );
      
      if (existingAssignment) {
        // Update existing assignment
        await updateDoc(doc(db, 'assignments', existingAssignment.id), {
          role: selectedRole,
          allocation: allocatedTime,
          updatedAt: serverTimestamp()
        });
        
        showToast('Assignment updated successfully', 'success');
      } else {
        // Create new assignment
        await addDoc(collection(db, 'assignments'), {
          organizationId,
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          memberId: selectedMember.id,
          memberName: selectedMember.displayName || selectedMember.email || 'Unknown User',
          role: selectedRole,
          allocation: allocatedTime,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: currentUser.uid
        });
        
        showToast('Member assigned to project successfully', 'success');
        
        // Also add to project members if not already there
        if (!selectedProject.members.includes(selectedMember.id)) {
          await updateDoc(doc(db, 'projects', selectedProject.id), {
            members: [...(selectedProject.members || []), selectedMember.id],
            updatedAt: serverTimestamp()
          });
        }
      }
      
      // Reload data
      await loadResources();
      
      // Close dialog and reset form
      handleCloseAssignDialog();
    } catch (error) {
      console.error('Error assigning member:', error);
      showToast('Failed to assign member: ' + error.message, 'error');
    }
  };

  const handleOpenAssignDialog = (member = null) => {
    setSelectedMember(member);
    setSelectedProject(null);
    setSelectedRole('');
    setAllocatedTime(100);
    setOpenAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedMember(null);
    setSelectedProject(null);
    setSelectedRole('');
    setAllocatedTime(100);
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      await updateDoc(doc(db, 'assignments', assignmentId), {
        status: 'inactive',
        updatedAt: serverTimestamp()
      });
      
      showToast('Assignment removed successfully', 'success');
      
      // Reload data
      await loadResources();
    } catch (error) {
      console.error('Error removing assignment:', error);
      showToast('Failed to remove assignment: ' + error.message, 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;
    
    try {
      // The draggable ID is the assignment ID
      const assignmentId = draggableId;
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (!assignment) {
        showToast('Assignment not found', 'error');
        return;
      }
      
      // The destination droppable ID is the project ID
      const newProjectId = destination.droppableId;
      const newProject = projects.find(p => p.id === newProjectId);
      
      if (!newProject) {
        showToast('Project not found', 'error');
        return;
      }
      
      // Update the assignment
      await updateDoc(doc(db, 'assignments', assignmentId), {
        projectId: newProjectId,
        projectName: newProject.name,
        updatedAt: serverTimestamp()
      });
      
      showToast('Resource allocation updated successfully', 'success');
      
      // Reload data
      await loadResources();
    } catch (error) {
      console.error('Error updating assignment:', error);
      showToast('Failed to update assignment: ' + error.message, 'error');
    }
  };

  const getAllocationColor = (allocation) => {
    if (allocation > 100) return 'error';
    if (allocation > 85) return 'warning';
    if (allocation > 60) return 'primary';
    return 'success';
  };

  const getFilteredMembers = () => {
    if (memberFilter === 'all') return members;
    if (memberFilter === 'overallocated') return members.filter(m => m.allocation > 100);
    if (memberFilter === 'underallocated') return members.filter(m => m.allocation < 50);
    if (memberFilter === 'optimal') {
      return members.filter(m => m.allocation >= 50 && m.allocation <= 100);
    }
    return members;
  };

  const getFilteredProjects = () => {
    if (projectFilter === 'all') return projects;
    return projects.filter(p => p.id === projectFilter);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Group color="primary" />
              Resource Management
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenAssignDialog()}
            >
              Assign Resource
            </Button>
          </Box>
        </Grid>
        
        {/* Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Team Allocation" />
              <Tab label="Project Resources" />
              <Tab label="Skills Matrix" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {/* Team Allocation Tab */}
              {tabValue === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <FormControl size="small" sx={{ width: 200 }}>
                      <InputLabel>Filter Members</InputLabel>
                      <Select
                        value={memberFilter}
                        onChange={(e) => setMemberFilter(e.target.value)}
                        label="Filter Members"
                      >
                        <MenuItem value="all">All Members</MenuItem>
                        <MenuItem value="overallocated">Overallocated (>100%)</MenuItem>
                        <MenuItem value="optimal">Optimal (50-100%)</MenuItem>
                        <MenuItem value="underallocated">Underallocated (&lt;50%)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {getFilteredMembers().map(member => (
                      <Grid item xs={12} md={6} lg={4} key={member.id}>
                        <Card variant="outlined">
                          <CardHeader
                            avatar={
                              <Avatar src={member.photoURL}>
                                {member.displayName?.charAt(0) || member.email?.charAt(0) || 'U'}
                              </Avatar>
                            }
                            title={member.displayName || member.email || 'Unknown User'}
                            subheader={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">
                                  {member.role || 'Team Member'}
                                </Typography>
                                <Chip 
                                  size="small" 
                                  label={`${member.allocation}% Allocated`}
                                  color={getAllocationColor(member.allocation)}
                                />
                              </Box>
                            }
                            action={
                              <IconButton onClick={() => handleOpenAssignDialog(member)}>
                                <Add />
                              </IconButton>
                            }
                          />
                          <Divider />
                          <CardContent sx={{ pt: 1, pb: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(member.allocation, 100)} 
                              color={getAllocationColor(member.allocation)}
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                mb: 2
                              }}
                            />
                            
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                              Project Assignments
                            </Typography>
                            {member.projects.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                Not assigned to any projects
                              </Typography>
                            ) : (
                              <List dense disablePadding>
                                {member.projects.map((project, index) => {
                                  const projectInfo = projects.find(p => p.id === project.id);
                                  const assignment = assignments.find(
                                    a => a.memberId === member.id && a.projectId === project.id
                                  );
                                  
                                  return (
                                    <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                                      <ListItemText
                                        primary={projectInfo?.name || 'Unknown Project'}
                                        secondary={
                                          <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Chip 
                                              size="small" 
                                              label={project.role} 
                                              variant="outlined"
                                              sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                            <Chip 
                                              size="small" 
                                              label={`${project.allocation}%`} 
                                              color="primary"
                                              variant="outlined"
                                              sx={{ height: 20, fontSize: '0.7rem' }}
                                            />
                                          </Box>
                                        }
                                      />
                                      {assignment && (
                                        <ListItemSecondaryAction>
                                          <IconButton 
                                            edge="end" 
                                            size="small"
                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                          >
                                            <Delete fontSize="small" />
                                          </IconButton>
                                        </ListItemSecondaryAction>
                                      )}
                                    </ListItem>
                                  );
                                })}
                              </List>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
              
              {/* Project Resources Tab */}
              {tabValue === 1 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <FormControl size="small" sx={{ width: 200 }}>
                      <InputLabel>Filter Projects</InputLabel>
                      <Select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        label="Filter Projects"
                      >
                        <MenuItem value="all">All Projects</MenuItem>
                        {projects.map(project => (
                          <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Grid container spacing={2}>
                      {getFilteredProjects().map(project => (
                        <Grid item xs={12} md={6} lg={4} key={project.id}>
                          <Card variant="outlined">
                            <CardHeader
                              title={project.name}
                              subheader={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip 
                                    size="small" 
                                    label={project.status || 'Active'} 
                                    color="primary"
                                  />
                                  <Typography variant="body2">
                                    {project.members.length} Team Members
                                  </Typography>
                                </Box>
                              }
                              action={
                                <IconButton onClick={() => handleOpenAssignDialog()}>
                                  <Add />
                                </IconButton>
                              }
                            />
                            <Divider />
                            <CardContent sx={{ pt: 1, pb: 1 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Assigned Team Members
                              </Typography>
                              <Droppable droppableId={project.id}>
                                {(provided) => (
                                  <List 
                                    dense 
                                    disablePadding
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{ 
                                      minHeight: 100,
                                      bgcolor: 'background.default',
                                      borderRadius: 1,
                                      p: 1
                                    }}
                                  >
                                    {project.members.length === 0 ? (
                                      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                                        No resources assigned
                                      </Typography>
                                    ) : (
                                      project.members.map((memberAssignment, index) => {
                                        const member = members.find(m => m.id === memberAssignment.id);
                                        const assignment = assignments.find(
                                          a => a.memberId === memberAssignment.id && a.projectId === project.id
                                        );
                                        
                                        if (!member || !assignment) return null;
                                        
                                        return (
                                          <Draggable 
                                            key={assignment.id} 
                                            draggableId={assignment.id} 
                                            index={index}
                                          >
                                            {(provided) => (
                                              <ListItem 
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                sx={{ 
                                                  mb: 1, 
                                                  borderRadius: 1,
                                                  bgcolor: 'background.paper'
                                                }}
                                              >
                                                <ListItemAvatar {...provided.dragHandleProps}>
                                                  <Avatar src={member.photoURL}>
                                                    {member.displayName?.charAt(0) || member.email?.charAt(0) || 'U'}
                                                  </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                  primary={member.displayName || member.email || 'Unknown User'}
                                                  secondary={
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                      <Chip 
                                                        size="small" 
                                                        label={memberAssignment.role} 
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                      />
                                                      <Chip 
                                                        size="small" 
                                                        label={`${memberAssignment.allocation}%`} 
                                                        color={getAllocationColor(member.allocation)}
                                                        variant="outlined"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                      />
                                                    </Box>
                                                  }
                                                />
                                                <ListItemSecondaryAction>
                                                  <IconButton 
                                                    edge="end" 
                                                    size="small"
                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                  >
                                                    <Delete fontSize="small" />
                                                  </IconButton>
                                                </ListItemSecondaryAction>
                                              </ListItem>
                                            )}
                                          </Draggable>
                                        );
                                      })
                                    )}
                                    {provided.placeholder}
                                  </List>
                                )}
                              </Droppable>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </DragDropContext>
                </>
              )}
              
              {/* Skills Matrix Tab */}
              {tabValue === 2 && (
                <Typography variant="body1" sx={{ p: 2, textAlign: 'center' }}>
                  Skills matrix feature coming soon...
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Assign Resource Dialog */}
      <Dialog open={openAssignDialog} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedMember ? `Assign ${selectedMember.displayName || selectedMember.email} to Project` : 'Assign Resource to Project'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {!selectedMember && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Team Member</InputLabel>
                  <Select
                    value={selectedMember?.id || ''}
                    onChange={(e) => {
                      const member = members.find(m => m.id === e.target.value);
                      setSelectedMember(member);
                    }}
                    label="Team Member"
                    required
                  >
                    {members.map(member => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.displayName || member.email || 'Unknown User'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Project</InputLabel>
                <Select
                  value={selectedProject?.id || ''}
                  onChange={(e) => {
                    const project = projects.find(p => p.id === e.target.value);
                    setSelectedProject(project);
                  }}
                  label="Project"
                  required
                >
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Role"
                  required
                >
                  <MenuItem value="Developer">Developer</MenuItem>
                  <MenuItem value="Designer">Designer</MenuItem>
                  <MenuItem value="Project Manager">Project Manager</MenuItem>
                  <MenuItem value="QA Tester">QA Tester</MenuItem>
                  <MenuItem value="DevOps">DevOps</MenuItem>
                  <MenuItem value="Business Analyst">Business Analyst</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <TextField
                  label="Allocation (%)"
                  type="number"
                  value={allocatedTime}
                  onChange={(e) => setAllocatedTime(parseInt(e.target.value, 10))}
                  InputProps={{
                    inputProps: { min: 5, max: 100 }
                  }}
                  helperText="Percentage of time allocated to this project"
                />
              </FormControl>
              
              {selectedMember && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Allocation: {selectedMember.allocation}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(selectedMember.allocation, 100)} 
                    color={getAllocationColor(selectedMember.allocation)}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      mb: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.allocation > 100 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Warning fontSize="small" color="error" />
                        This team member is already overallocated
                      </Box>
                    ) : selectedMember.allocation + allocatedTime > 100 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Warning fontSize="small" color="warning" />
                        This assignment would overallocate the team member ({selectedMember.allocation + allocatedTime}%)
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle fontSize="small" color="success" />
                        Allocation is within acceptable range
                      </Box>
                    )}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleAssign}
            disabled={!selectedMember || !selectedProject || !selectedRole}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceManagement; 