import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { AUTH_CONFIG } from '../config/auth.config';

const app = initializeApp(AUTH_CONFIG.firebase);
const db = getFirestore(app);
const auth = getAuth(app);

export const TaskService = {
  // Create a new task
  createTask: async (projectId, taskData) => {
    try {
      const user = auth.currentUser;
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const newTask = {
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        assignedTo: taskData.assignedTo || user.uid,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: taskData.dueDate || null
      };
      const docRef = await addDoc(tasksRef, newTask);
      return { id: docRef.id, ...newTask };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Get all tasks for a project
  getProjectTasks: async (projectId) => {
    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const querySnapshot = await getDocs(tasksRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  },

  // Update a task
  updateTask: async (taskId, updateData) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
}; 