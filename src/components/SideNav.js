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
  ListItemButton,
  Collapse
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
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TimelineIcon from '@mui/icons-material/Timeline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SideNav = ({ open, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedOrg, organizations, loading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  // Effect to close drawer when navigating on mobile
  useEffect(() => {
    if (isMobile && open) {
      handleDrawerToggle();
    }
  }, [location.pathname, isMobile]);

  const handleAdminMenuToggle = () => {
    setAdminMenuOpen(!adminMenuOpen);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isProjectManager = user?.role === 'project_manager';

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Projects', icon: <FolderIcon />, path: '/projects' },
    { text: 'My Tasks', icon: <AssignmentIcon />, path: '/my-tasks' },
    { text: 'Team', icon: <PeopleIcon />, path: '/team' },
    { text: 'Calendar', icon: <CalendarTodayIcon />, path: '/calendar' },
    { text: 'Organizations', icon: <BusinessIcon />, path: '/organizations' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const adminMenuItems = [
    { text: 'Team Performance', icon: <AssessmentIcon />, path: '/admin/team-performance' },
    { text: 'Resource Management', icon: <TimelineIcon />, path: '/admin/resource-management' },
    { text: 'Project History', icon: <AssignmentIcon />, path: '/admin/project-history' },
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
            onClick={() => navigate('/organizations')}
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

  const drawerContent = (
    <Box sx={{ width: 240, height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        p: 2,
        borderBottom: 1, 
        borderColor: 'divider'
      }}>
        <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 1 }} />
          KanbanTool
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      {renderContent()}
      
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderLeft: location.pathname === item.path ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
              pl: 2
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
        
        {/* Admin Menu - only shown to admins and project managers */}
        {(isAdmin || isProjectManager) && (
          <>
            <Divider sx={{ my: 2 }} />
            <ListItemButton 
              onClick={handleAdminMenuToggle}
              sx={{
                py: 1.5,
                px: 2,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                }
              }}
            >
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Admin Tools" 
                primaryTypographyProps={{
                  fontWeight: 'medium'
                }}
              />
              {adminMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={adminMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {adminMenuItems.map((item) => (
                  <ListItemButton
                    key={item.text}
                    onClick={() => navigate(item.path)}
                    selected={location.pathname === item.path}
                    sx={{
                      pl: 4,
                      py: 1.5,
                      borderLeft: location.pathname === item.path ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      primaryTypographyProps={{
                        fontSize: '0.9rem'
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </>
        )}
      </List>
      
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {selectedOrg?.name ? `Organization: ${selectedOrg.name}` : 'No organization selected'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: 240, 
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            boxShadow: 1
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default SideNav;
