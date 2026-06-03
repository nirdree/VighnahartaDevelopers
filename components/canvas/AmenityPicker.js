'use client';

import { Dialog, DialogTitle, DialogContent, Grid, Box, Typography } from '@mui/material';
import { AMENITY_TYPES } from '@/lib/constants';

export default function AmenityPicker({ open, onClose, onSelect }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700} color="#1a3c5e">Choose Amenity</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} pt={1}>
          {AMENITY_TYPES.map(a => (
            <Grid item xs={4} key={a.id}>
              <Box
                onClick={() => { onSelect(a); onClose(); }}
                sx={{
                  p: 2, textAlign: 'center', cursor: 'pointer', borderRadius: 2,
                  border: '1.5px solid #e0e0e0',
                  '&:hover': { bgcolor: '#e8f0fe', borderColor: '#1a3c5e' },
                  transition: 'all 0.15s',
                }}
              >
                <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{a.emoji}</Typography>
                <Typography variant="caption" fontWeight={600} color="#444" display="block" mt={0.5}>
                  {a.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
