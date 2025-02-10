import React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VerifiedIcon from '@mui/icons-material/Verified';

const TaskStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'To Do':
        return {
          color: 'default',
          icon: <PendingIcon />,
          label: 'To Do'
        };
      case 'In Progress':
        return {
          color: 'primary',
          icon: <PlayArrowIcon />,
          label: 'In Progress'
        };
      case 'Done':
        return {
          color: 'success',
          icon: <CheckCircleIcon />,
          label: 'Done'
        };
      case 'Verified':
        return {
          color: 'success',
          icon: <VerifiedIcon />,
          label: 'Verified'
        };
      default:
        return {
          color: 'default',
          icon: <PendingIcon />,
          label: status
        };
    }
  };

  const { color, icon, label } = getStatusConfig();

  return (
    <Chip
      icon={icon}
      label={label}
      color={color}
      size="small"
      sx={{
        '& .MuiChip-icon': {
          fontSize: '1rem'
        }
      }}
    />
  );
};

export default TaskStatus; 