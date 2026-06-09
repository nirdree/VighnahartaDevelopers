'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Typography, Chip, Stack, IconButton, Avatar, Tooltip, Skeleton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LogoutIcon from '@mui/icons-material/Logout';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';

const ProjectCanvas = dynamic(() => import('@/components/canvas/ProjectCanvas'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, bgcolor: '#f9f9f6' }}>
      <Typography color="#888">Loading canvas...</Typography>
    </Box>
  ),
});

export default function CanvasPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, logout } = useAuth();
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
    // position:fixed + inset:0 guarantees it covers exactly the full viewport
    // regardless of what AppShell/sidebar is doing in the background
    <Box sx={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f9f9f6',
      zIndex: 1200,
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: { xs: 1, sm: 2 }, py: 0,
        bgcolor: '#1a3c5e', flexShrink: 0,
        height: 48,
        minHeight: 48,
      }}>
        <Tooltip title="Back to Projects">
          <IconButton size="small" onClick={() => router.push('/projects')}
            sx={{ color: 'rgba(255,255,255,0.75)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <Stack direction="row" alignItems="center" spacing={1} flex={1} minWidth={0}>
          {loading ? (
            <Skeleton width={160} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
          ) : (
            <>
              <Typography variant="subtitle2" fontWeight={800} color="white" noWrap sx={{ fontSize: '0.9rem' }}>
                {project?.name}
              </Typography>
              {project?.location && (
                <Stack direction="row" alignItems="center" spacing={0.3} sx={{ display: { xs: 'none', sm: 'flex' }, flexShrink: 0 }}>
                  <LocationOnIcon sx={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }} />
                  <Typography variant="caption" color="rgba(255,255,255,0.45)" noWrap sx={{ fontSize: '0.72rem' }}>
                    {project.location}
                  </Typography>
                </Stack>
              )}
              {!isAdmin && (
                <Chip label="Read-Only" size="small"
                  sx={{ bgcolor: 'rgba(200,146,42,0.3)', color: '#ffd580', fontWeight: 700, fontSize: '0.6rem', height: 18, flexShrink: 0 }} />
              )}
            </>
          )}
        </Stack>

        {user && (
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ flexShrink: 0 }}>
            <Avatar sx={{ width: 26, height: 26, bgcolor: '#c8922a', fontSize: '0.7rem', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}>
              {user.name?.[0]?.toUpperCase()}
            </Avatar>
            <Typography variant="caption" color="rgba(255,255,255,0.65)" fontWeight={600} noWrap sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem' }}>
              {user.name?.split(' ')[0]}
            </Typography>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={logout}
                sx={{ color: 'rgba(255,255,255,0.55)', '&:hover': { color: '#ff8a80' } }}>
                <LogoutIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* Canvas fills ALL remaining space */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {id && <ProjectCanvas projectId={id} readOnly={!isAdmin} />}
      </Box>
    </Box>
  );
}
