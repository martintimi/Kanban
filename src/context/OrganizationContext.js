import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { OrganizationService } from '../services/organization.service';
import { useToast } from './ToastContext';

const OrganizationContext = createContext();

export const OrganizationProvider = ({ children }) => {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      loadOrganizations();
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

  const selectOrganization = (org) => {
    setSelectedOrg(org);
    localStorage.setItem('selectedOrgId', org.id);
  };

  const createOrganization = async (orgData) => {
    try {
      const newOrg = await OrganizationService.createOrganization({
        ...orgData,
        createdBy: user.uid
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

  return (
    <OrganizationContext.Provider value={{
      organizations,
      selectedOrg,
      selectOrganization,
      createOrganization,
      loading,
      refreshOrganizations: loadOrganizations
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