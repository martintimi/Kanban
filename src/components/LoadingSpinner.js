import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTheme } from '@mui/material/styles';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { transform: scale(0.8); opacity: 0.3; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.3; }
`;

const floatUp = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
`;

const LoadingSpinner = ({ message = 'Loading...' }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        width: '100%',
        padding: 4
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 3
        }}
      >
        {/* Main spinner circle */}
        <Box 
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTop: `3px solid ${theme.palette.primary.main}`,
            borderRight: `3px solid ${theme.palette.secondary.main}`,
            animation: `${spin} 1s linear infinite`,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '5px',
              left: '5px',
              right: '5px',
              bottom: '5px',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderBottom: `3px solid ${theme.palette.error.main}`,
              borderLeft: `3px solid ${theme.palette.success.main}`,
              animation: `${spin} 1.5s linear infinite reverse`
            }
          }}
        />
        
        {/* Floating dots */}
        <Box sx={{ position: 'absolute', display: 'flex', gap: 1 }}>
          {[theme.palette.primary.main, theme.palette.secondary.main, theme.palette.error.main].map((color, index) => (
            <Box 
              key={index}
              sx={{
                width: 10,
                height: 10,
                backgroundColor: color,
                borderRadius: '50%',
                animation: `${floatUp} 1.5s ease-in-out infinite`,
                animationDelay: `${index * 0.2}s`
              }}
            />
          ))}
        </Box>
      </Box>
      
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{
          animation: `${pulse} 1.5s ease-in-out infinite`,
          mt: 2,
          fontWeight: 'medium'
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner; 