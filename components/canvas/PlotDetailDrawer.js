'use client';

import {
  Drawer, Box, Typography, Stack, Chip, Button, Divider,
  IconButton, Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import GridOnIcon from '@mui/icons-material/GridOn';
import { PLOT_STATUS_COLORS, PLOT_STATUS_LABELS } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <Box>
      <Typography variant="caption" sx={{ color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: '#1a3c5e', fontWeight: 500, mt: 0.3 }}>{value}</Typography>
    </Box>
  );
}

export default function PlotDetailDrawer({ plot, open, onClose, onEdit, onDelete }) {
  const { user } = useAuth();
  if (!plot) return null;

  const statusColor = PLOT_STATUS_COLORS[plot.status] || '#999';
  const customer = plot.customerId;
  const agent = plot.assignedAgent;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 380 }, p: 0 } }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#1a3c5e', p: 3, color: 'white' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <GridOnIcon sx={{ fontSize: 18, color: '#c8922a' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, fontWeight: 600 }}>
                PLOT DETAILS
              </Typography>
            </Stack>
            <Typography variant="h5" fontWeight={800}>Plot {plot.plotNumber}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Chip
          label={PLOT_STATUS_LABELS[plot.status] || plot.status}
          size="small"
          sx={{
            bgcolor: statusColor,
            color: plot.status === 'token' ? '#333' : 'white',
            fontWeight: 700,
            mt: 2,
            letterSpacing: 0.5,
          }}
        />
      </Box>

      {/* Body */}
      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        <Stack spacing={2.5}>
          {/* Plot info */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e" mb={1.5}>Plot Information</Typography>
            <Stack spacing={1.5} sx={{ bgcolor: '#f5f7fa', p: 2, borderRadius: 2 }}>
              <InfoRow label="Area" value={plot.area} />
              <InfoRow label="Length" value={plot.length} />
              <InfoRow label="Width" value={plot.width} />
              <InfoRow label="Price" value={plot.price ? `₹${Number(plot.price).toLocaleString('en-IN')}` : null} />
              <InfoRow label="Shape" value={plot.shapeType} />
              <InfoRow label="Notes" value={plot.notes} />
            </Stack>
          </Box>

          {/* Customer info */}
          {customer && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e" mb={1.5}>Customer</Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ bgcolor: '#e8f5e9', p: 2, borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: '#2e7d32', width: 40, height: 40, fontWeight: 700 }}>
                  {customer.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#1a3c5e">{customer.name}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5} mt={0.3}>
                    <PhoneIcon sx={{ fontSize: 13, color: '#666' }} />
                    <Typography variant="caption" color="#666">{customer.mobile}</Typography>
                  </Stack>
                  {customer.email && (
                    <Typography variant="caption" color="#666" display="block">{customer.email}</Typography>
                  )}
                  {customer.address && (
                    <Typography variant="caption" color="#666" display="block" mt={0.3}>{customer.address}</Typography>
                  )}
                </Box>
              </Stack>
            </Box>
          )}

          {/* Agent */}
          {agent && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e" mb={1.5}>Assigned Agent</Typography>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ bgcolor: '#e3f2fd', p: 2, borderRadius: 2 }}>
                <Avatar sx={{ bgcolor: '#1565c0', width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem' }}>
                  {agent.name?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#1a3c5e">{agent.name}</Typography>
                  <Typography variant="caption" color="#666">{agent.email}</Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Admin actions */}
      {user?.role === 'admin' && (
        <>
          <Divider />
          <Box sx={{ p: 2.5 }}>
            <Stack spacing={1.5}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<EditIcon />}
                onClick={onEdit}
                sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}
              >
                Edit Plot
              </Button>
              <Button
                variant="outlined"
                fullWidth
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >
                Delete Plot
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Drawer>
  );
}
