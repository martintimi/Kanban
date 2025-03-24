import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Paper, Typography, Box, Badge, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TaskItem from './TaskItem';

/**
 * A column that can have tasks dropped into it
 */
const DroppableColumn = ({
  columnId,
  columnName,
  tasks = [],
  onAddTask,
  onEditTask,
  onDeleteTask,
  onOpenTaskDetails
}) => {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => 
          theme.palette.mode === 'dark' 
            ? theme.palette.background.paper 
            : '#f5f5f5'
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Badge 
          badgeContent={tasks.length} 
          color="primary"
          sx={{ '& .MuiBadge-badge': { fontSize: '0.8rem' } }}
        >
          <Typography variant="h6" fontWeight="500" sx={{ ml: 1 }}>
            {columnName}
          </Typography>
        </Badge>
        
        <Tooltip title={`Add task to ${columnName}`}>
          <IconButton
            onClick={() => onAddTask(columnId)}
            size="small"
            color="primary"
            sx={{ 
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              flexGrow: 1,
              minHeight: '100px',
              transition: 'background-color 0.2s ease',
              backgroundColor: snapshot.isDraggingOver 
                ? 'action.hover' 
                : 'transparent',
              borderRadius: 1,
              p: 1,
              overflowY: 'auto'
            }}
          >
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onEdit={() => onEditTask(task)}
                onDelete={onDeleteTask}
                onOpenDetails={() => onOpenTaskDetails(task)}
              />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
};

export default DroppableColumn; 