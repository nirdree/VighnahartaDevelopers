'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Stack, Typography, Box,
  Divider, CircularProgress, Chip, InputAdornment,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { PLOT_STATUS_COLORS, PLOT_STATUS_LABELS } from '@/lib/constants';

const PAYMENT_TYPES = [
  { value: 'token', label: 'Token Amount' },
  { value: 'partial', label: 'Partial Payment' },
  { value: 'emi', label: 'EMI' },
  { value: 'full', label: 'Full Payment' },
];

const EMPTY = { amount: '', paymentType: 'token', paymentDate: new Date().toISOString().split('T')[0], note: '' };

export default function PaymentDialog({ open, onClose, plot, onPaymentAdded }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY);
  const [payments, setPayments] = useState([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchPayments = useCallback(async () => {
    if (!plot?._id) return;
    setFetching(true);
    try {
      const { data } = await axios.get(`/api/plots/${plot._id}?payments=true`);
      if (data.success) { setPayments(data.data); setTotalPaid(data.totalPaid); }
    } catch {}
    setFetching(false);
  }, [plot?._id]);

  useEffect(() => {
    if (open) { fetchPayments(); setForm(EMPTY); }
  }, [open, fetchPayments]);

  const handleAdd = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      enqueueSnackbar('Enter a valid amount', { variant: 'warning' }); return;
    }
    if (!plot.customerId) {
      enqueueSnackbar('Assign a customer to the plot before adding payments', { variant: 'warning' }); return;
    }
    setLoading(true);
    try {
      const customerId = typeof plot.customerId === 'object' ? plot.customerId._id : plot.customerId;
      const { data } = await axios.patch(`/api/plots/${plot._id}`, { ...form, amount: Number(form.amount), customerId });
      if (data.success) {
        enqueueSnackbar('Payment recorded', { variant: 'success' });
        setForm(EMPTY);
        fetchPayments();
        onPaymentAdded?.(data.data);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to record payment', { variant: 'error' });
    }
    setLoading(false);
  };

  const remaining = plot ? Math.max(0, (plot.price || 0) - totalPaid) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: '#1a3c5e', display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentsIcon sx={{ color: '#c8922a' }} />
        Payment Management — Plot {plot?.plotNumber}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          {/* Summary */}
          <Stack direction="row" spacing={2}>
            <Box flex={1} sx={{ bgcolor: '#e8f5e9', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="#555">Total Price</Typography>
              <Typography fontWeight={700} color="#1a3c5e">₹{Number(plot?.price || 0).toLocaleString('en-IN')}</Typography>
            </Box>
            <Box flex={1} sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="#555">Total Paid</Typography>
              <Typography fontWeight={700} color="#2e7d32">₹{totalPaid.toLocaleString('en-IN')}</Typography>
            </Box>
            <Box flex={1} sx={{ bgcolor: '#fff3e0', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="#555">Remaining</Typography>
              <Typography fontWeight={700} color="#e65100">₹{remaining.toLocaleString('en-IN')}</Typography>
            </Box>
          </Stack>

          <Divider />

          {/* Add payment form */}
          <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">Add Payment</Typography>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Amount *"
              type="number"
              fullWidth
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <TextField
              label="Type *"
              select
              fullWidth
              value={form.paymentType}
              onChange={e => setForm({ ...form, paymentType: e.target.value })}
            >
              {PAYMENT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Date"
              type="date"
              fullWidth
              value={form.paymentDate}
              onChange={e => setForm({ ...form, paymentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Note"
              fullWidth
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
            />
          </Stack>

          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={loading}
            sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' }, alignSelf: 'flex-start' }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Record Payment'}
          </Button>

          <Divider />

          {/* Payment history */}
          <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">Payment History</Typography>
          {fetching ? (
            <CircularProgress size={24} />
          ) : payments.length === 0 ? (
            <Typography variant="body2" color="#999">No payments recorded yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {payments.map(p => (
                <Box key={p._id} sx={{ bgcolor: '#f5f7fa', p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#1a3c5e">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="#666">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        {p.note ? ` — ${p.note}` : ''}
                        {p.recordedBy ? ` · ${p.recordedBy.name}` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={PAYMENT_TYPES.find(t => t.value === p.paymentType)?.label || p.paymentType}
                      size="small"
                      sx={{ bgcolor: '#1a3c5e', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
