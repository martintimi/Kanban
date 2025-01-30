import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectService } from '../components/Projects/project.service';
import { useAuth } from './AuthContext';

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadActivities = async () => {
    try {
      setLoading(true);
      if (user?.uid) {
        const allProjects = await ProjectService.getUserProjects(user.uid);
        
        const allActivities = allProjects
          .filter(project => Array.isArray(project.activities))
          .flatMap(project => 
            (project.activities || []).map(activity => ({
              ...activity,
              projectId: project.id,
              projectName: project.name,
              entityType: activity.metadata?.entityType || 'project',
              actionType: activity.metadata?.actionType || activity.type
            }))
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        console.log('Loaded activities:', allActivities); // Debug log
        setActivities(allActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reload activities when user changes
  useEffect(() => {
    loadActivities();
  }, [user]);

  const refreshActivities = () => {
    loadActivities();
  };

  const addActivity = async (projectId, activity) => {
    try {
      await ProjectService.addActivity(projectId, activity);
      await loadActivities(); // Reload all activities
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  return (
    <ActivityContext.Provider value={{ 
      activities, 
      loading, 
      refreshActivities,
      loadActivities,
      addActivity
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivities must be used within an ActivityProvider');
  }
  return context;
}; 