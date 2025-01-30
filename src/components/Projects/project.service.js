import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { NotificationService } from '../../services/notification.service';

export class ProjectService {
  // Create a new project
  static async createProject(projectData, userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const projectsRef = collection(db, 'projects');
      const newProject = {
        ...projectData,
        userId,
        members: [userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activities: [],
        tasks: [],
        status: projectData.status || 'active',
        priority: projectData.priority || 'medium',
        categories: projectData.categories || [],
        milestones: [],
        attachments: [],
        comments: [],
        archived: false,
        progress: 0,
        template: projectData.template || null
      };
      
      const docRef = await addDoc(projectsRef, newProject);
      const createdProject = {
        id: docRef.id,
        ...newProject
      };
      
      return createdProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Get all projects for current user
  static async getUserProjects(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Projects fetched:', projects); // Debug log
      return projects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  }

  // Update a project
  static async updateProject(projectId, projectData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const updatedData = {
        ...projectData,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(projectRef, updatedData);
      return {
        id: projectId,
        ...updatedData
      };
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  // Delete a project
  static async deleteProject(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);

      // Also delete related data (tasks, activities, etc.)
      // Add any additional cleanup here if needed

      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  static async getProjects() {
    try {
      const projectsRef = collection(db, 'projects');
      const querySnapshot = await getDocs(projectsRef);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  }

  static async addTask(projectId, taskData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const tasks = project.tasks || [];
      
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        status: taskData.status || 'To Do',
        assignee: taskData.assignee || null,
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Update project with new task
      await updateDoc(projectRef, {
        tasks: [...tasks, newTask],
        updatedAt: new Date().toISOString()
      });

      // Send notification to assignee if task is assigned
      if (taskData.assignee) {
        await NotificationService.sendTaskNotification(taskData.assignee, {
          title: 'New Task Assigned',
          body: `You have been assigned to task: ${taskData.name}`,
          type: 'task_assigned',
          projectId,
          taskId: newTask.id
        });
      }

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  static async assignTask(projectId, taskId, assigneeId) {
    try {
      // First verify the assignee exists
      const userRef = doc(db, 'users', assigneeId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Assignee user not found');
      }

      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const tasks = project.tasks || [];
      const members = project.members || [];

      // Add assignee to project members if not already a member
      if (!members.includes(assigneeId)) {
        members.push(assigneeId);
      }

      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      // Update task assignment
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        assignee: assigneeId,
        assigneeName: userDoc.data().fullName || userDoc.data().email,
        updatedAt: new Date().toISOString()
      };

      // Update project with new task and members
      await updateDoc(projectRef, {
        tasks,
        members,
        updatedAt: new Date().toISOString()
      });

      // Send notification to assignee
      await NotificationService.sendTaskNotification(assigneeId, {
        title: 'New Task Assignment',
        body: `You have been assigned to task: ${tasks[taskIndex].name}`,
        type: 'task_assigned',
        projectId,
        taskId,
        taskName: tasks[taskIndex].name,
        priority: tasks[taskIndex].priority,
        dueDate: tasks[taskIndex].dueDate
      });

      return tasks[taskIndex];
    } catch (error) {
      console.error('Error assigning task:', error);
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

      const tasks = projectDoc.data()?.tasks || [];
      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );

      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  static async getProjectTasks(projectId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      return projectDoc.data()?.tasks || [];
    } catch (error) {
      console.error('Error getting project tasks:', error);
      throw error;
    }
  }

  static async addTaskComment(projectId, taskId, comment) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDocs(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const comments = task.comments || [];
          return {
            ...task,
            comments: [...comments, {
              id: Date.now().toString(),
              ...comment,
              createdAt: new Date().toISOString()
            }]
          };
        }
        return task;
      });

      await updateDoc(projectRef, {
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  static async updateTaskStatus(projectId, taskId, status) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const updatedTasks = tasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: this.normalizeTaskStatus(status),
              updatedAt: new Date().toISOString() 
            }
          : task
      );

      await updateDoc(projectRef, {
        tasks: updatedTasks
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      throw error;
    }
  }

  // Add method to track activities
  static async addActivity(projectId, activity) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const project = projectDoc.data();
      const activities = project.activities || [];

      // Add new activity with unique ID and additional metadata
      const newActivity = {
        id: Date.now().toString(),
        ...activity,
        timestamp: new Date().toISOString(),
        metadata: {
          projectName: project.name,
          projectId: projectId,
          entityType: activity.entityType || 'project', // 'project' or 'task'
          actionType: activity.type, // 'created', 'updated', 'deleted', etc.
        }
      };

      // Update project with new activity
      await updateDoc(projectRef, {
        activities: [newActivity, ...activities].slice(0, 100), // Keep last 100 activities
        updatedAt: new Date().toISOString()
      });

      return newActivity;
    } catch (error) {
      console.error('Error adding activity:', error);
      throw new Error(`Failed to add activity: ${error.message}`);
    }
  }

  // Add method for managing subtasks
  static async addSubtask(projectId, parentTaskId, subtaskData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const parentTaskIndex = tasks.findIndex(t => t.id === parentTaskId);
      if (parentTaskIndex === -1) {
        throw new Error('Parent task not found');
      }

      const subtask = {
        id: Date.now().toString(),
        name: subtaskData.name,
        description: subtaskData.description || '',
        status: 'To Do',
        assignee: subtaskData.assignee || null,
        dueDate: subtaskData.dueDate || null,
        createdAt: new Date().toISOString(),
        completed: false
      };

      tasks[parentTaskIndex].subtasks.push(subtask);

      await updateDoc(projectRef, {
        tasks,
        updatedAt: new Date().toISOString()
      });

      return subtask;
    } catch (error) {
      console.error('Error adding subtask:', error);
      throw error;
    }
  }

