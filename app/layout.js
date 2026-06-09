'use client';

import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';
import theme from '@/lib/theme';
import { AuthProvider } from '@/hooks/useAuth';

export default function RootLayout({ children }) {
  return (
    <html lang="en" style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      <head>
        <title>Vighnaharta Developers</title>
        <meta name="description" content="Premium Real Estate Plot Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, width: '100%', height: '100%', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            autoHideDuration={3000}
          >
            <AuthProvider>
              {children}
            </AuthProvider>
          </SnackbarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
