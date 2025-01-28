import React from 'react';
import { Box, IconButton, Typography, Menu, MenuItem, ListItemIcon, AppBar, Toolbar } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const navigate = useNavigate();

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    handleClose();
  };

  const getAvatarContent = () => {
    if (user?.photoURL) {
      return <Avatar src={user.photoURL} alt={user.name || user.email} />;
    }
    return (
      <Avatar sx={{ 
        bgcolor: darkMode ? 'primary.dark' : 'primary.main',
        color: 'white',
      }}>
        {user?.email?.charAt(0).toUpperCase()}
      </Avatar>
    );
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: 1300,
        left: '240px', // Match sidebar width exactly
        width: 'calc(100% - 240px)', // Match sidebar width exactly
        bgcolor: darkMode ? '#1e1e1e' : '#fff',
        color: darkMode ? '#fff' : '#555',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        height: '64px', // Fixed height
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'flex-end', 
        gap: 2,
        minHeight: '64px !important', // Override default Toolbar height
        padding: '0 20px', // Consistent padding
      }}>
        <IconButton 
          onClick={toggleTheme} 
          sx={{ 
            color: 'inherit',
          }}
        >
          {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
        </IconButton>

        <IconButton 
          onClick={handleAvatarClick}
          sx={{
            p: 0.5,
            '&:hover': {
              transform: 'scale(1.1)',
            },
            transition: 'transform 0.2s',
          }}
        >
          {getAvatarContent()}
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1.5,
              bgcolor: darkMode ? '#1e1e1e' : '#fff',
              color: darkMode ? '#fff' : '#555',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }
          }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default TopNav; 