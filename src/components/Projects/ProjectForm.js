import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  Autocomplete
} from '@mui/material';

const PROJECT_CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Research',
  'Infrastructure',
  'Testing',
  'Documentation',
  'Maintenance'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#0DA86C' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' }
];

const ProjectForm = ({ formData, setFormData }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="Project Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <TextField
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />

      <FormControl fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          value={formData.category || ''}
          label="Category"
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          {PROJECT_CATEGORIES.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Priority</InputLabel>
        <Select
          value={formData.priority || 'medium'}
          label="Priority"
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          {PRIORITY_LEVELS.map((priority) => (
            <MenuItem key={priority.value} value={priority.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: priority.color
                  }}
                />
                {priority.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        type="date"
        label="Deadline"
        value={formData.deadline || ''}
        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
        InputLabelProps={{ shrink: true }}
      />
    </Box>
  );
};

export default ProjectForm; 