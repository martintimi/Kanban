import { useAuth } from '../context/AuthContext';

export const useRoleAccess = () => {
  const { user } = useAuth();

  const hasAccess = (allowedRoles) => {
    if (!user || !allowedRoles) return false;
    return allowedRoles.includes(user.role);
  };

  const isAdmin = () => user?.role === 'admin';
  const isProjectManager = () => user?.role === 'project_manager';
  const isDeveloper = () => user?.role === 'developer';

  return {
    hasAccess,
    isAdmin,
    isProjectManager,
    isDeveloper,
    userRole: user?.role
  };
}; 