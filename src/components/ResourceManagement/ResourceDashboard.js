import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  Typography,
  LinearProgress,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  AvatarGroup,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Speed as SpeedIcon,
  Group as GroupIcon,
  Mail as MailIcon
} from '@mui/icons-material';
import { useProjects } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { useToast } from '../../context/ToastContext';

const ResourceDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [workloadData, setWorkloadData] = useState({});
  const [inviteDialog, setInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const { user } = useAuth();
  const { projects } = useProjects();
  const { showToast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, [user]);

  useEffect(() => {
    if (selectedOrg) {
      loadOrgMembers();
      calculateWorkload();
    }
  }, [selectedOrg, projects]);

  const loadOrganizations = async () => {
    try {
      const userOrgs = await OrganizationService.getUserOrganizations(user.uid);
      setOrganizations(userOrgs);
      if (userOrgs.length > 0) {
        setSelectedOrg(userOrgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      showToast('Failed to load organizations', 'error');
    }
  };

  const loadOrgMembers = async () => {
    if (!selectedOrg) return;
    try {
      const orgMembers = await OrganizationService.getOrganizationMembers(selectedOrg.id);
      setMembers(orgMembers);
    } catch (error) {
      console.error('Error loading members:', error);
      showToast('Failed to load team members', 'error');
    }
  };

  const calculateWorkload = () => {
    const workload = {};
    
    projects.forEach(project => {
      if (project.organizationId !== selectedOrg.id) return;
      
      project.tasks?.forEach(task => {
        if (!task.assignee) return;
        
        workload[task.assignee] = workload[task.assignee] || {
          total: 0,
          completed: 0,
          inProgress: 0,
          projects: new Set()
        };
        
        workload[task.assignee].total++;
        workload[task.assignee].projects.add(project.id);
        
        if (task.status === 'Done') {
          workload[task.assignee].completed++;
        } else if (task.status === 'In Progress') {
          workload[task.assignee].inProgress++;
        }
      });
    });
    
    setWorkloadData(workload);
  };

  const handleInviteUser = async () => {
    try {
      await OrganizationService.inviteUser(selectedOrg.id, inviteEmail);
      showToast('Invitation sent successfully', 'success');
      setInviteDialog(false);
      setInviteEmail('');
    } catch (error) {
      console.error('Error inviting user:', error);
      showToast('Failed to send invitation', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Resource Management
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Organization</InputLabel>
            <Select
              value={selectedOrg?.id || ''}
              onChange={(e) => {
                const org = organizations.find(o => o.id === e.target.value);
                setSelectedOrg(org);
              }}
            >
              {organizations.map(org => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setInviteDialog(true)}
        >
          Invite Member
        </Button>
      </Box>

      <Grid container spacing={3}>
        {members.map(member => {
          const data = workloadData[member.id] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            projects: new Set()
          };
          
          const progress = data.total ? (data.completed / data.total) * 100 : 0;

          return (
            <Grid item xs={12} md={4} key={member.id}>
              <Card
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  p: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={member.photoURL} sx={{ width: 50, height: 50 }}>
                    {member.name?.charAt(0)}
                  </Avatar>
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="h6">{member.name}</Typography>
                    <Typography variant="body2">{member.role}</Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Task Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="h4">{data.total}</Typography>
                    <Typography variant="body2">Total Tasks</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h4">{data.inProgress}</Typography>
                    <Typography variant="body2">In Progress</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="h4">{data.projects.size}</Typography>
                    <Typography variant="body2">Projects</Typography>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={inviteDialog} onClose={() => setInviteDialog(false)}>
        <DialogTitle>Invite Team Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInviteUser}>
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResourceDashboard; 