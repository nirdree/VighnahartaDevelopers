'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  Chip, Stack, IconButton, Divider, Avatar, useTheme, useMediaQuery,
} from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import MapIcon from '@mui/icons-material/Map';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedIcon from '@mui/icons-material/Verified';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useAuth } from '@/hooks/useAuth';

const NAV_LINKS = ['Home', 'About', 'Projects', 'Features', 'Contact'];

const STATS = [
  { value: '500+', label: 'Plots Managed' },
  { value: '12+', label: 'Projects Delivered' },
  { value: '350+', label: 'Happy Families' },
  { value: '8+', label: 'Years of Trust' },
];

const FEATURES = [
  {
    icon: <MapIcon sx={{ fontSize: 40 }} />,
    title: 'Interactive Plot Layout',
    desc: 'Visualize every plot on a live canvas. Rectangle and polygon plots with real-time status coloring — green to red.',
    color: '#e8f5e9',
    iconColor: '#2e7d32',
  },
  {
    icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
    title: 'Real-Time Availability',
    desc: 'Instantly check which plots are available, booked, token-paid, or sold without calling the admin.',
    color: '#e3f2fd',
    iconColor: '#1565c0',
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    title: 'Agent Management',
    desc: 'Assign agents to projects. Agents get read-only access — they can answer customer queries independently.',
    color: '#fff3e0',
    iconColor: '#e65100',
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Role-Based Access',
    desc: 'Admin controls everything. Agents see only what they need. JWT-secured with HTTP-only cookies.',
    color: '#f3e5f5',
    iconColor: '#6a1b9a',
  },
  {
    icon: <SupportAgentIcon sx={{ fontSize: 40 }} />,
    title: 'Customer Records',
    desc: 'Maintain complete customer profiles linked to their purchased plots — name, mobile, address, notes.',
    color: '#e0f7fa',
    iconColor: '#00695c',
  },
  {
    icon: <VerifiedIcon sx={{ fontSize: 40 }} />,
    title: 'Centralized Data',
    desc: 'One dashboard. All projects, plots, customers, and agents — no more scattered spreadsheets.',
    color: '#fce4ec',
    iconColor: '#880e4f',
  },
];

