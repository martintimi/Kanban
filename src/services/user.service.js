import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  updateDoc 
} from 'firebase/firestore';

export class UserService {
  static async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  static async getUserTasks(userId) {
    try {
      const projectsRef = collection(db, 'projects');
      const querySnapshot = await getDocs(projectsRef);
      const allProjects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all tasks assigned to user across all projects
      const assignedTasks = allProjects.flatMap(project => 
        (project.tasks || [])
          .filter(task => task.assignee === userId)
          .map(task => ({
            ...task,
            projectId: project.id,
            projectName: project.name
          }))
      );

      return assignedTasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      return [];
    }
  }

  static async updateUserSkills(userId, skills) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { skills });
    } catch (error) {
      console.error('Error updating user skills:', error);
      throw error;
    }
  }
} 