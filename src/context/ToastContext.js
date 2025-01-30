import React, { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success',
    duration: 5000
  });

  const showToast = (message, severity = 'success', duration = 5000) => {
    setToast({
      open: true,
      message,
      severity,
      duration
    });
  };

  const hideToast = () => {
    setToast(prev => ({
      ...prev,
      open: false
    }));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        open={toast.open}
        handleClose={hideToast}
        message={toast.message}
        severity={toast.severity}
        duration={toast.duration}
      />
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