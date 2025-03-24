import React, { createContext, useContext, useState } from 'react';

const AIAssistantContext = createContext();

export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};

export const AIAssistantProvider = ({ children }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantHistory, setAssistantHistory] = useState([]);

  const helpTopics = {
    meetings: {
      create: "To create a new meeting, click the 'New Meeting' button in the meetings tab. You'll get a link to share with participants.",
      join: "To join a meeting, either click the meeting link you received or go to the meetings tab and click 'Join' on an active meeting.",
      controls: "During a meeting, you can:\n- Mute/unmute your microphone\n- Turn your camera on/off\n- Share your screen\n- Send reactions\n- Chat with participants",
      leave: "To leave a meeting, click the red phone button in the meeting controls. This will disconnect you from the call.",
    },
    tasks: {
      create: "To create a task, click the '+' button in the tasks section. Fill in the title, description, and optionally assign it to team members.",
      manage: "You can manage tasks by:\n- Dragging them between columns\n- Setting due dates\n- Adding comments\n- Marking them as complete",
      filters: "Use the filter options above the task board to:\n- Show only your tasks\n- Filter by status\n- Search by keyword",
    },
    general: {
      navigation: "Use the sidebar to navigate between different sections of the app. The main sections are Dashboard, Tasks, and Meetings.",
      shortcuts: "Common shortcuts:\n- 'N' - New task\n- 'M' - New meeting\n- '?' - Show this help",
      settings: "Access your settings by clicking your profile picture in the top-right corner.",
    }
  };

  const getContextualHelp = (location) => {
    switch (location) {
      case '/meetings':
        return helpTopics.meetings;
      case '/tasks':
        return helpTopics.tasks;
      default:
        return helpTopics.general;
    }
  };

  const processUserQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Meeting-related queries
    if (lowerQuery.includes('meeting')) {
      if (lowerQuery.includes('create') || lowerQuery.includes('start')) {
        return helpTopics.meetings.create;
      }
      if (lowerQuery.includes('join')) {
        return helpTopics.meetings.join;
      }
      if (lowerQuery.includes('control') || lowerQuery.includes('audio') || lowerQuery.includes('video')) {
        return helpTopics.meetings.controls;
      }
      if (lowerQuery.includes('leave') || lowerQuery.includes('exit')) {
        return helpTopics.meetings.leave;
      }
    }
    
    // Task-related queries
    if (lowerQuery.includes('task')) {
      if (lowerQuery.includes('create') || lowerQuery.includes('new')) {
        return helpTopics.tasks.create;
      }
      if (lowerQuery.includes('manage') || lowerQuery.includes('edit')) {
        return helpTopics.tasks.manage;
      }
      if (lowerQuery.includes('filter') || lowerQuery.includes('search')) {
        return helpTopics.tasks.filters;
      }
    }
    
    // General queries
    if (lowerQuery.includes('navigate') || lowerQuery.includes('find')) {
      return helpTopics.general.navigation;
    }
    if (lowerQuery.includes('shortcut') || lowerQuery.includes('keyboard')) {
      return helpTopics.general.shortcuts;
    }
    if (lowerQuery.includes('setting') || lowerQuery.includes('profile')) {
      return helpTopics.general.settings;
    }
    
    // Default response
    return "I can help you with meetings, tasks, navigation, and general app usage. Try asking about specific features or actions you'd like to perform!";
  };

  const value = {
    isAssistantOpen,
    setIsAssistantOpen,
    assistantHistory,
    setAssistantHistory,
    getContextualHelp,
    processUserQuery,
    helpTopics
  };

  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
}; 