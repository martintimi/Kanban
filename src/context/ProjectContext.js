import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectService } from '../services/project.service';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

const LOCAL_STORAGE_KEY = 'projectData';

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    tasksToday: 0,
    completionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (localData) {
      setProjects(localData.projects || []);
      setProjectStats(localData.projectStats || {
        totalProjects: 0,
        activeProjects: 0,
        tasksToday: 0,
        completionRate: 0
      });
      setRecentActivities(localData.recentActivities || []);
      setProjectProgress(localData.projectProgress || []);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (user?.uid) {
        console.log('User authenticated:', user.uid);
        await loadProjects();
      } else {
        console.log('No authenticated user');
        // Clear project data when not authenticated
        setProjects([]);
        setProjectStats({
          totalProjects: 0,
          activeProjects: 0,
          tasksToday: 0,
          completionRate: 0
        });
      }
    };

    checkAuth();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      projects,
      projectStats,
      recentActivities,
      projectProgress
    }));
  }, [projects, projectStats, recentActivities, projectProgress]);

  const loadProjects = async () => {
    console.log('Loading projects for user:', user?.uid);
    if (!user?.uid) {
      console.error('No user ID available');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const projectList = await ProjectService.getUserProjects(user.uid);
      setProjects(projectList);
      calculateProjectStats(projectList);
      updateProjectProgress(projectList);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err.message);
      
      const localData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      if (localData?.projects) {
        setProjects(localData.projects);
        setProjectStats(localData.projectStats);
        setRecentActivities(localData.recentActivities);
        setProjectProgress(localData.projectProgress);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectStats = (projectsList) => {
    const total = projectsList.length;
    const active = projectsList.filter(p => p.status === 'active').length;
    const completed = projectsList.filter(p => p.status === 'completed').length;
    
    setProjectStats({
      totalProjects: total,
      activeProjects: active,
      tasksToday: projectsList.reduce((acc, proj) => 
        acc + (proj.tasks?.filter(t => 
          new Date(t.dueDate).toDateString() === new Date().toDateString()
        ).length || 0), 0),
      completionRate: total ? Math.round((completed / total) * 100) : 0
    });
  };

  const addActivity = (activity) => {
    setRecentActivities(prev => [{
      id: Date.now(),
      action: activity.action,
      projectName: activity.projectName,
      timestamp: new Date().toISOString(),
    }, ...prev.slice(0, 9)]);
  };

  const updateProjectProgress = (projectsList) => {
    const progressData = [
      {
        name: 'To Do',
        completed: projectsList.filter(p => p.status === 'todo').length,
        pending: projectsList.filter(p => p.status === 'todo' && p.priority === 'high').length
      },
      {
        name: 'In Progress',
        completed: projectsList.filter(p => p.status === 'in-progress').length,
        pending: projectsList.filter(p => p.status === 'in-progress' && p.priority === 'high').length
      },
      {
        name: 'Completed',
        completed: projectsList.filter(p => p.status === 'completed').length,
        pending: 0
      }
    ];
    setProjectProgress(progressData);
  };

  const createProject = async (projectData) => {
    if (!user?.uid) {
      throw new Error('Please log in to create a project');
    }

    setLoading(true);
    try {
      const newProject = await ProjectService.createProject({
        ...projectData,
        status: 'active',
        createdAt: new Date().toISOString(),
        userId: user.uid,
        tasks: [],
      }, user.uid);

      setProjects(prev => {
        const updated = [...prev, newProject];
        return updated;
      });
      
      addActivity({
        action: 'created',
        projectName: projectData.name
      });
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, updatedData) => {
    if (!user?.uid) {
      throw new Error('Please log in to update a project');
    }

    setLoading(true);
    try {
      const updatedProject = await ProjectService.updateProject(projectId, updatedData, user.uid);
      setProjects(prev => prev.map(p => 
        p.id === projectId ? updatedProject : p
      ));
      
      addActivity({
        action: 'updated',
        projectName: updatedData.name
      });
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    try {
      await ProjectService.deleteProject(projectId);
      
      setProjects(prev => {
        const updated = prev.filter(project => project.id !== projectId);
        calculateProjectStats(updated);
        updateProjectProgress(updated);
        return updated;
      });

      addActivity({
        action: 'deleted',
        projectName: projects.find(p => p.id === projectId)?.name || 'project'
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        projectStats,
        recentActivities,
        projectProgress,
        loading,
        error,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects: loadProjects
      }}
    >
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

export default ProjectContext; 