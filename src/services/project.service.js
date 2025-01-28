import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export class ProjectService {
  // Create a new project
  static async createProject(projectData, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const projectsRef = collection(db, 'projects');
      const newProject = {
        ...projectData,
        userId,
        members: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activities: [],
        tasks: [] // Initialize empty tasks array
      };
      
      const docRef = await addDoc(projectsRef, newProject);
      const createdProject = {
        id: docRef.id,
        ...newProject
      };
      
      console.log('Created project:', createdProject); // Debug log
      return createdProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Get all projects for current user
  static async getUserProjects(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Projects fetched:', projects); // Debug log
      return projects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  // Update a project
  async updateProject(projectId, updateData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Delete a project
  async deleteProject(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  static async getProjects() {
    try {
      const projectsRef = collection(db, 'projects');
      const querySnapshot = await getDocs(projectsRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  static async createTask(projectId, taskData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      const currentTasks = projectDoc.data()?.tasks || [];

      // Add new task with unique ID
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update project with new task
      await updateDoc(projectRef, {
        tasks: [...currentTasks, newTask],
        updatedAt: new Date().toISOString()
      });

      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  static async updateTask(projectId, taskId, updates) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      // Update specific task
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              ...updates, 
              updatedAt: new Date().toISOString() 
            }
          : task
      );

      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async getProjectTasks(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      return projectDoc.data()?.tasks || [];
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  }

  static async addTaskComment(projectId, taskId, comment) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const comments = task.comments || [];
          return {
            ...task,
            comments: [...comments, {
              id: Date.now().toString(),
              ...comment,
              createdAt: new Date().toISOString()
            }]
          };
        }
        return task;
      });

      await updateDoc(projectRef, {
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async updateTaskStatus(projectId, taskId, status) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status,
              updatedAt: new Date().toISOString() 
            }
          : task
      );

      await updateDoc(projectRef, {
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Add method to track activities
  static async addActivity(projectId, activity) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const activities = projectDoc.data()?.activities || [];

      await updateDoc(projectRef, {
        activities: [
          {
            id: Date.now().toString(),
            ...activity,
            timestamp: new Date().toISOString()
          },
          ...activities
        ]
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  }
} 