import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useProjects } from '../../context/ProjectContext';
import { useToast } from '../../context/ToastContext';

const ProjectCalendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: new Date(),
    endDate: new Date(),
    type: 'meeting'
  });

  const { projects } = useProjects();
  const { showToast } = useToast();

  useEffect(() => {
    // Collect all project deadlines and milestones
    const projectEvents = projects.reduce((acc, project) => {
      // Add project deadlines
      if (project.deadline) {
        acc.push({
          title: `${project.name} Deadline`,
          date: new Date(project.deadline),
          type: 'deadline',
          projectId: project.id
        });
      }

      // Add task deadlines
      project.tasks?.forEach(task => {
        if (task.dueDate) {
          acc.push({
            title: `Task: ${task.name}`,
            date: new Date(task.dueDate),
            type: 'task',
            projectId: project.id,
            taskId: task.id
          });
        }
      });

      return acc;
    }, []);

    setEvents(projectEvents);
  }, [projects]);

  const handleAddEvent = async () => {
    try {
      // Add validation
      if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) {
        showToast('Please fill in all fields', 'error');
        return;
      }

      // Add the event to your events list
      setEvents(prev => [...prev, {
        ...newEvent,
        date: newEvent.startDate,
        type: 'meeting'
      }]);

      // Close dialog and reset form
      setDialogOpen(false);
      setNewEvent({
        title: '',
        startDate: new Date(),
        endDate: new Date(),
        type: 'meeting'
      });

      showToast('Event added successfully', 'success');
    } catch (error) {
      console.error('Error adding event:', error);
      showToast('Failed to add event', 'error');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Project Timeline
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => setDialogOpen(true)}
          >
            Add Event
          </Button>
        </Box>

        <Paper sx={{ p: 2 }}>
          <Timeline>
            {events.map((event, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color={
                    event.type === 'deadline' ? 'error' :
                    event.type === 'task' ? 'primary' :
                    'grey'
                  } />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6">
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.date.toLocaleDateString()}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Add Event</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              sx={{ mb: 2, mt: 2 }}
            />
            <DateTimePicker
              label="Start Date"
              value={newEvent.startDate}
              onChange={(date) => setNewEvent({ ...newEvent, startDate: date })}
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} />}
            />
            <DateTimePicker
              label="End Date"
              value={newEvent.endDate}
              onChange={(date) => setNewEvent({ ...newEvent, endDate: date })}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAddEvent}>
              Add Event
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default ProjectCalendar; 