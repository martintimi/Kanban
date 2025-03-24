import axios from 'axios';

class OpenAIService {
  constructor() {
    this.api = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      }
    });
  }

  async generateResponse(messages) {
    try {
      const response = await this.api.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for a Kanban project management tool.
            Be specific and provide actionable steps when helping users.
            Keep responses concise but informative.
            Use markdown for formatting when appropriate.
            Current features include:
            - Project management with Kanban boards
            - Task creation and assignment
            - Team collaboration tools
            - Meeting scheduling and video calls
            - Calendar integration
            - Activity tracking
            - Organization settings
            
            When suggesting actions, be specific about where to find buttons and features.
            If you're not sure about something, ask for clarification.
            Always maintain a helpful and professional tone.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0.2,
        presence_penalty: 0.1
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error);
      throw new Error(error.response?.data?.error?.message || 'Failed to generate AI response');
    }
  }

  async generateSuggestions(currentContext) {
    try {
      const response = await this.api.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate 3 helpful suggestions for the user based on their current context. Keep each suggestion short and actionable."
          },
          {
            role: "user",
            content: `Current context: ${currentContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
        top_p: 1
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error.response?.data || error);
      throw new Error('Failed to generate suggestions');
    }
  }

  async generateContextualHelp(currentPath, userAction) {
    const contextMap = {
      '/dashboard': 'the dashboard page showing project overview and statistics',
      '/projects': 'the projects list page where users manage their projects',
      '/task-column': 'the Kanban board view showing task columns',
      '/my-tasks': 'the personal tasks page showing assigned tasks',
      '/calendar': 'the project calendar view for scheduling',
      '/meetings': 'the meetings management page',
      '/settings': 'the user settings page',
      '/organization-management': 'the organization management page'
    };

    const context = contextMap[currentPath] || 'the main application';

    try {
      const response = await this.api.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for a Kanban project management tool. 
            The user is currently on ${context}. 
            ${userAction ? `They are trying to ${userAction}.` : ''}
            Provide specific, actionable help for their current context.`
          },
          {
            role: "user",
            content: "What can I do here?"
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate contextual help');
    }
  }
}

export const openAIService = new OpenAIService(); 