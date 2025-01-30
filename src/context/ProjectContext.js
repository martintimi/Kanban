import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectService } from '../components/Projects/project.service';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Load projects when user changes
  useEffect(() => {
    const loadProjects = async () => {
      if (!user?.uid) return;
      
      setLoading(true);
      try {
        const userProjects = await ProjectService.getUserProjects(user.uid);
        setProjects(userProjects || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
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
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      const newProject = await ProjectService.createProject(projectData, user.uid);
      
      setProjects(prev => {
        const updated = [...prev, newProject];
        calculateProjectStats(updated);
        updateProjectProgress(updated);
        return updated;
      });

      addActivity({
        action: 'created',
        projectName: newProject.name
      });

      // Return the created project
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
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

  return (
    <ProjectContext.Provider
      value={{
        projects,
        loading,
        error,
        setError,
        setProjects,
        createProject,
        updateProject,
        deleteProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}; 