'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Skeleton, Chip, Stack, Button, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';
import dynamic from 'next/dynamic';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/hooks/useAuth';

const ProjectCanvas = dynamic(() => import('@/components/canvas/ProjectCanvas'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height="100%" />
    </Box>
  ),
});

export default function CanvasPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`/api/projects/${id}`)
        .then(res => { if (res.data.success) setProject(res.data.data); })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const isAdmin = user?.role === 'admin';

  return (
    <AppShell>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)', gap: 0 }}>
        {/* Breadcrumb header */}
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2} flexShrink={0}>
          <IconButton size="small" onClick={() => router.push('/projects')} sx={{ border: '1px solid #e0e0e0' }}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          {loading ? (
            <Skeleton width={200} height={32} />
          ) : (
            <>
              <Typography variant="h5" fontWeight={800} color="#1a3c5e">{project?.name}</Typography>
              {project?.location && (
                <Stack direction="row" alignItems="center" spacing={0.4}>
                  <LocationOnIcon sx={{ fontSize: 15, color: '#888' }} />
                  <Typography variant="body2" color="#888">{project.location}</Typography>
                </Stack>
              )}
              {!isAdmin && (
                <Chip label="Read-Only" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700 }} />
              )}
            </>
          )}
        </Stack>

        {/* Canvas area */}
        <Box
          sx={{
            flex: 1,
            bgcolor: 'white',
            borderRadius: 3,
            border: '1px solid #e0e0e0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {id && <ProjectCanvas projectId={id} readOnly={!isAdmin} />}
        </Box>
      </Box>
    </AppShell>
  );
}
