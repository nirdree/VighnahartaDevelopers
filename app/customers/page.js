'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Stack, TextField, InputAdornment,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Card, CardContent, Chip, IconButton, Avatar, Grid, Skeleton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';

const EMPTY_FORM = { name: '', mobile: '', email: '', address: '', notes: '' };

function CustomerCard({ customer, onEdit }) {
  return (
    <Card sx={{ height: '100%', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)' } }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: '#1a3c5e', fontWeight: 700 }}>
              {customer.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e">{customer.name}</Typography>
              <Typography variant="caption" color="#888">
                Added {new Date(customer.createdAt).toLocaleDateString('en-IN')}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => onEdit(customer)} sx={{ color: '#1a3c5e' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PhoneIcon sx={{ fontSize: 14, color: '#c8922a' }} />
            <Typography variant="body2" color="#444" fontWeight={500}>{customer.mobile}</Typography>
          </Stack>
          {customer.email && (
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailIcon sx={{ fontSize: 14, color: '#2196f3' }} />
              <Typography variant="body2" color="#444">{customer.email}</Typography>
            </Stack>
          )}
          {customer.address && (
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <LocationOnIcon sx={{ fontSize: 14, color: '#4caf50', mt: 0.2 }} />
              <Typography variant="body2" color="#666" sx={{ lineHeight: 1.5 }}>{customer.address}</Typography>
            </Stack>
          )}
          {customer.notes && (
            <Box sx={{ bgcolor: '#f5f7fa', borderRadius: 1.5, p: 1, mt: 0.5 }}>
              <Typography variant="caption" color="#666" sx={{ fontStyle: 'italic' }}>
                {customer.notes}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
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
    clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => fetchCustomers(val), 400);
  };

  const openAdd = () => { setEditCustomer(null); setForm(EMPTY_FORM); setErrors({}); setDialogOpen(true); };
  const openEdit = (c) => { setEditCustomer(c); setForm({ name: c.name, mobile: c.mobile, email: c.email || '', address: c.address || '', notes: c.notes || '' }); setErrors({}); setDialogOpen(true); };

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
      if (res.data.success) {
        setDialogOpen(false);
        fetchCustomers(search);
      }
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
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1a3c5e">Customers</Typography>
            <Typography variant="body2" color="#888" mt={0.5}>{customers.length} customer{customers.length !== 1 ? 's' : ''} registered</Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <TextField
              size="small"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={handleSearch}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment>,
              }}
              sx={{ width: 260 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
              sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' }, whiteSpace: 'nowrap' }}>
              Add Customer
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Grid container spacing={3}>
            {[1,2,3,4,5,6].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 3 }} />
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
          <Grid container spacing={3}>
            {customers.map(c => (
              <Grid item xs={12} sm={6} md={4} key={c._id}>
                <CustomerCard customer={c} onEdit={openEdit} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

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
