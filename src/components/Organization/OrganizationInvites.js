import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { 
  Business as BusinessIcon, 
  Check as CheckIcon, 
  Close as CloseIcon 
} from '@mui/icons-material';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { OrganizationService } from '../../services/organization.service';
import { useOrganization } from '../../context/OrganizationContext';

const OrganizationInvites = ({ open, onClose }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const [acceptingId, setAcceptingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [invitations, setInvitations] = useState([]);
  
  React.useEffect(() => {
    if (open && user?.uid) {
      loadInvitations();
    }
  }, [open, user]);

  const loadInvitations = async () => {
    try {
      const invites = await OrganizationService.getPendingInvitations(user.uid);
      setInvitations(invites);
    } catch (error) {
      console.error('Error loading invitations:', error);
      showToast('Failed to load invitations', 'error');
    }
  };
  
  const handleAccept = async (invitation) => {
    try {
      setAcceptingId(invitation.id);
      await OrganizationService.acceptInvitation(invitation.id, user.uid);
      showToast('Invitation accepted successfully', 'success');
      await refreshOrganizations(); // Refresh the organizations list
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      
      if (invitations.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      showToast(error.message || 'Failed to accept invitation', 'error');
    } finally {
      setAcceptingId(null);
    }
  };
  
  const handleDecline = async (invitation) => {
    try {
      setDecliningId(invitation.id);
      await OrganizationService.declineInvitation(invitation.id, user.uid);
      showToast('Invitation declined', 'info');
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      
      if (invitations.length <= 1) {
        onClose();
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      showToast(error.message || 'Failed to decline invitation', 'error');
    } finally {
      setDecliningId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BusinessIcon />
          <Typography>Organization Invitations</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {invitations.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No pending invitations
            </Typography>
          </Box>
        ) : (
          <List>
            {invitations.map((invitation) => (
              <React.Fragment key={invitation.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <BusinessIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`Join ${invitation.organizationName}`}
                    secondary={`Role: ${invitation.role}`}
                  />
                  <ListItemSecondaryAction sx={{ display: 'flex', gap: 1 }}>
                    <LoadingButton
                      size="small"
                      color="success"
                      variant="contained"
                      onClick={() => handleAccept(invitation)}
                      loading={acceptingId === invitation.id}
                      startIcon={<CheckIcon />}
                    >
                      Accept
                    </LoadingButton>
                    <LoadingButton
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleDecline(invitation)}
                      loading={decliningId === invitation.id}
                      startIcon={<CloseIcon />}
                    >
                      Decline
                    </LoadingButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrganizationInvites; 