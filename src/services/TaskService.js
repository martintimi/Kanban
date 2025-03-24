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
  serverTimestamp,
  arrayRemove,
  Timestamp
} from 'firebase/firestore';
import { db, storage } from '../firebase/config';
import { NotificationService } from './notification.service';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
  /**
   * Get all tasks for a project
   * @param {string} projectId - Project ID
   * @returns Promise - Array of tasks
   */
  static async getTasks(projectId) {
    try {
      const tasksRef = collection(db, 'projects', projectId, 'tasks');
      const tasksQuery = query(tasksRef, orderBy('createdAt', 'desc'));
      const taskSnapshot = await getDocs(tasksQuery);
      
      const tasks = [];
      for (const doc of taskSnapshot.docs) {
        const task = { id: doc.id, ...doc.data() };
        
        // Convert timestamps to dates for easier handling in the UI
        if (task.createdAt) {
          task.createdAt = task.createdAt.toDate();
        }
        if (task.updatedAt) {
          task.updatedAt = task.updatedAt.toDate();
        }
        if (task.dueDate) {
          task.dueDate = task.dueDate.toDate();
        }
        
        // Fetch user details for assigned users if possible
        if (task.assignedTo) {
          try {
            const userDoc = await getDoc(doc(db, 'users', task.assignedTo));
            if (userDoc.exists()) {
              task.assignedToUser = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          } catch (error) {
            console.error('Error fetching assigned user:', error);
          }
        }
        
        tasks.push(task);
      }
      
      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  /**
   * Get tasks assigned to a specific user
   * @param {string} userId - User ID
   * @returns Promise - Array of tasks
   */
  static async getUserTasks(userId) {
    try {
      // Get all projects
      const projectsRef = collection(db, 'projects');
      const projectsSnapshot = await getDocs(projectsRef);
      
      const tasks = [];
      
      // For each project, get tasks assigned to the user
      for (const projectDoc of projectsSnapshot.docs) {
        const projectId = projectDoc.id;
        const tasksRef = collection(db, 'projects', projectId, 'tasks');
        const tasksQuery = query(tasksRef, where('assignedTo', '==', userId));
        const taskSnapshot = await getDocs(tasksQuery);
        
        taskSnapshot.docs.forEach(doc => {
          const task = { 
            id: doc.id, 
            ...doc.data(),
            projectId, // Add projectId to the task
            projectName: projectDoc.data().name // Add project name to the task
          };
          
          // Convert timestamps to dates
          if (task.createdAt) {
            task.createdAt = task.createdAt.toDate();
          }
          if (task.updatedAt) {
            task.updatedAt = task.updatedAt.toDate();
          }
          if (task.dueDate) {
            task.dueDate = task.dueDate.toDate();
          }
          
          tasks.push(task);
        });
      }
      
      return tasks;
    } catch (error) {
      console.error('Error getting user tasks:', error);
      throw error;
    }
  }

  /**
   * Create a new task
   * @param {string} projectId - Project ID
   * @param {Object} taskData - Task data
   * @returns Promise - Created task
   */
  static async createTask(projectId, taskData) {
    try {
      const taskRef = collection(db, 'projects', projectId, 'tasks');
      
      // Add timestamps
      const taskWithTimestamps = {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Convert Date objects to Firestore timestamps
      if (taskWithTimestamps.dueDate) {
        taskWithTimestamps.dueDate = Timestamp.fromDate(new Date(taskWithTimestamps.dueDate));
      }
      
      const docRef = await addDoc(taskRef, taskWithTimestamps);
      
      // Update the project's taskCount
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (projectDoc.exists()) {
        const currentCount = projectDoc.data().taskCount || 0;
        await updateDoc(projectRef, {
          taskCount: currentCount + 1,
          updatedAt: serverTimestamp()
        });
      }
      
      return {
        id: docRef.id,
        ...taskWithTimestamps
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  /**
   * Update a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Task data to update
   * @returns Promise
   */
  static async updateTask(projectId, taskId, taskData) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      
      // Add update timestamp
      const updateData = {
        ...taskData,
        updatedAt: serverTimestamp()
      };
      
      // Convert Date objects to Firestore timestamps
      if (updateData.dueDate) {
        updateData.dueDate = Timestamp.fromDate(new Date(updateData.dueDate));
      }
      
      await updateDoc(taskRef, updateData);
      
      // Update project's lastActivity
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        updatedAt: serverTimestamp()
      });
      
      return { id: taskId, ...updateData };
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Delete a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @returns Promise
   */
  static async deleteTask(projectId, taskId) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      
      // Get task data to check for attachments
      const taskDoc = await getDoc(taskRef);
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        
        // Delete attachments from storage if they exist
        if (taskData.attachments && taskData.attachments.length > 0) {
          for (const attachment of taskData.attachments) {
            try {
              const fileRef = ref(storage, attachment.path);
              await deleteObject(fileRef);
            } catch (error) {
              console.error('Error deleting attachment:', error);
              // Continue with deletion even if attachment delete fails
            }
          }
        }
      }
      
      // Delete the task
      await deleteDoc(taskRef);
      
      // Update the project's taskCount
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      if (projectDoc.exists()) {
        const currentCount = projectDoc.data().taskCount || 0;
        await updateDoc(projectRef, {
          taskCount: Math.max(0, currentCount - 1), // Ensure count doesn't go below 0
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Upload a file attachment for a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {File} file - File to upload
   * @returns Promise - Attachment info
   */
  static async uploadTaskAttachment(projectId, taskId, file) {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = `projects/${projectId}/tasks/${taskId}/attachments/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Upload file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Create attachment object
      const attachment = {
        id: uuidv4(),
        name: file.name,
        type: file.type,
        size: file.size,
        path: storagePath,
        url: downloadURL,
        uploadedAt: new Date()
      };
      
      // Update task with new attachment
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        attachments: arrayUnion(attachment),
        updatedAt: serverTimestamp()
      });
      
      return attachment;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  }

  /**
   * Delete a file attachment from a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {Object} attachment - Attachment object to delete
   * @returns Promise
   */
  static async deleteTaskAttachment(projectId, taskId, attachment) {
    try {
      // Delete from storage
      const fileRef = ref(storage, attachment.path);
      await deleteObject(fileRef);
      
      // Remove from task
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        attachments: arrayRemove(attachment),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  }

  /**
   * Add a comment to a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID of commenter
   * @param {string} content - Comment content
   * @returns Promise - Comment object
   */
  static async addComment(projectId, taskId, userId, content) {
    try {
      const comment = {
        id: uuidv4(),
        userId,
        content,
        createdAt: new Date()
      };
      
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        comments: arrayUnion(comment),
        updatedAt: serverTimestamp()
      });
      
      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Toggle subtask completion
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} subtaskId - Subtask ID
   * @param {boolean} completed - Completion status
   * @returns Promise
   */
  static async toggleSubtask(projectId, taskId, subtaskId, completed) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }
      
      const taskData = taskDoc.data();
      const subtasks = taskData.subtasks || [];
      
      // Find and update the subtask
      const updatedSubtasks = subtasks.map(subtask => {
        if (subtask.id === subtaskId) {
          return { ...subtask, completed };
        }
        return subtask;
      });
      
      // Calculate progress based on completed subtasks
      const totalSubtasks = updatedSubtasks.length;
      const completedSubtasks = updatedSubtasks.filter(subtask => subtask.completed).length;
      const progress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
      
      // Update task
      await updateDoc(taskRef, {
        subtasks: updatedSubtasks,
        progress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling subtask:', error);
      throw error;
    }
  }

  /**
   * Update task progress
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {number} progress - Progress percentage
   * @returns Promise
   */
  static async updateTaskProgress(projectId, taskId, progress) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        progress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task progress:', error);
      throw error;
    }
  }

  /**
   * Add a time entry to a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {Object} timeEntry - Time entry object
   * @returns Promise
   */
  static async addTimeEntry(projectId, taskId, timeEntry) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(taskRef, {
        timeEntries: arrayUnion({
          id: uuidv4(),
          ...timeEntry,
          createdAt: new Date()
        }),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding time entry:', error);
      throw error;
    }
  }

  /**
   * Add a subtask to a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {Object} subtask - Subtask object
   * @returns Promise
   */
  static async addSubtask(projectId, taskId, subtask) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      
      // Add ID to subtask if not present
      const newSubtask = {
        ...subtask,
        id: subtask.id || uuidv4(),
        completed: subtask.completed || false,
        createdAt: new Date()
      };
      
      await updateDoc(taskRef, {
        subtasks: arrayUnion(newSubtask),
        updatedAt: serverTimestamp()
      });
      
      return newSubtask;
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  }

  /**
   * Update a task's status and notify admin/PM
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} newStatus - New task status
   * @param {string} userId - User ID who is updating the status
   * @returns Promise
   */
  static async updateTaskStatus(projectId, taskId, newStatus, userId) {
    try {
      console.log('Updating task status:', { projectId, taskId, newStatus, userId });
      
      if (!projectId || !taskId) {
        console.error('Missing projectId or taskId');
        throw new Error('Missing projectId or taskId');
      }
      
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      
      // Get current task data
      const taskDoc = await getDoc(taskRef);
      
      // If task document doesn't exist in Firestore, check if the task data is in the project document
      if (!taskDoc.exists()) {
        console.log('Task not found in tasks collection, checking project document');
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          throw new Error('Project not found');
        }
        
        const projectData = projectDoc.data();
        if (!projectData.tasks || !Array.isArray(projectData.tasks)) {
          throw new Error('Project has no tasks array');
        }
        
        // Find the task in the project's tasks array
        const taskIndex = projectData.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
          throw new Error('Task not found in project tasks');
        }
        
        // Update the task status in the array
        const updatedTasks = [...projectData.tasks];
        const oldStatus = updatedTasks[taskIndex].status || 'To Do';
        updatedTasks[taskIndex] = {
          ...updatedTasks[taskIndex],
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        
        // Add status change to history if it exists
        if (!updatedTasks[taskIndex].statusHistory) {
          updatedTasks[taskIndex].statusHistory = [];
        }
        
        updatedTasks[taskIndex].statusHistory.push({
          from: oldStatus,
          to: newStatus,
          updatedBy: userId,
          timestamp: new Date().toISOString()
        });
        
        // Update the project document with the modified tasks array
        await updateDoc(projectRef, {
          tasks: updatedTasks,
          updatedAt: serverTimestamp()
        });
        
        // Create notifications for the task status change
        try {
          this.createTaskStatusNotifications(
            projectId,
            taskId,
            updatedTasks[taskIndex],
            projectData,
            oldStatus,
            newStatus,
            userId
          );
        } catch (notifError) {
          console.error('Error creating notifications:', notifError);
          // Continue even if notifications fail
        }
        
        return { success: true, status: newStatus };
      }
      
      // Process task from tasks collection as before
      const taskData = taskDoc.data();
      const oldStatus = taskData.status || 'To Do'; // Provide a default value if status is missing
      
      // Prepare the update data
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      
      // Only add to statusHistory if the field exists or create a new array
      if (taskData.statusHistory) {
        updateData.statusHistory = arrayUnion({
          from: oldStatus,
          to: newStatus,
          updatedBy: userId,
          timestamp: serverTimestamp()
        });
      } else {
        // Initialize statusHistory array
        updateData.statusHistory = [{
          from: oldStatus,
          to: newStatus,
          updatedBy: userId,
          timestamp: serverTimestamp()
        }];
      }
      
      // Update task status
      await updateDoc(taskRef, updateData);
      
      try {
        // Create notifications for the task status change
        await this.createTaskStatusNotifications(
          projectId,
          taskId,
          taskData,
          null, // We'll fetch project data in the method
          oldStatus,
          newStatus,
          userId
        );
      } catch (notificationError) {
        console.error('Error in notification process:', notificationError);
        // Don't fail the status update if notifications fail
      }
      
      return { success: true, status: newStatus };
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to create notifications for task status changes
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {Object} taskData - Task data
   * @param {Object} projectData - Project data (optional, will be fetched if not provided)
   * @param {string} oldStatus - Previous task status
   * @param {string} newStatus - New task status
   * @param {string} userId - User ID who is updating the status
   */
  static async createTaskStatusNotifications(
    projectId,
    taskId,
    taskData,
    projectData,
    oldStatus,
    newStatus,
    userId
  ) {
    try {
      // Get project data if not provided
      if (!projectData) {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          console.warn('Project not found, skipping notifications');
          return;
        }
        
        projectData = projectDoc.data();
      }
      
      // Skip notification process if organization ID is missing
      if (!projectData.organizationId) {
        console.warn('Organization ID missing, skipping notifications');
        return;
      }
      
      // Get org details to identify admin/PMs
      const orgRef = doc(db, 'organizations', projectData.organizationId);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        console.warn('Organization not found, skipping notifications');
        return;
      }
      
      const orgData = orgDoc.data();
      
      // Get user details for notification message
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : { displayName: 'A user' };
      
      // Determine who should be notified (project managers and admins)
      const adminsToNotify = [];
      
      // Add project creator/owner
      if (projectData.createdBy && projectData.createdBy !== userId) {
        adminsToNotify.push(projectData.createdBy);
      }
      
      // Add organization admins
      if (orgData.admins && Array.isArray(orgData.admins)) {
        for (const adminId of orgData.admins) {
          if (adminId !== userId && !adminsToNotify.includes(adminId)) {
            adminsToNotify.push(adminId);
          }
        }
      }
      
      // Add project managers from org roles
      if (orgData.roles) {
        for (const [uid, role] of Object.entries(orgData.roles)) {
          if ((role === 'admin' || role === 'project_manager') && 
              uid !== userId && !adminsToNotify.includes(uid)) {
            adminsToNotify.push(uid);
          }
        }
      }
      
      // Create notification message based on status
      let message = '';
      let type = 'status_update';
      
      if (newStatus === 'In Progress' && oldStatus === 'To Do') {
        message = `${userData.displayName || 'A developer'} has started working on task "${taskData.name || 'Untitled'}"`;
        type = 'work_started';
      } else if (newStatus === 'Done') {
        message = `${userData.displayName || 'A developer'} has completed task "${taskData.name || 'Untitled'}"`;
        type = 'task_completed';
      } else {
        message = `${userData.displayName || 'A user'} changed task "${taskData.name || 'Untitled'}" status from ${oldStatus} to ${newStatus}`;
      }
      
      // Send notifications to all admins and PMs
      for (const adminId of adminsToNotify) {
        try {
          await NotificationService.createNotification(adminId, {
            type,
            message,
            taskId,
            taskName: taskData.name || 'Untitled',
            projectId,
            projectName: projectData.name || 'Untitled Project',
            actorId: userId,
            actorName: userData.displayName || 'A user',
            timestamp: new Date().toISOString()
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
          // Continue with other notifications even if one fails
        }
      }
      
      // Update project's lastActivity
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating task status notifications:', error);
      // Don't rethrow to prevent task status update failure
    }
  }

  /**
   * Verify a task as completed
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} verifiedBy - User ID verifying the task
   * @returns Promise
   */
  static async verifyTask(projectId, taskId, verifiedBy) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }
      
      const taskData = taskDoc.data();
      
      // Check if task is in a verifiable state
      if (taskData.status !== 'Review') {
        throw new Error('Task must be in Review status to be verified');
      }
      
      // Add verification details
      await updateDoc(taskRef, {
        status: 'Completed',
        verifiedBy,
        verifiedAt: new Date(),
        history: arrayUnion({
          id: uuidv4(),
          type: 'verification',
          verifiedBy,
          timestamp: new Date()
        }),
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error verifying task:', error);
      throw error;
    }
  }

  /**
   * Assign a task to a user
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} assigneeId - User ID to assign to
   * @returns Promise
   */
  static async assignTask(projectId, taskId, assigneeId) {
    try {
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      
      // Add assignment history
      const historyEntry = {
        id: uuidv4(),
        type: 'assignment',
        assigneeId,
        timestamp: new Date()
      };
      
      await updateDoc(taskRef, {
        assignedTo: assigneeId,
        history: arrayUnion(historyEntry),
        updatedAt: serverTimestamp()
      });
      
      return { assigneeId, historyEntry };
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  }

  /**
   * Updates a task in the project's tasks array (for projects that use embedded tasks)
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {Object} updatedFields - Fields to update
   * @returns Promise - Updated task data
   */
  static async updateTaskInProjectArray(projectId, taskId, updatedFields) {
    try {
      console.log('Updating task in project array:', { projectId, taskId, updatedFields });
      
      if (!projectId || !taskId) {
        throw new Error('Missing projectId or taskId');
      }
      
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      if (!projectData.tasks || !Array.isArray(projectData.tasks)) {
        throw new Error('Project has no tasks array');
      }
      
      // Find the task in the project's tasks array
      const taskIndex = projectData.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found in project tasks');
      }
      
      // Update the task in the array
      const updatedTasks = [...projectData.tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...updatedFields,
        updatedAt: new Date().toISOString()
      };
      
      // Update the project document with the modified tasks array
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: serverTimestamp()
      });
      
      // Return the updated task
      return {
        id: taskId,
        ...updatedTasks[taskIndex]
      };
    } catch (error) {
      console.error('Error updating task in project array:', error);
      throw error;
    }
  }

  /**
   * Start a timer for a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID who is starting the timer
   * @returns Promise
   */
  static async startTaskTimer(projectId, taskId, userId) {
    try {
      console.log(`Starting timer for task ${taskId} in project ${projectId} by user ${userId}`);
      
      // First try to update the task in the project array
      try {
        // Check if task exists in regular tasks collection
        const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
        const taskDoc = await getDoc(taskRef);
        
        if (taskDoc.exists()) {
          // Update the task with the timer details
          await updateDoc(taskRef, {
            activeTimer: {
              userId,
              startTime: serverTimestamp(),
              isRunning: true
            },
            status: 'In Progress',
            updatedAt: serverTimestamp()
          });
          
          // Create a notification for the active timer
          await NotificationService.createNotification({
            type: 'taskStart',
            userId,
            taskId,
            taskName: taskDoc.data().name || 'Unknown Task',
            projectId,
            message: `Started working on task: ${taskDoc.data().name || 'Unknown Task'}`,
            createdAt: serverTimestamp()
          });
          
          // Also update the task status
          await this.updateTaskStatus(projectId, taskId, 'In Progress', userId);
          
          console.log(`Timer started successfully for task ${taskId}`);
          return true;
        } else {
          // Task not found in regular tasks collection, try project array
          const result = await this.updateTaskInProjectArray(projectId, taskId, {
            activeTimer: {
              userId,
              startTime: serverTimestamp(),
              isRunning: true
            },
            status: 'In Progress',
            updatedAt: serverTimestamp()
          });
          
          if (result) {
            console.log(`Timer started successfully for task ${taskId} in project array`);
            return true;
          }
        }
      } catch (error) {
        console.error('Error starting timer for task:', error);
        throw error;
      }
      
      return false;
    } catch (error) {
      console.error('Error starting task timer:', error);
      throw error;
    }
  }

  /**
   * Stop a timer for a task
   * @param {string} projectId - Project ID
   * @param {string} taskId - Task ID
   * @param {string} userId - User ID who is stopping the timer
   * @param {string} newStatus - Optional new status to set
   * @returns Promise
   */
  static async stopTaskTimer(projectId, taskId, userId, newStatus = null) {
    try {
      console.log(`Stopping timer for task ${taskId} in project ${projectId} by user ${userId}`);
      
      // First check the task in the regular collection
      const taskRef = doc(db, 'projects', projectId, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      
      if (taskDoc.exists()) {
        const taskData = taskDoc.data();
        const activeTimer = taskData.activeTimer;
        
        if (activeTimer && activeTimer.isRunning) {
          // Calculate time spent
          const startTime = activeTimer.startTime.toDate();
          const endTime = new Date();
          const timeSpentMs = endTime - startTime;
          
          // Create a time entry
          const timeEntry = {
            id: uuidv4(),
            userId,
            startTime,
            endTime,
            duration: timeSpentMs,
            note: `Time tracked for task: ${taskData.name || 'Unknown Task'}`
          };
          
          // Total time spent (add to existing time)
          const totalTimeSpent = (taskData.timeSpent || 0) + timeSpentMs;
          
          // Update the task
          const updateData = {
            activeTimer: {
              isRunning: false,
              lastUserId: userId,
              lastStartTime: activeTimer.startTime,
              lastEndTime: serverTimestamp()
            },
            timeEntries: arrayUnion(timeEntry),
            timeSpent: totalTimeSpent,
            updatedAt: serverTimestamp()
          };
          
          // If new status is provided, update it too
          if (newStatus) {
            updateData.status = newStatus;
          }
          
          await updateDoc(taskRef, updateData);
          
          // Create a notification for the completed timer
          await NotificationService.createNotification({
            type: newStatus === 'Done' ? 'taskComplete' : 'taskStatusChange',
            userId,
            taskId,
            taskName: taskData.name || 'Unknown Task',
            projectId,
            timeSpent: timeSpentMs,
            message: `Stopped working on task: ${taskData.name || 'Unknown Task'}`,
            oldStatus: taskData.status,
            newStatus: newStatus || taskData.status,
            createdAt: serverTimestamp()
          });
          
          console.log(`Timer stopped successfully for task ${taskId}`);
          return {
            success: true,
            timeSpent: timeSpentMs,
            totalTimeSpent
          };
        } else {
          console.warn(`No active timer found for task ${taskId}`);
          return {
            success: false,
            error: 'No active timer found'
          };
        }
      } else {
        // Task not found in regular collection, try project array
        // This requires more complex logic, so for now we'll just log the error
        console.error(`Task ${taskId} not found in regular collection, cannot stop timer`);
        return {
          success: false,
          error: 'Task not found'
        };
      }
    } catch (error) {
      console.error('Error stopping task timer:', error);
      throw error;
    }
  }

  /**
   * Format time spent in milliseconds to a readable string
   * @param {number} timeSpentMs - Time spent in milliseconds
   * @returns {string} Formatted time string (HH:MM:SS)
   */
  static formatTimeSpent(timeSpentMs) {
    const totalSeconds = Math.floor(timeSpentMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Add a method to add manual time entries
  static async addManualTimeEntry(projectId, taskId, userId, durationMs) {
    if (!projectId || !taskId || !userId || !durationMs) {
      console.error('Missing required parameters for addManualTimeEntry');
      throw new Error('Missing required parameters');
    }
    
    try {
      // Create a new time entry
      const timeEntry = {
        startTime: new Date(Date.now() - durationMs).toISOString(),
        endTime: new Date().toISOString(),
        duration: durationMs,
        userId: userId,
        manual: true,
        createdAt: new Date().toISOString()
      };
      
      // First try to update task in project array
      try {
        // Get the project document
        const projectDoc = await db.collection('projects').doc(projectId).get();
        
        if (!projectDoc.exists) {
          throw new Error('Project not found');
        }
        
        const project = projectDoc.data();
        const tasks = project.tasks || [];
        
        // Find the task in the array
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          throw new Error('Task not found in project array');
        }
        
        // Get existing time entries and total time
        const timeEntries = tasks[taskIndex].timeEntries || [];
        const totalTimeSpent = (tasks[taskIndex].totalTimeSpent || 0) + durationMs;
        
        // Add the new time entry
        timeEntries.push(timeEntry);
        
        // Create field path for the update
        const timeEntriesPath = `tasks.${taskIndex}.timeEntries`;
        const totalTimePath = `tasks.${taskIndex}.totalTimeSpent`;
        
        // Update the project document
        await db.collection('projects').doc(projectId).update({
          [timeEntriesPath]: timeEntries,
          [totalTimePath]: totalTimeSpent
        });
        
        return {
          timeEntries,
          totalTimeSpent
        };
      } catch (projectError) {
        console.log('Error updating time entry in project array, trying task collection:', projectError);
        
        // If the task is not in the project array, try the tasks collection
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) {
          throw new Error('Task not found');
        }
        
        const task = taskDoc.data();
        
        // Get existing time entries and total time
        const timeEntries = task.timeEntries || [];
        const totalTimeSpent = (task.totalTimeSpent || 0) + durationMs;
        
        // Add the new time entry
        timeEntries.push(timeEntry);
        
        // Update the task document
        await db.collection('tasks').doc(taskId).update({
          timeEntries,
          totalTimeSpent
        });
        
        return {
          timeEntries,
          totalTimeSpent
        };
      }
    } catch (error) {
      console.error('Error adding manual time entry:', error);
      throw error;
    }
  }

  // Add a method for admins to review completed tasks
  static async reviewTask(projectId, taskId, rating, comment) {
    if (!projectId || !taskId) {
      console.error('Missing required parameters for reviewTask');
      throw new Error('Missing required parameters');
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    try {
      const reviewData = {
        rating,
        comment,
        reviewedAt: new Date().toISOString(),
        reviewerId: db.auth().currentUser.uid,
        reviewerName: db.auth().currentUser.displayName || db.auth().currentUser.email
      };
      
      // First try to update task in project array
      try {
        // Get the project document
        const projectDoc = await db.collection('projects').doc(projectId).get();
        
        if (!projectDoc.exists) {
          throw new Error('Project not found');
        }
        
        const project = projectDoc.data();
        const tasks = project.tasks || [];
        
        // Find the task in the array
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) {
          throw new Error('Task not found in project array');
        }
        
        // Update the task with review data
        const reviewPath = `tasks.${taskIndex}.review`;
        const statusPath = `tasks.${taskIndex}.status`;
        
        // Update the project document
        await db.collection('projects').doc(projectId).update({
          [reviewPath]: reviewData,
          [statusPath]: 'Reviewed'
        });
        
        // Create notification for the task assignee
        if (tasks[taskIndex].assignee) {
          const notification = {
            type: 'task_reviewed',
        taskId: taskId,
            taskName: tasks[taskIndex].name,
        projectId: projectId,
            recipientId: tasks[taskIndex].assignee,
            message: `Your task "${tasks[taskIndex].name}" has been reviewed`,
            rating: rating,
            comment: comment,
            read: false,
            createdAt: new Date().toISOString()
          };
          
          await db.collection('notifications').add(notification);
        }
        
        return {
          review: reviewData,
          status: 'Reviewed'
        };
      } catch (projectError) {
        console.log('Error reviewing task in project array, trying task collection:', projectError);
        
        // If the task is not in the project array, try the tasks collection
        const taskDoc = await db.collection('tasks').doc(taskId).get();
        
        if (!taskDoc.exists) {
          throw new Error('Task not found');
        }
        
        // Update the task with review data
        await db.collection('tasks').doc(taskId).update({
          review: reviewData,
          status: 'Reviewed'
        });
        
        // Create notification for the task assignee
        const task = taskDoc.data();
        if (task.assignee) {
          const notification = {
            type: 'task_reviewed',
            taskId: taskId,
            taskName: task.name,
            projectId: projectId,
            recipientId: task.assignee,
            message: `Your task "${task.name}" has been reviewed`,
            rating: rating,
            comment: comment,
            read: false,
            createdAt: new Date().toISOString()
          };
          
          await db.collection('notifications').add(notification);
        }
        
        return {
          review: reviewData,
          status: 'Reviewed'
        };
      }
    } catch (error) {
      console.error('Error reviewing task:', error);
      throw error;
    }
  }
} 