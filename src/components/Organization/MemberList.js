import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useOrganization } from '../../context/OrganizationContext';
import { useToast } from '../../context/ToastContext';
import { OrganizationService } from '../../services/organization.service';

const MemberList = ({ members }) => {
  const { selectedOrg } = useOrganization();
  const { showToast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleRemoveMember = async () => {
    if (!selectedMember || !selectedOrg) return;
    
    try {
      await OrganizationService.removeMember(selectedOrg.id, selectedMember.id);
      showToast('Member removed successfully', 'success');
      setDeleteConfirmOpen(false);
      // You might want to refresh the member list after removal
      // This would typically be done by calling a parent function passed as prop
    } catch (error) {
      console.error('Error removing member:', error);
      showToast('Failed to remove member', 'error');
    }
  };

  const openDeleteConfirm = (member) => {
    setSelectedMember(member);
    setDeleteConfirmOpen(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'project_manager': return 'primary';
      case 'developer': return 'success';
      default: return 'default';
    }
  };

  return (
    <>
      <List sx={{ width: '100%' }}>
        {members.map((member) => (
          <ListItem
            key={member.id}
            sx={{
              mb: 1,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <ListItemAvatar>
              <Avatar src={member.photoURL}>
                {member.name?.charAt(0) || member.email?.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1">
                    {member.name || member.email}
                  </Typography>
                  <Chip 
                    label={member.role} 
                    size="small" 
                    color={getRoleColor(member.role)}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              }
              secondary={member.email}
            />
            <ListItemSecondaryAction>
              <IconButton 
                edge="end" 
                aria-label="delete" 
                onClick={() => openDeleteConfirm(member)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {selectedMember?.name || selectedMember?.email} from this organization? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleRemoveMember} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MemberList; 