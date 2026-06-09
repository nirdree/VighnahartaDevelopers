'use client';

import { Box, ToggleButton, ToggleButtonGroup, Tooltip, Button, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
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
import { CANVAS_TOOL_TYPES } from '@/lib/constants';

const TOOLS = [
  { value: CANVAS_TOOL_TYPES.SELECT,    icon: <NearMeIcon fontSize="small" />,       tip: 'Select' },
  { value: CANVAS_TOOL_TYPES.RECTANGLE, icon: <CropFreeIcon fontSize="small" />,     tip: 'Rectangle Plot' },
  { value: CANVAS_TOOL_TYPES.POLYGON,   icon: <PolylineIcon fontSize="small" />,     tip: 'Polygon Plot' },
  { value: CANVAS_TOOL_TYPES.COPY,      icon: <ContentCopyIcon fontSize="small" />,  tip: 'Copy Plot' },
  { value: CANVAS_TOOL_TYPES.ROAD,      icon: <LinearScaleIcon fontSize="small" />,  tip: 'Road' },
  { value: CANVAS_TOOL_TYPES.AMENITY,   icon: <ParkIcon fontSize="small" />,         tip: 'Amenity' },
  { value: CANVAS_TOOL_TYPES.TEXT,      icon: <TextFieldsIcon fontSize="small" />,   tip: 'Text Label' },
  { value: CANVAS_TOOL_TYPES.DELETE,    icon: <DeleteIcon fontSize="small" />,       tip: 'Delete' },
  { value: CANVAS_TOOL_TYPES.PAN,       icon: <PanToolIcon fontSize="small" />,      tip: 'Pan' },
];

export default function CanvasToolbar({ activeTool, onToolChange, onSave, onUndo, saving, readOnly, roadPointCount, onFinishRoad, onCancelRoad }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: { xs: 1, sm: 2 },
        py: 1,
        bgcolor: 'white',
        borderBottom: '1px solid #e0e0e0',
        // Horizontal scroll on mobile so buttons never wrap/overflow
        overflowX: 'auto',
        overflowY: 'hidden',
        flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        minHeight: 52,
      }}
    >
      {!readOnly && (
        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={(_, v) => v && onToolChange(v)}
          size="small"
          sx={{
            flexShrink: 0,
            '& .MuiToggleButton-root': {
              border: '1px solid #e0e0e0',
              borderRadius: '8px !important',
              mx: 0.25,
              px: { xs: 1, sm: 1.2 },
              minWidth: 36,
              height: 36,
            },
          }}
        >
          {TOOLS.map((t) => (
            <Tooltip key={t.value} title={isMobile ? '' : t.tip} placement="bottom">
              <ToggleButton
                value={t.value}
                sx={{ '&.Mui-selected': { bgcolor: '#1a3c5e', color: 'white', '&:hover': { bgcolor: '#0f2338' } } }}
              >
                {t.icon}
              </ToggleButton>
            </Tooltip>
          ))}
        </ToggleButtonGroup>
      )}

      <Box flex={1} sx={{ minWidth: 8 }} />

      {!readOnly && (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {/* Road finish/cancel buttons — appear when drawing a road */}
          {activeTool === CANVAS_TOOL_TYPES.ROAD && roadPointCount > 0 && (
            <>
              <Button
                size="small"
                variant="contained"
                onClick={onFinishRoad}
                disabled={roadPointCount < 2}
                sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' }, fontWeight: 700,
                  height: 36, px: 1.5, fontSize: '0.78rem', flexShrink: 0,
                  '&.Mui-disabled': { bgcolor: '#ccc' },
                }}
              >
                ✓ Done ({roadPointCount}pts)
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={onCancelRoad}
                sx={{ borderColor: '#e0e0e0', color: '#d32f2f', height: 36, px: 1.2, fontSize: '0.78rem', flexShrink: 0 }}
              >
                ✕
              </Button>
            </>
          )}
          <Tooltip title={isMobile ? '' : 'Undo'}>
            <IconButton size="small" onClick={onUndo}
              sx={{ border: '1px solid #e0e0e0', borderRadius: 2, color: '#555', width: 36, height: 36 }}>
              <UndoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isMobile ? '' : 'Save Layout'}>
            <IconButton size="small" onClick={onSave} disabled={saving}
              sx={{ bgcolor: '#1a3c5e', borderRadius: 2, color: 'white', width: 36, height: 36,
                '&:hover': { bgcolor: '#0f2338' }, '&.Mui-disabled': { bgcolor: '#ccc' } }}>
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {readOnly && (
        <Typography variant="caption" sx={{ color: '#c8922a', fontWeight: 700, bgcolor: '#fff3e0',
          px: 1.5, py: 0.5, borderRadius: 2, flexShrink: 0, whiteSpace: 'nowrap' }}>
          👁 READ ONLY
        </Typography>
      )}
    </Box>
  );
}
