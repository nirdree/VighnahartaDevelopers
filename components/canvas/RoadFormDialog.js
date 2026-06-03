'use client';

import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';

export default function RoadFormDialog({ open, onClose, onSave }) {
  const [form, setForm] = useState({ roadName: '', roadWidth: '12' });

  const handleSave = () => {
    onSave(form);
    setForm({ roadName: '', roadWidth: '12' });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700} color="#1a3c5e">Road Details</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          <TextField
            label="Road Name"
            fullWidth
            value={form.roadName}
            onChange={e => setForm({ ...form, roadName: e.target.value })}
            placeholder="e.g. Main Road, Lane 1"
          />
          <TextField
            label="Road Width (ft)"
            fullWidth
            type="number"
            value={form.roadWidth}
            onChange={e => setForm({ ...form, roadWidth: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ bgcolor: '#1a3c5e' }}>Save Road</Button>
      </DialogActions>
    </Dialog>
  );
}
