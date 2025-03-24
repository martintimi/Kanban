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
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NotificationService } from './notification.service';

export class ProjectService {
  static async createProject(data) {
    try {
      if (!data.organizationId || !data.createdBy) {
        throw new Error('Organization ID and creator ID are required');
      }

      const projectsRef = collection(db, 'projects');
      const newProject = {
        name: data.name,
        description: data.description,
        priority: data.priority || 'Medium',
        deadline: data.deadline || null,
        status: 'active',
        progress: 0,
        organizationId: data.organizationId,
        createdBy: data.createdBy,
        owner: data.owner || data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        tasks: [],
        members: [data.createdBy], // Add creator as first member
        categories: [],
        settings: {
          allowComments: true,
          allowTaskCreation: true,
          defaultTaskStatus: 'To Do'
        }
      };
      
      const docRef = await addDoc(projectsRef, newProject);
      
      // Return the project with resolved timestamps
      return {
        id: docRef.id,
        ...newProject,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error(error.message || 'Failed to create project');
    }
  }

  static async getOrganizationProjects(organizationId) {
    try {
      if (!organizationId) {
        console.error('Organization ID is required');
        return [];
      }

      console.log("Getting projects for organization:", organizationId);
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef, 
        where('organizationId', '==', organizationId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('No projects found for organization:', organizationId);
        return [];
      }

      const projects = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        console.log("Raw project data:", data);
        
        // Convert timestamps and ensure tasks array exists
        const project = {
          id: doc.id,
          ...data,
          tasks: data.tasks || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          deadline: data.deadline?.toDate() || null
        };

        console.log("Processed project:", {
          id: project.id,
          name: project.name,
          organizationId: project.organizationId,
          tasksCount: project.tasks.length,
          tasks: project.tasks.map(t => ({
            id: t.id,
            name: t.name,
            assignedTo: t.assignedTo,
            assignee: t.assignee
          }))
        });

        projects.push(project);
      }

      console.log(`Found ${projects.length} projects for organization ${organizationId}`);
      return projects;
    } catch (error) {
      console.error('Error getting organization projects:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  static async updateProject(projectId, data) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  static async deleteProject(projectId) {
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  static async addMemberToProject(projectId, userId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        members: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error adding member to project:', error);
      throw error;
    }
  }

  static async removeMemberFromProject(projectId, userId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        members: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error removing member from project:', error);
      throw error;
    }
  }

  static async getUserProjects(userId, organizationId) {
    try {
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);
      
      // Filter projects based on user's organization role
      const orgDoc = await getDoc(doc(db, 'organizations', organizationId));
      const orgData = orgDoc.data();
      const userRole = orgData.roles[userId];

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(project => {
          // Admins and PMs see all projects
          if (userRole === 'admin' || userRole === 'project_manager') return true;
          // Developers only see projects they're assigned to
          return project.members.includes(userId);
        });
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  static async getProject(projectId) {
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
  }

  static async addActivity(projectId, activity) {
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
  }

  static async updateTask(projectId, taskId, updates) {
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
  }

  static async getTask(projectId, taskId) {
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
  }

  static async addTask(projectId, taskData) {
    try {
      console.log("Adding task with data:", {
        projectId,
        taskData: {
          ...taskData,
          assignedTo: taskData.assignedTo,
          assignee: taskData.assignedTo
        }
      });

      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      
      // Generate a unique ID for the task
      const taskId = Date.now().toString();
      
      // Create the new task with all required fields
      const newTask = {
        id: taskId,
        name: taskData.name,
        description: taskData.description || '',
        priority: taskData.priority || 'medium',
        status: taskData.status || 'To Do',
        dueDate: taskData.dueDate || null,
        createdBy: taskData.createdBy,
        assignedTo: taskData.assignedTo, // Primary field for assignment
        assignee: taskData.assignedTo,   // Keep for backward compatibility
        organizationId: taskData.organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: [],
        comments: [],
        attachments: [],
        progress: 0,
        timeSpent: 0,
        timeEstimate: taskData.timeEstimate || 0
      };

      console.log("Created new task object:", newTask);

      // Add task to project's tasks array
      const updatedTasks = [...(project.tasks || []), newTask];
      
      // Update the project document
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        lastModified: serverTimestamp()
      });

      // Create notification for assigned user
      if (taskData.assignedTo) {
        console.log("Creating notification for user:", taskData.assignedTo);
        await NotificationService.createNotification(taskData.assignedTo, {
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned to task: ${taskData.name}`,
          taskId: taskId,
          projectId: projectId,
          timestamp: new Date().toISOString(),
          read: false
        });
      } else {
        console.log("No assignee specified for task");
      }

      console.log("Task created successfully:", newTask);
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  static async deleteTask(projectId, taskId) {
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
  }

  static async updateTaskStatus(projectId, taskId, newStatus) {
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
} 