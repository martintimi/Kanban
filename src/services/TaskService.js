import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc,
  getDocs,
  deleteDoc,
  arrayUnion,
  increment,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NotificationService } from './notification.service';

export const TaskService = {
  // Create a new task
  createTask: async (projectId, taskData) => {
    try {
      const tasksRef = collection(db, `projects/${projectId}/tasks`);
      const newTask = {
        ...taskData,
        timeSpent: 0,
        timeEstimate: taskData.timeEstimate || 0,
        startDate: taskData.startDate || new Date().toISOString(),
        completedSubtasks: 0,
        totalSubtasks: taskData.subtasks?.length || 0,
        progress: 0,
        timeEntries: [],
        lastActive: new Date().toISOString(),
        subtasks: taskData.subtasks || [],
        comments: [],
        attachments: [],
        watchers: [taskData.assignedTo],
        history: [{
          type: 'created',
          timestamp: new Date().toISOString(),
          userId: taskData.createdBy,
          details: 'Task created'
        }]
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
      const q = query(tasksRef, orderBy('lastActive', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  },

  // Get a single task by ID
  getTask: async (projectId, taskId) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      const taskDoc = await getDoc(taskRef);
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }
      return { id: taskDoc.id, ...taskDoc.data() };
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  // Update task progress
  updateTaskProgress: async (projectId, taskId, progress) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      await updateDoc(taskRef, {
        progress,
        lastActive: new Date().toISOString(),
        history: arrayUnion({
          type: 'progress',
          timestamp: new Date().toISOString(),
          details: `Progress updated to ${progress}%`
        })
      });
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  },

  // Add time entry
  addTimeEntry: async (projectId, taskId, timeEntry) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      await updateDoc(taskRef, {
        timeSpent: increment(timeEntry.duration),
        timeEntries: arrayUnion(timeEntry),
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding time entry:', error);
      throw error;
    }
  },

  // Add subtask
  addSubtask: async (projectId, taskId, subtask) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      await updateDoc(taskRef, {
        subtasks: arrayUnion(subtask),
        totalSubtasks: increment(1),
        lastActive: new Date().toISOString(),
        history: arrayUnion({
          type: 'subtask_added',
          timestamp: new Date().toISOString(),
          details: `Added subtask: ${subtask.title}`
        })
      });
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  },

  // Add comment
  addComment: async (projectId, taskId, comment) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      await updateDoc(taskRef, {
        comments: arrayUnion(comment),
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (projectId, taskId) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      await deleteDoc(taskRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Update task
  updateTask: async (projectId, taskId, updates) => {
    try {
      const taskRef = doc(db, `projects/${projectId}/tasks/${taskId}`);
      await updateDoc(taskRef, {
        ...updates,
        lastActive: new Date().toISOString(),
        history: arrayUnion({
          type: 'update',
          timestamp: new Date().toISOString(),
          details: 'Task updated'
        })
      });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Get tasks assigned to a user
  getUserTasks: async (userId) => {
    try {
      const tasksRef = collection(db, 'tasks');
      const q = query(
        tasksRef, 
        where('assignedTo', '==', userId),
        orderBy('lastActive', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (projectId, taskId, newStatus, userId) => {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });

      // Create notification in the notification system (not toast)
      await NotificationService.createNotification(userId, {
        type: 'TASK_STATUS_UPDATED',
        title: 'Task Status Updated',
        message: `Task status has been updated to ${newStatus}`,
        taskId: taskId,
        projectId: projectId,
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  },

  // Verify task
  verifyTask: async (projectId, taskId, verifiedBy) => {
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

      const updatedTask = {
        ...project.tasks[taskIndex],
        status: 'Verified',
        verifiedAt: new Date().toISOString(),
        verifiedBy: verifiedBy
      };

      project.tasks[taskIndex] = updatedTask;

      await updateDoc(projectRef, {
        tasks: project.tasks
      });

      // Create notification
      await NotificationService.notifyTaskVerified(updatedTask, projectId, verifiedBy);

      return updatedTask;
    } catch (error) {
      console.error('Error verifying task:', error);
      throw error;
    }
  },

  // Assign task
  assignTask: async (projectId, taskId, assigneeId, taskData) => {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        assignee: assigneeId,
        status: 'To Do'
      });

      // Create notification for the assignee
      await NotificationService.createNotification(assigneeId, {
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `You have been assigned to task: ${taskData.name}`,
        taskId: taskId,
        projectId: projectId,
        timestamp: new Date().toISOString(),
        read: false
      });
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }
}; 