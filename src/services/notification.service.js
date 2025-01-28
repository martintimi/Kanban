import { getToken, onMessage } from 'firebase/messaging';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc 
} from 'firebase/firestore';
import { ProjectService } from './project.service';
import { db, messaging } from '../firebase/config';

export class NotificationService {
  static async subscribeToNotifications(userId, callback) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging);
        
        await this.saveUserToken(userId, token);

        // Return an unsubscribe function
        const unsubscribe = onMessage(messaging, (payload) => {
          callback(payload);
        });

        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      }
      // Return a no-op function if permission not granted
      return () => {};
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      // Return a no-op function on error
      return () => {};
    }
  }

  static async sendTaskNotification(userId, notification) {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification
        })
      });
      return response.json();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async checkDueDates() {
    try {
      // Get all active projects and their tasks
      const projects = await ProjectService.getProjects();
      const allTasks = projects.flatMap(project => 
        (project.tasks || []).map(task => ({
          ...task,
          projectId: project.id
        }))
      );
      
      const today = new Date();
      
      allTasks.forEach(task => {
        const dueDate = new Date(task.dueDate);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3 && daysUntilDue > 0) {
          this.sendTaskNotification(task.assignee, {
            title: 'Task Due Soon',
            body: `Task "${task.name}" is due in ${daysUntilDue} days`,
            type: 'due_date',
            taskId: task.id
          });
        }
      });
    } catch (error) {
      console.error('Error checking due dates:', error);
    }
  }

  static async getProjectManagers(projectId) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'project_manager'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting project managers:', error);
      return [];
    }
  }

  static async notifyTaskComplete(task) {
    try {
      const projectManagers = await this.getProjectManagers(task.projectId);
      
      projectManagers.forEach(manager => {
        this.sendTaskNotification(manager.id, {
          title: 'Task Completed',
          body: `Task "${task.name}" has been marked as complete by ${task.assignee}`,
          type: 'task_complete',
          taskId: task.id
        });
      });
    } catch (error) {
      console.error('Error notifying task completion:', error);
    }
  }

  static async notifyTaskAssignment(task, assigneeId) {
    try {
      await this.sendTaskNotification(assigneeId, {
        title: 'New Task Assignment',
        body: `You have been assigned to task: ${task.name}`,
        type: 'task_assigned',
        taskId: task.id,
        projectId: task.projectId
      });

      // Also send email notification
      await this.sendEmailNotification(assigneeId, {
        subject: 'New Task Assignment',
        body: `
          You have been assigned a new task:
          Task: ${task.name}
          Due Date: ${new Date(task.dueDate).toLocaleDateString()}
          Priority: ${task.priority}
          Description: ${task.description}
        `
      });
    } catch (error) {
      console.error('Error notifying task assignment:', error);
    }
  }

  static async saveUserToken(userId, token) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        notificationToken: token
      });
    } catch (error) {
      console.error('Error saving user token:', error);
    }
  }
}

export const subscribeToNotifications = NotificationService.subscribeToNotifications.bind(NotificationService);