const knowledgeBase = {
  dashboard: {
    overview: "The dashboard shows your project statistics, tasks, and recent activity.",
    features: [
      "View total projects and tasks",
      "Track project progress",
      "See task status distribution",
      "Monitor recent activity",
      "Quick access to create new tasks or projects"
    ],
    actions: {
      "create project": "Click the 'Create Project' button at the bottom of the projects list",
      "new task": "Click the 'New Task' button in the top right corner",
      "view projects": "Click the 'View Projects' button or use the sidebar navigation",
      "search": "Use the search bar at the top to find projects or tasks"
    }
  },
  projects: {
    overview: "Manage your projects and track their progress using Kanban boards.",
    features: [
      "Create and edit projects",
      "Assign team members",
      "Set project status",
      "Track project progress",
      "View project analytics"
    ],
    actions: {
      "create": "Click the '+' button to create a new project",
      "edit": "Click the three dots menu on a project card to edit",
      "delete": "Open project menu and select 'Delete Project'",
      "assign": "Open project settings to manage team members"
    }
  },
  tasks: {
    overview: "Create and manage tasks using a Kanban board layout.",
    features: [
      "Drag and drop tasks between columns",
      "Set task priority and status",
      "Assign tasks to team members",
      "Add comments and attachments",
      "Track task progress"
    ],
    actions: {
      "create": "Click 'New Task' or use the '+' button in any column",
      "edit": "Click on a task card to open the detail view",
      "move": "Drag and drop tasks between columns",
      "assign": "Click the avatar icon on a task to assign members"
    }
  },
  team: {
    overview: "Manage your team members and their roles.",
    features: [
      "Add and remove team members",
      "Assign roles and permissions",
      "View member activities",
      "Manage team settings"
    ],
    actions: {
      "invite": "Click 'Invite Member' to add new team members",
      "remove": "Go to member settings and click 'Remove'",
      "change role": "Edit member permissions in team settings"
    }
  },
  meetings: {
    overview: "Schedule and manage video meetings with your team.",
    features: [
      "Create instant or scheduled meetings",
      "Share screen during meetings",
      "Chat with participants",
      "Record meetings"
    ],
    actions: {
      "start": "Click 'New Meeting' to start an instant meeting",
      "schedule": "Use calendar view to schedule future meetings",
      "join": "Click the meeting link or join from the meetings list"
    }
  }
};

class LocalAIService {
  constructor() {
    this.context = '';
    this.conversationHistory = [];
  }

  setContext(path) {
    this.context = path.replace('/', '') || 'dashboard';
  }

  generateResponse(userInput) {
    const input = userInput.toLowerCase();
    const context = knowledgeBase[this.context] || knowledgeBase.dashboard;
    
    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: userInput });

    // Check for specific actions
    for (const [action, response] of Object.entries(context.actions)) {
      if (input.includes(action)) {
        const answer = `Here's how to ${action}: ${response}`;
        this.conversationHistory.push({ role: 'assistant', content: answer });
        return answer;
      }
    }

    // Check for feature inquiries
    if (input.includes('how') || input.includes('what') || input.includes('help')) {
      const features = context.features.map(f => `• ${f}`).join('\n');
      const answer = `${context.overview}\n\nKey features:\n${features}`;
      this.conversationHistory.push({ role: 'assistant', content: answer });
      return answer;
    }

    // Handle navigation questions
    if (input.includes('find') || input.includes('where')) {
      const locations = {
        'project': 'Click "Projects" in the left sidebar',
        'task': 'Click "Tasks" in the left sidebar or use the quick create button',
        'team': 'Access team settings through the "Team" section in the sidebar',
        'meeting': 'Find meetings under the "Meetings" tab in the main navigation',
        'setting': 'Click the settings icon in the top-right corner'
      };

      for (const [key, value] of Object.entries(locations)) {
        if (input.includes(key)) {
          const answer = `To find ${key}s: ${value}`;
          this.conversationHistory.push({ role: 'assistant', content: answer });
          return answer;
        }
      }
    }

    // Default response with context-aware suggestions
    const suggestions = [
      `• Create a new ${this.context === 'dashboard' ? 'project or task' : this.context.slice(0, -1)}`,
      `• View ${this.context} overview and statistics`,
      `• Manage ${this.context} settings and preferences`
    ].join('\n');

    const answer = `I can help you with ${this.context}! Here are some things you can do:\n${suggestions}\n\nWhat would you like to know more about?`;
    this.conversationHistory.push({ role: 'assistant', content: answer });
    return answer;
  }

  getWelcomeMessage() {
    const context = knowledgeBase[this.context] || knowledgeBase.dashboard;
    return `👋 Hi! I'm your AI assistant. ${context.overview}\n\nHow can I help you today?`;
  }

  getSuggestions() {
    const context = knowledgeBase[this.context] || knowledgeBase.dashboard;
    return context.features.slice(0, 3).map(f => `• ${f}`).join('\n');
  }
}

export const localAIService = new LocalAIService(); 