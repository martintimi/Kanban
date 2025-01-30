import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Switch,
  Typography,
  Box
} from '@mui/material';
import { NotificationService } from '../services/notification.service';
import { useAuth } from '../context/AuthContext';

const NotificationPreferences = ({ open, onClose }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    sound: true,
    taskAssignment: true,
    taskDue: true,
    taskComments: true,
    taskStatusChange: true,
    desktop: true,
    groupByProject: true
  });

  useEffect(() => {
    if (user?.uid) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const prefs = await NotificationService.getUserNotificationPreferences(user.uid);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    try {
      await NotificationService.updateNotificationPreferences(user.uid, preferences);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Notification Preferences</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Notification Types
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.taskAssignment}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    taskAssignment: e.target.checked
                  }))}
                />
              }
              label="Task Assignments"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.taskDue}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    taskDue: e.target.checked
                  }))}
                />
              }
              label="Due Date Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.taskComments}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    taskComments: e.target.checked
                  }))}
                />
              }
              label="Task Comments"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.taskStatusChange}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    taskStatusChange: e.target.checked
                  }))}
                />
              }
              label="Status Changes"
            />
          </FormGroup>

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Notification Settings
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.sound}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    sound: e.target.checked
                  }))}
                />
              }
              label="Sound Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.desktop}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    desktop: e.target.checked
                  }))}
                />
              }
              label="Desktop Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.groupByProject}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    groupByProject: e.target.checked
                  }))}
                />
              }
              label="Group by Project"
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationPreferences; 