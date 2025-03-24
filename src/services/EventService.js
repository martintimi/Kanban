import { 
  collection, 
  addDoc, 
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Service for tracking project and organization events
 */
export class EventService {
  /**
   * Create a new event record
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} - Created event
   */
  static async createEvent(eventData) {
    try {
      if (!eventData.type) {
        throw new Error('Event type is required');
      }
      
      const event = {
        ...eventData,
        timestamp: serverTimestamp()
      };
      
      const eventRef = await addDoc(collection(db, 'events'), event);
      return { id: eventRef.id, ...event };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }
  
  /**
   * Get events for a specific project
   * @param {string} projectId - Project ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Events array
   */
  static async getProjectEvents(projectId, options = {}) {
    try {
      const { limit = 50, eventTypes = null } = options;
      
      let eventsQuery = query(
        collection(db, 'events'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'desc')
      );
      
      if (eventTypes && Array.isArray(eventTypes) && eventTypes.length > 0) {
        eventsQuery = query(
          eventsQuery,
          where('type', 'in', eventTypes)
        );
      }
      
      const eventsSnapshot = await getDocs(eventsQuery);
      
      return eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting project events:', error);
      throw error;
    }
  }
  
  /**
   * Get events for a specific organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Events array
   */
  static async getOrganizationEvents(organizationId, options = {}) {
    try {
      const { limit = 50, eventTypes = null } = options;
      
      let eventsQuery = query(
        collection(db, 'events'),
        where('organizationId', '==', organizationId),
        orderBy('timestamp', 'desc')
      );
      
      if (eventTypes && Array.isArray(eventTypes) && eventTypes.length > 0) {
        eventsQuery = query(
          eventsQuery,
          where('type', 'in', eventTypes)
        );
      }
      
      const eventsSnapshot = await getDocs(eventsQuery);
      
      return eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting organization events:', error);
      throw error;
    }
  }
  
  /**
   * Get events related to a specific task
   * @param {string} taskId - Task ID
   * @returns {Promise<Array>} - Events array
   */
  static async getTaskEvents(taskId) {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('entityId', '==', taskId),
        where('entityType', '==', 'task'),
        orderBy('timestamp', 'desc')
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      
      return eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting task events:', error);
      throw error;
    }
  }
  
  /**
   * Get events related to a specific user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Events array
   */
  static async getUserEvents(userId) {
    try {
      const eventsQuery = query(
        collection(db, 'events'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      
      return eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user events:', error);
      throw error;
    }
  }
  
  /**
   * Record a task creation event
   * @param {Object} taskData - Task data
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created event
   */
  static async recordTaskCreated(taskData, projectId, userId) {
    try {
      const projectData = await this.getProjectData(projectId);
      
      const eventData = {
        type: 'task_created',
        entityId: taskData.id,
        entityName: taskData.name,
        entityType: 'task',
        projectId,
        projectName: projectData.name,
        organizationId: projectData.organizationId,
        userId,
        details: {
          description: taskData.description,
          priority: taskData.priority,
          dueDate: taskData.dueDate
        }
      };
      
      return this.createEvent(eventData);
    } catch (error) {
      console.error('Error recording task created event:', error);
      // Don't throw, just log the error to prevent blocking the main operation
    }
  }
  
  /**
   * Record a task status change event
   * @param {Object} taskData - Task data
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @param {string} oldStatus - Previous status
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} - Created event
   */
  static async recordTaskStatusChanged(taskData, projectId, userId, oldStatus, newStatus) {
    try {
      const projectData = await this.getProjectData(projectId);
      
      const eventData = {
        type: 'task_status_changed',
        entityId: taskData.id,
        entityName: taskData.name,
        entityType: 'task',
        projectId,
        projectName: projectData.name,
        organizationId: projectData.organizationId,
        userId,
        details: {
          oldStatus,
          newStatus,
          timeSpent: taskData.timeSpent || 0
        }
      };
      
      return this.createEvent(eventData);
    } catch (error) {
      console.error('Error recording task status change event:', error);
      // Don't throw, just log the error to prevent blocking the main operation
    }
  }
  
  /**
   * Record a task assignment event
   * @param {Object} taskData - Task data
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID assigning the task
   * @param {string} assigneeId - User ID assigned to the task
   * @returns {Promise<Object>} - Created event
   */
  static async recordTaskAssigned(taskData, projectId, userId, assigneeId) {
    try {
      const projectData = await this.getProjectData(projectId);
      
      const eventData = {
        type: 'task_assigned',
        entityId: taskData.id,
        entityName: taskData.name,
        entityType: 'task',
        projectId,
        projectName: projectData.name,
        organizationId: projectData.organizationId,
        userId,
        targetUserId: assigneeId,
        details: {}
      };
      
      return this.createEvent(eventData);
    } catch (error) {
      console.error('Error recording task assignment event:', error);
      // Don't throw, just log the error to prevent blocking the main operation
    }
  }
  
  /**
   * Record a task completion event
   * @param {Object} taskData - Task data
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created event
   */
  static async recordTaskCompleted(taskData, projectId, userId) {
    try {
      const projectData = await this.getProjectData(projectId);
      
      const eventData = {
        type: 'task_completed',
        entityId: taskData.id,
        entityName: taskData.name,
        entityType: 'task',
        projectId,
        projectName: projectData.name,
        organizationId: projectData.organizationId,
        userId,
        details: {
          timeSpent: taskData.timeSpent || 0,
          dueDate: taskData.dueDate
        }
      };
      
      return this.createEvent(eventData);
    } catch (error) {
      console.error('Error recording task completion event:', error);
      // Don't throw, just log the error to prevent blocking the main operation
    }
  }
  
  /**
   * Record a project creation event
   * @param {Object} projectData - Project data
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Created event
   */
  static async recordProjectCreated(projectData, userId) {
    try {
      const eventData = {
        type: 'project_created',
        entityId: projectData.id,
        entityName: projectData.name,
        entityType: 'project',
        projectId: projectData.id,
        projectName: projectData.name,
        organizationId: projectData.organizationId,
        userId,
        details: {
          description: projectData.description,
          status: projectData.status
        }
      };
      
      return this.createEvent(eventData);
    } catch (error) {
      console.error('Error recording project created event:', error);
      // Don't throw, just log the error to prevent blocking the main operation
    }
  }
  
  /**
   * Record a member added to project event
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID adding the member
   * @param {string} memberId - User ID of the added member
   * @returns {Promise<Object>} - Created event
   */
  static async recordMemberAdded(projectId, userId, memberId) {
    try {
      const projectData = await this.getProjectData(projectId);
      
      const eventData = {
        type: 'member_added',
        entityId: projectId,
        entityName: projectData.name,
        entityType: 'project',
        projectId,
        projectName: projectData.name,
        organizationId: projectData.organizationId,
        userId,
        targetUserId: memberId,
        details: {}
      };
      
      return this.createEvent(eventData);
    } catch (error) {
      console.error('Error recording member added event:', error);
      // Don't throw, just log the error to prevent blocking the main operation
    }
  }
  
  /**
   * Get project data (helper method)
   * @param {string} projectId - Project ID
   * @returns {Promise<Object>} - Project data
   */
  static async getProjectData(projectId) {
    try {
      // Check if projectId is a valid string
      if (!projectId || typeof projectId !== 'string') {
        throw new Error('Invalid project ID');
      }
      
      const projectRef = collection(db, 'projects');
      const q = query(projectRef, where('__name__', '==', projectId));
      const projectSnapshot = await getDocs(q);
      
      if (projectSnapshot.empty) {
        throw new Error('Project not found');
      }
      
      const projectDoc = projectSnapshot.docs[0];
      return { id: projectDoc.id, ...projectDoc.data() };
    } catch (error) {
      console.error('Error getting project data:', error);
      throw error;
    }
  }
} 