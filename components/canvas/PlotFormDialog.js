'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Stack, CircularProgress,
  InputAdornment, Autocomplete,
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'token', label: 'Token' },
  { value: 'booked', label: 'Booked' },
  { value: 'halfpayment', label: 'Half Payment' },
  { value: 'sold', label: 'Sold' },
];

const EMPTY_FORM = {
  plotNumber: '',
  area: '',
  length: '',
  width: '',
  price: '',
  status: 'available',
  customerId: null,
  assignedAgent: null,
  notes: '',
};

export default function PlotFormDialog({ open, onClose, onSave, projectId, initialData, editMode }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchAgents();
      if (initialData) {
        setForm({
          plotNumber: initialData.plotNumber || '',
          area: initialData.area || '',
          length: initialData.length || '',
          width: initialData.width || '',
          price: initialData.price || '',
          status: initialData.status || 'available',
          customerId: initialData.customerId?._id || initialData.customerId || null,
          assignedAgent: initialData.assignedAgent?._id || initialData.assignedAgent || null,
          notes: initialData.notes || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [open, initialData]);

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get('/api/customers');
      if (data.success) setCustomers(data.data);
    } catch {}
  };

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get('/api/agents');
      if (data.success) setAgents(data.data);
    } catch {}
  };

  const validate = () => {
    const e = {};
    if (!form.plotNumber.trim()) e.plotNumber = 'Plot number is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await onSave(form);
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to save plot', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm({ ...form, [field]: e.target.value }),
    error: !!errors[field],
    helperText: errors[field],
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1a3c5e' }}>
        {editMode ? 'Edit Plot' : 'New Plot Details'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          <TextField label="Plot Number *" fullWidth {...f('plotNumber')} placeholder="e.g. A-101" />
          <Stack direction="row" spacing={2}>
            <TextField label="Area" fullWidth {...f('area')} placeholder="e.g. 1200 sq.ft" />
            <TextField label="Length" fullWidth {...f('length')} placeholder="e.g. 40 ft" />
            <TextField label="Width" fullWidth {...f('width')} placeholder="e.g. 30 ft" />
          </Stack>
          <TextField
            label="Price"
            fullWidth
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
          />
          <TextField label="Status" select fullWidth value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </TextField>

          <Autocomplete
            options={customers}
            getOptionLabel={(o) => typeof o === 'object' ? `${o.name} — ${o.mobile}` : o}
            value={customers.find(c => c._id === form.customerId) || null}
            onChange={(_, v) => setForm({ ...form, customerId: v?._id || null })}
            renderInput={(params) => <TextField {...params} label="Assign Customer (optional)" />}
          />

          <Autocomplete
            options={agents}
            getOptionLabel={(o) => typeof o === 'object' ? o.name : o}
            value={agents.find(a => a._id === form.assignedAgent) || null}
            onChange={(_, v) => setForm({ ...form, assignedAgent: v?._id || null })}
            renderInput={(params) => <TextField {...params} label="Assign Agent (optional)" />}
          />

          <TextField label="Notes" fullWidth multiline rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editMode ? 'Save Changes' : 'Create Plot'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
