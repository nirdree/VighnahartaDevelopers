'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Stack,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ApartmentIcon from '@mui/icons-material/Apartment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f2338 0%, #1a3c5e 60%, #2d6a9f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
      }}
    >
      {/* Decorative grid */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(200,146,42,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(200,146,42,0.04) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ width: '100%', maxWidth: 440, position: 'relative' }}>
        {/* Back to home */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/')}
          sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, '&:hover': { color: 'white' } }}
        >
          Back to Home
        </Button>

        <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
          {/* Header */}
          <Box
            sx={{
              bgcolor: '#1a3c5e',
              py: 4,
              px: 4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(200,146,42,0.2)',
                border: '2px solid #c8922a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <ApartmentIcon sx={{ color: '#c8922a', fontSize: 28 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{ color: 'white', fontWeight: 800, fontFamily: '"Playfair Display", serif' }}
            >
              Vighnaharta Developers
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
              Sign in to your account
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#1a3c5e' }} />
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="email"
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#1a3c5e' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  sx={{
                    bgcolor: '#1a3c5e',
                    '&:hover': { bgcolor: '#0f2338' },
                    py: 1.7,
                    fontSize: '1rem',
                    fontWeight: 700,
                    mt: 1,
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Sign In'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', display: 'block', mt: 3 }}>
          Secure login • Vighnaharta Developers © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
}
