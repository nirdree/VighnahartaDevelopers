'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Stack, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Card, CardContent, Chip, IconButton, Avatar, Grid, Skeleton,
  Drawer, Divider, LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import GridOnIcon from '@mui/icons-material/GridOn';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { PLOT_STATUS_COLORS, PLOT_STATUS_LABELS } from '@/lib/constants';

const EMPTY_FORM = { name: '', mobile: '', email: '', address: '', notes: '' };
const PAYMENT_TYPE_LABELS = { token: 'Token', partial: 'Partial', emi: 'EMI', full: 'Full Payment' };
const PAYMENT_TYPE_COLORS = { token: '#ff9800', partial: '#2196f3', emi: '#9c27b0', full: '#4caf50' };

function CustomerCard({ customer, onEdit, onView }) {
  return (
    <Card sx={{ height: '100%', cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}
      onClick={onView}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#1a3c5e', fontWeight: 700, width: 40, height: 40 }}>
              {customer.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">{customer.name}</Typography>
              <Typography variant="caption" color="#aaa">
                Added {new Date(customer.createdAt).toLocaleDateString('en-IN')}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(customer); }} sx={{ color: '#1a3c5e' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>
        <Stack spacing={0.8}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PhoneIcon sx={{ fontSize: 14, color: '#c8922a' }} />
            <Typography variant="body2" color="#444" fontWeight={500}>{customer.mobile}</Typography>
          </Stack>
          {customer.email && (
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon sx={{ fontSize: 14, color: '#2196f3' }} />
              <Typography variant="body2" color="#444" noWrap>{customer.email}</Typography>
            </Stack>
          )}
          {customer.address && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <LocationOnIcon sx={{ fontSize: 14, color: '#4caf50', mt: 0.2 }} />
              <Typography variant="body2" color="#666" sx={{ lineHeight: 1.5 }}>{customer.address}</Typography>
            </Stack>
          )}
        </Stack>
        <Box mt={1.5}>
          <Typography variant="caption" color="#aaa" fontWeight={600}>TAP TO VIEW DETAILS →</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function CustomerDetailDrawer({ customerId, open, onClose, onEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !customerId) return;
    setLoading(true);
    axios.get(`/api/customers/${customerId}`)
      .then(res => { if (res.data.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, [open, customerId]);

  const customer = data?.data;
  const plots = data?.plots || [];
  const payments = data?.payments || [];
  const totalPaid = data?.totalPaid || 0;
  const totalPlotValue = data?.totalPlotValue || 0;
  const remaining = Math.max(0, totalPlotValue - totalPaid);

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 440 }, p: 0 } }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#1a3c5e', p: 3, color: 'white' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: '#c8922a', width: 48, height: 48, fontWeight: 800, fontSize: '1.2rem' }}>
              {customer?.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800}>{customer?.name}</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PhoneIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">{customer?.mobile}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={() => onEdit(customer)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Payment summary */}
        {!loading && (
          <Stack direction="row" spacing={1.5} mt={2.5}>
            <Box flex={1} sx={{ bgcolor: 'rgba(255,255,255,0.08)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">Plot Value</Typography>
              <Typography variant="subtitle2" fontWeight={800} color="white">
                ₹{totalPlotValue.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box flex={1} sx={{ bgcolor: 'rgba(76,175,80,0.2)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">Total Paid</Typography>
              <Typography variant="subtitle2" fontWeight={800} color="#a5d6a7">
                ₹{totalPaid.toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box flex={1} sx={{ bgcolor: 'rgba(244,67,54,0.2)', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">Remaining</Typography>
              <Typography variant="subtitle2" fontWeight={800} color="#ef9a9a">
                ₹{remaining.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      <Box sx={{ overflowY: 'auto', flex: 1, p: 2.5 }}>
        {loading ? (
          <Stack spacing={1.5}>{[1,2,3,4].map(i => <Skeleton key={i} height={60} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : (
          <Stack spacing={3}>
            {/* Plots */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <GridOnIcon sx={{ fontSize: 18, color: '#1a3c5e' }} />
                <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">
                  Assigned Plots ({plots.length})
                </Typography>
              </Stack>
              {plots.length === 0 ? (
                <Typography variant="body2" color="#bbb">No plots assigned yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {plots.map(plot => {
                    const paidForPlot = payments.filter(p => p.plotId?.toString() === plot._id?.toString()).reduce((s, p) => s + p.amount, 0);
                    const pct = plot.price ? Math.min(100, Math.round((paidForPlot / plot.price) * 100)) : 0;
                    return (
                      <Box key={plot._id} sx={{ bgcolor: '#f5f7fa', borderRadius: 2, p: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.8}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={700} color="#1a3c5e">Plot {plot.plotNumber}</Typography>
                            <Chip label={PLOT_STATUS_LABELS[plot.status] || plot.status} size="small"
                              sx={{ bgcolor: PLOT_STATUS_COLORS[plot.status], color: plot.status === 'token' ? '#333' : 'white', fontWeight: 700, height: 18, fontSize: '0.65rem' }} />
                          </Stack>
                          <Typography variant="caption" color="#888">{plot.projectId?.name}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="#666">
                            ₹{paidForPlot.toLocaleString('en-IN')} paid of ₹{(plot.price || 0).toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} color="#1a3c5e">{pct}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={pct} sx={{
                          height: 6, borderRadius: 3, bgcolor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': { bgcolor: PLOT_STATUS_COLORS[plot.status], borderRadius: 3 },
                        }} />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Payment ledger */}
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <CurrencyRupeeIcon sx={{ fontSize: 18, color: '#1a3c5e' }} />
                <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">
                  Payment Ledger ({payments.length})
                </Typography>
              </Stack>
              {payments.length === 0 ? (
                <Typography variant="body2" color="#bbb">No payments recorded yet.</Typography>
              ) : (
                <Stack spacing={1}>
                  {payments.map((p, i) => (
                    <Stack key={p._id} direction="row" justifyContent="space-between" alignItems="center"
                      sx={{ bgcolor: i % 2 === 0 ? '#f9f9f9' : 'white', borderRadius: 1.5, px: 1.5, py: 1 }}>
                      <Box>
                        <Chip label={PAYMENT_TYPE_LABELS[p.paymentType] || p.paymentType} size="small"
                          sx={{ bgcolor: (PAYMENT_TYPE_COLORS[p.paymentType] || '#999') + '20',
                            color: PAYMENT_TYPE_COLORS[p.paymentType] || '#999', fontWeight: 700, fontSize: '0.65rem', height: 18, mb: 0.3 }} />
                        <Typography variant="caption" color="#aaa" display="block">
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                          {p.note ? ` · ${p.note}` : ''}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={800} color="#2e7d32">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </Typography>
                    </Stack>
                  ))}

                  {/* Total row */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center"
                    sx={{ bgcolor: '#e8f5e9', borderRadius: 2, px: 1.5, py: 1.2, mt: 0.5 }}>
                    <Typography variant="body2" fontWeight={700} color="#2e7d32">Total Collected</Typography>
                    <Typography variant="subtitle2" fontWeight={800} color="#2e7d32">
                      ₹{totalPaid.toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </Box>

            {/* Contact info */}
            {(customer?.email || customer?.address || customer?.notes) && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e" mb={1}>Contact Info</Typography>
                  <Stack spacing={1}>
                    {customer.email && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <EmailIcon sx={{ fontSize: 15, color: '#2196f3' }} />
                        <Typography variant="body2" color="#444">{customer.email}</Typography>
                      </Stack>
                    )}
                    {customer.address && (
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <LocationOnIcon sx={{ fontSize: 15, color: '#4caf50', mt: 0.2 }} />
                        <Typography variant="body2" color="#666">{customer.address}</Typography>
                      </Stack>
                    )}
                    {customer.notes && (
                      <Box sx={{ bgcolor: '#f5f7fa', borderRadius: 1.5, p: 1.2 }}>
                        <Typography variant="caption" color="#666" sx={{ fontStyle: 'italic' }}>{customer.notes}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
    else fetchCustomers();
  }, [user]);

  const fetchCustomers = async (q = '') => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/customers${q ? `?search=${q}` : ''}`);
      if (data.success) setCustomers(data.data);
    } catch { enqueueSnackbar('Failed to load customers', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(window._st);
    window._st = setTimeout(() => fetchCustomers(val), 400);
  };

  const openAdd = () => { setEditCustomer(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true); };
  const openEdit = (c) => {
    setEditCustomer(c);
    setForm({ name: c.name, mobile: c.mobile, email: c.email || '', address: c.address || '', notes: c.notes || '' });
    setErrors({});
    setDialogOpen(true);
    setDrawerOpen(false);
  };
  const openView = (c) => { setSelectedId(c._id); setDrawerOpen(true); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      let res;
      if (editCustomer) {
        res = await axios.put(`/api/customers/${editCustomer._id}`, form);
        enqueueSnackbar('Customer updated!', { variant: 'success' });
      } else {
        res = await axios.post('/api/customers', form);
        enqueueSnackbar('Customer added!', { variant: 'success' });
      }
      if (res.data.success) { setDialogOpen(false); fetchCustomers(search); }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to save customer', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm({ ...form, [field]: e.target.value }),
    error: !!errors[field],
    helperText: errors[field],
  });

  return (
    <AppShell>
      <Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1a3c5e">Customers</Typography>
            <Typography variant="body2" color="#888" mt={0.5}>{customers.length} customer{customers.length !== 1 ? 's' : ''} registered</Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField size="small" placeholder="Search name or mobile..."
              value={search} onChange={handleSearch}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment> }}
              sx={{ width: { xs: '100%', sm: 240 } }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
              sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' }, whiteSpace: 'nowrap' }}>
              Add Customer
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Grid container spacing={2.5}>
            {[1,2,3,4,5,6].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : customers.length === 0 ? (
          <Box textAlign="center" py={10}>
            <PersonIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
            <Typography variant="h5" color="#bbb" fontWeight={700}>No Customers Found</Typography>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 3, bgcolor: '#1a3c5e' }} onClick={openAdd}>
              Add First Customer
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {customers.map(c => (
              <Grid item xs={12} sm={6} md={4} key={c._id}>
                <CustomerCard customer={c} onEdit={openEdit} onView={() => openView(c)} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <CustomerDetailDrawer
        customerId={selectedId}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={openEdit}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} color="#1a3c5e">
          {editCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField label="Full Name *" fullWidth {...f('name')} />
            <TextField label="Mobile Number *" fullWidth {...f('mobile')} type="tel" />
            <TextField label="Email" fullWidth {...f('email')} type="email" />
            <TextField label="Address" fullWidth {...f('address')} multiline rows={2} />
            <TextField label="Notes" fullWidth {...f('notes')} multiline rows={2} placeholder="Any additional notes..." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}>
            {saving ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editCustomer ? 'Save Changes' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
