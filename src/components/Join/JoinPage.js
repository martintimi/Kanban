import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { meetingService } from '../../services/meeting.service';

const JoinPage = () => {
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleJoin = async () => {
    if (!joinCode || !joinCode.includes(':')) {
      showToast('Please enter a valid join code (format: MEETINGID:TOKEN)', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      // Parse the join code
      const [meetingIdPart, tokenPart] = joinCode.split(':');
      
      // Try to find the full meeting ID using the partial ID
      const meeting = await meetingService.findMeetingByPartialId(meetingIdPart);
      
      if (!meeting) {
        showToast('Meeting not found. Please check your join code.', 'error');
        setIsLoading(false);
        return;
      }
      
      // Navigate to the meeting with the token
      const meetingLink = `/meetings/${meeting.id}?token=${tokenPart}`;
      navigate(meetingLink);
    } catch (error) {
      console.error('Error joining meeting:', error);
      showToast('Failed to join meeting. Please try again.', 'error');
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, bgcolor: '#1a1a1a', color: 'white' }}>
        <Typography variant="h4" gutterBottom align="center">
          Join Meeting
        </Typography>
        
        <Typography variant="body1" paragraph align="center">
          Enter the join code provided by the meeting host
        </Typography>
        
        <Box component="form" sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Join Code"
            variant="outlined"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g. ABC123:XYZ789"
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,0.2)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255,255,255,0.7)',
              }
            }}
          />
          
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={handleJoin}
            disabled={isLoading || !joinCode}
          >
            {isLoading ? 'Joining...' : 'Join Meeting'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default JoinPage; 