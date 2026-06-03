'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Stage, Layer, Rect, Line, Circle, Text, Group, RegularPolygon } from 'react-konva';
import { PLOT_STATUS_COLORS, CANVAS_TOOL_TYPES, AMENITY_TYPES } from '@/lib/constants';
import CanvasToolbar from './CanvasToolbar';
import PlotFormDialog from './PlotFormDialog';
import PlotDetailDrawer from './PlotDetailDrawer';
import RoadFormDialog from './RoadFormDialog';
import AmenityPicker from './AmenityPicker';

const CANVAS_BG = '#f9f9f6';
const GRID_SIZE = 20;

function getPointerPos(stage) {
  const pos = stage.getPointerPosition();
  const scale = stage.scaleX();
  return {
    x: (pos.x - stage.x()) / scale,
    y: (pos.y - stage.y()) / scale,
  };
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

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentRect, setCurrentRect] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]); // [{x,y}]
  const [roadPoints, setRoadPoints] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // UI state
  const [plotFormOpen, setPlotFormOpen] = useState(false);
  const [pendingShape, setPendingShape] = useState(null);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editPlot, setEditPlot] = useState(null);
  const [roadFormOpen, setRoadFormOpen] = useState(false);
  const [amenityPickerOpen, setAmenityPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // History for undo
  const [history, setHistory] = useState([]);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plotsRes, projectRes] = await Promise.all([
        axios.get(`/api/plots?projectId=${projectId}`),
        axios.get(`/api/projects/${projectId}`),
      ]);
      if (plotsRes.data.success) setPlots(plotsRes.data.data);
      if (projectRes.data.success && projectRes.data.data.canvasData) {
        const cd = projectRes.data.data.canvasData;
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
      await axios.put(`/api/projects/${projectId}`, {
        canvasData: { roads, amenities, textLabels },
      });
      enqueueSnackbar('Layout saved!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to save layout', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const pushHistory = () => {
    setHistory(prev => [...prev.slice(-19), { plots: [...plots], roads: [...roads], amenities: [...amenities] }]);
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setPlots(prev.plots);
    setRoads(prev.roads);
    setAmenities(prev.amenities);
    setHistory(h => h.slice(0, -1));
  };

  // Wheel zoom
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.2, Math.min(5, newScale));
    stage.scale({ x: clampedScale, y: clampedScale });
    const newPos = {
      x: pointer.x - (pointer.x - stage.x()) * (clampedScale / oldScale),
      y: pointer.y - (pointer.y - stage.y()) * (clampedScale / oldScale),
    };
    stage.position(newPos);
  };

  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    const pos = getPointerPos(stage);

    if (activeTool === CANVAS_TOOL_TYPES.PAN) {
      setIsPanning(true);
      panStart.current = { x: e.evt.clientX - stage.x(), y: e.evt.clientY - stage.y() };
      return;
    }

    if (activeTool === CANVAS_TOOL_TYPES.RECTANGLE) {
      setIsDrawing(true);
      setDrawStart(pos);
      setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }

    if (activeTool === CANVAS_TOOL_TYPES.ROAD) {
      setRoadPoints(prev => [...prev, pos]);
    }
  };

  const handleMouseMove = (e) => {
    const stage = stageRef.current;
    const pos = getPointerPos(stage);
    setMousePos(pos);

    if (isPanning && panStart.current) {
      stage.x(e.evt.clientX - panStart.current.x);
      stage.y(e.evt.clientY - panStart.current.y);
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

  const handleMouseUp = () => {
    setIsPanning(false);
    if (activeTool === CANVAS_TOOL_TYPES.RECTANGLE && isDrawing && currentRect) {
      if (currentRect.width > 10 && currentRect.height > 10) {
        setPendingShape({ type: 'rectangle', ...currentRect });
        setPlotFormOpen(true);
      }
      setIsDrawing(false);
      setCurrentRect(null);
    }
  };

  const handleCanvasClick = (e) => {
    const stage = stageRef.current;
    const pos = getPointerPos(stage);

    if (activeTool === CANVAS_TOOL_TYPES.POLYGON) {
      // Check if clicking near first point to close
      if (polygonPoints.length >= 3) {
        const first = polygonPoints[0];
        const dist = Math.sqrt((pos.x - first.x) ** 2 + (pos.y - first.y) ** 2);
        if (dist < 15) {
          setPendingShape({ type: 'polygon', points: polygonPoints });
          setPolygonPoints([]);
          setPlotFormOpen(true);
          return;
        }
      }
      setPolygonPoints(prev => [...prev, pos]);
    }

    if (activeTool === CANVAS_TOOL_TYPES.AMENITY) {
      setAmenityPickerOpen(true);
      setMousePos(pos);
    }

    if (activeTool === CANVAS_TOOL_TYPES.TEXT) {
      const label = prompt('Enter text label:');
      if (label) {
        pushHistory();
        setTextLabels(prev => [...prev, { id: Date.now(), x: pos.x, y: pos.y, text: label }]);
      }
    }
  };

  const handleDblClick = () => {
    if (activeTool === CANVAS_TOOL_TYPES.POLYGON && polygonPoints.length >= 3) {
      setPendingShape({ type: 'polygon', points: polygonPoints });
      setPolygonPoints([]);
      setPlotFormOpen(true);
    }
    if (activeTool === CANVAS_TOOL_TYPES.ROAD && roadPoints.length >= 2) {
      setRoadFormOpen(true);
    }
  };

  const handlePlotSave = async (formData) => {
    try {
      let coords = [];
      let canvasX = 0, canvasY = 0, canvasW = 100, canvasH = 80;

      if (pendingShape?.type === 'rectangle') {
        const s = pendingShape;
        coords = [
          { x: s.x, y: s.y }, { x: s.x + s.width, y: s.y },
          { x: s.x + s.width, y: s.y + s.height }, { x: s.x, y: s.y + s.height },
        ];
        canvasX = s.x; canvasY = s.y; canvasW = s.width; canvasH = s.height;
      } else if (pendingShape?.type === 'polygon') {
        coords = pendingShape.points;
        const xs = coords.map(p => p.x), ys = coords.map(p => p.y);
        canvasX = Math.min(...xs); canvasY = Math.min(...ys);
        canvasW = Math.max(...xs) - canvasX; canvasH = Math.max(...ys) - canvasY;
      }

      const payload = {
        ...formData,
        projectId,
        shapeType: pendingShape?.type,
        coordinates: coords,
        canvasX, canvasY, canvasWidth: canvasW, canvasHeight: canvasH,
        price: Number(formData.price) || 0,
      };

      let res;
      if (editPlot) {
        res = await axios.put(`/api/plots/${editPlot._id}`, payload);
      } else {
        res = await axios.post('/api/plots', payload);
      }

      if (res.data.success) {
        pushHistory();
        if (editPlot) {
          setPlots(prev => prev.map(p => p._id === editPlot._id ? res.data.data : p));
          enqueueSnackbar('Plot updated!', { variant: 'success' });
        } else {
          setPlots(prev => [...prev, res.data.data]);
          enqueueSnackbar('Plot created!', { variant: 'success' });
        }
        setPlotFormOpen(false);
        setPendingShape(null);
        setEditPlot(null);
      }
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || 'Failed to save plot', { variant: 'error' });
    }
  };

  const handleRoadSave = (roadData) => {
    pushHistory();
    setRoads(prev => [...prev, { id: Date.now(), points: roadPoints, ...roadData }]);
    setRoadPoints([]);
    setRoadFormOpen(false);
  };

  const handleAmenitySelect = (amenity) => {
    pushHistory();
    setAmenities(prev => [...prev, { id: Date.now(), type: amenity.id, emoji: amenity.emoji, label: amenity.label, x: mousePos.x, y: mousePos.y }]);
  };

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
    setSelectedPlot(plot);
    setDrawerOpen(true);
  };

  const handleEditFromDrawer = () => {
    setDrawerOpen(false);
    setEditPlot(selectedPlot);
    setPendingShape({
      type: selectedPlot.shapeType,
      x: selectedPlot.canvasX,
      y: selectedPlot.canvasY,
      width: selectedPlot.canvasWidth,
      height: selectedPlot.canvasHeight,
      points: selectedPlot.coordinates,
    });
    setPlotFormOpen(true);
  };

  const handleDeleteFromDrawer = async () => {
    if (!confirm(`Delete plot ${selectedPlot.plotNumber}?`)) return;
    try {
      await axios.delete(`/api/plots/${selectedPlot._id}`);
      setPlots(prev => prev.filter(p => p._id !== selectedPlot._id));
      setDrawerOpen(false);
      enqueueSnackbar('Plot deleted', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to delete plot', { variant: 'error' });
    }
  };

  const getCursor = () => {
    switch (activeTool) {
      case CANVAS_TOOL_TYPES.PAN: return isPanning ? 'grabbing' : 'grab';
      case CANVAS_TOOL_TYPES.RECTANGLE: return 'crosshair';
      case CANVAS_TOOL_TYPES.POLYGON: return 'crosshair';
      case CANVAS_TOOL_TYPES.ROAD: return 'crosshair';
      case CANVAS_TOOL_TYPES.DELETE: return 'not-allowed';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
        <Typography ml={2} color="#888">Loading canvas...</Typography>
      </Box>
    );
  }

  // Preview polygon points as flat array for Konva Line
  const polygonFlatPoints = polygonPoints.flatMap(p => [p.x, p.y]);
  const previewFlatPoints = polygonPoints.length
    ? [...polygonFlatPoints, mousePos.x, mousePos.y]
    : [];

  const roadFlatPoints = roadPoints.flatMap(p => [p.x, p.y]);
  const roadPreviewPoints = roadPoints.length
    ? [...roadFlatPoints, mousePos.x, mousePos.y]
    : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CanvasToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onSave={saveCanvas}
        onUndo={handleUndo}
        saving={saving}
        readOnly={readOnly}
      />

      <Box ref={containerRef} sx={{ flex: 1, overflow: 'hidden', cursor: getCursor(), position: 'relative' }}>
        {/* Legend */}
        <Box sx={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.92)', borderRadius: 2, p: 1.5,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)', display: 'flex', gap: 1.5, flexWrap: 'wrap',
        }}>
          {Object.entries(PLOT_STATUS_COLORS).map(([k, c]) => (
            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 12, height: 12, bgcolor: c, borderRadius: 0.5 }} />
              <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#444', textTransform: 'capitalize' }}>
                {k}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Polygon instruction */}
        {activeTool === CANVAS_TOOL_TYPES.POLYGON && polygonPoints.length > 0 && (
          <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10,
            bgcolor: '#1a3c5e', color: 'white', px: 2, py: 0.8, borderRadius: 2, fontSize: '0.8rem', fontWeight: 600 }}>
            {polygonPoints.length < 3 ? `${3 - polygonPoints.length} more point(s) needed` : 'Double-click or click first point to close polygon'}
          </Box>
        )}

        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
          onDblClick={handleDblClick}
          onWheel={handleWheel}
          style={{ background: CANVAS_BG }}
        >
          <Layer>
            {/* Grid */}
            {Array.from({ length: Math.ceil(3000 / GRID_SIZE) }).map((_, i) => (
              <Line key={`v${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, 3000]} stroke="#e8e8e8" strokeWidth={0.5} />
            ))}
            {Array.from({ length: Math.ceil(3000 / GRID_SIZE) }).map((_, i) => (
              <Line key={`h${i}`} points={[0, i * GRID_SIZE, 3000, i * GRID_SIZE]} stroke="#e8e8e8" strokeWidth={0.5} />
            ))}

            {/* Roads */}
            {roads.map(road => (
              <Line
                key={road.id}
                points={road.points.flatMap(p => [p.x, p.y])}
                stroke="#bdbdbd"
                strokeWidth={Number(road.roadWidth) || 12}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            {roads.map(road => road.roadName && (
              <Text key={`rt${road.id}`}
                x={road.points[0]?.x || 0} y={(road.points[0]?.y || 0) - 16}
                text={road.roadName} fontSize={11} fill="#888" fontStyle="bold"
              />
            ))}

            {/* Plots */}
            {plots.map(plot => {
              const color = PLOT_STATUS_COLORS[plot.status] || '#4caf50';
              const coords = plot.coordinates || [];

              if (plot.shapeType === 'rectangle' && coords.length === 4) {
                const x = plot.canvasX ?? coords[0].x;
                const y = plot.canvasY ?? coords[0].y;
                const w = plot.canvasWidth ?? (coords[1].x - coords[0].x);
                const h = plot.canvasHeight ?? (coords[3].y - coords[0].y);
                return (
                  <Group key={plot._id}>
                    <Rect
                      x={x} y={y} width={w} height={h}
                      fill={color + 'CC'} stroke={color} strokeWidth={2}
                      cornerRadius={2}
                      onClick={(e) => !readOnly ? handlePlotClick(plot, e) : setSelectedPlot(plot) || setDrawerOpen(true)}
                      onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; }}
                      onMouseLeave={e => { e.target.getStage().container().style.cursor = getCursor(); }}
                    />
                    <Text
                      x={x + 4} y={y + 4} width={w - 8}
                      text={plot.plotNumber} fontSize={Math.max(9, Math.min(14, w / 6))}
                      fill="white" fontStyle="bold" align="center"
                      onClick={(e) => !readOnly ? handlePlotClick(plot, e) : setSelectedPlot(plot) || setDrawerOpen(true)}
                    />
                    {w > 40 && (
                      <Text
                        x={x + 4} y={y + h - 18} width={w - 8}
                        text={plot.area || ''} fontSize={9}
                        fill="rgba(255,255,255,0.8)" align="center"
                        onClick={(e) => !readOnly ? handlePlotClick(plot, e) : setSelectedPlot(plot) || setDrawerOpen(true)}
                      />
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
                    <Line
                      points={flatPts} closed fill={color + 'CC'} stroke={color} strokeWidth={2}
                      onClick={(e) => !readOnly ? handlePlotClick(plot, e) : setSelectedPlot(plot) || setDrawerOpen(true)}
                      onMouseEnter={e => { e.target.getStage().container().style.cursor = 'pointer'; }}
                      onMouseLeave={e => { e.target.getStage().container().style.cursor = getCursor(); }}
                    />
                    <Text
                      x={cx - 20} y={cy - 8} width={40}
                      text={plot.plotNumber} fontSize={11}
                      fill="white" fontStyle="bold" align="center"
                      onClick={(e) => !readOnly ? handlePlotClick(plot, e) : setSelectedPlot(plot) || setDrawerOpen(true)}
                    />
                  </Group>
                );
              }
              return null;
            })}

            {/* Amenities */}
            {amenities.map(a => (
              <Text key={a.id} x={a.x - 16} y={a.y - 16} text={a.emoji} fontSize={28}
                draggable={!readOnly}
                onDragEnd={e => {
                  setAmenities(prev => prev.map(am => am.id === a.id ? { ...am, x: e.target.x() + 16, y: e.target.y() + 16 } : am));
                }}
              />
            ))}
            {amenities.map(a => (
              <Text key={`al${a.id}`} x={a.x - 24} y={a.y + 14} width={48} text={a.label}
                fontSize={9} fill="#555" align="center" fontStyle="bold"
              />
            ))}

            {/* Text labels */}
            {textLabels.map(t => (
              <Text key={t.id} x={t.x} y={t.y} text={t.text} fontSize={14}
                fill="#1a3c5e" fontStyle="bold"
                draggable={!readOnly}
                onDragEnd={e => {
                  setTextLabels(prev => prev.map(tl => tl.id === t.id ? { ...tl, x: e.target.x(), y: e.target.y() } : tl));
                }}
              />
            ))}

            {/* Current drawing rect */}
            {currentRect && (
              <Rect
                x={currentRect.x} y={currentRect.y}
                width={currentRect.width} height={currentRect.height}
                fill="rgba(26,60,94,0.2)" stroke="#1a3c5e" strokeWidth={1.5}
                dash={[6, 3]}
              />
            )}

            {/* Polygon preview */}
            {previewFlatPoints.length >= 4 && (
              <Line points={previewFlatPoints} stroke="#1a3c5e" strokeWidth={1.5} dash={[5, 3]} />
            )}
            {polygonPoints.map((p, i) => (
              <Circle key={i} x={p.x} y={p.y} radius={i === 0 ? 6 : 4}
                fill={i === 0 ? '#c8922a' : '#1a3c5e'} stroke="white" strokeWidth={1.5}
              />
            ))}

            {/* Road preview */}
            {roadPreviewPoints.length >= 4 && (
              <Line points={roadPreviewPoints} stroke="#bdbdbd" strokeWidth={10} lineCap="round" opacity={0.5} />
            )}
            {roadPoints.map((p, i) => (
              <Circle key={i} x={p.x} y={p.y} radius={4} fill="#888" stroke="white" strokeWidth={1} />
            ))}
          </Layer>
        </Stage>
      </Box>

      <PlotFormDialog
        open={plotFormOpen}
        onClose={() => { setPlotFormOpen(false); setPendingShape(null); setEditPlot(null); setPolygonPoints([]); }}
        onSave={handlePlotSave}
        projectId={projectId}
        initialData={editPlot}
        editMode={!!editPlot}
      />

      <PlotDetailDrawer
        plot={selectedPlot}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
      />

      <RoadFormDialog
        open={roadFormOpen}
        onClose={() => { setRoadFormOpen(false); setRoadPoints([]); }}
        onSave={handleRoadSave}
      />

      <AmenityPicker
        open={amenityPickerOpen}
        onClose={() => setAmenityPickerOpen(false)}
        onSelect={handleAmenitySelect}
      />
    </Box>
  );
}
