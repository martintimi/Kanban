import React from 'react';
import { Alert, Box, Typography, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { useTheme } from '@mui/material/styles';

const toastIcons = {
  success: <CheckCircleIcon sx={{ fontSize: 28 }} />,
  error: <ErrorIcon sx={{ fontSize: 28 }} />,
  info: <InfoIcon sx={{ fontSize: 28 }} />,
  warning: <WarningIcon sx={{ fontSize: 28 }} />
};

const CustomToast = ({ message, severity, onClose }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      layout
    >
      <Alert
        severity={severity}
        icon={toastIcons[severity]}
        sx={{
          width: '100%',
          minWidth: '400px',
          boxShadow: theme.shadows[3],
          borderRadius: 1,
          padding: 2,
          marginBottom: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          '& .MuiAlert-icon': {
            padding: 1,
            fontSize: '2rem',
            color: theme.palette[severity].main
          },
          '& .MuiAlert-message': {
            color: theme.palette.text.primary
          }
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box sx={{ ml: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Typography>
          <Typography variant="body2">
            {message}
          </Typography>
        </Box>
      </Alert>
    </motion.div>
  );
};

export default CustomToast; 