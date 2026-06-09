'use client';

import { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Stack, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Button, Tabs, Tab, Card, Grid,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneIcon from '@mui/icons-material/Phone';
import axios from 'axios';
import { useSnackbar } from 'notistack';

export default function PaymentTracking() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState({ upcoming: [], overdue: [] });
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data } = await axios.get('/api/payments/upcoming');
        if (data.success) {
          setData(data.data);
        }
      } catch (err) {
        enqueueSnackbar(err?.response?.data?.error || 'Failed to fetch payments', { variant: 'error' });
      }
      setLoading(false);
    };

    fetchPayments();
  }, [enqueueSnackbar]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/payments/upcoming');
      if (data.success) {
        setData(data.data);
        enqueueSnackbar('Refreshed successfully', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to refresh', { variant: 'error' });
    }
    setLoading(false);
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    const target = new Date(date);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (days) => {
    if (days < 0) return '#d32f2f'; // Overdue - red
    if (days <= 3) return '#ff6f00'; // Urgent - orange
    if (days <= 7) return '#f57c00'; // Soon - dark orange
    return '#388e3c'; // Normal - green
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const PaymentTable = ({ payments, isOverdue = false }) => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: '#1a3c5e' }}>
          <TableRow>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Plot</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Customer</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Contact</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Final Price</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Paid</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">Pending</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }}>Payment Date</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700 }} align="center">Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments.map((payment, idx) => {
            const days = getDaysUntil(payment.nextInstalmentDate);
            const statusColor = getStatusColor(days);
            const statusLabel = isOverdue ? `${Math.abs(days)} days overdue` : `${days} days left`;
            const finalPrice = payment.finalPlotPrice || payment.plotId?.price || 0;

            return (
              <TableRow key={payment._id} sx={{ '&:hover': { bgcolor: '#f5f7fa' } }}>
                <TableCell>
                  <Typography fontWeight={700} color="#1a3c5e">
                    Plot {payment.plotId?.plotNumber}
                  </Typography>
                  <Typography variant="caption" color="#666">
                    Original: ₹{Number(payment.plotId?.price || 0).toLocaleString('en-IN')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{payment.customerId?.name || 'N/A'}</Typography>
                  <Typography variant="caption" color="#666">
                    {payment.plotId?.status && (
                      <Chip
                        label={payment.plotId.status}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    {payment.customerId?.mobile && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PhoneIcon sx={{ fontSize: '0.875rem', color: '#666' }} />
                        <Typography variant="caption" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                          {payment.customerId.mobile}
                        </Typography>
                      </Stack>
                    )}
                    {payment.customerId?.email && (
                      <Typography variant="caption" color="#666">
                        {payment.customerId.email}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color="#1a3c5e">
                    ₹{Number(finalPrice).toLocaleString('en-IN')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color="#2e7d32">
                    ₹{Number(payment.amount).toLocaleString('en-IN')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color="#e65100">
                    ₹{Number(Math.max(0, finalPrice - payment.amount)).toLocaleString('en-IN')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(payment.nextInstalmentDate)}
                  </Typography>
                  <Typography variant="caption" color="#666">
                    Last paid: {formatDate(payment.paymentDate)}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      bgcolor: statusColor,
                      color: 'white',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      display: 'inline-block'
                    }}
                  >
                    {statusLabel}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1a3c5e' }}>
              <CalendarTodayIcon sx={{ color: '#c8922a' }} />
              Payment Tracking & Reminders
            </Typography>
            <Typography variant="body2" color="#666" mt={1}>
              Track upcoming and overdue payments to ensure timely reminders to plot owners
            </Typography>
          </Stack>
          <Button
            variant="contained"
            onClick={handleRefresh}
            sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#e3f2fd', border: '2px solid #2196f3' }}>
              <Typography variant="caption" color="#666">Upcoming Payments</Typography>
              <Typography variant="h5" fontWeight={700} color="#1976d2" mt={1}>
                {data.totalUpcoming}
              </Typography>
              <Typography variant="caption" color="#666">within next 30 days</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#ffebee', border: '2px solid #f44336' }}>
              <Typography variant="caption" color="#666">Overdue Payments</Typography>
              <Typography variant="h5" fontWeight={700} color="#d32f2f" mt={1}>
                {data.totalOverdue}
              </Typography>
              <Typography variant="caption" color="#666">action needed</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
              <Typography variant="caption" color="#666">Total Pending Amount</Typography>
              <Typography variant="h5" fontWeight={700} color="#f57c00" mt={1}>
                ₹{(data.upcoming.reduce((sum, p) => sum + Math.max(0, (p.finalPlotPrice || p.plotId?.price || 0) - p.amount), 0) + data.overdue.reduce((sum, p) => sum + Math.max(0, (p.finalPlotPrice || p.plotId?.price || 0) - p.amount), 0)).toLocaleString('en-IN')}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, bgcolor: '#f3e5f5', border: '2px solid #9c27b0' }}>
              <Typography variant="caption" color="#666">Reminders Today</Typography>
              <Typography variant="h5" fontWeight={700} color="#6a1b9a" mt={1}>
                {data.upcoming.filter(p => getDaysUntil(p.nextInstalmentDate) === 0).length}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
            <Tab
              icon={<CheckCircleIcon />}
              iconPosition="start"
              label={`Upcoming (${data.totalUpcoming})`}
            />
            <Tab
              icon={<WarningAmberIcon />}
              iconPosition="start"
              label={`Overdue (${data.totalOverdue})`}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Stack>
            {data.upcoming.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#2e7d32', mb: 1 }} />
                <Typography color="#2e7d32" fontWeight={700}>
                  No upcoming payments
                </Typography>
                <Typography variant="body2" color="#666">
                  All payments are on track!
                </Typography>
              </Paper>
            ) : (
              <PaymentTable payments={data.upcoming} />
            )}
          </Stack>
        )}

        {tabValue === 1 && (
          <Stack>
            {data.overdue.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: '#2e7d32', mb: 1 }} />
                <Typography color="#2e7d32" fontWeight={700}>
                  No overdue payments
                </Typography>
                <Typography variant="body2" color="#666">
                  All payments are on time!
                </Typography>
              </Paper>
            ) : (
              <PaymentTable payments={data.overdue} isOverdue />
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
