'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

export default function AddProjectDialog({ open, onClose, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ name: '', location: '', description: '', totalArea: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Project name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/projects', form);
      if (data.success) {
        enqueueSnackbar('Project created successfully!', { variant: 'success' });
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to create project', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', location: '', description: '', totalArea: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1a3c5e' }}>Add New Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          <TextField
            label="Project Name *"
            fullWidth
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Location *"
            fullWidth
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            error={!!errors.location}
            helperText={errors.location}
          />
          <TextField
            label="Total Area (e.g. 5 acres)"
            fullWidth
            value={form.totalArea}
            onChange={(e) => setForm({ ...form, totalArea: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
