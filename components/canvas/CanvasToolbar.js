'use client';

import { useState } from 'react';
import {
  Box, ToggleButton, ToggleButtonGroup, Tooltip, Button, Typography,
  IconButton, useMediaQuery, useTheme, Popover, Switch, FormControlLabel,
  Divider, Stack,
} from '@mui/material';
import CropFreeIcon from '@mui/icons-material/CropFree';
import PolylineIcon from '@mui/icons-material/Polyline';
import NearMeIcon from '@mui/icons-material/NearMe';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DeleteIcon from '@mui/icons-material/Delete';
import PanToolIcon from '@mui/icons-material/PanTool';
import ParkIcon from '@mui/icons-material/Park';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SettingsIcon from '@mui/icons-material/Settings';
import { CANVAS_TOOL_TYPES } from '@/lib/constants';

const TOOLS = [
  { value: CANVAS_TOOL_TYPES.SELECT,    icon: <NearMeIcon fontSize="small" />,      tip: 'Select / Drag' },
  { value: CANVAS_TOOL_TYPES.RECTANGLE, icon: <CropFreeIcon fontSize="small" />,    tip: 'Rectangle Plot' },
  { value: CANVAS_TOOL_TYPES.POLYGON,   icon: <PolylineIcon fontSize="small" />,    tip: 'Polygon Plot' },
  { value: CANVAS_TOOL_TYPES.COPY,      icon: <ContentCopyIcon fontSize="small" />, tip: 'Copy Plot' },
  { value: CANVAS_TOOL_TYPES.ROAD,      icon: <LinearScaleIcon fontSize="small" />, tip: 'Road' },
  { value: CANVAS_TOOL_TYPES.AMENITY,   icon: <ParkIcon fontSize="small" />,        tip: 'Amenity' },
  { value: CANVAS_TOOL_TYPES.TEXT,      icon: <TextFieldsIcon fontSize="small" />,  tip: 'Text Label' },
  { value: CANVAS_TOOL_TYPES.DELETE,    icon: <DeleteIcon fontSize="small" />,      tip: 'Delete' },
  { value: CANVAS_TOOL_TYPES.PAN,       icon: <PanToolIcon fontSize="small" />,     tip: 'Pan' },
];

const BG_COLORS = [
  { label: 'Cream',      value: '#f9f9f6' },
  { label: 'White',      value: '#ffffff' },
  { label: 'Light Blue', value: '#eaf3fb' },
  { label: 'Light Gray', value: '#f0f0f0' },
  { label: 'Dark',       value: '#1e1e2e' },
];

