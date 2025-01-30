import React, { useState } from 'react';
import {
  Box,
  Typography,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { ProjectService } from './project.service';

const ProjectMilestones = ({ projectId, milestones, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    dueDate: ''
  });

  const handleAddMilestone = async () => {
    try {
      await ProjectService.addMilestone(projectId, newMilestone);
      onUpdate();
      setOpen(false);
      setNewMilestone({ title: '', description: '', dueDate: '' });
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Project Milestones</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Milestone
        </Button>
      </Box>

      <Timeline>
        {milestones.map((milestone) => (
          <TimelineItem key={milestone.id}>
            <TimelineSeparator>
              <TimelineDot color={milestone.status === 'completed' ? 'success' : 'grey'} />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">{milestone.title}</Typography>
              <Typography>{milestone.description}</Typography>
              <Typography variant="caption" color="text.secondary">
                Due: {new Date(milestone.dueDate).toLocaleDateString()}
              </Typography>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Milestone</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              value={newMilestone.dueDate}
              onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddMilestone} variant="contained">
            Add Milestone
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectMilestones; 