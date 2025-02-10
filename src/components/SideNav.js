import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Tooltip,
  Divider,
  Typography,
  Badge
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  Assignment as TaskIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Assessment as ResourceIcon,
  Email as EmailIcon,
  Description as DraftsIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

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
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      roles: ['admin', 'project_manager', 'developer']
    },
    {
      title: 'Projects',
      path: '/projects',
      icon: <TaskIcon />,
      roles: ['admin', 'project_manager']
    },
    {
      title: 'My Tasks',
      path: '/my-tasks',
      icon: <TaskIcon />,
      roles: ['developer']
    },
    {
      title: 'Create Task',
      path: '/create-task',
      icon: <AddIcon />,
      roles: ['admin', 'project_manager']
    },
    {
      title: 'Resources',
      path: '/resources',
      icon: <ResourceIcon />,
      roles: ['admin', 'project_manager']
    },
    {
      title: 'Calendar',
      path: '/calendar',
      icon: <CalendarIcon />,
      roles: ['admin', 'project_manager', 'developer']
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />,
      roles: ['admin', 'project_manager', 'developer']
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <Box sx={{ 
      width: 240, 
      height: '100%',
      bgcolor: 'background.paper',
      borderRight: '1px solid',
      borderColor: 'divider',
      pt: 8
    }}>
      <List component="nav">
        {filteredMenuItems.map((item) => (
          <Tooltip 
            key={item.path} 
            title={item.title} 
            placement="right"
          >
            <ListItem
              button
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mb: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 40,
                color: location.pathname === item.path ? 'inherit' : 'text.secondary' 
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.title} />
            </ListItem>
          </Tooltip>
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
