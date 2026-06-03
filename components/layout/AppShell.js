'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, IconButton, Typography, Avatar, Menu, MenuItem,
  Divider, Tooltip, useMediaQuery, useTheme, Chip, Skeleton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '@/hooks/useAuth';

const DRAWER_WIDTH = 250;
const MINI_WIDTH = 64;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <DashboardIcon />, href: '/dashboard', roles: ['admin', 'agent'] },
  { label: 'Projects', icon: <FolderIcon />, href: '/projects', roles: ['admin', 'agent'] },
  { label: 'Agents', icon: <PeopleIcon />, href: '/agents', roles: ['admin'] },
  { label: 'Customers', icon: <PersonIcon />, href: '/customers', roles: ['admin'] },
];

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (isMobile) setOpen(false);
    else setOpen(true);
  }, [isMobile]);

  const filteredNav = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#1a3c5e' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(200,146,42,0.2)', border: '1px solid #c8922a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ApartmentIcon sx={{ color: '#c8922a', fontSize: 20 }} />
        </Box>
        {(open || mobileOpen) && (
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 800, fontFamily: '"Playfair Display", serif', lineHeight: 1.1 }}>
              Vighnaharta
            </Typography>
            <Typography variant="caption" sx={{ color: '#c8922a', letterSpacing: 1.5, fontSize: '0.55rem', fontWeight: 700 }}>
              DEVELOPERS
            </Typography>
          </Box>
        )}
      </Box>

      {/* Role badge */}
      {(open || mobileOpen) && user && (
        <Box sx={{ px: 2, pb: 2 }}>
          <Chip
            label={user.role.toUpperCase()}
            size="small"
            sx={{
              bgcolor: user.role === 'admin' ? 'rgba(200,146,42,0.25)' : 'rgba(33,150,243,0.25)',
              color: user.role === 'admin' ? '#ffd580' : '#90caf9',
              fontWeight: 700,
              fontSize: '0.65rem',
              letterSpacing: 1.5,
              height: 22,
            }}
          />
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Nav */}
      <List sx={{ px: 1, py: 2, flex: 1 }}>
        {filteredNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Tooltip key={item.href} title={!open && !isMobile ? item.label : ''} placement="right">
              <ListItemButton
                onClick={() => { router.push(item.href); if (isMobile) setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  px: open || isMobile ? 2 : 1.5,
                  justifyContent: open || isMobile ? 'flex-start' : 'center',
                  bgcolor: active ? 'rgba(200,146,42,0.2)' : 'transparent',
                  border: active ? '1px solid rgba(200,146,42,0.4)' : '1px solid transparent',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? '#c8922a' : 'rgba(255,255,255,0.65)',
                    minWidth: open || isMobile ? 36 : 'auto',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {(open || isMobile) && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ffd580' : 'rgba(255,255,255,0.8)',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* User info at bottom */}
      {(open || isMobile) && user && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: '#c8922a', fontSize: '0.85rem', fontWeight: 700 }}>
              {user.name?.[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
                {user.email}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f7fa' }}>
        <Skeleton variant="rectangular" width={250} height="100vh" />
        <Box flex={1} p={4}>
          <Skeleton variant="rectangular" height={64} sx={{ mb: 3, borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    );
  }

  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: open ? DRAWER_WIDTH : MINI_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: open ? DRAWER_WIDTH : MINI_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              transition: theme.transitions.create('width', { duration: 200 }),
              overflow: 'hidden',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'white',
            borderBottom: '1px solid #e8eaed',
            color: '#1a3c5e',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile ? (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#1a3c5e' }}>
                <MenuIcon />
              </IconButton>
            ) : (
              <IconButton onClick={() => setOpen(!open)} sx={{ color: '#1a3c5e' }}>
                {open ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a3c5e', flex: 1, fontSize: '1rem' }}>
              {filteredNav.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.label || 'Vighnaharta'}
            </Typography>

            <Tooltip title="Account">
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: '#1a3c5e', fontSize: '0.85rem', fontWeight: 700 }}>
                  {user.name?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>{user.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={logout} sx={{ gap: 1.5, color: '#d32f2f' }}>
                <LogoutIcon fontSize="small" /> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
