import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { sessionManager } from '../utils/sessionManager';
import { soundManager } from '../utils/soundManager';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const SessionWarningDialog = ({ open, onContinue, onLogout }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      // Play sound when dialog opens
      if (soundEnabled) {
        soundManager.playWarningSound();
      }

      const interval = setInterval(() => {
        const remaining = Math.floor(sessionManager.getRemainingTime());
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          clearInterval(interval);
          onLogout();
        }
        
        // Play sound every minute if enabled
        if (soundEnabled && remaining > 0 && remaining % 60 === 0) {
          soundManager.playWarningSound();
        }
      }, 1000);

      return () => {
        clearInterval(interval);
        soundManager.stopWarningSound();
      };
    }
  }, [open, onLogout, soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      soundManager.playWarningSound();
    } else {
      soundManager.stopWarningSound();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onContinue}
      disableEscapeKeyDown
      disableBackdropClick
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Session Expiring Soon
        <Tooltip title={soundEnabled ? "Mute Sound" : "Enable Sound"}>
          <IconButton onClick={toggleSound} size="small">
            {soundEnabled ? <VolumeUpIcon /> : <VolumeOffIcon />}
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Your session will expire in {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} minutes.
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Would you like to continue your session?
        </Typography>
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(timeLeft / 300) * 100}
            sx={{ 
              height: 8, 
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                transition: 'none'
              }
            }}
          />
        </Box>
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ display: 'block', mt: 1, textAlign: 'right' }}
        >
          {Math.ceil(timeLeft)} seconds remaining
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="error">
          Logout Now
        </Button>
        <Button onClick={onContinue} variant="contained" autoFocus>
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionWarningDialog; 