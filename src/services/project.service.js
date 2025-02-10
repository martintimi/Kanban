import { 
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export const ProjectService = {
  createProject: async (projectData, userId) => {
    try {
      const projectsRef = collection(db, 'projects');
      const newProject = {
        ...projectData,
        createdBy: userId,
        createdAt: serverTimestamp(),
        members: [userId],
        tasks: [],
        activities: []
      };
      
      const docRef = await addDoc(projectsRef, newProject);
      return { id: docRef.id, ...newProject };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  getUserProjects: async (userId) => {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('members', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  },

  getProject: async (projectId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      
      return { id: projectDoc.id, ...projectDoc.data() };
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  },

  updateProject: async (projectId, updates) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...updates,
        lastModified: serverTimestamp()
      });
      
      const updatedDoc = await getDoc(projectRef);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  addActivity: async (projectId, activity) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        activities: arrayUnion({
          ...activity,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  },

  updateTask: async (projectId, taskId, updates) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const taskIndex = project.tasks.findIndex(t => t.id === taskId);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      // Update the task
      project.tasks[taskIndex] = {
        ...project.tasks[taskIndex],
        ...updates,
        lastModified: new Date().toISOString()
      };

      // Update the project document
      await updateDoc(projectRef, {
        tasks: project.tasks
      });

      return project.tasks[taskIndex];
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  getTask: async (projectId, taskId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const task = project.tasks.find(t => t.id === taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      return task;
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  addTask: async (projectId, taskData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const newTask = {
        id: crypto.randomUUID(), // Generate unique ID
        ...taskData,
        createdAt: new Date().toISOString(),
        status: taskData.status || 'To Do',
        comments: [],
        subtasks: [],
        timeSpent: 0
      };

      // Add task to project's tasks array
      const updatedTasks = [...(project.tasks || []), newTask];
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      });

      // Add activity for task creation
      await ProjectService.addActivity(projectId, {
        type: 'task_created',
        entityType: 'task',
        taskId: newTask.id,
        taskName: newTask.name,
        userId: taskData.createdBy,
        timestamp: new Date().toISOString(),
        details: `Created task: ${newTask.name}`
      });

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  deleteTask: async (projectId, taskId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const updatedTasks = project.tasks.filter(task => task.id !== taskId);

      await updateDoc(projectRef, {
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  updateTaskStatus: async (projectId, taskId, newStatus) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const taskIndex = project.tasks.findIndex(task => task.id === taskId);
      
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      project.tasks[taskIndex].status = newStatus;
      project.tasks[taskIndex].lastModified = new Date().toISOString();

      await updateDoc(projectRef, {
        tasks: project.tasks,
        lastModified: serverTimestamp()
      });

      return project.tasks[taskIndex];
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
}; 