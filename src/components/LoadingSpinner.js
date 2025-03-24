import React from 'react';
import { Box } from '@mui/material';
import CustomLoader from './CustomLoader';

const LoadingSpinner = ({ message = "Setting up your workspace..." }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      width: '100%',
      bgcolor: 'background.default'
    }}>
      <CustomLoader message={message} />
    </Box>
  );
};

export default LoadingSpinner; 