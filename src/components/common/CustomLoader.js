import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const CustomLoader = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        width: '100%',
        gap: 2,
        p: 4
      }}
    >
      <CircularProgress size={40} thickness={4} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default CustomLoader; 