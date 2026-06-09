'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Button, Chip } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Stage, Layer, Rect, Line, Circle, Text, Group } from 'react-konva';
import { PLOT_STATUS_COLORS, PLOT_STATUS_LABELS, CANVAS_TOOL_TYPES } from '@/lib/constants';
import CanvasToolbar from './CanvasToolbar';
import PlotFormDialog from './PlotFormDialog';
import PlotDetailDrawer from './PlotDetailDrawer';
import RoadFormDialog from './RoadFormDialog';
import AmenityPicker from './AmenityPicker';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

const CANVAS_BG = '#f9f9f6';
const GRID_SIZE = 40;
const CANVAS_SIZE = 4000;

// Build grid lines once — only visible region is drawn by Konva automatically
const GRID_LINES = [];
for (let i = 0; i <= CANVAS_SIZE / GRID_SIZE; i++) {
  const v = i * GRID_SIZE;
  GRID_LINES.push({ points: [v, 0, v, CANVAS_SIZE], key: `v${i}` });
  GRID_LINES.push({ points: [0, v, CANVAS_SIZE, v], key: `h${i}` });
}

function getScaledPos(stage) {
  const pos = stage.getPointerPosition();
  if (!pos) return { x: 0, y: 0 };
  const s = stage.scaleX();
  return { x: (pos.x - stage.x()) / s, y: (pos.y - stage.y()) / s };
}

