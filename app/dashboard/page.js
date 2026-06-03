'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Grid, Card, CardContent, Typography, Button, Skeleton,
  LinearProgress, Stack, Chip, Divider,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import GridOnIcon from '@mui/icons-material/GridOn';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import { PLOT_STATUS_COLORS, PLOT_STATUS_LABELS } from '@/lib/constants';
import AddProjectDialog from '@/components/projects/AddProjectDialog';
import AddAgentDialog from '@/components/agents/AddAgentDialog';

function StatCard({ icon, label, value, color, loading }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        {loading ? (
          <>
            <Skeleton width={60} height={20} />
            <Skeleton width={80} height={50} />
          </>
        ) : (
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
            <Box>
              <Typography variant="body2" sx={{ color: '#888', fontWeight: 500, mb: 0.5 }}>
                {label}
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a3c5e' }}>
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: color + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: color,
              }}
            >
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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/dashboard');
      if (data.success) setStats(data.data);
    } catch (err) {
      enqueueSnackbar('Failed to load dashboard stats', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const totalNonAvailable = stats
    ? stats.plotStats.token + stats.plotStats.booked + stats.plotStats.halfpayment + stats.plotStats.sold
    : 0;

  return (
    <AppShell>
      <Box>
        {/* Header */}
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} mb={4} spacing={2}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a3c5e' }}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </Typography>
            <Typography variant="body2" sx={{ color: '#888', mt: 0.5 }}>
              Here's what's happening across your projects today.
            </Typography>
          </Box>
          {user?.role === 'admin' && (
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAddAgentOpen(true)}
                sx={{ borderColor: '#1a3c5e', color: '#1a3c5e' }}
              >
                Add Agent
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setAddProjectOpen(true)}
                sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}
              >
                Add Project
              </Button>
            </Stack>
          )}
        </Stack>

        {/* Main stats */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={6} md={3}>
            <StatCard icon={<FolderIcon />} label="Total Projects" value={stats?.totalProjects ?? 0} color="#1a3c5e" loading={loading} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<PeopleIcon />} label="Active Agents" value={stats?.totalAgents ?? 0} color="#c8922a" loading={loading} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<GridOnIcon />} label="Total Plots" value={stats?.totalPlots ?? 0} color="#2196f3" loading={loading} />
          </Grid>
          <Grid item xs={6} md={3}>
            <StatCard icon={<PersonIcon />} label="Customers" value={stats?.totalCustomers ?? 0} color="#4caf50" loading={loading} />
          </Grid>
        </Grid>

        {/* Plot status breakdown */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a3c5e', mb: 3 }}>
                  Plot Status Overview
                </Typography>
                {loading ? (
                  <Stack spacing={2}>
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} height={40} />)}
                  </Stack>
                ) : (
                  <Stack spacing={2.5}>
                    {Object.entries(PLOT_STATUS_LABELS).map(([key, label]) => {
                      const count = stats?.plotStats?.[key] ?? 0;
                      const total = stats?.totalPlots || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <Box key={key}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.8}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: PLOT_STATUS_COLORS[key] }} />
                              <Typography variant="body2" fontWeight={600} color="#444">{label}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Typography variant="body2" fontWeight={700} color="#1a3c5e">{count}</Typography>
                              <Chip label={`${pct}%`} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: PLOT_STATUS_COLORS[key] + '20', color: PLOT_STATUS_COLORS[key], fontWeight: 700 }} />
                            </Stack>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': { bgcolor: PLOT_STATUS_COLORS[key], borderRadius: 4 },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a3c5e', mb: 3 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/projects')}
                    sx={{ justifyContent: 'space-between', borderColor: '#e0e0e0', color: '#1a3c5e', py: 1.5 }}
                  >
                    View All Projects
                  </Button>
                  {user?.role === 'admin' && (
                    <>
                      <Button
                        fullWidth
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => router.push('/agents')}
                        sx={{ justifyContent: 'space-between', borderColor: '#e0e0e0', color: '#1a3c5e', py: 1.5 }}
                      >
                        Manage Agents
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => router.push('/customers')}
                        sx={{ justifyContent: 'space-between', borderColor: '#e0e0e0', color: '#1a3c5e', py: 1.5 }}
                      >
                        View Customers
                      </Button>
                    </>
                  )}
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ bgcolor: '#f0f7f0', borderRadius: 2, p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                    <Typography variant="body2" fontWeight={700} color="#2e7d32">Availability Rate</Typography>
                  </Stack>
                  {loading ? (
                    <Skeleton height={40} />
                  ) : (
                    <>
                      <Typography variant="h4" fontWeight={800} color="#2e7d32">
                        {stats?.totalPlots ? Math.round((stats.plotStats.available / stats.totalPlots) * 100) : 0}%
                      </Typography>
                      <Typography variant="caption" color="#666">
                        {stats?.plotStats?.available ?? 0} of {stats?.totalPlots ?? 0} plots available
                      </Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <AddProjectDialog open={addProjectOpen} onClose={() => setAddProjectOpen(false)} onSuccess={fetchStats} />
      <AddAgentDialog open={addAgentOpen} onClose={() => setAddAgentOpen(false)} onSuccess={() => fetchStats()} />
    </AppShell>
  );
}
