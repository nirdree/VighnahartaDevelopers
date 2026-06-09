'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Typography, Box,
  Divider, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const PAYMENT_TYPES = [
  { value: 'token', label: 'Token Amount' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'emi', label: 'EMI' },
  { value: 'full', label: 'Full Payment' },
];

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

const emptyCustomer = () => ({ name: '', mobile: '' });

const EMPTY = {
  customers: [emptyCustomer()],
  email: '',
  address: '',
  notes: '',
  finalPlotPrice: '',
  amount: '',
  paymentType: 'token',
  paymentMode: 'cash',
  paymentDate: new Date().toISOString().split('T')[0],
  nextInstalmentDate: '',
  agentId: '',
  agentCommission: '',
};

export default function BookingDialog({ open, onClose, plot, onBooked }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, finalPlotPrice: plot?.price || '' });
      axios.get('/api/agents').then(r => { if (r.data.success) setAgents(r.data.data); }).catch(() => {});
    }
  }, [open, plot]);

  const setCustomer = (i, field, val) => {
    const updated = form.customers.map((c, idx) => idx === i ? { ...c, [field]: val } : c);
    setForm({ ...form, customers: updated });
  };

  const addCustomer = () => setForm({ ...form, customers: [...form.customers, emptyCustomer()] });
  const removeCustomer = (i) => setForm({ ...form, customers: form.customers.filter((_, idx) => idx !== i) });

  const handleSubmit = async () => {
    const primary = form.customers[0];
    if (!primary.name.trim() || !primary.mobile.trim()) {
      enqueueSnackbar('Primary customer name and mobile are required', { variant: 'warning' }); return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      enqueueSnackbar('Enter a valid payment amount', { variant: 'warning' }); return;
    }
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/plots/${plot._id}`, {
        customers: form.customers.filter(c => c.name && c.mobile),
        email: form.email,
        address: form.address,
        notes: form.notes,
        finalPlotPrice: form.finalPlotPrice,
        amount: Number(form.amount),
        paymentType: form.paymentType,
        paymentMode: form.paymentMode,
        paymentDate: form.paymentDate,
        nextInstalmentDate: form.nextInstalmentDate || undefined,
        agentId: form.agentId || undefined,
        agentCommission: form.agentCommission || undefined,
      });
      if (data.success) {
        enqueueSnackbar('Plot booked successfully!', { variant: 'success' });
        onBooked?.(data.data);
        onClose();
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Booking failed', { variant: 'error' });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1a3c5e', display: 'flex', alignItems: 'center', gap: 1 }}>
        <BookmarkAddIcon sx={{ color: '#c8922a' }} />
        Book Plot — {plot?.plotNumber}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} pt={1}>

          {/* Customer(s) */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">Customer Details</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addCustomer} sx={{ color: '#1a3c5e' }}>
                Add Co-buyer
              </Button>
            </Stack>
            <Stack spacing={1.5}>
              {form.customers.map((c, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={i === 0 ? 'Name *' : `Co-buyer ${i} Name`}
                    size="small" fullWidth
                    value={c.name}
                    onChange={e => setCustomer(i, 'name', e.target.value)}
                  />
                  <TextField
                    label="Mobile *"
                    size="small" fullWidth
                    value={c.mobile}
                    onChange={e => setCustomer(i, 'mobile', e.target.value)}
                  />
                  {i > 0 && (
                    <IconButton size="small" onClick={() => removeCustomer(i)} color="error">
                      <RemoveCircleOutlineIcon />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>

          <Stack direction="row" spacing={2}>
            <TextField label="Email" fullWidth size="small" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <TextField label="Address" fullWidth size="small" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </Stack>
          <TextField label="Notes" fullWidth size="small" multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

          <Divider />

          {/* Payment */}
          <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">Payment Details</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Final Plot Price"
              fullWidth size="small" type="number"
              value={form.finalPlotPrice}
              onChange={e => setForm({ ...form, finalPlotPrice: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <TextField
              label="Amount Paid *"
              fullWidth size="small" type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Payment Type *" select fullWidth size="small" value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value })}>
              {PAYMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Payment Mode" select fullWidth size="small" value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>
              {PAYMENT_MODES.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Payment Date" type="date" fullWidth size="small" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} InputLabelProps={{ shrink: true }} />
            <TextField label="Next Instalment Date" type="date" fullWidth size="small" value={form.nextInstalmentDate} onChange={e => setForm({ ...form, nextInstalmentDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          </Stack>

          <Divider />

          {/* Agent */}
          <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">Agent Information</Typography>
          <Stack direction="row" spacing={2}>
            <TextField label="Assign Agent" select fullWidth size="small" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}>
              <MenuItem value="">None</MenuItem>
              {agents.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}
            </TextField>
            <TextField
              label="Agent Commission"
              fullWidth size="small" type="number"
              value={form.agentCommission}
              onChange={e => setForm({ ...form, agentCommission: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
          </Stack>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <BookmarkAddIcon />}
          sx={{ bgcolor: '#c8922a', '&:hover': { bgcolor: '#a57420' } }}
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
