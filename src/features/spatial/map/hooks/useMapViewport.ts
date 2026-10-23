import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import {
  DEFAULT_PROJECTION_CONFIG,
  type ProjectedPoint,
  type SelenographicCoordinate,
} from '@/domain/coordinates/projection';
import type { MapZoomPreset } from '@/features/spatial/map/components/MapToolbar';
import {
  REGIONAL_ZOOM,
  coordinateFromPointer,
  dragOrigin,
  draggedPan,
  presetViewport,
  steppedZoom,
  wheelZoom,
  type MapViewport,
} from '@/features/spatial/map/model/mapViewportMath';

const { svgSize: SVG_SIZE, center: MAP_CENTER } = DEFAULT_PROJECTION_CONFIG;

const REGIONAL_VIEWPORT: MapViewport = { zoom: REGIONAL_ZOOM, pan: { x: 0, y: 0 } };

/**
 * Owns the map's camera (zoom, pan, drag) and the live cursor readout. The camera
 * is view-only state: nothing outside the map reads it, so it never enters the
 * canonical scenario context.
 */
export function useMapViewport(sitePos: ProjectedPoint) {
  const [viewport, setViewport] = useState<MapViewport>(REGIONAL_VIEWPORT);
  const [activePreset, setActivePreset] = useState<MapZoomPreset | 'custom'>('regional');
  const [isDragging, setIsDragging] = useState(false);
  const [cursorCoord, setCursorCoord] = useState<SelenographicCoordinate | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { zoom, pan } = viewport;

  /** Selenographic coordinate under a pointer event, or null off the mapped disc. */
  const coordinateFromEvent = useCallback(
    (event: { clientX: number; clientY: number }): SelenographicCoordinate | null => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return null;
      return coordinateFromPointer({
        clientX: event.clientX,
        clientY: event.clientY,
        rect,
        svgSize: SVG_SIZE,
        center: MAP_CENTER,
        viewport,
      });
    },
    [viewport],
  );

  const applyPreset = useCallback(
    (preset: MapZoomPreset) => {
      setActivePreset(preset);
      setViewport(presetViewport(preset, sitePos, MAP_CENTER));
    },
    [sitePos],
  );

  const resetViewport = useCallback(() => applyPreset('regional'), [applyPreset]);

  const zoomIn = useCallback(() => {
    setActivePreset('custom');
    setViewport((current) => ({ ...current, zoom: steppedZoom(current.zoom, 1) }));
  }, []);

  const zoomOut = useCallback(() => {
    setActivePreset('custom');
    setViewport((current) => ({ ...current, zoom: steppedZoom(current.zoom, -1) }));
  }, []);

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      if (event.button !== 0) return;
      setIsDragging(true);
      dragStartRef.current = dragOrigin(viewport, event.clientX, event.clientY);
    },
    [viewport],
  );

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      if (isDragging) {
        setActivePreset('custom');
        const panNext = draggedPan(dragStartRef.current, event.clientX, event.clientY);
        setViewport((current) => ({ ...current, pan: panNext }));
      }
      setCursorCoord(coordinateFromEvent(event));
    },
    [isDragging, coordinateFromEvent],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setCursorCoord(null);
  }, []);

  const handleWheel = useCallback((event: ReactWheelEvent) => {
    event.preventDefault();
    setActivePreset('custom');
    setViewport((current) => ({ ...current, zoom: wheelZoom(current.zoom, event.deltaY) }));
  }, []);

  /** Transform for the pannable <g>, frozen while dragging so the map tracks the cursor. */
  const viewportStyle = useMemo(
    () => ({
      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      transformOrigin: `${MAP_CENTER}px ${MAP_CENTER}px`,
      transition: isDragging ? 'none' : 'transform 0.15s ease-out',
    }),
    [pan, zoom, isDragging],
  );

  return {
    svgRef,
    zoom,
    pan,
    isDragging,
    activePreset,
    cursorCoord,
    viewportStyle,
    coordinateFromEvent,
    applyPreset,
    resetViewport,
    zoomIn,
    zoomOut,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleWheel,
  };
}
