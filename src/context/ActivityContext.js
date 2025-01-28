import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProjectService } from '../services/project.service';
import { useAuth } from './AuthContext';

const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadActivities = async () => {
    try {
      if (user?.uid) {
        const allProjects = await ProjectService.getUserProjects(user.uid);
        const allActivities = allProjects.flatMap(project => 
          (project.activities || []).map(activity => ({
            ...activity,
            projectId: project.id,
            projectName: project.name
          }))
        ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        setActivities(allActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [user]);

  const addActivity = async (projectId, activity) => {
    try {
      await ProjectService.addActivity(projectId, activity);
      await loadActivities(); // Reload all activities
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  return (
    <ActivityContext.Provider value={{ activities, loading, addActivity, loadActivities }}>
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