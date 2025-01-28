import React, { useState, useEffect } from 'react';
import { UserService } from '../services/user.service';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Grid,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import EmptyState from './EmptyState'; // We'll create this next

const MyTasks = () => {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadMyTasks = async () => {
      if (user?.uid) {
        const tasks = await UserService.getUserTasks(user.uid);
        setMyTasks(tasks);
        setLoading(false);
      }
    };
    loadMyTasks();
  }, [user]);

  const filteredTasks = myTasks
    .filter(task => {
      if (filter === 'all') return true;
      return task.status === filter;
    })
    .filter(task => 
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          return b.priority.localeCompare(a.priority);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  if (loading) return <LinearProgress />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Tasks
        </Typography>
        <Typography color="text.secondary">
          Manage and track your assigned tasks
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          select
          size="small"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ minWidth: 120 }}
          InputProps={{
            startAdornment: <FilterListIcon sx={{ mr: 1 }} />
          }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="To Do">To Do</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Done">Done</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 120 }}
          InputProps={{
            startAdornment: <SortIcon sx={{ mr: 1 }} />
          }}
        >
          <MenuItem value="dueDate">Due Date</MenuItem>
          <MenuItem value="priority">Priority</MenuItem>
          <MenuItem value="status">Status</MenuItem>
        </TextField>
      </Box>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <EmptyState 
          icon={<AssignmentLateIcon sx={{ fontSize: 60 }} />}
          title="No tasks found"
          description={
            searchTerm 
              ? "No tasks match your search criteria" 
              : "You don't have any tasks assigned yet"
          }
          action={
            <Button 
              variant="contained" 
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map(task => (
            <Grid item xs={12} md={6} lg={4} key={task.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {task.name}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Project: {task.projectName}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={task.status} 
                      color={
                        task.status === 'Done' ? 'success' :
                        task.status === 'In Progress' ? 'warning' : 
                        'default'
                      }
                      size="small"
                    />
                    <Chip
                      label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                      size="small"
                      color={
                        new Date(task.dueDate) < new Date() ? 'error' : 'default'
                      }
                    />
                    <Chip
                      label={task.priority}
                      size="small"
                      color={
                        task.priority === 'high' ? 'error' :
                        task.priority === 'medium' ? 'warning' :
                        'default'
                      }
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {task.description}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MyTasks; 