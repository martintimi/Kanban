import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Stack
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  PersonAdd as PersonAddIcon, 
  PeopleOutline as PeopleIcon, 
  PersonAddAlt as InviteIcon, 
  HourglassEmpty as HourglassEmptyIcon,
  VideoCall as VideoCallIcon
} from '@mui/icons-material';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { OrganizationService } from '../../services/organization.service';
import { UserService } from '../../services/user.service';
import { LoadingButton } from '@mui/lab';
import CustomLoader from '../CustomLoader';
import MemberList from './MemberList';
import InviteForm from './InviteForm';
import MeetingManager from '../Meeting/MeetingManager';

const EmptyState = ({ type }) => (
  <Paper 
    sx={{ 
      p: 4, 
      textAlign: 'center',
      bgcolor: 'background.default',
      borderRadius: 2
    }}
  >
    <Box sx={{ mb: 2 }}>
      {type === 'members' ? (
        <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
      ) : type === 'meetings' ? (
        <VideoCallIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
      ) : (
        <InviteIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
      )}
    </Box>
    <Typography variant="h6" gutterBottom>
      {type === 'members' 
        ? 'No Team Members Yet' 
        : type === 'meetings'
        ? 'No Active Meetings'
        : 'No Users Available to Invite'
      }
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {type === 'members' 
        ? 'Start building your team by inviting developers and project managers'
        : type === 'meetings'
        ? 'Start a new meeting to collaborate with your team'
        : 'All available users have already been invited to your organization'
      }
    </Typography>
  </Paper>
);

const OrganizationManagement = () => {
  const location = useLocation();
  const { selectedOrg, loading } = useOrganization();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [tab, setTab] = useState(0);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inviting, setInviting] = useState({});
  const [selectedRole, setSelectedRole] = useState('developer');
  const [pendingInvites, setPendingInvites] = useState([]);
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [updatingOrg, setUpdatingOrg] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [selectedOrg]);

  const loadUsers = async () => {
    if (!selectedOrg?.id) return;
    
    try {
      setLoadingMembers(true);
      const [currentMembers, allUsers, pendingInvites] = await Promise.all([
        OrganizationService.getOrganizationMembers(selectedOrg.id),
        UserService.getAllUsers(),
        OrganizationService.getPendingInvitations(selectedOrg.id)
      ]);
      
      // Filter out the admin and set members
      const teamMembers = currentMembers.filter(member => 
        member.id !== user.uid && member.role !== 'admin'
      );
      setMembers(teamMembers);

      // Filter available users and check pending invites
      const memberIds = currentMembers.map(m => m.id);
      const pendingUserIds = pendingInvites.map(invite => invite.userId);
      
      const available = allUsers.filter(u => 
        !memberIds.includes(u.id) && // Not already a member
        !pendingUserIds.includes(u.id) && // Not already invited
        u.id !== user.uid && // Not current user
        u.role !== 'admin' // Not an admin
      );
      
      setAvailableUsers(available);
      setPendingInvites(pendingInvites);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleInvite = async (userId) => {
    try {
      setInviting(prev => ({ ...prev, [userId]: true }));
      await OrganizationService.inviteMember(selectedOrg.id, userId, selectedRole);
      showToast('Invitation sent successfully', 'success');
      await loadUsers(); // Reload the lists
    } catch (error) {
      console.error('Error inviting member:', error);
      showToast(error.message || 'Failed to send invitation', 'error');
    } finally {
      setInviting(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await OrganizationService.removeMember(selectedOrg.id, memberId);
      showToast('Member removed successfully', 'success');
      await loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  // Determine if we're in a loading state (either context loading or members loading)
  const isLoading = loading || loadingMembers;

  if (!selectedOrg) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Please select an organization first</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">
          Organization Management
        </Typography>
      </Stack>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="CURRENT MEMBERS" />
        <Tab label="INVITE MEMBERS" />
        <Tab label="MEETINGS" />
      </Tabs>

      {/* Show loader when loading */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CustomLoader message="Loading..." />
        </Box>
      ) : (
        <>
          {/* Only show content when not loading */}
          {tab === 0 && (
            <Paper sx={{ p: 3, minHeight: 300 }}>
              {members.length > 0 ? (
                <MemberList members={members} />
              ) : (
                <EmptyState type="members" />
              )}
            </Paper>
          )}
          
          {tab === 1 && (
            <Paper sx={{ p: 3 }}>
              <InviteForm />
            </Paper>
          )}

          {tab === 2 && (
            <Paper sx={{ p: 3 }}>
              <MeetingManager />
            </Paper>
          )}
        </>
      )}

      {creatingOrg && <CustomLoader message="Creating organization..." />}
      {updatingOrg && <CustomLoader message="Updating organization..." />}
      {deletingOrg && <CustomLoader message="Deleting organization..." />}
    </Box>
  );
};

export default OrganizationManagement;   