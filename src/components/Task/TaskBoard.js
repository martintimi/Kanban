import React, { useState, useEffect } from 'react';
import { Grid, Box, Typography, Button, CircularProgress, Container, Paper } from '@mui/material';
import { DragDropContext } from '@hello-pangea/dnd';
import { useParams, useNavigate } from 'react-router-dom';
import DroppableColumn from './DroppableColumn';
import TaskDetails from './TaskDetails';
import CreateTaskModal from './CreateTaskModal';
import { TaskService } from '../../services/TaskService';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../EmptyState';
import { useAuth } from '../../context/AuthContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoadingSpinner from '../LoadingSpinner';

const TaskBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({
    'todo': { id: 'todo', title: 'To Do', taskIds: [] },
    'inProgress': { id: 'inProgress', title: 'In Progress', taskIds: [] },
    'review': { id: 'review', title: 'Review', taskIds: [] },
    'completed': { id: 'completed', title: 'Completed', taskIds: [] }
  });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentColumn, setCurrentColumn] = useState('todo');
  
  // Load project and tasks
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get project details and tasks
        await loadProjectDetails();
        await loadTasks();
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading board data:', error);
        setError('Failed to load the task board. Please try again.');
        setLoading(false);
      }
    };
    
    loadData();
  }, [projectId]);
  
  const loadProjectDetails = async () => {
    try {
      // Implementation would fetch project details from Firebase
      // For now, we'll just set a placeholder
      setProject({
        id: projectId,
        name: 'Project',
        description: 'Project description'
      });
    } catch (error) {
      console.error('Error loading project details:', error);
      throw error;
    }
  };
  
  const loadTasks = async () => {
    try {
      const tasksData = await TaskService.getTasks(projectId);
      setTasks(tasksData);
      
      // Organize tasks into columns
      const newColumns = { ...columns };
      
      // Reset task IDs
      Object.keys(newColumns).forEach(colId => {
        newColumns[colId].taskIds = [];
      });
      
      // Distribute tasks to columns based on status
      tasksData.forEach(task => {
        let columnId;
        switch (task.status) {
          case 'In Progress':
            columnId = 'inProgress';
            break;
          case 'Review':
            columnId = 'review';
            break;
          case 'Completed':
          case 'Done':
            columnId = 'completed';
            break;
          default:
            columnId = 'todo';
        }
        
        if (newColumns[columnId]) {
          newColumns[columnId].taskIds.push(task.id);
        }
      });
      
      setColumns(newColumns);
    } catch (error) {
      console.error('Error loading tasks:', error);
      throw error;
    }
  };
  
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // If no destination or dropped in the same place
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Find the task being moved
    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;
    
    // Update columns state
    const startColumn = columns[source.droppableId];
    const endColumn = columns[destination.droppableId];
    
    if (startColumn === endColumn) {
      // Reordering within the same column
      const newTaskIds = [...startColumn.taskIds];
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds
      };
      
      setColumns({
        ...columns,
        [newColumn.id]: newColumn
      });
    } else {
      // Moving from one column to another
      const startTaskIds = [...startColumn.taskIds];
      startTaskIds.splice(source.index, 1);
      
      const finishTaskIds = [...endColumn.taskIds];
      finishTaskIds.splice(destination.index, 0, draggableId);
      
      const newStartColumn = {
        ...startColumn,
        taskIds: startTaskIds
      };
      
      const newFinishColumn = {
        ...endColumn,
        taskIds: finishTaskIds
      };
      
      setColumns({
        ...columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn
      });
      
      // Update task status in the database
      let newStatus;
      switch (destination.droppableId) {
        case 'inProgress':
          newStatus = 'In Progress';
          break;
        case 'review':
          newStatus = 'Review';
          break;
        case 'completed':
          newStatus = 'Completed';
          break;
        default:
          newStatus = 'To Do';
      }
      
      try {
        await TaskService.updateTask(projectId, task.id, { 
          status: newStatus
        });
        
        // Update local task state
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === task.id ? { ...t, status: newStatus } : t
          )
        );
        
        showToast(`Task moved to ${newStatus}`, 'success');
      } catch (error) {
        console.error('Error updating task status:', error);
        showToast('Failed to update task status', 'error');
        
        // Revert the UI change on error
        setColumns({
          ...columns,
          [startColumn.id]: startColumn,
          [endColumn.id]: endColumn
        });
      }
    }
  };
  
  const handleAddTask = (columnId) => {
    setCurrentColumn(columnId);
    setSelectedTask(null);
    setCreateModalOpen(true);
  };
  
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setCreateModalOpen(true);
  };
  
  const handleDeleteTask = async (taskId) => {
    try {
      await TaskService.deleteTask(projectId, taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Update columns
      const newColumns = { ...columns };
      Object.keys(newColumns).forEach(colId => {
        newColumns[colId].taskIds = newColumns[colId].taskIds.filter(id => id !== taskId);
      });
      
      setColumns(newColumns);
      
      showToast('Task deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      showToast('Failed to delete task', 'error');
    }
  };
  
  const handleCreateTask = async (taskData) => {
    try {
      // Determine status based on current column
      let status;
      switch (currentColumn) {
        case 'inProgress':
          status = 'In Progress';
          break;
        case 'review':
          status = 'Review';
          break;
        case 'completed':
          status = 'Completed';
          break;
        default:
          status = 'To Do';
      }
      
      const newTaskData = {
        ...taskData,
        status,
        createdBy: currentUser.uid,
      };
      
      const createdTask = await TaskService.createTask(projectId, newTaskData);
      
      // Update local state
      setTasks(prevTasks => [createdTask, ...prevTasks]);
      
      // Update columns
      setColumns(prevColumns => ({
        ...prevColumns,
        [currentColumn]: {
          ...prevColumns[currentColumn],
          taskIds: [createdTask.id, ...prevColumns[currentColumn].taskIds]
        }
      }));
      
      setCreateModalOpen(false);
      showToast('Task created successfully', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showToast('Failed to create task', 'error');
    }
  };
  
  const handleUpdateTask = async (taskData) => {
    try {
      const updatedTask = await TaskService.updateTask(projectId, selectedTask.id, taskData);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === selectedTask.id ? { ...task, ...updatedTask } : task
        )
      );
      
      // If status changed, update columns
      if (selectedTask.status !== taskData.status) {
        // Find current column
        let currentColumnId = Object.keys(columns).find(colId => 
          columns[colId].taskIds.includes(selectedTask.id)
        );
        
        // Find new column
        let newColumnId;
        switch (taskData.status) {
          case 'In Progress':
            newColumnId = 'inProgress';
            break;
          case 'Review':
            newColumnId = 'review';
            break;
          case 'Completed':
          case 'Done':
            newColumnId = 'completed';
            break;
          default:
            newColumnId = 'todo';
        }
        
        if (currentColumnId && newColumnId && currentColumnId !== newColumnId) {
          setColumns(prevColumns => {
            const newColumns = { ...prevColumns };
            
            // Remove from current column
            newColumns[currentColumnId].taskIds = 
              newColumns[currentColumnId].taskIds.filter(id => id !== selectedTask.id);
            
            // Add to new column
            newColumns[newColumnId].taskIds = 
              [selectedTask.id, ...newColumns[newColumnId].taskIds];
            
            return newColumns;
          });
        }
      }
      
      setCreateModalOpen(false);
      showToast('Task updated successfully', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      showToast('Failed to update task', 'error');
    }
  };
  
  const handleOpenDetails = (task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };
  
  const handleSubmit = async (taskData) => {
    if (selectedTask) {
      await handleUpdateTask(taskData);
    } else {
      await handleCreateTask(taskData);
    }
  };
  
  // Render loading state
  if (loading) {
    return <LoadingSpinner message="Loading task board..." />;
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon />}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  // Render empty state if no tasks
  if (tasks.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <EmptyState
          title="No tasks yet"
          description="Create your first task to get started"
          actionText="Create Task"
          onAction={() => handleAddTask('todo')}
          illustration="tasks"
        />
      </Container>
    );
  }
  
  // Render task board
  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      {project && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {project.name}
          </Typography>
          {project.description && (
            <Typography variant="body2" color="text.secondary">
              {project.description}
            </Typography>
          )}
        </Paper>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
          {Object.values(columns).map(column => {
            const columnTasks = column.taskIds
              .map(taskId => tasks.find(task => task.id === taskId))
              .filter(Boolean);
              
            return (
              <Grid item xs={12} sm={6} md={3} key={column.id} sx={{ height: '100%' }}>
                <DroppableColumn
                  columnId={column.id}
                  columnName={column.title}
                  tasks={columnTasks}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onOpenTaskDetails={handleOpenDetails}
                />
              </Grid>
            );
          })}
        </Grid>
      </DragDropContext>
      
      {/* Create/Edit Task Modal */}
      <CreateTaskModal
        open={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedTask}
        isEdit={!!selectedTask}
      />
      
      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetails
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          task={selectedTask}
          projectId={projectId}
          onEdit={() => {
            setDetailsOpen(false);
            setCreateModalOpen(true);
          }}
          onDelete={(taskId) => {
            handleDeleteTask(taskId);
            setDetailsOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default TaskBoard; 