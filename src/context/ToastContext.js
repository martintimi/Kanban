import React, { createContext, useContext, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import CustomToast from '../components/Toast/CustomToast';
import { SoundManager } from '../utils/soundManager';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const theme = useTheme();

  const showToast = (message, severity = 'info', duration = 5000) => {
    const id = uuidv4();
    
    // Add new toast to the array
    setToasts(prevToasts => [...prevToasts, { id, message, severity }]);
    
    // Remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxWidth: '100%',
          width: 'auto',
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                layout: { type: 'spring', stiffness: 500, damping: 30 }
              }}
            >
              <CustomToast
                message={toast.message}
                severity={toast.severity}
                onClose={() => removeToast(toast.id)}
              />
            </motion.div>
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