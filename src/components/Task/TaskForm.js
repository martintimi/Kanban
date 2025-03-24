import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { keyframes } from '@mui/system';
import CustomLoader from '../CustomLoader';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const TaskForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    // Handle form submission
    setLoading(false);
  };

  return (
    <LoadingButton
      loading={loading}
      loadingIndicator={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: 'white',
              animation: `${spin} 1s linear infinite`
            }}
          />
          <Box sx={{ ml: 1, color: 'white' }}>Loading...</Box>
        </Box>
      }
      onClick={handleSubmit}
      variant="contained"
    >
      Create Task
    </LoadingButton>
  );
};

export default TaskForm; 