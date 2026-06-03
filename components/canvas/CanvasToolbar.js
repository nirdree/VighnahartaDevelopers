'use client';

import { Box, ToggleButton, ToggleButtonGroup, Tooltip, Divider, Button, Typography } from '@mui/material';
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
import { CANVAS_TOOL_TYPES } from '@/lib/constants';

const TOOLS = [
  { value: CANVAS_TOOL_TYPES.SELECT, icon: <NearMeIcon fontSize="small" />, tip: 'Select' },
  { value: CANVAS_TOOL_TYPES.RECTANGLE, icon: <CropFreeIcon fontSize="small" />, tip: 'Rectangle Plot' },
  { value: CANVAS_TOOL_TYPES.POLYGON, icon: <PolylineIcon fontSize="small" />, tip: 'Polygon Plot (click to place points, double-click to close)' },
  { value: CANVAS_TOOL_TYPES.ROAD, icon: <LinearScaleIcon fontSize="small" />, tip: 'Road' },
  { value: CANVAS_TOOL_TYPES.AMENITY, icon: <ParkIcon fontSize="small" />, tip: 'Amenity' },
  { value: CANVAS_TOOL_TYPES.TEXT, icon: <TextFieldsIcon fontSize="small" />, tip: 'Text Label' },
  { value: CANVAS_TOOL_TYPES.DELETE, icon: <DeleteIcon fontSize="small" />, tip: 'Delete' },
  { value: CANVAS_TOOL_TYPES.PAN, icon: <PanToolIcon fontSize="small" />, tip: 'Pan Canvas' },
];

export default function CanvasToolbar({ activeTool, onToolChange, onSave, onUndo, saving, readOnly }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 1.5,
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="caption" sx={{ color: '#888', fontWeight: 700, letterSpacing: 1, display: { xs: 'none', sm: 'block' } }}>
        TOOLS
      </Typography>

      {!readOnly && (
        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={(_, v) => v && onToolChange(v)}
          size="small"
          sx={{ '& .MuiToggleButton-root': { border: '1px solid #e0e0e0', borderRadius: '8px !important', mx: 0.3, px: 1.2 } }}
        >
          {TOOLS.map((t) => (
            <Tooltip key={t.value} title={t.tip} placement="bottom">
              <ToggleButton value={t.value} sx={{ '&.Mui-selected': { bgcolor: '#1a3c5e', color: 'white', '&:hover': { bgcolor: '#0f2338' } } }}>
                {t.icon}
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      )}

      <Box flex={1} />

      {!readOnly && (
        <>
          <Tooltip title="Undo last action">
            <span>
              <Button variant="outlined" size="small" startIcon={<UndoIcon />} onClick={onUndo}
                sx={{ borderColor: '#e0e0e0', color: '#555' }}>
                Undo
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            onClick={onSave}
            disabled={saving}
            sx={{ bgcolor: '#1a3c5e', '&:hover': { bgcolor: '#0f2338' } }}
          >
            {saving ? 'Saving...' : 'Save Layout'}
          </Button>
        </>
      )}

      {readOnly && (
        <Typography variant="caption" sx={{ color: '#c8922a', fontWeight: 700, bgcolor: '#fff3e0', px: 1.5, py: 0.5, borderRadius: 2 }}>
          👁 READ ONLY VIEW
        </Typography>
      )}
    </Box>
  );
}
