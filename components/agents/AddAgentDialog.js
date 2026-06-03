'use client';

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

export default function AddAgentDialog({ open, onClose, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/agents', form);
      if (data.success) {
        enqueueSnackbar('Agent created successfully!', { variant: 'success' });
        onSuccess?.();
        handleClose();
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to create agent', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: '', email: '', password: '' });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1a3c5e' }}>Add New Agent</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          <TextField label="Full Name *" fullWidth value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            error={!!errors.name} helperText={errors.name} />
          <TextField label="Email *" fullWidth type="email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            error={!!errors.email} helperText={errors.email} />
          <TextField label="Password *" fullWidth type="password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            error={!!errors.password} helperText={errors.password}
            placeholder="Minimum 6 characters" />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create Agent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
