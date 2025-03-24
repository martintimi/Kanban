import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip
} from '@mui/material';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useOrganization } from '../../context/OrganizationContext';
import CustomLoader from '../CustomLoader';
import { formatDistanceToNow } from 'date-fns';

const ProjectHistory = () => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { selectedOrg } = useOrganization();

  const fetchProjectHistory = async () => {
    if (!selectedOrg?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const historyRef = collection(db, 'projectHistory');
      const q = query(
        historyRef,
        where('organizationId', '==', selectedOrg.id),
        orderBy('timestamp', 'desc'),
        limit(rowsPerPage)
      );

      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      setHistory(historyData);
    } catch (error) {
      console.error('Error fetching project history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectHistory();
  }, [selectedOrg?.id, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'success';
      case 'updated': return 'info';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Project History
      </Typography>
      
      {loading ? (
        <CustomLoader message="Loading project history..." />
      ) : (
        <Paper 
          elevation={2}
          sx={{ 
            width: '100%', 
            overflow: 'hidden',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Project</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.default' }}>Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.projectName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.action}
                        color={getActionColor(item.action)}
                        size="small"
                        sx={{ minWidth: 75 }}
                      />
                    </TableCell>
                    <TableCell>{item.userName}</TableCell>
                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.details}
                    </TableCell>
                    <TableCell>
                      {item.timestamp ? formatDistanceToNow(item.timestamp, { addSuffix: true }) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No project history available
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={-1}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default ProjectHistory; 