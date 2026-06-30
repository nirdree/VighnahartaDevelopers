'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Button,
  Chip, Stack, Skeleton, IconButton, Menu, MenuItem, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FolderIcon from '@mui/icons-material/Folder';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';
import AddProjectDialog from '@/components/projects/AddProjectDialog';

function ProjectCard({ project, onEdit, onDelete, onClick }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' },
      }}
    >
      <CardContent sx={{ flex: 1, p: 3 }} onClick={onClick}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 2.5, bgcolor: '#e8f0fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2,
            }}
          >
            <FolderIcon sx={{ color: '#1a3c5e', fontSize: 24 }} />
          </Box>
          {user?.role === 'admin' && (
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a3c5e', mb: 0.5 }}>
          {project.name}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5} mb={2}>
          <LocationOnIcon sx={{ fontSize: 14, color: '#888' }} />
          <Typography variant="caption" sx={{ color: '#888' }}>{project.location}</Typography>
        </Stack>

        {project.description && (
          <Typography variant="body2" sx={{ color: '#666', mb: 2, fontSize: '0.82rem', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.description}
          </Typography>
        )}

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip label={`${project.stats?.totalPlots ?? 0} Plots`} size="small" sx={{ bgcolor: '#f0f0f0', fontWeight: 600, height: 22 }} />
          <Chip label={`${project.stats?.available ?? 0} Available`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, height: 22 }} />
          <Chip label={`${project.stats?.sold ?? 0} Sold`} size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 600, height: 22 }} />
        </Stack>
      </CardContent>

      <Divider />
      <CardActions sx={{ px: 2, py: 1.5 }}>
        <Button
          startIcon={<MapIcon />}
          size="small"
          onClick={onClick}
          sx={{ color: '#1a3c5e', fontWeight: 600 }}
        >
          Open Layout
        </Button>
      </CardActions>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setAnchorEl(null); onEdit(project); }} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" /> Edit
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); onDelete(project); }} sx={{ color: '#d32f2f', gap: 1.5 }}>
          <DeleteIcon fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </Card>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteProject, setDeleteProject] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/projects', { timeout: 15000 });
      if (data.success) setProjects(data.data);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) enqueueSnackbar('Session expired. Please login again.', { variant: 'error' });
      else if (status === 403) enqueueSnackbar('You do not have access to view projects.', { variant: 'error' });
      else enqueueSnackbar('Failed to load projects', { variant: 'error' });
    }
    finally { setLoading(false); }
  };

  const handleEdit = async () => {
    try {
      const { data } = await axios.put(`/api/projects/${editProject._id}`, editForm);
      if (data.success) {
        enqueueSnackbar('Project updated!', { variant: 'success' });
        setEditProject(null);
        fetchProjects();
      }
    } catch { enqueueSnackbar('Failed to update project', { variant: 'error' }); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/projects/${deleteProject._id}`);
      enqueueSnackbar('Project deleted', { variant: 'success' });
      setDeleteProject(null);
      fetchProjects();
    } catch { enqueueSnackbar('Failed to delete project', { variant: 'error' }); }
    finally { setDeleting(false); }
  };

  return (
    <AppShell>
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" fontWeight={800} color="#1a3c5e">Projects</Typography>
            <Typography variant="body2" color="#888" mt={0.5}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</Typography>
          </Box>
          {user?.role === 'admin' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}
              sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}>
              New Project
            </Button>
          )}
        </Stack>

        {loading ? (
          <Grid container spacing={3}>
            {[1,2,3,4,5,6].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : projects.length === 0 ? (
          <Box textAlign="center" py={10}>
            <FolderIcon sx={{ fontSize: 64, color: '#ddd', mb: 2 }} />
            <Typography variant="h5" color="#bbb" fontWeight={700}>No Projects Yet</Typography>
            {user?.role === 'admin' && (
              <Button variant="contained" startIcon={<AddIcon />} sx={{ mt: 3, bgcolor: '#1a3c5e' }} onClick={() => setAddOpen(true)}>
                Create First Project
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {projects.map(p => (
              <Grid item xs={12} sm={6} md={4} key={p._id}>
                <ProjectCard
                  project={p}
                  onClick={() => router.push(`/projects/${p._id}/canvas`)}
                  onEdit={(proj) => { setEditProject(proj); setEditForm({ name: proj.name, location: proj.location, description: proj.description, totalArea: proj.totalArea }); }}
                  onDelete={setDeleteProject}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <AddProjectDialog open={addOpen} onClose={() => setAddOpen(false)} onSuccess={fetchProjects} />

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onClose={() => setEditProject(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700} color="#1a3c5e">Edit Project</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField label="Project Name" fullWidth value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} />
            <TextField label="Location" fullWidth value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} />
            <TextField label="Total Area" fullWidth value={editForm.totalArea || ''} onChange={e => setEditForm({...editForm, totalArea: e.target.value})} />
            <TextField label="Description" fullWidth multiline rows={3} value={editForm.description || ''} onChange={e => setEditForm({...editForm, description: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditProject(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} sx={{ bgcolor: '#1a3c5e' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteProject} onClose={() => setDeleteProject(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete Project?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete <strong>{deleteProject?.name}</strong> and all its plots. This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteProject(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppShell>
  );
}
