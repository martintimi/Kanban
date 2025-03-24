import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Search as SearchIcon, Send as SendIcon } from '@mui/icons-material';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { OrganizationService } from '../../services/organization.service';
import { UserService } from '../../services/user.service';
import CustomLoader from '../CustomLoader';

const InviteForm = () => {
  const { selectedOrg } = useOrganization();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);

  useEffect(() => {
    if (selectedOrg?.id) {
      loadUsers();
    }
  }, [selectedOrg]);

  const loadUsers = async () => {
    if (!selectedOrg?.id) return;

    try {
      setLoading(true);
      const [members, allUsers, invites] = await Promise.all([
        OrganizationService.getOrganizationMembers(selectedOrg.id),
        UserService.getAllUsers(),
        OrganizationService.getPendingInvitations(selectedOrg.id)
      ]);

      // Filter out users who are already members or have pending invites
      const memberIds = members.map(m => m.id);
      const inviteEmails = invites.map(i => i.email);
      
      const available = allUsers.filter(user => 
        !memberIds.includes(user.id) && 
        !inviteEmails.includes(user.email)
      );
      
      setAvailableUsers(available);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Please enter an email address', 'error');
      return;
    }

    try {
      setSending(true);
      const result = await OrganizationService.inviteByEmail(selectedOrg.id, email.trim(), role);
      showToast(result.message, 'success');
      setEmail('');
      await loadUsers(); // Refresh the lists
    } catch (error) {
      console.error('Error sending invitation:', error);
      showToast(error.message || 'Failed to send invitation', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleInviteUser = async (userId) => {
    try {
      setSending(true);
      // Get the user's email from the availableUsers list
      const userToInvite = availableUsers.find(u => u.id === userId);
      if (!userToInvite?.email) {
        throw new Error('User email not found');
      }
      const result = await OrganizationService.inviteByEmail(selectedOrg.id, userToInvite.email, role);
      showToast(result.message, 'success');
      await loadUsers(); // Refresh the lists
    } catch (error) {
      console.error('Error inviting user:', error);
      showToast(error.message || 'Failed to send invitation', 'error');
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Invite Members</Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleInvite}>
          <Typography variant="subtitle1" gutterBottom>
            Invite by Email
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              type="email"
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Role"
              >
                <MenuItem value="developer">Developer</MenuItem>
                <MenuItem value="project_manager">Project Manager</MenuItem>
              </Select>
            </FormControl>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={sending}
              loadingPosition="start"
              startIcon={<SendIcon />}
            >
              Send Invite
            </LoadingButton>
          </Box>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">
            Available Users
          </Typography>
          <TextField
            placeholder="Search users..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CustomLoader message="Loading users..." />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography color="text.secondary">
              No users available to invite
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredUsers.map((user) => (
              <ListItem
                key={user.id}
                secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleInviteUser(user.id)}
                  >
                    Invite
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar src={user.photoURL}>
                    {user.name?.charAt(0) || user.email?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={user.name || user.email}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {pendingInvites.length > 0 && (
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            Pending Invitations
          </Typography>
          <List>
            {pendingInvites.map((invite) => (
              <ListItem key={invite.id}>
                <ListItemText
                  primary={invite.email}
                  secondary={`Invited as ${invite.role} on ${new Date(invite.createdAt).toLocaleDateString()}`}
                />
                <Chip label="Pending" color="warning" size="small" />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default InviteForm; 