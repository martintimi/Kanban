import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography, Menu, MenuItem, ListItemIcon, AppBar, Toolbar, Button, useMediaQuery } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Badge from '@mui/material/Badge';
import { NotificationService } from '../services/notification.service';
import NotificationBell from './NotificationBell';
import { OrganizationSelector } from './Organization';
import GroupIcon from '@mui/icons-material/Group';
import { useOrganization } from '../context/OrganizationContext';
import { OrganizationService } from '../services/organization.service';
import BusinessIcon from '@mui/icons-material/Business';
import { OrganizationInvites } from './Organization';
import { useToast } from '../context/ToastContext';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const TopNav = () => {
  const { darkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const [teamAnchorEl, setTeamAnchorEl] = useState(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [acceptingInvite, setAcceptingInvite] = useState(null);
  const { showToast } = useToast();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

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

  useEffect(() => {
    let cleanup = () => {};

    const setupNotifications = async () => {
      if (user?.uid) {
        try {
          const unsubscribe = await NotificationService.subscribeToNotifications(
            user.uid, 
            (notification) => {
              setNotifications(prev => [{
                id: Date.now().toString(),
                ...notification,
                read: false,
                timestamp: new Date().toISOString()
              }, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          );
          cleanup = unsubscribe;
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    };

    setupNotifications();
    return () => cleanup();
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      loadPendingInvites();
    }
  }, [user]);

  const loadPendingInvites = async () => {
    const invites = await OrganizationService.getPendingInvitations(user.uid);
    setPendingInvites(invites);
  };

  const refreshInvitations = async () => {
    if (user?.uid) {
      const invites = await OrganizationService.getPendingInvitations(user.uid);
      setPendingInvites(invites);
    }
  };

  const handleAcceptInvite = async (invite) => {
    try {
      setAcceptingInvite(invite.invitationId);
      await OrganizationService.acceptInvitation(invite.invitationId, user.uid);
      showToast('Invitation accepted successfully');
      
      await refreshInvitations();
      
      if (pendingInvites.length <= 1) {
        setInviteDialogOpen(false);
      }
    } catch (error) {
      showToast(error.message || 'Failed to accept invitation', 'error');
    } finally {
      setAcceptingInvite(null);
    }
  };

  const handleDeclineInvite = async (invite) => {
    try {
      await OrganizationService.declineInvitation(invite.invitationId, user.uid);
      showToast('Invitation declined');
      
      await refreshInvitations();
      
      if (pendingInvites.length <= 1) {
        setInviteDialogOpen(false);
      }
    } catch (error) {
      showToast(error.message || 'Failed to decline invitation', 'error');
    }
  };

  const loadInvitations = async () => {
    if (!user?.uid) return;
    
    try {
      console.log('Loading invitations for user ID:', user.uid);
      
      // Direct Firebase implementation
      const invitationsRef = collection(db, 'invitations');
      const inviteQuery = query(
        invitationsRef,
        where('inviteeId', '==', user.uid),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(inviteQuery);
      console.log(`Found ${querySnapshot.size} pending invitations`);
      
      // Add debugging for invalid invitations
      if (querySnapshot.size > 0) {
        querySnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`Invitation: ${doc.id}, inviteeId: ${data.inviteeId}, org: ${data.organizationName}`);
        });
      }
      
      const invites = querySnapshot.docs.map(doc => ({
        invitationId: doc.id,
        ...doc.data()
      }));
      
      setPendingInvites(invites);
      
      if (invites.length > 0 && !inviteDialogOpen) {
        showToast(`You have ${invites.length} pending invitation(s)`, 'info');
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  useEffect(() => {
    loadInvitations();
    
    // Set up a periodic check for new invitations
    const intervalId = setInterval(loadInvitations, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [user?.uid]);

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: '100%',
        left: 0,
        bgcolor: darkMode ? '#1e1e1e' : '#fff',
        color: darkMode ? '#fff' : '#555',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        height: '64px',
      }}
    >
      <Toolbar sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '64px !important',
        padding: '0 16px',
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center'
        }}>
          {!isMobile && (
            <Typography variant="h6" component="div" sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ 
                color: '#3f51b5',
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1.2rem' },
                letterSpacing: '0.5px'
              }}>
                KANBAN
              </Box>
              <Box component="span" sx={{ 
                color: 'text.primary', 
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '1.2rem' },
              }}>
                TOOL
              </Box>
              <Box 
                component="span" 
                sx={{ 
                  bgcolor: '#3f51b5',
                  color: 'white', 
                  fontSize: '0.7em',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  ml: 0.5,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '20px',
                  minWidth: '22px'
                }}
              >
                21
              </Box>
            </Typography>
          )}

          {user?.role === 'developer' && (
            <Button 
              color="inherit" 
              component={Link} 
              to="/my-tasks"
              startIcon={<AssignmentIcon />}
              sx={{ fontWeight: 500 }}
            >
              My Tasks
            </Button>
          )}
          
          {(user?.role === 'admin' || user?.role === 'project_manager') && (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/dashboard"
                startIcon={<DashboardIcon />}
                sx={{ fontWeight: 500 }}
              >
                Dashboard
              </Button>
              <Button 
                color="inherit"
                startIcon={<GroupIcon />}
                onClick={(e) => setTeamAnchorEl(e.currentTarget)}
                sx={{ fontWeight: 500 }}
              >
                Team
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ 
          display: { xs: 'none', md: 'flex' }, 
          alignItems: 'center',
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          borderRadius: 2,
          px: 2,
          py: 0.5,
          width: { sm: '200px', md: '300px' }
        }}>
          <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          <InputBase
            placeholder="Search..."
            sx={{ color: 'inherit', width: '100%' }}
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
        }}>
          <NotificationBell />

          <OrganizationSelector />

          <Badge badgeContent={pendingInvites.length} color="error">
            <IconButton color="inherit" onClick={() => setInviteDialogOpen(true)}>
              <BusinessIcon />
            </IconButton>
          </Badge>

          <IconButton 
            sx={{ ml: 1 }} 
            onClick={toggleTheme} 
            color="inherit"
          >
            {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          <IconButton 
            onClick={handleAvatarClick}
            sx={{
              p: 0.5,
            }}
          >
            {getAvatarContent()}
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {user?.name || user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {user?.role}
            </Typography>
          </Box>
          <MenuItem onClick={() => {
            navigate('/settings');
            handleClose();
          }}>
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>

      <Menu
        anchorEl={teamAnchorEl}
        open={Boolean(teamAnchorEl)}
        onClose={() => setTeamAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          navigate('/organization-management');
          setTeamAnchorEl(null);
        }}>
          Manage Team
        </MenuItem>
        <MenuItem onClick={() => {
          navigate('/organization-management?invite=true');
          setTeamAnchorEl(null);
        }}>
          Invite Members
        </MenuItem>
      </Menu>

      <OrganizationInvites
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        invitations={pendingInvites}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
        loading={acceptingInvite}
      />
    </AppBar>
  );
};

export default TopNav; 