import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { OrganizationService } from '../services/organization.service';
import { useToast } from './ToastContext';

const OrganizationContext = createContext();

export const OrganizationProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      loadOrganizations();
      loadPendingInvitations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const userOrgs = await OrganizationService.getUserOrganizations(user.uid);
      setOrganizations(userOrgs);
      
      // Set selected org from localStorage or use first org
      const savedOrgId = localStorage.getItem('selectedOrgId');
      const orgToSelect = userOrgs.find(org => org.id === savedOrgId) || userOrgs[0];
      if (orgToSelect) {
        setSelectedOrg(orgToSelect);
        localStorage.setItem('selectedOrgId', orgToSelect.id);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      showToast('Failed to load organizations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const invites = await OrganizationService.getPendingInvitations(user.email);
      setPendingInvitations(invites);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const selectOrganization = (org) => {
    setSelectedOrg(org);
    localStorage.setItem('selectedOrgId', org.id);
  };

  const createOrganization = async (orgData) => {
    try {
      const newOrg = await OrganizationService.createOrganization({
        ...orgData,
        createdBy: user.uid,
        owner: user.uid,
        roles: {
          [user.uid]: 'admin' // Organization creator is admin by default
        }
      });
      setOrganizations(prev => [...prev, newOrg]);
      selectOrganization(newOrg);
      showToast('Organization created successfully', 'success');
      return newOrg;
    } catch (error) {
      console.error('Error creating organization:', error);
      showToast('Failed to create organization', 'error');
      throw error;
    }
  };

  const getUserOrgRole = (orgId, userId) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.roles?.[userId] || null;
  };

  const inviteMember = async (email, role) => {
    try {
      if (!selectedOrg) throw new Error('No organization selected');
      await OrganizationService.inviteMember(selectedOrg.id, email, role);
      showToast('Invitation sent successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  const acceptInvitation = async (inviteId) => {
    try {
      await OrganizationService.acceptInvitation(inviteId, user.uid);
      await loadPendingInvitations();
      await loadOrganizations();
      showToast('Invitation accepted successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
      throw error;
    }
  };

  return (
    <OrganizationContext.Provider value={{
      organizations,
      selectedOrg,
      selectOrganization,
      createOrganization,
      loading,
      refreshOrganizations: loadOrganizations,
      getUserOrgRole,
      pendingInvitations,
      inviteMember,
      acceptInvitation,
      refreshInvitations: loadPendingInvitations
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}; 