import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack
} from '@mui/material';
import {
  VideoCall as VideoCallIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { meetingService } from '../../services/meeting.service';
import { useNavigate } from 'react-router-dom';

const MeetingManager = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState([]);
  const [open, setOpen] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Subscribe to meetings collection
    const unsubscribe = meetingService.onMeetingsChange((updatedMeetings) => {
      setMeetings(updatedMeetings);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateMeeting = async () => {
    if (!meetingTitle.trim()) {
      showToast('Please enter a meeting title', 'error');
      return;
    }

    try {
      setIsCreating(true);
      const meeting = await meetingService.createMeeting({
        title: meetingTitle.trim()
      });

      // Generate meeting link
      const meetingLink = `${window.location.origin}/meetings/${meeting.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(meetingLink);
      
      showToast('Meeting created! Link copied to clipboard', 'success');
      setOpen(false);
      
      // Open meeting in new tab
      window.open(`/meetings/${meeting.id}`, '_blank');
    } catch (error) {
      console.error('Error creating meeting:', error);
      showToast('Failed to create meeting', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (meetingId) => {
    console.log(`Joining meeting: ${meetingId} as host`);
    // Open the meeting in a new tab, indicating this user is the host
    window.open(`/meetings/${meetingId}?ishost=true`, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Meetings
        </Typography>
        <Button
          variant="contained"
          startIcon={<VideoCallIcon />}
          onClick={() => setOpen(true)}
        >
          New Meeting
        </Button>
      </Stack>

      <Paper elevation={3} sx={{ p: 2 }}>
        {meetings.length > 0 ? (
          <Stack spacing={2}>
            {meetings.map((meeting) => (
              <Paper 
                key={meeting.id} 
                elevation={1} 
                sx={{ p: 2 }}
              >
                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center"
                >
                  <Typography variant="h6">
                    {meeting.title}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<VideoCallIcon />}
                    onClick={() => handleJoinMeeting(meeting.id)}
                  >
                    Join
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <VideoCallIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Active Meetings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a new meeting to collaborate with your team
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog open={open} onClose={() => !isCreating && setOpen(false)}>
        <DialogTitle>Create New Meeting</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Meeting Title"
            fullWidth
            variant="outlined"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            disabled={isCreating}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateMeeting}
            variant="contained"
            disabled={!meetingTitle.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create & Copy Link'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MeetingManager; 