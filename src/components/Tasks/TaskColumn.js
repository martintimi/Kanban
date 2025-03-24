import React from 'react';
import {
  Paper,
  Typography,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TaskCard from './TaskCard';

const TaskColumn = ({ 
  title, 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  onMoveTask 
}) => {
  return (
    <Paper 
      sx={{ 
        p: 2, 
        minHeight: 500,
        bgcolor: 'background.default',
        borderRadius: 2
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
          <Chip 
            label={tasks.length} 
            size="small" 
            sx={{ ml: 1 }}
          />
        </Box>
        <IconButton onClick={onAddTask} size="small">
          <AddIcon />
        </IconButton>
      </Box>

      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task.id)}
          onMove={onMoveTask}
        />
      ))}
    </Paper>
  );
};

export default TaskColumn; 