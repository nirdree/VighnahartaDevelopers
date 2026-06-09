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

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

const EMPTY = { 
  amount: '', 
  paymentType: 'token', 
  paymentDate: new Date().toISOString().split('T')[0], 
  paymentMode: 'cash',
  finalPlotPrice: '',
  nextInstalmentDate: '',
  note: '' 
};

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

  const remaining = (() => {
    // Use final plot price if available, otherwise use original plot price
    const effectivePrice = payments.length > 0 && payments[0].finalPlotPrice 
      ? payments[0].finalPlotPrice 
      : (plot?.price || 0);
    return Math.max(0, effectivePrice - totalPaid);
  })();

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
              <Typography variant="caption" color="#555">
                {payments.length > 0 && payments[0].finalPlotPrice ? 'Final Price' : 'Plot Price'}
              </Typography>
              <Typography fontWeight={700} color="#1a3c5e">
                ₹{Number(payments.length > 0 && payments[0].finalPlotPrice ? payments[0].finalPlotPrice : (plot?.price || 0)).toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box flex={1} sx={{ bgcolor: '#e3f2fd', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="#555">Total Paid</Typography>
              <Typography fontWeight={700} color="#2e7d32">₹{totalPaid.toLocaleString('en-IN')}</Typography>
            </Box>
            <Box flex={1} sx={{ bgcolor: '#fff3e0', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="#555">Pending</Typography>
              <Typography fontWeight={700} color="#e65100">₹{remaining.toLocaleString('en-IN')}</Typography>
            </Box>
          </Stack>

          {/* Show latest final price if recorded */}
          {payments.length > 0 && payments[0].finalPlotPrice && (
            <Box sx={{ bgcolor: '#f3e5f5', p: 2, borderRadius: 2, border: '2px solid #9c27b0' }}>
              <Typography variant="subtitle2" fontWeight={700} color="#6a1b9a">
                💰 Final Price (Customer Will Pay)
              </Typography>
              <Typography variant="h5" fontWeight={700} color="#1a3c5e" mt={0.5}>
                ₹{Number(payments[0].finalPlotPrice).toLocaleString('en-IN')}
              </Typography>
            </Box>
          )}

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
              label="Payment Mode"
              select
              fullWidth
              value={form.paymentMode}
              onChange={e => setForm({ ...form, paymentMode: e.target.value })}
            >
              {PAYMENT_MODES.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Final Plot Price"
              type="number"
              fullWidth
              placeholder={plot?.price || 'Leave blank for default'}
              value={form.finalPlotPrice}
              onChange={e => setForm({ ...form, finalPlotPrice: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            />
            <TextField
              label="Next Instalment Date"
              type="date"
              fullWidth
              value={form.nextInstalmentDate}
              onChange={e => setForm({ ...form, nextInstalmentDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <TextField
            label="Note"
            fullWidth
            multiline
            rows={2}
            value={form.note}
            onChange={e => setForm({ ...form, note: e.target.value })}
          />

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
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#1a3c5e">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" color="#666">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                        {p.paymentMode && ` • ${p.paymentMode}`}
                        {p.recordedBy ? ` • ${p.recordedBy.name}` : ''}
                      </Typography>
                    </Box>
                    <Chip
                      label={PAYMENT_TYPES.find(t => t.value === p.paymentType)?.label || p.paymentType}
                      size="small"
                      sx={{ bgcolor: '#1a3c5e', color: 'white', fontWeight: 600, fontSize: '0.7rem' }}
                    />
                  </Stack>
                  {p.note && (
                    <Typography variant="caption" color="#666" display="block" mb={0.5}>
                      📝 {p.note}
                    </Typography>
                  )}
                  {p.finalPlotPrice && (
                    <Typography variant="caption" color="#1a3c5e" display="block" fontWeight={600} mb={0.5}>
                      Final Price: ₹{Number(p.finalPlotPrice).toLocaleString('en-IN')}
                    </Typography>
                  )}
                  {p.nextInstalmentDate && (
                    <Box sx={{ bgcolor: '#fff9c4', px: 1, py: 0.5, borderRadius: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="#e65100" fontWeight={600}>
                        📅 Next Payment: {new Date(p.nextInstalmentDate).toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                  )}
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
