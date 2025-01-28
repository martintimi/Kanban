import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Typography,
  Badge
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuth } from '../context/AuthContext';
import AddTaskIcon from '@mui/icons-material/AddTask';
import TimelineIcon from '@mui/icons-material/Timeline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import { FaTachometerAlt, FaStar, FaEnvelope, FaDraftingCompass } from 'react-icons/fa';

const SideNav = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { text: 'Dashboard', icon: <FaTachometerAlt size={20} />, path: '/dashboard' },
    { text: 'Projects', icon: <FaStar size={20} />, path: '/projects' },
    
    // Developer Items
    ...(user?.role === 'developer' ? [
      { text: 'My Tasks', icon: <FormatListBulletedIcon />, path: '/my-tasks' },
      { text: 'Create Task', icon: <AddTaskIcon />, path: '/create-task' },
      { text: 'My Progress', icon: <TimelineIcon />, path: '/my-progress' },
    ] : []),

    // Admin/PM Items
    ...(user?.role === 'admin' || user?.role === 'project_manager' ? [
      { text: 'Team', icon: <PeopleIcon />, path: '/team' },
      { text: 'Analytics', icon: <BarChartIcon />, path: '/analytics' },
    ] : []),

    // Common Items
    { text: 'Send email', icon: <FaEnvelope size={20} />, path: '/email' },
    { text: 'Drafts', icon: <FaDraftingCompass size={20} />, path: '/drafts' },
  ];

  return (
    <Box sx={{ 
      width: 240, 
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      pt: 8
    }}>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text}
            button 
            onClick={() => handleNavigation(item.path)}
            selected={isActive(item.path)}
            sx={{
              color: theme => theme.palette.text.primary,
              '&.Mui-selected': {
                backgroundColor: theme => 
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  backgroundColor: theme => 
                    theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.12)',
                }
              },
              '&:hover': {
                backgroundColor: theme => 
                  theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.04)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: theme => isActive(item.path) 
                ? theme.palette.primary.main 
                : theme.palette.text.primary 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>

      {/* Role Badge */}
      <Box sx={{ p: 2, mt: 2 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            px: 1, 
            py: 0.5, 
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'white',
            textTransform: 'capitalize'
          }}
        >
          {user?.role || 'Guest'}
        </Typography>
      </Box>
    </Box>
  );
};

export default SideNav;
