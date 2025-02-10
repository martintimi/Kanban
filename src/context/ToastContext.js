import React, { createContext, useContext, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import CustomToast from '../components/Toast/CustomToast';
import { SoundManager } from '../utils/soundManager';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const theme = useTheme();

  const showToast = (message, severity = 'info') => {
    const id = Date.now();
    setToasts(prev => [{ id, message, severity }, ...prev]);
    
    // Play different sounds for different severities
    switch (severity) {
      case 'success':
        SoundManager.playNotification('DING');
        break;
      case 'error':
        SoundManager.playNotification('BELL');
        break;
      default:
        SoundManager.playNotification('NOTIFICATION_1');
    }

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const closeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          maxWidth: '90vw'
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <CustomToast
              key={toast.id}
              message={toast.message}
              severity={toast.severity}
              onClose={() => closeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </Box>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 