import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  IconButton,
  TextField,
  Typography,
  Avatar,
  Tooltip,
  Fade,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  SmartToy as AIIcon,
  Close as CloseIcon,
  Send as SendIcon,
  QuestionAnswer as QuestionIcon,
  Lightbulb as TipIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/system';
import { useLocation } from 'react-router-dom';
import { useAIAssistant } from '../../context/AIAssistantContext';
import { localAIService } from '../../services/localAI.service';
import ReactMarkdown from 'react-markdown';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const AIContainer = styled(Box)(({ theme, isOpen }) => ({
  position: 'fixed',
  bottom: 20,
  right: 20,
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 2,
}));

const AIButton = styled(IconButton)(({ theme }) => ({
  width: 56,
  height: 56,
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
  animation: `${pulseAnimation} 2s infinite ease-in-out`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
}));

const ChatWindow = styled(Paper)(({ theme }) => ({
  width: 380,
  height: 500,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: `${fadeIn} 0.3s ease-out`,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: 20,
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  borderRadius: '20px 20px 0 0',
}));

const ChatMessages = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

const InputContainer = styled(Box)(({ theme }) => ({
  padding: '16px 20px',
  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
  display: 'flex',
  gap: '12px',
}));

const MessageContent = styled(Paper)(({ isAI }) => ({
  padding: '12px 16px',
  borderRadius: '16px',
  maxWidth: '80%',
  backgroundColor: isAI ? '#f0f7ff' : '#fff',
  border: '1px solid',
  borderColor: isAI ? 'rgba(0, 120, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
}));

const Message = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      animation: `${fadeIn} 0.3s ease-out`
    }}
  >
    <Avatar
      sx={{
        bgcolor: message.isAI ? 'primary.main' : 'secondary.main',
        width: 32,
        height: 32
      }}
    >
      {message.isAI ? <AIIcon /> : 'U'}
    </Avatar>
    <MessageContent isAI={message.isAI}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <Typography variant="body1" component="div">
              {children}
            </Typography>
          ),
          ul: ({ children }) => (
            <Box component="ul" sx={{ mt: 1, mb: 1 }}>
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Typography component="li" variant="body1">
              {children}
            </Typography>
          ),
          code: ({ children }) => (
            <Box
              component="code"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                padding: '2px 4px',
                borderRadius: 1,
                fontFamily: 'monospace'
              }}
            >
              {children}
            </Box>
          )
        }}
      >
        {message.text}
      </ReactMarkdown>
    </MessageContent>
  </Box>
);

const contextualHelp = {
  '/': [
    { title: 'Dashboard Overview', content: 'Welcome to your dashboard! Here you can see your tasks, meetings, and team activity.' },
    { title: 'Quick Actions', content: 'Use the + button to create new tasks or meetings quickly.' }
  ],
  '/meetings': [
    { title: 'Meeting Controls', content: 'During meetings, use the bottom toolbar to control your audio, video, and screen sharing.' },
    { title: 'Reactions', content: 'Send quick reactions to engage with others using the emoji button.' }
  ],
  '/tasks': [
    { title: 'Task Management', content: 'Create, edit, and track your tasks. Drag and drop to reorder or change status.' },
    { title: 'Filters', content: 'Use filters to find specific tasks or view tasks by status.' }
  ]
};

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      // Set the current context based on location
      localAIService.setContext(location.pathname);
      
      // Add welcome message
      setMessages([
        {
          id: Date.now(),
          text: localAIService.getWelcomeMessage(),
          isAI: true
        }
      ]);
    } else {
      setMessages([]);
    }
  }, [isOpen, location]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      isAI: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Get response from local AI service
      const response = localAIService.generateResponse(input);
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: response,
        isAI: true
      }]);
    } catch (err) {
      console.error('Error getting AI response:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "I'm sorry, I couldn't process that request. Please try again.",
        isAI: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AIContainer>
      {isOpen && (
        <ChatWindow elevation={3}>
          <ChatHeader>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon />
              <Typography variant="h6">AI Assistant</Typography>
            </Box>
            <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </ChatHeader>

          <ChatMessages>
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            )}
            <div ref={messagesEndRef} />
          </ChatMessages>

          <InputContainer>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              multiline
              maxRows={3}
              size="small"
              disabled={isTyping}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <SendIcon />
            </IconButton>
          </InputContainer>
        </ChatWindow>
      )}

      <Tooltip title={isOpen ? "Close assistant" : "Need help?"} placement="left">
        <AIButton onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <CloseIcon /> : <AIIcon />}
        </AIButton>
      </Tooltip>
    </AIContainer>
  );
};

export default AIAssistant; 