import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Divider
} from '@mui/material';
import { Add as AddIcon, Business as BusinessIcon } from '@mui/icons-material';
import { useOrganization } from '../context/OrganizationContext';

const OrganizationSelector = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  
  const {
    organizations,
    selectedOrg,
    selectOrganization,
    createOrganization
  } = useOrganization();

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;
    
    try {
      await createOrganization({ name: newOrgName.trim() });
      setCreateDialogOpen(false);
      setNewOrgName('');
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };

  return (
    <>
      <Button
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<BusinessIcon />}
        color="inherit"
        sx={{ mr: 2 }}
      >
        {selectedOrg?.name || 'Select Organization'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {organizations.map(org => (
          <MenuItem
            key={org.id}
            selected={org.id === selectedOrg?.id}
            onClick={() => {
              selectOrganization(org);
              setAnchorEl(null);
            }}
          >
            {org.name}
          </MenuItem>
        ))}
        
        <Divider />
        <MenuItem onClick={() => {
          setAnchorEl(null);
          setCreateDialogOpen(true);
        }}>
          <AddIcon sx={{ mr: 1 }} />
          Create Organization
        </MenuItem>
      </Menu>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Organization Name"
            fullWidth
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateOrg} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OrganizationSelector; 