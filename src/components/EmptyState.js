import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import WorkIcon from '@mui/icons-material/Work';
import GroupIcon from '@mui/icons-material/Group';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';

const EmptyState = ({ type, onAction, currentModule }) => {
  // Configuration for different empty states
  const stateConfig = {
    tasks: {
      icon: WorkIcon,
      title: `No ${currentModule || 'Tasks'} Yet`,
      description: `Get started by creating your first ${currentModule?.toLowerCase() || 'task'}. Break down your ${currentModule?.toLowerCase() || 'project'} into manageable pieces and track progress effectively.`,
      buttonText: `Create ${currentModule || 'Task'}`,
      color: "#2196F3" // Material UI Blue
    },
    projects: {
      icon: DescriptionIcon,
      title: "No Projects Yet",
      description: "Start your journey by creating your first project. Organize and track your work in one place.",
      buttonText: "Create Project",
      color: "#1976D2" // Darker Blue
    },
    team: {
      icon: GroupIcon,
      title: "No Team Members Yet",
      description: "Build your team by inviting members to collaborate on your projects.",
      buttonText: "Add Team Members",
      color: "#1565C0" // Even Darker Blue
    },
    analytics: {
      icon: AnalyticsIcon,
      title: "No Analytics Data",
      description: "Start tracking your project progress to view analytics and insights.",
      buttonText: "View Guide",
      color: "#0D47A1" // Deepest Blue
    },
    emails: {
      icon: EmailIcon,
      title: "No Emails Yet",
      description: "Create and send your first email campaign to engage with your team.",
      buttonText: "Compose Email",
      color: "#2196F3" // Material UI Blue
    }
  };

  const config = stateConfig[type] || stateConfig.tasks;
  const IconComponent = config.icon;

  const handleAction = (e) => {
    e.preventDefault();
    if (typeof onAction === 'function') {
      // Call the onAction with no arguments to open the dialog instead of directly creating
      onAction();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          textAlign: 'center',
          p: 3,
          background: `linear-gradient(45deg, ${config.color}15, ${config.color}05)`,
          borderRadius: 4
        }}
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, 0],
            transition: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <IconComponent
            sx={{
              fontSize: 120,
              color: config.color,
              opacity: 0.9,
              mb: 4,
              filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1))'
            }}
          />
        </motion.div>

        <Typography 
          variant="h4" 
          sx={{ 
            color: config.color,
            fontWeight: 600,
            mb: 2,
            textShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {config.title}
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4, 
            maxWidth: 500,
            color: 'text.secondary',
            fontSize: '1.1rem',
            lineHeight: 1.6
          }}
        >
          {config.description}
        </Typography>

        <motion.div
          whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 0] }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAction}
            size="large"
            sx={{
              backgroundColor: config.color,
              '&:hover': {
                backgroundColor: `${config.color}dd`,
              },
              px: 4,
              py: 1.5,
              borderRadius: 2,
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            {config.buttonText}
          </Button>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default EmptyState; 