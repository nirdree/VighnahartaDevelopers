'use client';

import { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Switch, CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import KeyIcon from '@mui/icons-material/Key';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppShell from '@/components/layout/AppShell';
import AddAgentDialog from '@/components/agents/AddAgentDialog';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AgentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [resetAgent, setResetAgent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
    else fetchAgents();
  }, [user]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/agents');
      if (data.success) setAgents(data.data);
    } catch { enqueueSnackbar('Failed to load agents', { variant: 'error' }); }
    finally { setLoading(false); }
  };

  const toggleActive = async (agent) => {
    try {
      await axios.put(`/api/agents/${agent._id}`, { isActive: !agent.isActive });
      setAgents(prev => prev.map(a => a._id === agent._id ? { ...a, isActive: !a.isActive } : a));
      enqueueSnackbar(`Agent ${!agent.isActive ? 'enabled' : 'disabled'}`, { variant: 'success' });
    } catch { enqueueSnackbar('Failed to update agent', { variant: 'error' }); }
  };

  const handleEdit = async () => {
    try {
      const { data } = await axios.put(`/api/agents/${editAgent._id}`, { name: editAgent.name, email: editAgent.email });
      if (data.success) {
        setAgents(prev => prev.map(a => a._id === editAgent._id ? data.data : a));
        enqueueSnackbar('Agent updated!', { variant: 'success' });
        setEditAgent(null);
      }
    } catch { enqueueSnackbar('Failed to update agent', { variant: 'error' }); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      enqueueSnackbar('Password must be at least 6 characters', { variant: 'warning' });
      return;
    }
    setResetting(true);
    try {
      await axios.post(`/api/agents/${resetAgent._id}/reset-password`, { newPassword });
      enqueueSnackbar('Password reset successfully!', { variant: 'success' });
      setResetAgent(null);
      setNewPassword('');
    } catch { enqueueSnackbar('Failed to reset password', { variant: 'error' }); }
    finally { setResetting(false); }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150, renderCell: (p) => (
      <Typography variant="body2" fontWeight={600} color="#1a3c5e">{p.value}</Typography>
    )},
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 200 },
    { field: 'isActive', headerName: 'Status', width: 140, renderCell: (p) => (
      <Stack direction="row" alignItems="center" spacing={1}>
        <Switch size="small" checked={p.value}
          onChange={() => toggleActive(p.row)}
          sx={{ '& .MuiSwitch-thumb': { bgcolor: p.value ? '#4caf50' : '#f44336' } }}
        />
        <Chip
          label={p.value ? 'Active' : 'Disabled'}
          size="small"
          sx={{
            bgcolor: p.value ? '#e8f5e9' : '#ffebee',
            color: p.value ? '#2e7d32' : '#c62828',
            fontWeight: 700, height: 22,
          }}
        />
      </Stack>
    )},
    { field: 'createdAt', headerName: 'Joined', width: 130, renderCell: (p) => (
      <Typography variant="body2" color="#888">
        {new Date(p.value).toLocaleDateString('en-IN')}
      </Typography>
    )},
    { field: 'actions', headerName: 'Actions', width: 120, sortable: false, renderCell: (p) => (
      <Stack direction="row" spacing={0.5}>
        <Tooltip title="Edit Agent">
          <IconButton size="small" onClick={() => setEditAgent({ ...p.row })}
            sx={{ color: '#1a3c5e' }}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reset Password">
          <IconButton size="small" onClick={() => setResetAgent(p.row)}
            sx={{ color: '#c8922a' }}>
            <KeyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    )},
  ];

  return (
    <AppShell>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1a3c5e">Agents</Typography>
            <Typography variant="body2" color="#888" mt={0.5}>{agents.length} agent{agents.length !== 1 ? 's' : ''} registered</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}
            sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}>
            Add Agent
          </Button>
        </Stack>

        <Box sx={{ bgcolor: 'white', borderRadius: 3, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
          <DataGrid
            rows={agents.map(a => ({ ...a, id: a._id }))}
            columns={columns}
            loading={loading}
            autoHeight
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            disableRowSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': { bgcolor: '#f5f7fa', fontWeight: 700 },
              '& .MuiDataGrid-row:hover': { bgcolor: '#f9f9f9' },
            }}
          />
        </Box>
      </Box>

      <AddAgentDialog open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchAgents} />

      {/* Edit Dialog */}
      <Dialog open={!!editAgent} onClose={() => setEditAgent(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} color="#1a3c5e">Edit Agent</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField label="Name" fullWidth value={editAgent?.name || ''} onChange={e => setEditAgent({ ...editAgent, name: e.target.value })} />
            <TextField label="Email" fullWidth value={editAgent?.email || ''} onChange={e => setEditAgent({ ...editAgent, email: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditAgent(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} sx={{ bgcolor: '#1a3c5e' }}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetAgent} onClose={() => { setResetAgent(null); setNewPassword(''); }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} color="#1a3c5e">Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="#555" mb={2}>
            Set a new password for <strong>{resetAgent?.name}</strong>
          </Typography>
          <TextField
            label="New Password"
            fullWidth
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Minimum 6 characters"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => { setResetAgent(null); setNewPassword(''); }}>Cancel</Button>
          <Button variant="contained" onClick={handleResetPassword} disabled={resetting}
            sx={{ bgcolor: '#1a3c5e' }}>
            {resetting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Reset'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