export default function CanvasToolbar({
  activeTool, onToolChange, onSave, onUndo, saving, readOnly,
  roadPointCount, onFinishRoad, onCancelRoad,
  // settings props
  settings, onSettingsChange,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  const set = (key, val) => onSettingsChange({ ...settings, [key]: val });

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      px: { xs: 1, sm: 2 }, py: 1,
      bgcolor: 'white', borderBottom: '1px solid #e0e0e0',
      overflowX: 'auto', overflowY: 'hidden', flexShrink: 0,
      WebkitOverflowScrolling: 'touch',
      '&::-webkit-scrollbar': { display: 'none' },
      scrollbarWidth: 'none',
      minHeight: 52,
    }}>
      {!readOnly && (
        <ToggleButtonGroup
          value={activeTool} exclusive
          onChange={(_, v) => v && onToolChange(v)}
          size="small"
          sx={{
            flexShrink: 0,
            '& .MuiToggleButton-root': {
              border: '1px solid #e0e0e0', borderRadius: '8px !important',
              mx: 0.25, px: { xs: 1, sm: 1.2 }, minWidth: 36, height: 36,
            },
          }}
        >
          {TOOLS.map(t => (
            <Tooltip key={t.value} title={isMobile ? '' : t.tip} placement="bottom">
              <ToggleButton value={t.value}
                sx={{ '&.Mui-selected': { bgcolor: '#1a3c5e', color: 'white', '&:hover': { bgcolor: '#0f2338' } } }}>
                {t.icon}
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      )}

      <Box flex={1} sx={{ minWidth: 8 }} />

      {!readOnly && (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {/* Road done/cancel */}
          {activeTool === CANVAS_TOOL_TYPES.ROAD && roadPointCount > 0 && (
            <>
              <Button size="small" variant="contained" onClick={onFinishRoad}
                disabled={roadPointCount < 2}
                sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, fontWeight: 700, height: 36, px: 1.5, fontSize: '0.78rem', flexShrink: 0, '&.Mui-disabled': { bgcolor: '#ccc' } }}>
                ✓ Done ({roadPointCount}pts)
              </Button>
              <Button size="small" variant="outlined" onClick={onCancelRoad}
                sx={{ borderColor: '#e0e0e0', color: '#d32f2f', height: 36, px: 1.2, fontSize: '0.78rem', flexShrink: 0 }}>
                ✕
              </Button>
            </>
          )}

          {/* Settings */}
          <Tooltip title={isMobile ? '' : 'Canvas Settings'}>
            <IconButton size="small" onClick={e => setSettingsAnchor(e.currentTarget)}
              sx={{ border: '1px solid #e0e0e0', borderRadius: 2, color: settingsAnchor ? '#1a3c5e' : '#555', width: 36, height: 36, bgcolor: settingsAnchor ? '#e8f0fe' : 'transparent' }}>
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isMobile ? '' : 'Undo'}>
            <IconButton size="small" onClick={onUndo}
              sx={{ border: '1px solid #e0e0e0', borderRadius: 2, color: '#555', width: 36, height: 36 }}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title={isMobile ? '' : 'Save Layout'}>
            <IconButton size="small" onClick={onSave} disabled={saving}
              sx={{ bgcolor: '#1a3c5e', borderRadius: 2, color: 'white', width: 36, height: 36, '&:hover': { bgcolor: '#0f2338' }, '&.Mui-disabled': { bgcolor: '#ccc' } }}>
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {readOnly && (
        <Typography variant="caption" sx={{ color: '#c8922a', fontWeight: 700, bgcolor: '#fff3e0', px: 1.5, py: 0.5, borderRadius: 2, flexShrink: 0, whiteSpace: 'nowrap' }}>
          👁 READ ONLY
        </Typography>
      )}

      {/* Settings Popover */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 2.5, width: 260, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } }}
      >
        <Typography variant="subtitle2" fontWeight={700} color="#1a3c5e" mb={2}>
          ⚙️ Canvas Settings
        </Typography>

        {/* Snap to grid */}
        <FormControlLabel
          control={<Switch checked={settings.snapToGrid} onChange={e => set('snapToGrid', e.target.checked)} size="small" />}
          label={<Typography variant="body2" fontWeight={600}>Snap to Grid</Typography>}
          sx={{ mb: 0.5, mx: 0 }}
        />
        <Typography variant="caption" color="#aaa" display="block" mb={1.5}>
          Plots move in fixed grid steps when dragging
        </Typography>

        <Divider sx={{ my: 1.5 }} />

        {/* Grid lines */}
        <FormControlLabel
          control={<Switch checked={settings.showGrid} onChange={e => set('showGrid', e.target.checked)} size="small" />}
          label={<Typography variant="body2" fontWeight={600}>Show Grid Lines</Typography>}
          sx={{ mb: 0.5, mx: 0 }}
        />

        {/* Grid dots */}
        <FormControlLabel
          control={<Switch checked={settings.showDots} onChange={e => set('showDots', e.target.checked)} size="small" />}
          label={<Typography variant="body2" fontWeight={600}>Show Grid Dots</Typography>}
          sx={{ mx: 0 }}
        />

        <Divider sx={{ my: 1.5 }} />

        {/* Background color */}
        <Typography variant="body2" fontWeight={600} mb={1}>Background Color</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {BG_COLORS.map(c => (
            <Tooltip key={c.value} title={c.label}>
              <Box
                onClick={() => set('bgColor', c.value)}
                sx={{
                  width: 32, height: 32, borderRadius: 1.5, bgcolor: c.value, cursor: 'pointer',
                  border: settings.bgColor === c.value ? '3px solid #1a3c5e' : '2px solid #ddd',
                  transition: 'border 0.15s',
                  boxShadow: settings.bgColor === c.value ? '0 0 0 2px #c8922a' : 'none',
                }}
              />
            </Tooltip>
          ))}
          {/* Custom color */}
          <Tooltip title="Custom color">
            <Box sx={{ position: 'relative', width: 32, height: 32 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 1.5, cursor: 'pointer',
                border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', overflow: 'hidden',
              }}>
                🎨
                <input type="color" value={settings.bgColor}
                  onChange={e => set('bgColor', e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                />
              </Box>
            </Box>
          </Tooltip>
        </Stack>
      </Popover>
    </Box>
  );
}
