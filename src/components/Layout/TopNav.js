import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import OrganizationSelector from '../Organization/OrganizationSelector';
import OrganizationInvites from '../Organization/OrganizationInvites';
import UserMenu from './UserMenu';

const TopNav = ({ onMenuClick }) => {
  const [invitesOpen, setInvitesOpen] = useState(false);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const { user } = useAuth();

  const handleNotificationsClick = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleOpenInvites = () => {
    setInvitesOpen(true);
    handleNotificationsClose();
  };

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <OrganizationSelector />

          <Box sx={{ flexGrow: 1 }} />

          <IconButton color="inherit" onClick={handleNotificationsClick}>
            <Badge badgeContent={1} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationsAnchor}
            open={Boolean(notificationsAnchor)}
            onClose={handleNotificationsClose}
          >
            <MenuItem onClick={handleOpenInvites}>
              View Organization Invites
            </MenuItem>
          </Menu>

          <UserMenu />
        </Toolbar>
      </AppBar>

      <OrganizationInvites 
        open={invitesOpen}
        onClose={() => setInvitesOpen(false)}
      />
    </>
  );
};

export default TopNav; 