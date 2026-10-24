import React, { useState, useRef, useCallback } from 'react';
import {
  Compass,
  Crosshair,
  Eye,
  Globe,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  Activity,
  ArrowLeft,
  FastForward,
  Rewind,
} from 'lucide-react';
import { useScenarioModel, useScenarioCommands } from '@/app/scenario/context/scenarioContext';
import { useSpatialPreferences } from '@/features/spatial/hooks/useSpatialPreferences';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { LunarGlobe3D } from '@/features/spatial/ui/LunarGlobe3D';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';

export function Scenario3DLab() {
  const { site: selectedSite, conditions, ephemeris, epochIsoUtc, epochMs } = useScenarioModel();
  const { selectSite, setEpoch } = useScenarioCommands();
  const { preferences, toggleLayer, selectCameraPreset } = useSpatialPreferences();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const epochRef = useRef(epochMs);
  epochRef.current = epochMs;

  const stepTimeHours = useCallback(
    (hours: number) => {
      setEpoch(epochRef.current + hours * 3600 * 1000);
    },
    [setEpoch],
  );

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setEpoch(epochRef.current + 3600 * 1000);
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying, setEpoch]);

  const handleSelectSite = useCallback(
    (site: CandidateSite) => {
      selectSite(site.id);
    },
    [selectSite],
  );

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fallback to container-only fullscreen
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleReturnToObservatory = () => {
    window.location.href = '/';
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)] overflow-hidden flex flex-col select-none font-sans ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Minimal Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[var(--lm-color-surface)]/85 backdrop-blur-md border-b border-[var(--lm-color-border-subtle)] pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReturnToObservatory}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] hover:bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-secondary)] hover:text-white transition-colors"
            title="Return to LunaMission Observatory"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Observatory</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider font-mono text-[var(--lm-color-selected-site)]">
              LunaMission 3D Lab
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-muted)] border border-[var(--lm-color-border-subtle)]">
              STANDALONE 3D HARNESS
            </span>
          </div>
        </div>

        {/* Header Right: Candidate Quick Switcher & Toggles */}
        <div className="flex items-center gap-2">
          {/* Site Selector Dropdown */}
          <select
            value={selectedSite.id}
            onChange={(e) => {
              const target = CANDIDATE_SITES.find((s) => s.id === e.target.value);
              if (target) handleSelectSite(target);
            }}
            className="bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-xs text-[var(--lm-color-text-primary)] rounded-[var(--lm-radius-xs)] px-2.5 py-1 font-mono focus:outline-none focus:border-[var(--lm-color-selected-site)]"
          >
            {CANDIDATE_SITES.map((site) => (
              <option key={site.id} value={site.id}>
                {site.code} • {site.name}
              </option>
            ))}
          </select>

          {/* Diagnostics Panel Toggle */}
          <button
            type="button"
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] border transition-colors ${
              showDiagnostics
                ? 'bg-[var(--lm-color-selected-site)]/15 border-[var(--lm-color-selected-site)]/60 text-[var(--lm-color-selected-site)] font-semibold'
                : 'bg-[var(--lm-color-surface-raised)] border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white'
            }`}
            title="Toggle Engine Diagnostics HUD"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Telemetry</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="p-1.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main 3D Scene Viewport */}
      <main className="flex-1 w-full h-full relative min-h-0">
        <LunarGlobe3D
          selectedSite={selectedSite}
          onSelectSite={handleSelectSite}
          subSolarLatDeg={ephemeris.subSolarLatDeg}
          subSolarLonDeg={ephemeris.subSolarLonDeg}
          subEarthLatDeg={ephemeris.subEarthLatDeg}
          subEarthLonDeg={ephemeris.subEarthLonDeg}
          earthElevationDeg={conditions.earthElevationDeg}
          showGrid={preferences.showGrid}
          showShadowRegions={preferences.showShadowRegions}
          showVectors={preferences.showVectors}
          onToggleGrid={() => toggleLayer('grid')}
          onToggleShadowRegions={() => toggleLayer('shadowRegions')}
          onToggleVectors={() => toggleLayer('vectors')}
          cameraPreset={preferences.cameraPreset}
          onCameraPresetChange={selectCameraPreset}
          showDiagnostics={showDiagnostics}
          epochIsoUtc={epochIsoUtc}
          hideHeader
          hideRibbon
        />
      </main>

      {/* Unified Bottom Dock: Camera Presets & Time Controller */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 max-w-[min(940px,94vw)] w-full flex flex-col items-center gap-1 pointer-events-none">
        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={() => setIsControlsCollapsed((prev) => !prev)}
          className="pointer-events-auto px-3 py-0.5 rounded-t-[var(--lm-radius-sm)] bg-[var(--lm-color-surface)]/90 backdrop-blur-md border border-[var(--lm-color-border-subtle)] border-b-0 text-[10px] font-mono text-[var(--lm-color-text-muted)] hover:text-white transition-colors shadow-xs"
        >
          {isControlsCollapsed ? '▲ Show 3D Navigation Dock' : '▼ Collapse Dock (Zen View)'}
        </button>

        {!isControlsCollapsed && (
          <div className="pointer-events-auto w-full flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-[var(--lm-radius-md)] bg-[var(--lm-color-surface)]/90 backdrop-blur-md border border-[var(--lm-color-border)] shadow-xl">
            {/* 1. Camera Presets Group */}
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-text-muted)] px-1.5 hidden md:inline">
                Preset:
              </span>

              <button
                type="button"
                onClick={() => selectCameraPreset('global')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'global'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Global Context: Complete Moon sphere overview"
              >
                <Globe className="w-3 h-3" />
                <span>Global</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('nadir')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'nadir'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="South Pole Focus: Centered on polar candidate region"
              >
                <Compass className="w-3 h-3 text-[var(--lm-color-selected-site)]" />
                <span>South Pole</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('oblique')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'oblique'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Oblique Terrain: Perspective view across crater rims"
              >
                <Eye className="w-3 h-3" />
                <span>Oblique</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('site')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'site'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Candidate Site Focus: Frame selected site"
              >
                <Crosshair className="w-3 h-3" />
                <span>Site</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('inspection')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'inspection'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Local Site Inspection: Deep zoom grazing view of crater relief and lighting"
              >
                <ZoomIn className="w-3 h-3 text-[var(--lm-color-sun)]" />
                <span>Inspect</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('nadir')}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
                title="Return to Overview: Reset camera to nadir polar view"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Overview</span>
              </button>
            </div>

            {/* 2. Layer Toggles */}
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
              <button
                type="button"
                onClick={() => toggleLayer('vectors')}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.showVectors
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle Sun and Earth Direction Vectors"
              >
                Vectors
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('shadowRegions')}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.showShadowRegions
                    ? 'bg-[var(--lm-color-surface-strong)] text-[#8CCBFF] border border-[#8CCBFF]/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle 83°S Polar Boundary Footprint"
              >
                Footprint
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('grid')}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.showGrid
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle Selenographic Coordinate Grid"
              >
                Grid
              </button>
            </div>

            {/* 3. Time Controls */}
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
              <button
                type="button"
                onClick={() => stepTimeHours(-6)}
                className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white"
                title="Step Back 6 Hours"
              >
                <Rewind className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => togglePlayback()}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  isPlaying
                    ? 'bg-[var(--lm-color-sun)]/20 text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/50 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title={isPlaying ? 'Pause Ephemeris Playback' : 'Play Ephemeris Time Progression'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={() => stepTimeHours(6)}
                className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white"
                title="Step Forward 6 Hours"
              >
                <FastForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
