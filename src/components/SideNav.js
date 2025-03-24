import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Button, 
  Skeleton,
  IconButton,
  useMediaQuery,
  Divider,
  ListItemButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SideNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrg, organizations, loading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Effect to close drawer when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleDrawer = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Projects', icon: <FolderIcon />, path: '/projects' },
    { text: 'Team', icon: <PeopleIcon />, path: '/team' },
    { text: 'Calendar', icon: <CalendarTodayIcon />, path: '/calendar' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Don't render create organization prompt during loading
  const renderContent = () => {
    if (orgLoading) {
      // Show skeleton loading state instead of flash content
      return (
        <Box sx={{ p: 2 }}>
          <Skeleton variant="rectangular" width="100%" height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={120} />
        </Box>
      );
    }

    // If user has no organizations, show create org prompt
    if ((!organizations || organizations.length === 0) && user) {
      return (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Create an organization to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<BusinessIcon />}
            onClick={() => navigate('/organization-management')}
            sx={{ mt: 1 }}
          >
            CREATE ORGANIZATION
          </Button>
        </Box>
      );
    }

    // Otherwise don't show anything extra
    return null;
  };

  // Mobile toggle button that sits at the top of the page
  const mobileToggle = (
    <IconButton
      color="inherit"
      aria-label="open drawer"
      edge="start"
      onClick={toggleDrawer}
      sx={{
        position: 'fixed',
        top: 12,
        left: mobileOpen ? 250 : 16,
        zIndex: 1300,
        bgcolor: 'background.paper',
        boxShadow: 2,
        borderRadius: '50%',
        transition: 'left 0.3s',
        display: { xs: 'flex', md: 'none' }
      }}
    >
      {mobileOpen ? <CloseIcon /> : <MenuIcon />}
    </IconButton>
  );

  const drawerWidth = 240;

  const drawerContent = (
    <Box sx={{ overflow: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List sx={{ pt: 8 }}>
        {menuItems.map((item) => (
          <ListItemButton
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              mb: 1,
              borderRadius: 1,
              '&.Mui-selected': {
                bgcolor: 'rgba(63, 81, 181, 0.12)',
                '&:hover': {
                  bgcolor: 'rgba(63, 81, 181, 0.18)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  bgcolor: '#3f51b5',
                  borderRadius: '0 4px 4px 0',
                }
              },
              '&:hover': {
                bgcolor: 'rgba(63, 81, 181, 0.08)',
              }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? '#3f51b5' : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontWeight: location.pathname === item.path ? 'bold' : 'regular' 
              }} 
            />
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ mt: 'auto', borderTop: 1, borderColor: 'divider', p: 2 }}>
        {selectedOrg && (
          <Box>
            <Typography variant="subtitle2">Organization</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {selectedOrg.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.role || 'Member'}
            </Typography>
          </Box>
        )}
        {renderContent()}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile toggle button */}
      {mobileToggle}

      {/* Mobile drawer (temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={toggleDrawer}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
            pt: 0,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop drawer (permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
            height: '100%',
            top: '64px',
            pt: 0,
          },
          display: { xs: 'none', md: 'block' },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default SideNav;
