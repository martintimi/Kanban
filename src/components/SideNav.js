import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaStar, FaEnvelope, FaDraftingCompass } from 'react-icons/fa';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import { Typography } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode } = useTheme();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <FaTachometerAlt size={20} />, path: '/dashboard' },
    { text: 'Projects', icon: <FaStar size={20} />, path: '/projects' },
    { text: 'Send email', icon: <FaEnvelope size={20} />, path: '/email' },
    { text: 'Drafts', icon: <FaDraftingCompass size={20} />, path: '/drafts' },
  ];

  const DrawerList = (
    <Box sx={{ 
      width: 250,
      height: '100%',
      backgroundColor: darkMode ? '#1e1e1e' : 'white',
      color: darkMode ? '#fff' : '#555555',
    }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 'bold', 
          fontSize: '1.2rem', 
          padding: 2,
          color: 'inherit'
        }}
      >
        Personal Kanban
      </Typography>
      
      <Divider sx={{ 
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
      }} />
      
      <List>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  py: 1.5,
                  color: isActive ? '#007BFF' : 'inherit',
                  backgroundColor: isActive 
                    ? (darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)')
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? 'rgba(255, 255, 255, 0.08)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Box sx={{ 
                    color: isActive ? '#007BFF' : 'inherit',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {item.icon}
                  </Box>
                  <Typography sx={{ 
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 400
                  }}>
                    {item.text}
                  </Typography>
                </Box>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 250,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 250,
          boxSizing: 'border-box',
          backgroundColor: darkMode ? '#1e1e1e' : 'white',
          borderRight: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        },
      }}
    >
      {DrawerList}
    </Drawer>
  );
};

export default SideNav;
