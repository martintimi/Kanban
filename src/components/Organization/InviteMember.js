import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography
} from '@mui/material';

const InviteMember = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');

  const handleSendInvite = () => {
    // This function is now just a placeholder and does nothing
    if (!email || !email.includes('@')) {
      setError('Valid email is required');
      return;
    }

    // Reset the form
    setEmail('');
    setRole('developer');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invite Team Member</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Enter the email address of the user you want to invite.
          </Typography>
          
          <TextField
            label="Email Address"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            placeholder="teammate@example.com"
          />
          
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              label="Role"
            >
              <MenuItem value="admin">Administrator</MenuItem>
              <MenuItem value="project_manager">Project Manager</MenuItem>
              <MenuItem value="developer">Developer</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSendInvite} 
          variant="contained"
        >
          Send Invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InviteMember; 