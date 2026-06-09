'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Grid, Card, CardContent, Typography, Button, Skeleton,
  LinearProgress, Stack, Chip, Divider, Avatar, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import GridOnIcon from '@mui/icons-material/GridOn';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { PLOT_STATUS_COLORS, PLOT_STATUS_LABELS } from '@/lib/constants';
import AddProjectDialog from '@/components/projects/AddProjectDialog';
import AddAgentDialog from '@/components/agents/AddAgentDialog';

const PAYMENT_TYPE_LABELS = { token: 'Token', partial: 'Partial', emi: 'EMI', full: 'Full Payment' };
const PAYMENT_TYPE_COLORS = { token: '#ff9800', partial: '#2196f3', emi: '#9c27b0', full: '#4caf50' };

function StatCard({ icon, label, value, sub, color, loading, rupee }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {loading ? (
          <><Skeleton width={60} height={20} /><Skeleton width={100} height={44} /></>
        ) : (
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" sx={{ color: '#888', fontWeight: 500, mb: 0.5 }}>{label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a3c5e', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {rupee ? `₹${Number(value).toLocaleString('en-IN')}` : value}
              </Typography>
              {sub && <Typography variant="caption" color="#aaa">{sub}</Typography>}
            </Box>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5, bgcolor: color + '20',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
            }}>
              {icon}
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/dashboard');
      if (data.success) setStats(data.data);
    } catch { enqueueSnackbar('Failed to load dashboard stats', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const soldRevenue = stats
    ? (stats.plotStats.sold / (stats.totalPlots || 1)) * 100
    : 0;

  return (
    <AppShell>
      <Box>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={3} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a3c5e', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
              Here's your sales overview for today.
            </Typography>
          </Box>
          {user?.role === 'admin' && (
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button variant="outlined" size="small" startIcon={<AddIcon />}
                onClick={() => setAddAgentOpen(true)}
                sx={{ borderColor: '#1a3c5e', color: '#1a3c5e' }}>
                Add Agent
              </Button>
              <Button variant="contained" size="small" startIcon={<AddIcon />}
                onClick={() => setAddProjectOpen(true)}
                sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}>
                New Project
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Top stat cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={6} md={2.4}>
            <StatCard icon={<FolderIcon />} label="Projects" value={stats?.totalProjects ?? 0} color="#1a3c5e" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={6} md={2.4}>
            <StatCard icon={<GridOnIcon />} label="Total Plots" value={stats?.totalPlots ?? 0} color="#2196f3" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={6} md={2.4}>
            <StatCard icon={<PersonIcon />} label="Customers" value={stats?.totalCustomers ?? 0} color="#4caf50" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={6} md={2.4}>
            <StatCard icon={<PeopleIcon />} label="Agents" value={stats?.totalAgents ?? 0} color="#c8922a" loading={loading} />
          </Grid>
          <Grid item xs={12} sm={12} md={2.4}>
            <StatCard icon={<CurrencyRupeeIcon />} label="Total Revenue" value={stats?.totalRevenue ?? 0} color="#4caf50" loading={loading} rupee />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Left — Plot Status + Quick Actions */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3}>
              {/* Plot status */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                    <Typography variant="h6" fontWeight={700} color="#1a3c5e">Plot Status</Typography>
                    <Chip
                      label={`${stats?.totalPlots ?? 0} Total`}
                      size="small"
                      sx={{ bgcolor: '#e8f0fe', color: '#1a3c5e', fontWeight: 700 }}
                    />
                  </Stack>
                  {loading ? (
                    <Stack spacing={1.5}>{[1,2,3,4,5].map(i => <Skeleton key={i} height={36} />)}</Stack>
                  ) : (
                    <Stack spacing={2}>
                      {Object.entries(PLOT_STATUS_LABELS).map(([key, label]) => {
                        const count = stats?.plotStats?.[key] ?? 0;
                        const total = stats?.totalPlots || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <Box key={key}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.6}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: PLOT_STATUS_COLORS[key] }} />
                                <Typography variant="body2" fontWeight={600} color="#444">{label}</Typography>
                              </Stack>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" fontWeight={800} color="#1a3c5e">{count}</Typography>
                                <Typography variant="caption" color="#aaa">{pct}%</Typography>
                              </Stack>
                            </Stack>
                            <LinearProgress variant="determinate" value={pct} sx={{
                              height: 7, borderRadius: 4, bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': { bgcolor: PLOT_STATUS_COLORS[key], borderRadius: 4 },
                            }} />
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="#1a3c5e" mb={2}>Quick Actions</Typography>
                  <Stack spacing={1.5}>
                    <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/projects')}
                      sx={{ justifyContent: 'space-between', borderColor: '#e0e0e0', color: '#1a3c5e', py: 1.2 }}>
                      View All Projects
                    </Button>
                    {user?.role === 'admin' && (
                      <>
                        <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />}
                          onClick={() => router.push('/customers')}
                          sx={{ justifyContent: 'space-between', borderColor: '#e0e0e0', color: '#1a3c5e', py: 1.2 }}>
                          Manage Customers
                        </Button>
                        <Button fullWidth variant="outlined" endIcon={<ArrowForwardIcon />}
                          onClick={() => router.push('/agents')}
                          sx={{ justifyContent: 'space-between', borderColor: '#e0e0e0', color: '#1a3c5e', py: 1.2 }}>
                          Manage Agents
                        </Button>
                      </>
                    )}
                  </Stack>

                  <Divider sx={{ my: 2.5 }} />

                  {/* Sales progress */}
                  <Box sx={{ bgcolor: '#f0f7f0', borderRadius: 2, p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                      <TrendingUpIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      <Typography variant="body2" fontWeight={700} color="#2e7d32">Sales Progress</Typography>
                    </Stack>
                    {loading ? <Skeleton height={40} /> : (
                      <>
                        <Typography variant="h4" fontWeight={800} color="#2e7d32">
                          {stats?.totalPlots ? Math.round(((stats.plotStats.sold + stats.plotStats.halfpayment + stats.plotStats.booked + stats.plotStats.token) / stats.totalPlots) * 100) : 0}%
                        </Typography>
                        <Typography variant="caption" color="#666">
                          {(stats?.plotStats?.sold ?? 0) + (stats?.plotStats?.halfpayment ?? 0) + (stats?.plotStats?.booked ?? 0) + (stats?.plotStats?.token ?? 0)} of {stats?.totalPlots ?? 0} plots engaged
                        </Typography>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Right — Recent Payments */}
          <Grid item xs={12} md={7}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Typography variant="h6" fontWeight={700} color="#1a3c5e">Recent Payments</Typography>
                  <CurrencyRupeeIcon sx={{ color: '#4caf50' }} />
                </Stack>

                {loading ? (
                  <Stack spacing={1.5}>{[1,2,3,4,5,6].map(i => <Skeleton key={i} height={52} sx={{ borderRadius: 2 }} />)}</Stack>
                ) : !stats?.recentPayments?.length ? (
                  <Box textAlign="center" py={6}>
                    <CurrencyRupeeIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
                    <Typography color="#bbb" fontWeight={600}>No payments recorded yet</Typography>
                  </Box>
                ) : (
                  <Stack spacing={0}>
                    {/* Header row */}
                    <Stack direction="row" sx={{ px: 1.5, pb: 1, borderBottom: '2px solid #f0f0f0' }}>
                      <Typography variant="caption" fontWeight={700} color="#aaa" flex={1.5}>CUSTOMER</Typography>
                      <Typography variant="caption" fontWeight={700} color="#aaa" flex={1} sx={{ display: { xs: 'none', sm: 'block' } }}>PLOT</Typography>
                      <Typography variant="caption" fontWeight={700} color="#aaa" flex={1}>TYPE</Typography>
                      <Typography variant="caption" fontWeight={700} color="#aaa" flex={1} textAlign="right">AMOUNT</Typography>
                      <Typography variant="caption" fontWeight={700} color="#aaa" flex={1} textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>DATE</Typography>
                    </Stack>

                    {stats.recentPayments.map((p, i) => (
                      <Stack key={p._id} direction="row" alignItems="center"
                        sx={{ px: 1.5, py: 1.2, borderRadius: 2, bgcolor: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                        <Stack direction="row" alignItems="center" spacing={1} flex={1.5} minWidth={0}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#1a3c5e', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                            {p.customerId?.name?.[0]?.toUpperCase() || '?'}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600} color="#1a3c5e" noWrap>
                            {p.customerId?.name || 'Unknown'}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" color="#666" flex={1} fontWeight={500} sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {p.plotId?.plotNumber || '—'}
                        </Typography>
                        <Box flex={1}>
                          <Chip
                            label={PAYMENT_TYPE_LABELS[p.paymentType] || p.paymentType}
                            size="small"
                            sx={{
                              bgcolor: (PAYMENT_TYPE_COLORS[p.paymentType] || '#999') + '20',
                              color: PAYMENT_TYPE_COLORS[p.paymentType] || '#999',
                              fontWeight: 700, fontSize: '0.68rem', height: 20,
                            }}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight={800} color="#2e7d32" flex={1} textAlign="right">
                          ₹{Number(p.amount).toLocaleString('en-IN')}
                        </Typography>
                        <Typography variant="caption" color="#aaa" flex={1} textAlign="right" sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <AddProjectDialog open={addProjectOpen} onClose={() => setAddProjectOpen(false)} onSuccess={fetchStats} />
      <AddAgentDialog open={addAgentOpen} onClose={() => setAddAgentOpen(false)} onSuccess={fetchStats} />
    </AppShell>
  );
}
