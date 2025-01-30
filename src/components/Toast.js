import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';

const Toast = ({ open, handleClose, message, severity = 'success', duration = 5000 }) => {
  const getIcon = () => {
    switch (severity) {
      case 'success':
        return <CheckCircleIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      case 'warning':
        return <WarningIcon fontSize="small" />;
      case 'info':
        return <InfoIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getColors = () => {
    switch (severity) {
      case 'success':
        return { border: '#10B981', icon: '#10B981' };
      case 'error':
        return { border: '#EF4444', icon: '#EF4444' };
      case 'warning':
        return { border: '#F59E0B', icon: '#F59E0B' };
      case 'info':
        return { border: '#3B82F6', icon: '#3B82F6' };
      default:
        return { border: '#3B82F6', icon: '#3B82F6' };
    }
  };

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, handleClose]);

  const colors = getColors();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, y: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              minWidth: 300,
              maxWidth: 400,
              bgcolor: 'background.paper',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 2,
              border: '1px solid',
              borderColor: colors.border,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 2,
                background: `linear-gradient(145deg, ${colors.border}15, ${colors.border}05)`,
                zIndex: -1,
              }
            }}
          >
            <Box 
              sx={{ 
                color: colors.icon,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {getIcon()}
            </Box>
            <Typography 
              sx={{ 
                flex: 1,
                color: 'text.primary',
                fontSize: '0.95rem',
                fontWeight: 500,
                ml: 1
              }}
            >
              {message}
            </Typography>
            <IconButton 
              size="small" 
              onClick={handleClose}
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast; 