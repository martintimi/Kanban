import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import NotificationSettings from './NotificationSettings';

const Settings = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        <Divider sx={{ my: 2 }} />
        <NotificationSettings />
      </Paper>
    </Box>
  );
};

export default Settings; 