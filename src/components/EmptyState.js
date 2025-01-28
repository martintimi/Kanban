import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyState = ({ icon, title, description, action }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        textAlign: 'center'
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 2 }}>
        {icon}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {description}
      </Typography>
      {action}
    </Box>
  );
};

export default EmptyState; 