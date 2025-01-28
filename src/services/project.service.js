import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const ProjectService = {
  // Create a new project
  async createProject(projectData, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const projectsRef = collection(db, 'projects');
      const newProject = {
        ...projectData,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(projectsRef, newProject);
      return {
        id: docRef.id,
        ...newProject
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Get all projects for current user
  async getUserProjects(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

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
  },

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
}; 