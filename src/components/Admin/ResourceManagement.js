import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useOrganization } from '../../context/OrganizationContext';
import CustomLoader from '../common/CustomLoader';

const ResourceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [resources, setResources] = useState([]);
  const { selectedOrg } = useOrganization();

  const fetchResources = async () => {
    try {
      setLoading(true);
      if (!selectedOrg?.id) return;

      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('organizations', 'array-contains', selectedOrg.id)
      );

      const snapshot = await getDocs(q);
      const resourceData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setResources(resourceData);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [selectedOrg?.id]);

  if (loading) {
    return <CustomLoader message="Loading resource data..." />;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Resource Management
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Team Overview
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total Team Members: {resources.length}
            </Typography>
          </Paper>
        </Grid>

        {resources.map((resource) => (
          <Grid item xs={12} md={6} lg={4} key={resource.id}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {resource.displayName || resource.email}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Role: {resource.role || 'Member'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Email: {resource.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {resource.status || 'Active'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ResourceManagement; 