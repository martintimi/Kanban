import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  DialogActions,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format } from 'date-fns';

const TaskView = ({ open, onClose, task, assignee }) => {
  if (!task) return null;

  const getProgress = () => {
    if (!task.subtasks?.length) return 0;
    return Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{task.name}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            {task.description}
          </Typography>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Chip label={`Status: ${task.status}`} />
          <Chip label={`Priority: ${task.priority}`} />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Assigned To
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar src={assignee?.photoURL}>
              {assignee?.name?.charAt(0) || assignee?.email?.charAt(0)}
            </Avatar>
            <Typography>
              {assignee?.name || assignee?.email || 'Unassigned'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Due Date
          </Typography>
          <Typography display="flex" alignItems="center" gap={1}>
            <AccessTimeIcon fontSize="small" />
            {format(new Date(task.dueDate), 'MMMM d, yyyy')}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {getProgress()}% Complete
          </Typography>
        </Box>

        {task.subtasks?.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Subtasks
            </Typography>
            {task.subtasks.map((subtask, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Chip 
                  size="small"
                  label={subtask.completed ? 'Done' : 'Pending'}
                  color={subtask.completed ? 'success' : 'default'}
                />
                <Typography>{subtask.title}</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskView; 