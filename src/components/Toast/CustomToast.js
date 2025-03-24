import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  useTheme
} from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

// Define toast icons with custom styling
const toastIcons = {
  success: <CheckCircleIcon fontSize="small" />,
  error: <ErrorIcon fontSize="small" />,
  info: <InfoIcon fontSize="small" />,
  warning: <WarningIcon fontSize="small" />
};

// Define severity colors - more vibrant
const severityColors = {
  success: '#22c55e', // bright green
  error: '#ef4444',   // bright red
  info: '#1976d2',    // bright blue (replaced from pink)
  warning: '#f59e0b'  // bright yellow/orange
};

const CustomToast = ({ message, severity = 'info', onClose }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Get the appropriate color from our palette based on severity
  const color = severityColors[severity] || severityColors.info;
  
  // Create a glass-like effect
  const glassBg = isDarkMode 
    ? 'rgba(15, 23, 42, 0.8)' 
    : 'rgba(255, 255, 255, 0.95)';
    
  const glassBorder = isDarkMode
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.8)';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 40
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          maxWidth: '350px',
          overflow: 'hidden',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${glassBorder}`,
          background: glassBg,
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 9999
        }}
      >
        {/* Left color bar */}
        <Box
          sx={{
            width: '6px',
            background: color,
            flexShrink: 0
          }}
        />
        
        {/* Icon circle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            pl: 2
          }}
        >
          <Box
            sx={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              border: `1px solid ${color}40`
            }}
          >
            {toastIcons[severity]}
          </Box>
        </Box>
        
        {/* Content */}
        <Box
          sx={{
            p: 2,
            pl: 1,
            flexGrow: 1,
            pr: 0.5
          }}
        >
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              color: isDarkMode ? 'white' : 'text.primary'
            }}
          >
            {message}
          </Typography>
        </Box>
        
        {/* Close button */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 1.5 }}>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)'
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Animated progress bar */}
        <Box
          component={motion.div}
          initial={{ width: '100%' }}
          animate={{ width: 0 }}
          transition={{ duration: 5, ease: 'linear' }}
          sx={{
            height: '3px',
            backgroundColor: color,
            position: 'absolute',
            bottom: 0,
            left: 0
          }}
        />
      </Box>
    </motion.div>
  );
};

export default CustomToast; 