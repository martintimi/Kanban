import React from 'react';
import { Box } from '@mui/material';
import CreateTaskModal from './CreateTaskModal';

const CreateTask = () => {
  return (
    <Box sx={{ p: 3 }}>
      <CreateTaskModal />
    </Box>
  );
};

export default CreateTask; 