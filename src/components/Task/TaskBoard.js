import React, { useState, useEffect } from 'react';
import { Box, Grid } from '@mui/material';
import TaskColumn from './TaskColumn';
import TaskForm from './TaskForm';
import { useParams } from 'react-router-dom';
import { ProjectService } from '../../services/project.service';
import { useToast } from '../../context/ToastContext';
import CustomLoader from '../CustomLoader'; // Import the custom loader

const TaskBoard = () => {
  // Existing code...

  if (loading) {
    return <CustomLoader message="Preparing your task board..." />;
  }

  // Rest of component...
};

export default TaskBoard; 