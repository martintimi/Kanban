import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Paper,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Timer as TimerIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDistanceStrict } from 'date-fns';
import { TaskService } from '../../services/TaskService';

const TaskTimer = ({ taskId, projectId, onTimeUpdate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [todayTime, setTodayTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        const now = Date.now();
        const timeElapsed = Math.floor((now - startTime) / 1000);
        setElapsedTime(timeElapsed);
        setTodayTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const handlePause = () => {
    setIsRunning(false);
    if (onTimeUpdate) {
      onTimeUpdate(taskId, elapsedTime);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setElapsedTime(0);
    if (onTimeUpdate) {
      onTimeUpdate(taskId, elapsedTime);
    }
  };

  const handleTimeUpdate = async (taskId, duration) => {
    try {
      const timeEntry = {
        duration,        // Time in seconds
        timestamp: new Date().toISOString(),
        userId: user.uid
      };
      await TaskService.addTimeEntry(projectId, taskId, timeEntry);
    } catch (error) {
      showToast('Failed to update time entry', 'error');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        gap: 2,
        bgcolor: theme => theme.palette.background.paper
      }}
    >
      <TimerIcon color="primary" />
      <Box>
        <Typography variant="body2" color="text.secondary">
          Time Tracked Today
        </Typography>
        <Typography variant="h6">
          {formatTime(todayTime)}
        </Typography>
      </Box>
      <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
        {!isRunning ? (
          <Tooltip title="Start Timer">
            <IconButton onClick={handleStart} color="primary">
              <PlayIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Tooltip title="Pause Timer">
              <IconButton onClick={handlePause} color="warning">
                <PauseIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Stop Timer">
              <IconButton onClick={handleStop} color="error">
                <StopIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
      {isRunning && (
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <CircularProgress 
            variant="determinate" 
            value={(elapsedTime % 60) * 1.67} 
            size={24}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {elapsedTime % 60}s
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default TaskTimer; 