const TESTIMONIALS = [
  {
    name: 'Rajesh Kulkarni',
    role: 'Sales Manager, Pune',
    text: 'Earlier I used to call the admin 10 times a day. Now I just open the app and show clients the layout directly.',
    avatar: 'R',
  },
  {
    name: 'Sneha Patil',
    role: 'Real Estate Agent, Nashik',
    text: 'The canvas view is amazing. Clients love seeing the plot layout visually. Conversions have gone up.',
    avatar: 'S',
  },
  {
    name: 'Vikram Desai',
    role: 'Admin, Aurangabad Projects',
    text: 'Managing 300 plots across 5 projects used to be chaos. This system makes it effortless.',
    avatar: 'V',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goToDashboard = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* ── Navbar ── */}
      <Box
        component="nav"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1200,
          transition: 'all 0.3s',
          bgcolor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
          backdropFilter: scrolled ? 'blur(10px)' : 'none',
          py: scrolled ? 1 : 2,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: '#1a3c5e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ApartmentIcon sx={{ color: '#c8922a', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 800,
                    color: scrolled ? '#1a3c5e' : 'white',
                    fontFamily: '"Playfair Display", serif',
                    lineHeight: 1.1,
                    fontSize: '1rem',
                  }}
                >
                  Vighnaharta
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: scrolled ? '#c8922a' : '#ffd580', fontWeight: 600, letterSpacing: 1.5, fontSize: '0.6rem' }}
                >
                  DEVELOPERS
                </Typography>
              </Box>
            </Stack>

            {!isMobile && (
              <Stack direction="row" spacing={3}>
                {NAV_LINKS.map((link) => (
                  <Typography
                    key={link}
                    component="a"
                    href={`#${link.toLowerCase()}`}
                    sx={{
                      color: scrolled ? '#1a3c5e' : 'rgba(255,255,255,0.9)',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      '&:hover': { color: '#c8922a' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {link}
                  </Typography>
                ))}
              </Stack>
            )}

            <Button
              variant="contained"
              onClick={goToDashboard}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: '#c8922a',
                '&:hover': { bgcolor: '#a07020' },
                px: 3,
                fontWeight: 700,
              }}
            >
              {loading ? 'Loading...' : user ? 'Go to Dashboard' : 'Login'}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ── Hero ── */}
      <Box
        id="home"
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f2338 0%, #1a3c5e 50%, #2d6a9f 100%)',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        {[
          { size: 400, top: '-100px', right: '-100px', opacity: 0.05 },
          { size: 250, bottom: '50px', left: '-80px', opacity: 0.06 },
          { size: 150, top: '30%', right: '20%', opacity: 0.04 },
        ].map((c, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: c.size,
              height: c.size,
              borderRadius: '50%',
              border: '2px solid rgba(200,146,42,0.4)',
              top: c.top,
              bottom: c.bottom,
              left: c.left,
              right: c.right,
              opacity: c.opacity * 10,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Grid pattern overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(200,146,42,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(200,146,42,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="xl" sx={{ position: 'relative', pt: 12, pb: 8 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                label="🏆 Maharashtra's Trusted Real Estate Platform"
                sx={{
                  bgcolor: 'rgba(200,146,42,0.2)',
                  color: '#ffd580',
                  fontWeight: 600,
                  mb: 3,
                  border: '1px solid rgba(200,146,42,0.3)',
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  color: 'white',
                  fontFamily: '"Playfair Display", serif',
                  fontSize: { xs: '2.5rem', md: '4rem' },
                  lineHeight: 1.15,
                  mb: 3,
                }}
              >
                Manage Every
                <Box component="span" sx={{ color: '#c8922a', display: 'block' }}>
                  Plot. Every Deal.
                </Box>
                With Confidence.
              </Typography>
              <Typography
                variant="h6"
                sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400, mb: 4, lineHeight: 1.7 }}
              >
                Vighnaharta Developers brings all your real estate projects onto one powerful platform.
                Visual plot layouts, live availability, agent management — everything your team needs.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={goToDashboard}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: '#c8922a',
                    '&:hover': { bgcolor: '#a07020' },
                    px: 4,
                    py: 1.8,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                  }}
                >
                  {user ? 'Open Dashboard' : 'Get Started Free'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  href="#features"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.4)',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.05)' },
                    px: 4,
                    py: 1.8,
                    fontSize: '1.05rem',
                  }}
                >
                  See Features
                </Button>
              </Stack>

              {/* Trust badges */}
              <Stack direction="row" spacing={2} mt={4} flexWrap="wrap" useFlexGap>
                {['100% Secure', 'Role-Based Access', 'Real-Time Updates'].map((b) => (
                  <Stack key={b} direction="row" alignItems="center" spacing={0.5}>
                    <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                      {b}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              {/* Hero visual — mock dashboard card */}
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4,
                  p: 3,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {/* Mock canvas */}
                <Box sx={{ bgcolor: '#f5f7fa', borderRadius: 2, p: 2, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#1a3c5e', fontWeight: 700, mb: 1, display: 'block' }}>
                    📐 Project Alpha — Plot Layout
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0.8 }}>
                    {[
                      'available','available','token','booked','available','sold',
                      'available','halfpayment','available','available','booked','sold',
                      'sold','available','available','token','available','available',
                      'available','available','sold','booked','available','available',
                    ].map((status, i) => (
                      <Box
                        key={i}
                        sx={{
                          aspectRatio: '1.3',
                          borderRadius: 1,
                          bgcolor: {
                            available: '#4caf50',
                            token: '#ffeb3b',
                            booked: '#2196f3',
                            halfpayment: '#ff9800',
                            sold: '#f44336',
                          }[status],
                          opacity: 0.85,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.45rem', color: 'white', fontWeight: 700 }}>
                          {i + 1}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                {/* Legend */}
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                  {Object.entries({ available: '#4caf50', token: '#ffeb3b', booked: '#2196f3', halfpayment: '#ff9800', sold: '#f44336' }).map(([k, c]) => (
                    <Stack key={k} direction="row" alignItems="center" spacing={0.5}>
                      <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: c }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' }}>
                        {k}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Stats row */}
          <Grid container spacing={3} mt={4}>
            {STATS.map((stat) => (
              <Grid item xs={6} md={3} key={stat.label}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="h3"
                    sx={{ color: '#c8922a', fontFamily: '"Playfair Display", serif', fontWeight: 800 }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Features ── */}
      <Box id="features" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#f5f7fa' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={8}>
            <Chip label="FEATURES" sx={{ bgcolor: '#e8f0fe', color: '#1a3c5e', fontWeight: 700, mb: 2, letterSpacing: 2 }} />
            <Typography
              variant="h2"
              sx={{ fontFamily: '"Playfair Display", serif', color: '#1a3c5e', mb: 2 }}
            >
              Everything Your Team Needs
            </Typography>
            <Typography variant="h6" sx={{ color: '#666', fontWeight: 400, maxWidth: 560, mx: 'auto' }}>
              Designed specifically for real estate developers in Maharashtra — from plot layout to final sale.
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.25s, box-shadow 0.25s',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' },
                    cursor: 'default',
                  }}
                >
                  <CardContent sx={{ p: 3.5 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 3,
                        bgcolor: f.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2.5,
                        color: f.iconColor,
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Typography variant="h6" sx={{ color: '#1a3c5e', fontWeight: 700, mb: 1 }}>
                      {f.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.7 }}>
                      {f.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── About ── */}
      <Box id="about" sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  bgcolor: 'linear-gradient(135deg, #1a3c5e, #2d6a9f)',
                  background: 'linear-gradient(135deg, #1a3c5e 0%, #2d6a9f 100%)',
                  borderRadius: 4,
                  p: 5,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute', top: -40, right: -40,
                    width: 200, height: 200, borderRadius: '50%',
                    border: '2px solid rgba(200,146,42,0.3)',
                  }}
                />
                <ApartmentIcon sx={{ fontSize: 56, color: '#c8922a', mb: 2 }} />
                <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, mb: 2 }}>
                  Vighnaharta Developers
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
                  Founded with the mission to bring technology to Maharashtra's real estate sector.
                  We build tools that empower developers and agents to work smarter, not harder.
                </Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', my: 3 }} />
                <Stack spacing={1.5}>
                  {['Pune • Nashik • Aurangabad', 'RERA Compliant Processes', 'ISO Certified Platform'].map((t) => (
                    <Stack key={t} direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{t}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Chip label="ABOUT US" sx={{ bgcolor: '#e8f0fe', color: '#1a3c5e', fontWeight: 700, mb: 2, letterSpacing: 2 }} />
              <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', color: '#1a3c5e', mb: 3 }}>
                Built for Real Estate Teams in Maharashtra
              </Typography>
              <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9, mb: 3 }}>
                Vighnaharta Developers is a technology platform built for real estate project managers,
                sales agents, and administrators. Our platform replaces scattered spreadsheets and
                WhatsApp chains with a single, powerful system.
              </Typography>
              <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9, mb: 4 }}>
                From plotting layouts on an interactive canvas to tracking plot statuses in real-time,
                every feature is designed with the day-to-day workflow of Maharashtra's real estate
                professionals in mind.
              </Typography>
              <Grid container spacing={3}>
                {[
                  { value: '0', label: 'Spreadsheets needed', sub: 'Replace all manual tracking' },
                  { value: '∞', label: 'Plots supported', sub: 'Scale to any project size' },
                ].map((item) => (
                  <Grid item xs={6} key={item.label}>
                    <Box sx={{ p: 2, bgcolor: '#f5f7fa', borderRadius: 2, textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ color: '#c8922a', fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
                        {item.value}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1a3c5e', fontWeight: 600 }}>{item.label}</Typography>
                      <Typography variant="caption" sx={{ color: '#888' }}>{item.sub}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Testimonials ── */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#f5f7fa' }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={7}>
            <Chip label="TESTIMONIALS" sx={{ bgcolor: '#fff3e0', color: '#c8922a', fontWeight: 700, mb: 2, letterSpacing: 2 }} />
            <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', color: '#1a3c5e' }}>
              Trusted by Real Estate Teams
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {TESTIMONIALS.map((t) => (
              <Grid item xs={12} md={4} key={t.name}>
                <Card sx={{ height: '100%', p: 1 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body1" sx={{ color: '#444', lineHeight: 1.8, mb: 3, fontStyle: 'italic' }}>
                      "{t.text}"
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#1a3c5e', fontWeight: 700 }}>{t.avatar}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#1a3c5e', fontWeight: 700 }}>{t.name}</Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>{t.role}</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── CTA Banner ── */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(135deg, #0f2338 0%, #1a3c5e 60%, #c8922a 100%)',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ color: 'white', fontFamily: '"Playfair Display", serif', mb: 2 }}>
            Ready to Manage Your Projects Smarter?
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400, mb: 5 }}>
            Join real estate developers across Maharashtra using Vighnaharta.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={goToDashboard}
            endIcon={<ArrowForwardIcon />}
            sx={{
              bgcolor: '#c8922a',
              '&:hover': { bgcolor: '#a07020' },
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            {user ? 'Open Dashboard' : 'Login to Dashboard'}
          </Button>
        </Container>
      </Box>

      {/* ── Contact ── */}
      <Box id="contact" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="flex-start">
            <Grid item xs={12} md={5}>
              <Chip label="CONTACT" sx={{ bgcolor: '#e8f0fe', color: '#1a3c5e', fontWeight: 700, mb: 2, letterSpacing: 2 }} />
              <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', color: '#1a3c5e', mb: 3 }}>
                Get in Touch
              </Typography>
              <Stack spacing={3}>
                {[
                  { icon: <PhoneIcon />, label: 'Phone', value: '+91 98765 43210' },
                  { icon: <EmailIcon />, label: 'Email', value: 'info@vighnaharta.dev' },
                  { icon: <LocationOnIcon />, label: 'Office', value: 'Pune, Maharashtra, India' },
                ].map((item) => (
                  <Stack key={item.label} direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 46, height: 46, borderRadius: 2,
                        bgcolor: '#e8f0fe', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#1a3c5e', flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#888', display: 'block' }}>{item.label}</Typography>
                      <Typography variant="body1" sx={{ color: '#1a3c5e', fontWeight: 600 }}>{item.value}</Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Grid>
            <Grid item xs={12} md={7}>
              <Box sx={{ bgcolor: '#f5f7fa', borderRadius: 3, p: 4 }}>
                <Typography variant="h5" sx={{ color: '#1a3c5e', fontWeight: 700, mb: 3 }}>Send a Message</Typography>
                <Stack spacing={2.5}>
                  {[
                    { label: 'Full Name', type: 'text', placeholder: 'Your name' },
                    { label: 'Email', type: 'email', placeholder: 'your@email.com' },
                    { label: 'Phone', type: 'tel', placeholder: '+91 98765 43210' },
                  ].map((f) => (
                    <Box key={f.label}>
                      <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, mb: 0.5, display: 'block' }}>
                        {f.label}
                      </Typography>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: '1.5px solid #e0e0e0',
                          borderRadius: 8,
                          fontSize: '0.95rem',
                          outline: 'none',
                          fontFamily: 'Inter, sans-serif',
                          boxSizing: 'border-box',
                          background: 'white',
                        }}
                      />
                    </Box>
                  ))}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, mb: 0.5, display: 'block' }}>
                      Message
                    </Typography>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your project..."
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1.5px solid #e0e0e0',
                        borderRadius: 8,
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontFamily: 'Inter, sans-serif',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                        background: 'white',
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' }, py: 1.5, fontWeight: 700 }}
                  >
                    Send Message
                  </Button>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ bgcolor: '#0f2338', py: 4 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 34, height: 34, borderRadius: 1.5, bgcolor: '#1a3c5e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ApartmentIcon sx={{ color: '#c8922a', fontSize: 18 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, fontFamily: '"Playfair Display", serif' }}>
                  Vighnaharta Developers
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, fontSize: '0.55rem' }}>
                  PLOT MANAGEMENT SYSTEM
                </Typography>
              </Box>
            </Stack>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              © {new Date().getFullYear()} Vighnaharta Developers. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              {['Privacy', 'Terms', 'Support'].map((l) => (
                <Typography key={l} variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', cursor: 'pointer', '&:hover': { color: '#c8922a' } }}>
                  {l}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
