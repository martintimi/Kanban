import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

export class UserService {
  static async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
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
} 