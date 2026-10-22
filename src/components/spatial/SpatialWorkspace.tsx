import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Map as MapIcon,
  Globe as GlobeIcon,
  Columns,
  Maximize2,
  Minimize2,
  Layers,
  Compass,
  Eye,
  Crosshair,
  RotateCcw,
  Sun,
  Globe as EarthIcon,
  X,
} from 'lucide-react';
import { CandidateSite } from '../../types/site';
import { CANDIDATE_SITES } from '../../lib/sites-data';
import { SouthPoleMap } from './SouthPoleMap';
import { LunarGlobe3D, CameraPreset } from './LunarGlobe3D';
import { VisualizationErrorBoundary } from '../common/VisualizationErrorBoundary';

export type SpatialViewMode = 'map2d' | 'dual' | 'globe3d';

export interface SpatialWorkspaceProps {
  selectedSite: CandidateSite;
  onSelectSite: (site: CandidateSite) => void;
  sunAzimuthDeg: number;
  earthAzimuthDeg: number;
  subSolarLatDeg: number;
  subSolarLonDeg: number;
  currentIsoUtc?: string;
}

export function SpatialWorkspace({
  selectedSite,
  onSelectSite,
  sunAzimuthDeg,
  earthAzimuthDeg,
  subSolarLatDeg,
  subSolarLonDeg,
  currentIsoUtc,
}: SpatialWorkspaceProps) {
  const [viewMode, setViewMode] = useState<SpatialViewMode>('map2d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpandedFallback, setIsExpandedFallback] = useState(false);

  // Global Workspace Layer Toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showPsr, setShowPsr] = useState(true);
  const [showVectors, setShowVectors] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('nadir');

  const workspaceRef = useRef<HTMLDivElement>(null);

  // Synchronize browser Fullscreen API with React state
  useEffect(() => {
    function handleFullscreenChange() {
      const isCurrentlyFullscreen =
        document.fullscreenElement === workspaceRef.current ||
        (document as any).webkitFullscreenElement === workspaceRef.current;
      setIsFullscreen(Boolean(isCurrentlyFullscreen));
      if (!isCurrentlyFullscreen) {
        setIsExpandedFallback(false);
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Listen for Escape key to exit fallback expanded mode or full screen
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
        if (isExpandedFallback) {
          setIsExpandedFallback(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isExpandedFallback]);

  // Toggle Fullscreen with graceful fallback if browser/iframe denies requestFullscreen
  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen || isExpandedFallback) {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // ignore
        }
      }
      setIsFullscreen(false);
      setIsExpandedFallback(false);
    } else {
      const elem = workspaceRef.current;
      if (elem && elem.requestFullscreen) {
        try {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        } catch (err) {
          console.warn('Native Fullscreen API rejected or restricted by iframe policy; activating in-page expansion:', err);
          setIsExpandedFallback(true);
        }
      } else {
        // Fallback for browsers or sandboxes without Fullscreen API
        setIsExpandedFallback(true);
      }
    }
  }, [isFullscreen, isExpandedFallback]);

  const activeFullscreen = isFullscreen || isExpandedFallback;

  return (
    <div
      ref={workspaceRef}
      className={`flex flex-col bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-3 sm:p-4 transition-all duration-200 ${
        activeFullscreen
          ? 'fixed inset-0 z-50 rounded-none border-none p-4 bg-[var(--lm-color-canvas)] overflow-hidden w-screen h-screen'
          : 'h-full min-h-[560px] lg:min-h-[640px]'
      }`}
    >
      {/* Authoritative Spatial Toolbar & Workspace Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--lm-color-border-subtle)] shrink-0">
        {/* Title and Active State Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--lm-color-text-primary)] uppercase tracking-wider font-mono">
              Spatial Workspace
            </span>
            <span className="text-xs text-[var(--lm-color-text-muted)] font-mono hidden sm:inline">
              [
              {viewMode === 'map2d' && '2D Polar Stereographic (83°S–90°S)'}
              {viewMode === 'dual' && 'Dual View: 2D Polar Map + 3D Moon Globe'}
              {viewMode === 'globe3d' && '3D NASA LRO Moon Globe'}
              ]
            </span>
          </div>

          {activeFullscreen && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-selected-site)]/15 border border-[var(--lm-color-selected-site)]/40 text-[11px] font-mono text-[var(--lm-color-selected-site)] font-medium">
                Fullscreen Active
              </span>
              <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] hidden md:inline">
                Press <kbd className="px-1 py-0.5 rounded bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)]">Esc</kbd> to exit
              </span>
            </div>
          )}
        </div>

        {/* Spatial Controls: Mode Switcher, Layer Toggles, 3D Presets & Fullscreen */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switch Buttons: 2D Map, Dual, 3D Globe */}
          <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('map2d')}
              title="Switch to 2D Polar Stereographic Map (Mode A)"
              aria-label="2D Polar Map view"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
                viewMode === 'map2d'
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>2D Map</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('dual')}
              title="Switch to Side-by-side Dual View (Mode C)"
              aria-label="Dual 2D and 3D View"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
                viewMode === 'dual'
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Dual View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('globe3d')}
              title="Switch to 3D NASA LRO Moon Globe"
              aria-label="3D Moon Globe view"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
                viewMode === 'globe3d'
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              <GlobeIcon className="w-3.5 h-3.5" />
              <span>3D Moon</span>
            </button>
          </div>

          {/* 3D Camera Presets (shown when in 3D or Dual mode) */}
          {(viewMode === 'globe3d' || viewMode === 'dual') && (
            <div className="hidden sm:flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
              <button
                type="button"
                onClick={() => setCameraPreset('nadir')}
                title="South Pole Nadir Camera (aligns with 2D map)"
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  cameraPreset === 'nadir'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                <Compass className="w-3 h-3 text-[var(--lm-color-selected-site)]" />
                <span>Nadir</span>
              </button>

              <button
                type="button"
                onClick={() => setCameraPreset('oblique')}
                title="Perspective view across crater rims"
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  cameraPreset === 'oblique'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Oblique</span>
              </button>

              <button
                type="button"
                onClick={() => setCameraPreset('site')}
                title="Focus camera on selected candidate site"
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  cameraPreset === 'site'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
              >
                <Crosshair className="w-3 h-3" />
                <span>Site</span>
              </button>
            </div>
          )}

          {/* Unified Layer Toggles */}
          <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs">
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Coordinate Grid"
              aria-label="Toggle grid"
              className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                showGrid
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)]'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              Grid
            </button>

            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              title="Toggle Sun and Earth Direction Vectors"
              aria-label="Toggle celestial vectors"
              className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                showVectors
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              Vectors
            </button>

            <button
              type="button"
              onClick={() => setShowPsr(!showPsr)}
              title="Toggle Permanently Shadowed Regions (PSR) & Footprint"
              aria-label="Toggle shadow regions"
              className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                showPsr
                  ? 'bg-[var(--lm-color-surface-strong)] text-[#8CCBFF] border border-[#8CCBFF]/40'
                  : 'text-[var(--lm-color-text-muted)] hover:text-white'
              }`}
            >
              PSR
            </button>
          </div>

          {/* Mode B: Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={activeFullscreen ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen Spatial Workspace (Mode B)'}
            aria-label={activeFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors ${
              activeFullscreen
                ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)] font-semibold'
                : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]'
            }`}
          >
            {activeFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[var(--lm-color-selected-site)]" />
                <span className="hidden sm:inline">Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Spatial Viewport Container */}
      <div className="flex-1 w-full my-2.5 min-h-0 relative overflow-hidden flex flex-col">
        {viewMode === 'map2d' && (
          <div className="w-full h-full flex-1 min-h-0">
            <SouthPoleMap
              selectedSite={selectedSite}
              onSelectSite={onSelectSite}
              sunAzimuthDeg={sunAzimuthDeg}
              earthAzimuthDeg={earthAzimuthDeg}
              showGrid={showGrid}
              showPsr={showPsr}
              showVectors={showVectors}
              onToggleGrid={() => setShowGrid((v) => !v)}
              onTogglePsr={() => setShowPsr((v) => !v)}
              onToggleVectors={() => setShowVectors((v) => !v)}
              hideHeader={true}
              hideRibbon={true}
            />
          </div>
        )}

        {viewMode === 'globe3d' && (
          <div className="w-full h-full flex-1 min-h-0">
            <VisualizationErrorBoundary
              fallbackTitle="3D Lunar Globe Encountered an Error"
              onFallbackTo2D={() => setViewMode('map2d')}
            >
              <LunarGlobe3D
                selectedSite={selectedSite}
                onSelectSite={onSelectSite}
                subSolarLatDeg={subSolarLatDeg}
                subSolarLonDeg={subSolarLonDeg}
                showGrid={showGrid}
                showPolarFootprint={showPsr}
                showVectors={showVectors}
                onToggleGrid={() => setShowGrid((v) => !v)}
                onTogglePolarFootprint={() => setShowPsr((v) => !v)}
                onToggleVectors={() => setShowVectors((v) => !v)}
                cameraPreset={cameraPreset}
                onCameraPresetChange={setCameraPreset}
                hideHeader={true}
                hideRibbon={true}
              />
            </VisualizationErrorBoundary>
          </div>
        )}

        {viewMode === 'dual' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5 w-full h-full flex-1 min-h-0 overflow-y-auto xl:overflow-hidden">
            {/* Left Column: 2D Polar Stereographic Map */}
            <div className="h-[480px] xl:h-full w-full min-h-0 flex flex-col">
              <div className="flex items-center justify-between pb-1 text-[11px] font-mono text-[var(--lm-color-text-muted)]">
                <span>[2D Polar Stereographic 83°S–90°S]</span>
              </div>
              <div className="flex-1 min-h-0">
                <SouthPoleMap
                  selectedSite={selectedSite}
                  onSelectSite={onSelectSite}
                  sunAzimuthDeg={sunAzimuthDeg}
                  earthAzimuthDeg={earthAzimuthDeg}
                  showGrid={showGrid}
                  showPsr={showPsr}
                  showVectors={showVectors}
                  onToggleGrid={() => setShowGrid((v) => !v)}
                  onTogglePsr={() => setShowPsr((v) => !v)}
                  onToggleVectors={() => setShowVectors((v) => !v)}
                  hideHeader={true}
                  hideRibbon={true}
                />
              </div>
            </div>

            {/* Right Column: 3D Moon Globe */}
            <div className="h-[480px] xl:h-full w-full min-h-0 flex flex-col">
              <div className="flex items-center justify-between pb-1 text-[11px] font-mono text-[var(--lm-color-text-muted)]">
                <span>[3D LRO Digital Elevation Globe]</span>
              </div>
              <div className="flex-1 min-h-0">
                <VisualizationErrorBoundary
                  fallbackTitle="3D Lunar Globe Encountered an Error"
                  onFallbackTo2D={() => setViewMode('map2d')}
                >
                  <LunarGlobe3D
                    selectedSite={selectedSite}
                    onSelectSite={onSelectSite}
                    subSolarLatDeg={subSolarLatDeg}
                    subSolarLonDeg={subSolarLonDeg}
                    showGrid={showGrid}
                    showPolarFootprint={showPsr}
                    showVectors={showVectors}
                    onToggleGrid={() => setShowGrid((v) => !v)}
                    onTogglePolarFootprint={() => setShowPsr((v) => !v)}
                    onToggleVectors={() => setShowVectors((v) => !v)}
                    cameraPreset={cameraPreset}
                    onCameraPresetChange={setCameraPreset}
                    hideHeader={true}
                    hideRibbon={true}
                  />
                </VisualizationErrorBoundary>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Authoritative Unified Candidate Site Ribbon */}
      <footer className="pt-2 border-t border-[var(--lm-color-border-subtle)] flex items-center gap-2 overflow-x-auto shrink-0 select-none">
        <span className="text-[11px] font-mono text-[var(--lm-color-text-muted)] shrink-0 uppercase tracking-wider">
          Candidate Sites:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {CANDIDATE_SITES.map((site) => {
            const isSelected = site.id === selectedSite.id;
            return (
              <button
                key={site.id}
                type="button"
                onClick={() => onSelectSite(site)}
                aria-pressed={isSelected}
                className={`px-2.5 py-1 text-xs font-mono-num rounded-[var(--lm-radius-sm)] transition-colors ${
                  isSelected
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)] font-semibold shadow-xs'
                    : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]'
                }`}
              >
                {site.name}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