export default function ProjectCanvas({ projectId, readOnly = false }) {
  const { enqueueSnackbar } = useSnackbar();
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const [activeTool, setActiveTool] = useState(CANVAS_TOOL_TYPES.SELECT);
  const [plots, setPlots] = useState([]);
  const [roads, setRoads] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [textLabels, setTextLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Drawing
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [roadPoints, setRoadPoints] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 200, y: 200 });

  // UI
  const [plotFormOpen, setPlotFormOpen] = useState(false);
  const [pendingShape, setPendingShape] = useState(null);
  const [pasteData, setPasteData] = useState(null);
  const [editPlot, setEditPlot] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [roadFormOpen, setRoadFormOpen] = useState(false);
  const [amenityPickerOpen, setAmenityPickerOpen] = useState(false);
  const [history, setHistory] = useState([]);

  // Pan / touch
  const isPanning = useRef(false);
  const panStart = useRef(null);
  const lastTouchDist = useRef(null);
  const lastTapTime = useRef(0);
  const lastTapPos = useRef(null);

  // Copy-paste
  const copiedPlot = useRef(null);
  const [hasCopied, setHasCopied] = useState(false);

  /* ── Size observer ── */
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Data fetch ── */
  useEffect(() => { fetchData(); }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plotsRes, projRes] = await Promise.all([
        axios.get(`/api/plots?projectId=${projectId}`),
        axios.get(`/api/projects/${projectId}`),
      ]);
      if (plotsRes.data.success) setPlots(plotsRes.data.data);
      if (projRes.data.success && projRes.data.data.canvasData) {
        const cd = projRes.data.data.canvasData;
        if (cd.roads) setRoads(cd.roads);
        if (cd.amenities) setAmenities(cd.amenities);
        if (cd.textLabels) setTextLabels(cd.textLabels);
      }
    } catch {
      enqueueSnackbar('Failed to load canvas data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveCanvas = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/projects/${projectId}`, { canvasData: { roads, amenities, textLabels } });
      enqueueSnackbar('Layout saved!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save layout', { variant: 'error' });
    } finally { setSaving(false); }
  };

  const pushHistory = () =>
    setHistory(prev => [...prev.slice(-19), { plots: [...plots], roads: [...roads], amenities: [...amenities] }]);

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setPlots(prev.plots); setRoads(prev.roads); setAmenities(prev.amenities);
    setHistory(h => h.slice(0, -1));
  };

  /* ── Zoom helpers ── */
  const zoomStage = (stage, scaleDelta, focalX, focalY) => {
    const oldScale = stage.scaleX();
    const newScale = Math.max(0.15, Math.min(6, oldScale * scaleDelta));
    stage.scale({ x: newScale, y: newScale });
    stage.position({
      x: focalX - (focalX - stage.x()) * (newScale / oldScale),
      y: focalY - (focalY - stage.y()) * (newScale / oldScale),
    });
  };

  /* ── Wheel zoom (desktop) ── */
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const ptr = stage.getPointerPosition();
    zoomStage(stage, e.evt.deltaY < 0 ? 1.1 : 1 / 1.1, ptr.x, ptr.y);
  };

  /* ── Shared down/move/up ── */
  const onDown = (clientX, clientY) => {
    const stage = stageRef.current;

    // SELECT or PAN — both pan with drag
    if (activeTool === CANVAS_TOOL_TYPES.SELECT || activeTool === CANVAS_TOOL_TYPES.PAN) {
      isPanning.current = true;
      panStart.current = { x: clientX - stage.x(), y: clientY - stage.y() };
      return;
    }
    if (activeTool === CANVAS_TOOL_TYPES.RECTANGLE) {
      const pos = getScaledPos(stage);
      setIsDrawing(true);
      setDrawStart(pos);
      setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  const onMove = (clientX, clientY) => {
    const stage = stageRef.current;
    const pos = getScaledPos(stage);
    setMousePos(pos);
    if (isPanning.current && panStart.current) {
      stage.x(clientX - panStart.current.x);
      stage.y(clientY - panStart.current.y);
      return;
    }
    if (isDrawing && activeTool === CANVAS_TOOL_TYPES.RECTANGLE && drawStart) {
      setCurrentRect({
        x: Math.min(pos.x, drawStart.x),
        y: Math.min(pos.y, drawStart.y),
        width: Math.abs(pos.x - drawStart.x),
        height: Math.abs(pos.y - drawStart.y),
      });
    }
  };

  const onUp = () => {
    isPanning.current = false;
    if (activeTool === CANVAS_TOOL_TYPES.RECTANGLE && isDrawing && currentRect) {
      if (currentRect.width > 10 && currentRect.height > 10) {
        setPendingShape({ type: 'rectangle', ...currentRect });
        setPlotFormOpen(true);
      }
      setIsDrawing(false);
      setCurrentRect(null);
    }
  };

  const onTap = (pos) => {
    // Paste
    if (activeTool === CANVAS_TOOL_TYPES.COPY && copiedPlot.current) {
      triggerPasteAt(pos);
      return;
    }
    if (activeTool === CANVAS_TOOL_TYPES.ROAD) {
      setRoadPoints(prev => [...prev, pos]);
      return;
    }
    if (activeTool === CANVAS_TOOL_TYPES.POLYGON) {
      if (polygonPoints.length >= 3) {
        const first = polygonPoints[0];
        const dist = Math.hypot(pos.x - first.x, pos.y - first.y);
        if (dist < 20) {
          setPendingShape({ type: 'polygon', points: polygonPoints });
          setPolygonPoints([]);
          setPlotFormOpen(true);
          return;
        }
      }
      setPolygonPoints(prev => [...prev, pos]);
    }
    if (activeTool === CANVAS_TOOL_TYPES.AMENITY) { setMousePos(pos); setAmenityPickerOpen(true); }
    if (activeTool === CANVAS_TOOL_TYPES.TEXT) {
      const label = prompt('Enter text label:');
      if (label) { pushHistory(); setTextLabels(prev => [...prev, { id: Date.now(), x: pos.x, y: pos.y, text: label }]); }
    }
  };

  const onDoubleTap = () => {
    if (activeTool === CANVAS_TOOL_TYPES.POLYGON && polygonPoints.length >= 3) {
      setPendingShape({ type: 'polygon', points: polygonPoints });
      setPolygonPoints([]);
      setPlotFormOpen(true);
    }
    if (activeTool === CANVAS_TOOL_TYPES.ROAD && roadPoints.length >= 2) setRoadFormOpen(true);
  };

  const handleFinishRoad = () => {
    if (roadPoints.length >= 2) setRoadFormOpen(true);
  };

  const handleCancelRoad = () => {
    setRoadPoints([]);
  };

  /* ── Mouse events ── */
  const handleMouseDown = (e) => onDown(e.evt.clientX, e.evt.clientY);
  const handleMouseMove = (e) => onMove(e.evt.clientX, e.evt.clientY);
  const handleMouseUp = () => onUp();
  const handleClick = () => { const s = stageRef.current; onTap(getScaledPos(s)); };
  const handleDblClick = () => onDoubleTap();

  /* ── Touch events ── */
  const handleTouchStart = (e) => {
    e.evt.preventDefault();
    const touches = e.evt.touches;
    if (touches.length === 2) {
      isPanning.current = false;
      setIsDrawing(false); setCurrentRect(null);
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
      return;
    }
    onDown(touches[0].clientX, touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    e.evt.preventDefault();
    const touches = e.evt.touches;
    if (touches.length === 2 && lastTouchDist.current) {
      const stage = stageRef.current;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const newDist = Math.hypot(dx, dy);
      const midX = (touches[0].clientX + touches[1].clientX) / 2;
      const midY = (touches[0].clientY + touches[1].clientY) / 2;
      const box = stage.container().getBoundingClientRect();
      zoomStage(stage, newDist / lastTouchDist.current, midX - box.left, midY - box.top);
      lastTouchDist.current = newDist;
      return;
    }
    onMove(touches[0].clientX, touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    e.evt.preventDefault();
    lastTouchDist.current = null;
    const stage = stageRef.current;
    const pos = getScaledPos(stage);
    const now = Date.now();
    if (lastTapTime.current && (now - lastTapTime.current) < 300 && lastTapPos.current &&
      Math.hypot(pos.x - lastTapPos.current.x, pos.y - lastTapPos.current.y) < 30) {
      lastTapTime.current = 0;
      onDoubleTap();
      return;
    }
    lastTapTime.current = now;
    lastTapPos.current = pos;
    onUp();
    if ([CANVAS_TOOL_TYPES.POLYGON, CANVAS_TOOL_TYPES.AMENITY, CANVAS_TOOL_TYPES.TEXT,
      CANVAS_TOOL_TYPES.ROAD, CANVAS_TOOL_TYPES.COPY].includes(activeTool)) {
      onTap(pos);
    }
  };

  /* ── Copy / Paste ── */
  const doCopy = (plot) => {
    copiedPlot.current = plot;
    setHasCopied(true);
    enqueueSnackbar(`Plot ${plot.plotNumber} copied`, { variant: 'info' });
  };

  const triggerPasteAt = (pos) => {
    const src = copiedPlot.current;
    if (!src) return;
    if (src.shapeType === 'rectangle') {
      setPendingShape({ type: 'rectangle', x: pos.x - src.canvasWidth / 2, y: pos.y - src.canvasHeight / 2, width: src.canvasWidth, height: src.canvasHeight });
    } else {
      const xs = src.coordinates.map(p => p.x), ys = src.coordinates.map(p => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      setPendingShape({ type: 'polygon', points: src.coordinates.map(p => ({ x: p.x + pos.x - cx, y: p.y + pos.y - cy })) });
    }
    setPasteData({ plotNumber: '', area: src.area || '', length: src.length || '', width: src.width || '', price: src.price || '', notes: src.notes || '', status: 'available', customerId: null, assignedAgent: null });
    setEditPlot(null);
    setPlotFormOpen(true);
  };

  const pasteCentered = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = stage.scaleX();
    triggerPasteAt({ x: (dimensions.width / 2 - stage.x()) / s, y: (dimensions.height / 2 - stage.y()) / s });
  };

  const cancelCopy = () => { copiedPlot.current = null; setHasCopied(false); };

  const handleCopyPlot = (plot) => {
    doCopy(plot);
    setActiveTool(CANVAS_TOOL_TYPES.COPY);
  };

  useEffect(() => {
    if (readOnly) return;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedPlot) doCopy(selectedPlot);
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedPlot.current) triggerPasteAt(mousePos);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readOnly, selectedPlot, mousePos]);

  /* ── Plot click ── */
  const handlePlotClick = (plot, e) => {
    e.cancelBubble = true;
    if (activeTool === CANVAS_TOOL_TYPES.DELETE) {
      if (confirm(`Delete plot ${plot.plotNumber}?`)) {
        axios.delete(`/api/plots/${plot._id}`).then(() => {
          setPlots(prev => prev.filter(p => p._id !== plot._id));
          enqueueSnackbar('Plot deleted', { variant: 'success' });
        });
      }
      return;
    }
    if (activeTool === CANVAS_TOOL_TYPES.COPY) {
      doCopy(plot);
      return;
    }
    // SELECT / PAN — open drawer on click (not drag)
    if (!isPanning.current) {
      setSelectedPlot(plot);
      setDrawerOpen(true);
    }
  };

  /* ── Plot save ── */
  const handlePlotSave = async (formData) => {
    try {
      let coords = [], canvasX = 0, canvasY = 0, canvasW = 100, canvasH = 80;
      if (pendingShape?.type === 'rectangle') {
        const s = pendingShape;
        coords = [{ x: s.x, y: s.y }, { x: s.x + s.width, y: s.y }, { x: s.x + s.width, y: s.y + s.height }, { x: s.x, y: s.y + s.height }];
        canvasX = s.x; canvasY = s.y; canvasW = s.width; canvasH = s.height;
      } else if (pendingShape?.type === 'polygon') {
        coords = pendingShape.points;
        const xs = coords.map(p => p.x), ys = coords.map(p => p.y);
        canvasX = Math.min(...xs); canvasY = Math.min(...ys);
        canvasW = Math.max(...xs) - canvasX; canvasH = Math.max(...ys) - canvasY;
      }
      const payload = { ...formData, projectId, shapeType: pendingShape?.type, coordinates: coords, canvasX, canvasY, canvasWidth: canvasW, canvasHeight: canvasH, price: Number(formData.price) || 0 };
      const res = editPlot ? await axios.put(`/api/plots/${editPlot._id}`, payload) : await axios.post('/api/plots', payload);
      if (res.data.success) {
        pushHistory();
        setPlots(prev => editPlot ? prev.map(p => p._id === editPlot._id ? res.data.data : p) : [...prev, res.data.data]);
        enqueueSnackbar(editPlot ? 'Plot updated!' : 'Plot created!', { variant: 'success' });
        setPlotFormOpen(false); setPendingShape(null); setEditPlot(null); setPasteData(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to save plot', { variant: 'error' });
    }
  };

  const handleEditFromDrawer = () => {
    setDrawerOpen(false);
    setEditPlot(selectedPlot);
    setPendingShape({ type: selectedPlot.shapeType, x: selectedPlot.canvasX, y: selectedPlot.canvasY, width: selectedPlot.canvasWidth, height: selectedPlot.canvasHeight, points: selectedPlot.coordinates });
    setPlotFormOpen(true);
  };

  const handleDeleteFromDrawer = async () => {
    if (!confirm(`Delete plot ${selectedPlot.plotNumber}?`)) return;
    try {
      await axios.delete(`/api/plots/${selectedPlot._id}`);
      setPlots(prev => prev.filter(p => p._id !== selectedPlot._id));
      setDrawerOpen(false);
      enqueueSnackbar('Plot deleted', { variant: 'success' });
    } catch { enqueueSnackbar('Failed to delete', { variant: 'error' }); }
  };

  const getCursor = () => {
    if (activeTool === CANVAS_TOOL_TYPES.PAN) return isPanning.current ? 'grabbing' : 'grab';
    if (activeTool === CANVAS_TOOL_TYPES.SELECT) return isPanning.current ? 'grabbing' : 'default';
    if (activeTool === CANVAS_TOOL_TYPES.RECTANGLE || activeTool === CANVAS_TOOL_TYPES.POLYGON || activeTool === CANVAS_TOOL_TYPES.ROAD) return 'crosshair';
    if (activeTool === CANVAS_TOOL_TYPES.DELETE) return 'not-allowed';
    if (activeTool === CANVAS_TOOL_TYPES.COPY) return hasCopied ? 'copy' : 'cell';
    return 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <CircularProgress size={28} />
        <Typography color="#888">Loading canvas...</Typography>
      </Box>
    );
  }

  const polygonPreview = polygonPoints.length ? [...polygonPoints.flatMap(p => [p.x, p.y]), mousePos.x, mousePos.y] : [];
  const roadPreview = roadPoints.length ? [...roadPoints.flatMap(p => [p.x, p.y]), mousePos.x, mousePos.y] : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={(tool) => {
          // Switching away from road tool while drawing — cancel
          if (activeTool === CANVAS_TOOL_TYPES.ROAD && roadPoints.length > 0 && tool !== CANVAS_TOOL_TYPES.ROAD) {
            setRoadPoints([]);
          }
          setActiveTool(tool);
        }}
        onSave={saveCanvas}
        onUndo={handleUndo}
        saving={saving}
        readOnly={readOnly}
        roadPointCount={roadPoints.length}
        onFinishRoad={handleFinishRoad}
        onCancelRoad={handleCancelRoad}
      />

      {/* Canvas container — must fill remaining height exactly */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          cursor: getCursor(),
          // Prevent browser from hijacking touch events for scroll
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Status legend — compact, top-right on mobile */}
        <Box sx={{
          position: 'absolute',
          bottom: { xs: 'auto', sm: 16 },
          top: { xs: 8, sm: 'auto' },
          right: { xs: 8, sm: 'auto' },
          left: { xs: 'auto', sm: 16 },
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.95)',
          borderRadius: 2,
          p: { xs: 1, sm: 1.5 },
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          display: 'flex',
          gap: { xs: 0.8, sm: 1.5 },
          flexDirection: { xs: 'column', sm: 'row' },
          flexWrap: 'wrap',
          maxWidth: { xs: 110, sm: 'none' },
        }}>
          {Object.entries(PLOT_STATUS_COLORS).map(([k, c]) => (
            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, bgcolor: c, borderRadius: 0.5, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#444', textTransform: 'capitalize', lineHeight: 1 }}>
                {PLOT_STATUS_LABELS[k] || k}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Instruction hints */}
        {activeTool === CANVAS_TOOL_TYPES.POLYGON && polygonPoints.length > 0 && (
          <Box sx={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            bgcolor: '#1a3c5e', color: 'white', px: 2, py: 0.8, borderRadius: 2,
            fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {polygonPoints.length < 3 ? `${3 - polygonPoints.length} more point(s) needed` : 'Double-tap or tap first point to close'}
          </Box>
        )}

        {activeTool === CANVAS_TOOL_TYPES.ROAD && (
          <Box sx={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            bgcolor: '#1a3c5e', color: 'white', px: 2, py: 0.8, borderRadius: 2,
            fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {roadPoints.length === 0
              ? '🛣️ Tap to place road points'
              : roadPoints.length === 1
              ? '🛣️ 1 point — tap to add more'
              : `🛣️ ${roadPoints.length} points — tap ✓ Done in toolbar to finish`}
          </Box>
        )}

        {activeTool === CANVAS_TOOL_TYPES.COPY && (
          <Box sx={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            bgcolor: '#c8922a', color: 'white', px: 2, py: 0.8, borderRadius: 2,
            fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
            boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          }}>
            {hasCopied ? `📋 Tap canvas to paste "${copiedPlot.current?.plotNumber}"` : '👆 Tap a plot to copy it'}
          </Box>
        )}

        {activeTool === CANVAS_TOOL_TYPES.DELETE && (
          <Box sx={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            bgcolor: '#d32f2f', color: 'white', px: 2, py: 0.8, borderRadius: 2,
            fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            🗑 Tap any plot, road or amenity to delete it
          </Box>
        )}

        {/* Mobile paste floating button */}
        {hasCopied && (
          <Box sx={{
            position: 'absolute', bottom: 70, right: 12, zIndex: 20,
            display: { xs: 'flex', sm: 'none' },
            flexDirection: 'column', alignItems: 'flex-end', gap: 1,
          }}>
            <Button variant="contained" startIcon={<ContentPasteIcon />} onClick={pasteCentered}
              sx={{ bgcolor: '#c8922a', '&:hover': { bgcolor: '#a57420' }, fontWeight: 700, borderRadius: 3, boxShadow: '0 4px 16px rgba(200,146,42,0.5)', fontSize: '0.8rem' }}>
              Paste Plot
            </Button>
            <Button size="small" onClick={cancelCopy}
              sx={{ color: '#555', bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2, fontSize: '0.72rem', px: 1.5 }}>
              Cancel Copy
            </Button>
          </Box>
        )}

        {/* Zoom controls — bottom right */}
        <Box sx={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: 0.5,
        }}>
          {[{ label: '+', delta: 1.25 }, { label: '−', delta: 0.8 }, { label: '⊙', delta: null }].map(btn => (
            <Box key={btn.label}
              onClick={() => {
                const stage = stageRef.current;
                if (!stage) return;
                if (btn.delta === null) {
                  stage.scale({ x: 1, y: 1 });
                  stage.position({ x: 0, y: 0 });
                } else {
                  zoomStage(stage, btn.delta, dimensions.width / 2, dimensions.height / 2);
                }
              }}
              sx={{
                width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 1.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 6px rgba(0,0,0,0.15)', cursor: 'pointer', fontWeight: 700,
                fontSize: btn.label === '⊙' ? '0.9rem' : '1.1rem', color: '#1a3c5e',
                '&:active': { bgcolor: '#e8f0fe' },
              }}>
              {btn.label}
            </Box>
          ))}
        </Box>

        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          onDblClick={handleDblClick}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ display: 'block', background: CANVAS_BG }}
        >
          <Layer>
            {/* Grid — static, no state, drawn once */}
            {GRID_LINES.map(l => (
              <Line key={l.key} points={l.points} stroke="#e8e8e8" strokeWidth={0.5} listening={false} />
            ))}

            {/* Roads */}
            {roads.map(road => (
              <Line key={road.id} points={road.points.flatMap(p => [p.x, p.y])}
                stroke="#c8c8c8" strokeWidth={Number(road.roadWidth) || 14} lineCap="round" lineJoin="round"
                onClick={(e) => {
                  if (activeTool === CANVAS_TOOL_TYPES.DELETE) {
                    e.cancelBubble = true;
                    if (confirm('Delete this road?')) {
                      pushHistory();
                      setRoads(prev => prev.filter(r => r.id !== road.id));
                    }
                  }
                }}
                onTap={(e) => {
                  if (activeTool === CANVAS_TOOL_TYPES.DELETE) {
                    e.cancelBubble = true;
                    if (confirm('Delete this road?')) {
                      pushHistory();
                      setRoads(prev => prev.filter(r => r.id !== road.id));
                    }
                  }
                }}
                onMouseEnter={e => { if (activeTool === CANVAS_TOOL_TYPES.DELETE) e.target.getStage().container().style.cursor = 'not-allowed'; }}
                onMouseLeave={e => { e.target.getStage().container().style.cursor = getCursor(); }}
                hitStrokeWidth={20}
              />
            ))}
            {roads.map(road => road.roadName && (
              <Text key={`rt${road.id}`} x={road.points[0]?.x || 0} y={(road.points[0]?.y || 0) - 18}
                text={road.roadName} fontSize={12} fill="#888" fontStyle="bold" listening={false} />
            ))}

            {/* Plots */}
            {plots.map(plot => {
              const color = PLOT_STATUS_COLORS[plot.status] || '#4caf50';
              const coords = plot.coordinates || [];
              const isSelected = selectedPlot?._id === plot._id && drawerOpen;

              if (plot.shapeType === 'rectangle' && coords.length === 4) {
                const x = plot.canvasX ?? coords[0].x;
                const y = plot.canvasY ?? coords[0].y;
                const w = plot.canvasWidth ?? (coords[1].x - coords[0].x);
                const h = plot.canvasHeight ?? (coords[3].y - coords[0].y);
                return (
                  <Group key={plot._id}>
                    <Rect x={x} y={y} width={w} height={h}
                      fill={color + 'CC'} stroke={isSelected ? '#fff' : color}
                      strokeWidth={isSelected ? 3 : 2} cornerRadius={3}
                      shadowEnabled={isSelected} shadowColor="rgba(0,0,0,0.3)" shadowBlur={8}
                      onClick={(e) => handlePlotClick(plot, e)}
                      onTap={(e) => handlePlotClick(plot, e)}
                      onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; }}
                      onMouseLeave={e => { e.target.getStage().container().style.cursor = getCursor(); }}
                    />
                    <Text x={x + 4} y={y + (h / 2) - 8} width={w - 8}
                      text={plot.plotNumber} fontSize={Math.max(9, Math.min(13, w / 5))}
                      fill="white" fontStyle="bold" align="center"
                      onClick={(e) => handlePlotClick(plot, e)}
                      onTap={(e) => handlePlotClick(plot, e)}
                      listening={false}
                    />
                    {h > 36 && plot.area && (
                      <Text x={x + 2} y={y + h - 14} width={w - 4}
                        text={plot.area} fontSize={8} fill="rgba(255,255,255,0.75)" align="center" listening={false} />
                    )}
                  </Group>
                );
              }

              if (plot.shapeType === 'polygon' && coords.length >= 3) {
                const flatPts = coords.flatMap(p => [p.x, p.y]);
                const cx = coords.reduce((s, p) => s + p.x, 0) / coords.length;
                const cy = coords.reduce((s, p) => s + p.y, 0) / coords.length;
                return (
                  <Group key={plot._id}>
                    <Line points={flatPts} closed fill={color + 'CC'}
                      stroke={isSelected ? '#fff' : color} strokeWidth={isSelected ? 3 : 2}
                      onClick={(e) => handlePlotClick(plot, e)}
                      onTap={(e) => handlePlotClick(plot, e)}
                      onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; }}
                      onMouseLeave={e => { e.target.getStage().container().style.cursor = getCursor(); }}
                    />
                    <Text x={cx - 24} y={cy - 7} width={48}
                      text={plot.plotNumber} fontSize={11} fill="white" fontStyle="bold" align="center"
                      onClick={(e) => handlePlotClick(plot, e)}
                      onTap={(e) => handlePlotClick(plot, e)}
                      listening={false}
                    />
                  </Group>
                );
              }
              return null;
            })}

            {/* Amenities */}
            {amenities.map(a => (
              <Group key={a.id}>
                <Text x={a.x - 16} y={a.y - 16} text={a.emoji} fontSize={28}
                  draggable={!readOnly && activeTool !== CANVAS_TOOL_TYPES.DELETE}
                  onDragEnd={e => setAmenities(prev => prev.map(am => am.id === a.id ? { ...am, x: e.target.x() + 16, y: e.target.y() + 16 } : am))}
                  onClick={(e) => {
                    if (activeTool === CANVAS_TOOL_TYPES.DELETE) {
                      e.cancelBubble = true;
                      pushHistory();
                      setAmenities(prev => prev.filter(am => am.id !== a.id));
                    }
                  }}
                  onTap={(e) => {
                    if (activeTool === CANVAS_TOOL_TYPES.DELETE) {
                      e.cancelBubble = true;
                      pushHistory();
                      setAmenities(prev => prev.filter(am => am.id !== a.id));
                    }
                  }}
                  onMouseEnter={e => { if (activeTool === CANVAS_TOOL_TYPES.DELETE) e.target.getStage().container().style.cursor = 'not-allowed'; }}
                  onMouseLeave={e => { e.target.getStage().container().style.cursor = getCursor(); }}
                />
                <Text x={a.x - 28} y={a.y + 14} width={56} text={a.label}
                  fontSize={9} fill="#666" align="center" fontStyle="bold" listening={false} />
              </Group>
            ))}

            {/* Text labels */}
            {textLabels.map(t => (
              <Text key={t.id} x={t.x} y={t.y} text={t.text} fontSize={14}
                fill="#1a3c5e" fontStyle="bold" draggable={!readOnly}
                onDragEnd={e => setTextLabels(prev => prev.map(tl => tl.id === t.id ? { ...tl, x: e.target.x(), y: e.target.y() } : tl))}
              />
            ))}

            {/* Drawing preview */}
            {currentRect && (
              <Rect x={currentRect.x} y={currentRect.y} width={currentRect.width} height={currentRect.height}
                fill="rgba(26,60,94,0.15)" stroke="#1a3c5e" strokeWidth={1.5} dash={[6, 3]} listening={false} />
            )}
            {polygonPreview.length >= 4 && (
              <Line points={polygonPreview} stroke="#1a3c5e" strokeWidth={1.5} dash={[5, 3]} listening={false} />
            )}
            {polygonPoints.map((p, i) => (
              <Circle key={i} x={p.x} y={p.y} radius={i === 0 ? 7 : 4}
                fill={i === 0 ? '#c8922a' : '#1a3c5e'} stroke="white" strokeWidth={2} listening={false} />
            ))}
            {roadPreview.length >= 4 && (
              <Line points={roadPreview} stroke="#c8c8c8" strokeWidth={12} lineCap="round" opacity={0.6} listening={false} />
            )}
            {roadPoints.map((p, i) => (
              <Circle key={i} x={p.x} y={p.y} radius={5} fill="#888" stroke="white" strokeWidth={1.5} listening={false} />
            ))}
          </Layer>
        </Stage>
      </Box>

      {/* Dialogs */}
      <PlotFormDialog
        open={plotFormOpen}
        onClose={() => { setPlotFormOpen(false); setPendingShape(null); setEditPlot(null); setPolygonPoints([]); setPasteData(null); }}
        onSave={handlePlotSave}
        projectId={projectId}
        initialData={pasteData || editPlot}
        editMode={!!editPlot}
      />
      <PlotDetailDrawer
        plot={selectedPlot}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
        onCopy={handleCopyPlot}
        onPlotUpdated={(updatedPlot) => {
          setPlots(prev => prev.map(p => p._id === updatedPlot._id ? updatedPlot : p));
          setSelectedPlot(updatedPlot);
        }}
      />
      <RoadFormDialog
        open={roadFormOpen}
        onClose={() => { setRoadFormOpen(false); setRoadPoints([]); }}
        onSave={(roadData) => { pushHistory(); setRoads(prev => [...prev, { id: Date.now(), points: roadPoints, ...roadData }]); setRoadPoints([]); setRoadFormOpen(false); }}
      />
      <AmenityPicker
        open={amenityPickerOpen}
        onClose={() => setAmenityPickerOpen(false)}
        onSelect={(amenity) => { pushHistory(); setAmenities(prev => [...prev, { id: Date.now(), type: amenity.id, emoji: amenity.emoji, label: amenity.label, x: mousePos.x, y: mousePos.y }]); }}
      />
    </Box>
  );
}
