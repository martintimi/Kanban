import React, { useState } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import NotificationSettings from './NotificationSettings';
import CustomLoader from '../CustomLoader';

const Settings = () => {
  const [loading, setLoading] = useState(false); // Add loading state

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
      
      {loading && <CustomLoader message="Loading settings..." />}
    </Box>
  );
};

export default Settings; 