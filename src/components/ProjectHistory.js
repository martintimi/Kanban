import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Badge
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import {
  Event,
  Person,
  Description,
  Delete,
  Edit,
  Add,
  Check,
  FilterList,
  CheckCircle,
  Warning,
  Info,
  Error,
  AccessTime,
  Cached,
  MoreVert,
  Download,
  Timeline as TimelineIcon,
  CalendarMonth,
  Group,
  ArrowRight
} from '@mui/icons-material';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatDistance, format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { useOrganization } from '../context/OrganizationContext';

const ProjectHistory = ({ projectId: propProjectId }) => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [exportData, setExportData] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const { projectId: urlProjectId } = useParams();
  const { selectedOrg } = useOrganization();
  const navigate = useNavigate();
  
  // Use projectId from props, URL params, or first project from org
  const projectId = propProjectId || urlProjectId || selectedOrg?.projects?.[0]?.id;
  
  // If we still don't have a projectId, show a message or redirect
  useEffect(() => {
    if (!projectId && selectedOrg?.projects?.length > 0) {
      navigate(`/admin/project-history/${selectedOrg.projects[0].id}`);
    }
  }, [projectId, selectedOrg, navigate]);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadProjectHistory();
    }
  }, [projectId]);

  useEffect(() => {
    prepareExportData();
  }, [events]);

  const loadProject = async () => {
    try {
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (projectDoc.exists()) {
        setProject({ id: projectDoc.id, ...projectDoc.data() });
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadProjectHistory = async () => {
    try {
      setLoading(true);
      
      // Query for project events
      const eventsQuery = query(
        collection(db, 'events'),
        where('projectId', '==', projectId),
        orderBy('timestamp', 'desc')
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = [];
      
      // We'll need to fetch user data
      const userIds = new Set();
      
      eventsSnapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.userId) userIds.add(data.userId);
        if (data.targetUserId) userIds.add(data.targetUserId);
        eventsData.push(data);
      });
      
      // Fetch task events too
      const taskEventsQuery = query(
        collection(db, 'events'),
        where('projectId', '==', projectId),
        where('entityType', '==', 'task'),
        orderBy('timestamp', 'desc')
      );
      
      const taskEventsSnapshot = await getDocs(taskEventsQuery);
      taskEventsSnapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (data.userId) userIds.add(data.userId);
        if (data.targetUserId) userIds.add(data.targetUserId);
        eventsData.push(data);
      });
      
      // Fetch user data
      const usersData = {};
      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          usersData[userId] = userDoc.data();
        }
      }
      
      setUsers(usersData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading project history:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareExportData = () => {
    const csvData = [
      ['Event Type', 'Description', 'User', 'Date', 'Details']
    ];
    
    events.forEach(event => {
      const userName = users[event.userId]?.displayName || users[event.userId]?.email || 'Unknown User';
      const date = event.timestamp?.toDate ? format(event.timestamp.toDate(), 'yyyy-MM-dd HH:mm:ss') : 'Unknown Date';
      
      csvData.push([
        event.type,
        getEventDescription(event),
        userName,
        date,
        JSON.stringify(event.details || {})
      ]);
    });
    
    setExportData(csvData);
  };

  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
  };

  const handleDateRangeChange = (event) => {
    setDateRange(event.target.value);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'task_created': return <Add color="primary" />;
      case 'task_updated': return <Edit color="secondary" />;
      case 'task_deleted': return <Delete color="error" />;
      case 'task_completed': return <CheckCircle color="success" />;
      case 'task_assigned': return <Person color="info" />;
      case 'task_status_changed': return <Cached color="warning" />;
      case 'member_added': return <Group color="primary" />;
      case 'member_removed': return <Group color="error" />;
      case 'comment_added': return <Description color="secondary" />;
      case 'deadline_changed': return <Event color="warning" />;
      case 'project_created': return <Add color="success" />;
      case 'project_updated': return <Edit color="info" />;
      default: return <Info color="default" />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'task_created': return 'primary';
      case 'task_updated': return 'secondary';
      case 'task_deleted': return 'error';
      case 'task_completed': return 'success';
      case 'task_assigned': return 'info';
      case 'task_status_changed': return 'warning';
      case 'member_added': return 'primary';
      case 'member_removed': return 'error';
      case 'comment_added': return 'secondary';
      case 'deadline_changed': return 'warning';
      case 'project_created': return 'success';
      case 'project_updated': return 'info';
      default: return 'default';
    }
  };

  const getEventDescription = (event) => {
    const userName = users[event.userId]?.displayName || users[event.userId]?.email || 'Unknown User';
    const targetUserName = users[event.targetUserId]?.displayName || users[event.targetUserId]?.email || 'a user';
    
    switch (event.type) {
      case 'task_created':
        return `${userName} created task "${event.entityName || 'Unknown Task'}"`;
      case 'task_updated':
        return `${userName} updated task "${event.entityName || 'Unknown Task'}"`;
      case 'task_deleted':
        return `${userName} deleted task "${event.entityName || 'Unknown Task'}"`;
      case 'task_completed':
        return `${userName} completed task "${event.entityName || 'Unknown Task'}"`;
      case 'task_assigned':
        return `${userName} assigned task "${event.entityName || 'Unknown Task'}" to ${targetUserName}`;
      case 'task_status_changed':
        return `${userName} changed status of "${event.entityName || 'Unknown Task'}" from ${event.details?.oldStatus || 'Unknown'} to ${event.details?.newStatus || 'Unknown'}`;
      case 'member_added':
        return `${userName} added ${targetUserName} to the project`;
      case 'member_removed':
        return `${userName} removed ${targetUserName} from the project`;
      case 'comment_added':
        return `${userName} commented on task "${event.entityName || 'Unknown Task'}"`;
      case 'deadline_changed':
        return `${userName} changed deadline of "${event.entityName || 'Unknown Task'}"`;
      case 'project_created':
        return `${userName} created the project`;
      case 'project_updated':
        return `${userName} updated project details`;
      default:
        return `${userName} performed action: ${event.type}`;
    }
  };

  const filterEvents = () => {
    let filteredEvents = [...events];
    
    // Filter by type
    if (filterType !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.type === filterType);
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'yesterday':
          startDate = new Date(now.setDate(now.getDate() - 1));
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = event.timestamp?.toDate ? event.timestamp.toDate() : new Date();
          return eventDate >= startDate;
        });
      }
    }
    
    return filteredEvents;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredEvents = filterEvents();

  return (
    <Paper 
      elevation={0}
      variant="outlined"
      sx={{ p: 2, borderRadius: 2 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon color="primary" />
          Project History
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Stack direction="row" spacing={2}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Event Type</InputLabel>
              <Select
                value={filterType}
                onChange={handleFilterChange}
                label="Event Type"
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="task_created">Task Created</MenuItem>
                <MenuItem value="task_updated">Task Updated</MenuItem>
                <MenuItem value="task_deleted">Task Deleted</MenuItem>
                <MenuItem value="task_completed">Task Completed</MenuItem>
                <MenuItem value="task_assigned">Task Assigned</MenuItem>
                <MenuItem value="task_status_changed">Status Changed</MenuItem>
                <MenuItem value="member_added">Member Added</MenuItem>
                <MenuItem value="member_removed">Member Removed</MenuItem>
                <MenuItem value="comment_added">Comment Added</MenuItem>
                <MenuItem value="deadline_changed">Deadline Changed</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRange}
                onChange={handleDateRangeChange}
                label="Date Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          
          <IconButton onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
          
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem>
              <CSVLink 
                data={exportData} 
                filename={`project-history-${projectId}.csv`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
              >
                <ListItemIcon>
                  <Download fontSize="small" />
                </ListItemIcon>
                <ListItemText>Export to CSV</ListItemText>
              </CSVLink>
            </MenuItem>
            <MenuItem onClick={loadProjectHistory}>
              <ListItemIcon>
                <Cached fontSize="small" />
              </ListItemIcon>
              <ListItemText>Refresh History</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {filteredEvents.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography color="text.secondary">No history events found with the current filters.</Typography>
        </Box>
      ) : (
        <Timeline position="alternate">
          {filteredEvents.map((event) => (
            <TimelineItem key={event.id}>
              <TimelineOppositeContent color="text.secondary">
                {event.timestamp?.toDate 
                  ? formatDistance(event.timestamp.toDate(), new Date(), { addSuffix: true })
                  : 'Unknown time'}
                <Typography variant="caption" display="block">
                  {event.timestamp?.toDate 
                    ? format(event.timestamp.toDate(), 'MMM dd, yyyy HH:mm')
                    : ''}
                </Typography>
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <TimelineDot color={getEventColor(event.type)}>
                  {getEventIcon(event.type)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              
              <TimelineContent>
                <Paper 
                  elevation={0} 
                  variant="outlined"
                  sx={{ 
                    p: 2, 
                    mb: 2,
                    borderRadius: 2,
                    borderLeft: `4px solid ${event.type.includes('task') ? '#1976d2' : '#22c55e'}`
                  }}
                >
                  <Typography variant="subtitle1" component="span">
                    {getEventDescription(event)}
                  </Typography>
                  
                  {event.details && Object.keys(event.details).length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {event.type === 'task_status_changed' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            size="small" 
                            label={event.details.oldStatus || 'Unknown'} 
                            color="default"
                          />
                          <ArrowRight fontSize="small" />
                          <Chip 
                            size="small" 
                            label={event.details.newStatus || 'Unknown'} 
                            color={event.details.newStatus === 'Done' ? 'success' : 'primary'}
                          />
                        </Box>
                      )}
                      
                      {event.type === 'task_assigned' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Person fontSize="small" color="primary" />
                          <Typography variant="body2">
                            Assigned to: {users[event.targetUserId]?.displayName || 'Unknown User'}
                          </Typography>
                        </Box>
                      )}
                      
                      {event.details.comment && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            "{event.details.comment}"
                          </Typography>
                        </Box>
                      )}
                      
                      {event.details.timeSpent && (
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Time spent: {Math.round(event.details.timeSpent / (1000 * 60))} minutes
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </Paper>
  );
};

export default ProjectHistory; 