  // Add method for managing dependencies
  static async updateTaskDependencies(projectId, taskId, dependencies) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            dependencies,
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      });

      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task dependencies:', error);
      throw error;
    }
  }

  // Add method for time tracking
  static async updateTaskTimeTracking(projectId, taskId, timeData) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const tasks = projectDoc.data()?.tasks || [];

      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          const timeTracking = task.timeTracking || {
            estimate: 0,
            logged: 0,
            history: []
          };

          return {
            ...task,
            timeTracking: {
              ...timeTracking,
              logged: timeTracking.logged + (timeData.logged || 0),
              history: [
                ...timeTracking.history,
                {
                  timestamp: new Date().toISOString(),
                  duration: timeData.logged,
                  description: timeData.description,
                  user: timeData.user
                }
              ]
            },
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      });

      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task time tracking:', error);
      throw error;
    }
  }

  static async deleteTask(projectId, taskId) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      const tasks = projectDoc.data()?.tasks || [];
      
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (!taskToDelete) {
        throw new Error('Task not found');
      }

      // Add activity before deleting
      await this.addActivity(projectId, {
        type: 'task_deleted',
        entityType: 'task',
        userId: taskToDelete.createdBy?.id,
        userName: taskToDelete.createdBy?.name,
        details: `Deleted task: ${taskToDelete.name}`,
        taskId: taskId,
        taskName: taskToDelete.name
      });

      const updatedTasks = tasks.filter(task => task.id !== taskId);
      await updateDoc(projectRef, {
        tasks: updatedTasks,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error deleting task:', error);
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

      return {
        id: projectDoc.id,
        ...projectDoc.data()
      };
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  }

  // Add method for project templates
  static async saveAsTemplate(projectId, templateName) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const projectData = projectDoc.data();
      const templatesRef = collection(db, 'projectTemplates');
      
      const template = {
        name: templateName,
        description: projectData.description,
        categories: projectData.categories,
        tasks: projectData.tasks,
        createdAt: new Date().toISOString(),
        createdFrom: projectId
      };

      await addDoc(templatesRef, template);
      return template;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }

  // Add method for project milestones
  static async addMilestone(projectId, milestone) {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const milestones = projectDoc.data().milestones || [];
      const newMilestone = {
        id: Date.now().toString(),
        ...milestone,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      await updateDoc(projectRef, {
        milestones: [...milestones, newMilestone],
        updatedAt: new Date().toISOString()
      });

      return newMilestone;
    } catch (error) {
      console.error('Error adding milestone:', error);
      throw error;
    }
  }

  // Add helper method to normalize status values
  static normalizeTaskStatus(status) {
    switch(status.toLowerCase()) {
      case 'done':
      case 'completed':
        return 'Done';
      case 'in progress':
      case 'inprogress':
      case 'in-progress':
        return 'In Progress';
      case 'to do':
      case 'todo':
      case 'to-do':
        return 'To Do';
      default:
        return 'To Do';
    }
  }

  static async getAssignedTasks(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get all projects where the user is a member
      const projectsRef = collection(db, 'projects');
      const q = query(
        projectsRef,
        where('members', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const assignedTasks = [];

      querySnapshot.docs.forEach(doc => {
        const project = doc.data();
        const projectTasks = project.tasks || [];
        
        // Filter tasks assigned to the user
        const userTasks = projectTasks
          .filter(task => task.assignee === userId)
          .map(task => ({
            ...task,
            projectId: doc.id,
            projectName: project.name
          }));
        
        assignedTasks.push(...userTasks);
      });

      return assignedTasks;
    } catch (error) {
      console.error('Error getting assigned tasks:', error);
      throw error;
    }
  }
} 