import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectService } from '../services/project.service';
import { useAuth } from './AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useOrganization } from './OrganizationContext';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();

  useEffect(() => {
    let unsubscribe = () => {};

    const loadProjects = async () => {
      if (user?.uid) {
        try {
          setLoading(true);
          setError(null);
          
          console.log('Fetching projects for user:', user.uid);
          
          const projectsRef = collection(db, 'projects');
          const q = query(
            projectsRef, 
            where('members', 'array-contains', user.uid)
          );
          
          unsubscribe = onSnapshot(q, (snapshot) => {
            const projectsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            console.log('Fetched projects:', projectsData);
            
            setProjects(projectsData);
            setLoading(false);
          }, (error) => {
            console.error('Error loading projects:', error);
            setError(error.message);
            setLoading(false);
          });
        } catch (error) {
          console.error('Error setting up projects listener:', error);
          setError(error.message);
          setLoading(false);
        }
      } else {
        setProjects([]);
        setLoading(false);
      }
    };

    loadProjects();
    return () => unsubscribe();
  }, [user]);

  const calculateProjectStats = (projectsList) => {
    // ... existing code ...
  };

  const updateProjectProgress = (projectsList) => {
    // ... existing code ...
  };

  const addActivity = (activity) => {
    // ... existing code ...
  };

  const createProject = async (projectData) => {
    try {
      if (!selectedOrg) {
        throw new Error('No organization selected');
      }

      const newProject = await ProjectService.createProject({
        ...projectData,
        organizationId: selectedOrg.id
      });

      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const updatedProject = await ProjectService.updateProject(projectId, projectData);
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, ...updatedProject } : p
      ));
      return updatedProject;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const deleteProject = async (projectId) => {
    try {
      await ProjectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    projects,
    loading,
    error,
    setError,
    createProject,
    updateProject,
    deleteProject,
    setProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}; 