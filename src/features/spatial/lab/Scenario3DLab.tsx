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
  FileText,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useScenarioModel, useScenarioCommands } from '@/app/scenario/context/scenarioContext';
import { useSpatialPreferences } from '@/features/spatial/hooks/useSpatialPreferences';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { LunarGlobe3D } from '@/features/spatial/ui/LunarGlobe3D';
import { CameraPreset } from '@/features/spatial/model/spatialPreferences';
import { GlobeSiteInspectionPanel } from '@/features/spatial/globe/components/GlobeSiteInspectionPanel';
import { availableValue } from '@/shared/formatting/availability';

export function Scenario3DLab() {
  const { site: selectedSite, conditions, ephemeris, epochIsoUtc, epochMs } = useScenarioModel();
  const { selectSite, setEpoch } = useScenarioCommands();
  const { preferences, toggleLayer, selectCameraPreset } = useSpatialPreferences();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(true);
  const [showSitePanel, setShowSitePanel] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
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
      setIsFullscreen((prev) => !prev);
    }
  };

  const handleReturnToObservatory = () => {
    window.location.href = '/';
  };

  const handleResetCamera = useCallback(() => {
    selectCameraPreset('nadir');
    // Ensure authoritative Shackleton Rim default is focused
    const defaultSite = CANDIDATE_SITES[0];
    if (defaultSite) selectSite(defaultSite.id);
  }, [selectCameraPreset, selectSite]);

  // Derive mode badge from active camera preset
  const modeMetadata = (() => {
    switch (preferences.cameraPreset) {
      case 'nadir':
        return {
          code: 'MODE A',
          name: 'Regional South Pole',
          desc: 'Polar relief, 83°S LOLA coverage boundary, and candidate comparison',
          color: 'text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)]/50 bg-[var(--lm-color-selected-site)]/10',
        };
      case 'site':
        return {
          code: 'MODE B',
          name: 'Candidate Overview',
          desc: 'Crater and ridge morphology surrounding candidate site',
          color: 'text-indigo-400 border-indigo-400/50 bg-indigo-500/10',
        };
      case 'inspection':
        return {
          code: 'MODE C',
          name: 'Local Inspection',
          desc: 'Close grazing perspective across crater rims with orbit rotation',
          color: 'text-[var(--lm-color-sun)] border-[var(--lm-color-sun)]/50 bg-[var(--lm-color-sun)]/10',
        };
      case 'global':
        return {
          code: 'GLOBAL',
          name: 'Full Moon Context',
          desc: 'Global selenographic sphere with comfortable margin',
          color: 'text-slate-300 border-slate-500/50 bg-slate-500/10',
        };
      case 'oblique':
      default:
        return {
          code: 'OBLIQUE',
          name: 'Polar Horizon Relief',
          desc: 'Low grazing angle view across south polar relief',
          color: 'text-cyan-300 border-cyan-400/50 bg-cyan-500/10',
        };
    }
  })();

  return (
    <div
      ref={containerRef}
      className={`relative w-screen h-screen bg-[var(--lm-color-canvas)] text-[var(--lm-color-text-primary)] overflow-hidden flex flex-col select-none font-sans ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* 1. Authoritative Top Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2.5 bg-[var(--lm-color-surface)]/90 backdrop-blur-md border-b border-[var(--lm-color-border-subtle)] pointer-events-auto">
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

          {/* Active Exploration Mode Badge */}
          <div
            className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${modeMetadata.color}`}
            title={modeMetadata.desc}
          >
            <Sparkles className="w-3 h-3" />
            <span className="font-bold">{modeMetadata.code}:</span>
            <span>{modeMetadata.name}</span>
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
            title="Select Authoritative Artemis Candidate Landing Site"
          >
            {CANDIDATE_SITES.map((site) => (
              <option key={site.id} value={site.id}>
                {site.code} • {site.name}
              </option>
            ))}
          </select>

          {/* Site Intel Panel Toggle */}
          <button
            type="button"
            onClick={() => setShowSitePanel((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-[var(--lm-radius-xs)] border transition-colors ${
              showSitePanel
                ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300 font-semibold'
                : 'bg-[var(--lm-color-surface-raised)] border-[var(--lm-color-border)] text-[var(--lm-color-text-muted)] hover:text-white'
            }`}
            title="Toggle Scientific Site Inspection Panel"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Site Intel</span>
          </button>

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

      {/* 2. Main 3D Scene Viewport */}
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
          showTerrain={showTerrain}
          showMarkers={showMarkers}
          showLabels={showLabels}
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

        {/* 3. Floating Scientific Site Inspection Panel */}
        {showSitePanel && (
          <div className="absolute top-14 left-4 z-20 pointer-events-none">
            <GlobeSiteInspectionPanel
              site={selectedSite}
              epochIsoUtc={epochIsoUtc}
              sunElevationDeg={conditions.sunElevationDeg ? availableValue(conditions.sunElevationDeg) ?? -1.29 : -1.29}
              sunAzimuthDeg={conditions.sunAzimuthDeg ? availableValue(conditions.sunAzimuthDeg) ?? 52.9 : 52.9}
              earthElevationDeg={conditions.earthElevationDeg}
              onEnterLocalInspection={() => selectCameraPreset('inspection')}
              currentMode={preferences.cameraPreset === 'inspection' ? 'inspection' : preferences.cameraPreset === 'site' ? 'overview' : 'regional'}
            />
          </div>
        )}
      </main>

      {/* 4. Unified Bottom Dock: Exploration Presets, Layer Controls, and Time Stepper */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-[min(1080px,96vw)] w-full flex flex-col items-center gap-1 pointer-events-none">
        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={() => setIsControlsCollapsed((prev) => !prev)}
          className="pointer-events-auto px-3 py-0.5 rounded-t-[var(--lm-radius-sm)] bg-[var(--lm-color-surface)]/90 backdrop-blur-md border border-[var(--lm-color-border-subtle)] border-b-0 text-[10px] font-mono text-[var(--lm-color-text-muted)] hover:text-white transition-colors shadow-xs"
        >
          {isControlsCollapsed ? '▲ Show 3D Navigation Dock' : '▼ Collapse Dock (Zen View)'}
        </button>

        {!isControlsCollapsed && (
          <div className="pointer-events-auto w-full flex flex-wrap items-center justify-between gap-2.5 p-2 rounded-[var(--lm-radius-md)] bg-[var(--lm-color-surface)]/92 backdrop-blur-md border border-[var(--lm-color-border)] shadow-xl">
            {/* 1. Camera Presets Group (Modes A, B, C & Global) */}
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--lm-color-text-muted)] px-1.5 hidden xl:inline">
                Mode:
              </span>

              <button
                type="button"
                onClick={() => selectCameraPreset('global')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'global'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Global Context: Full lunar sphere view"
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
                title="Mode A: Regional South Pole view (matching 2D polar map)"
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
                title="Perspective: Low grazing view across south-polar crater rims"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Oblique</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('site')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'site'
                    ? 'bg-[var(--lm-color-surface-strong)] text-indigo-400 border border-indigo-400/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Mode B: Candidate Overview (frames crater and ridge surroundings)"
              >
                <Crosshair className="w-3 h-3" />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => selectCameraPreset('inspection')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.cameraPreset === 'inspection'
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/60 font-semibold'
                    : 'text-[var(--lm-color-text-secondary)] hover:text-white'
                }`}
                title="Mode C: Local Inspection (deep zoom oblique grazing view with orbit rotation)"
              >
                <ZoomIn className="w-3 h-3 text-[var(--lm-color-sun)]" />
                <span>Inspect</span>
              </button>

              <button
                type="button"
                onClick={handleResetCamera}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium text-[var(--lm-color-text-muted)] hover:text-white transition-colors border border-transparent hover:border-[var(--lm-color-border-subtle)]"
                title="Reset Camera & Selection: Restores nadir view and default candidate"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Reset</span>
              </button>
            </div>

            {/* 2. Independent Layer Controls */}
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
              <button
                type="button"
                onClick={() => setShowTerrain((prev) => !prev)}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  showTerrain
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)] font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle Base Lunar Surface Terrain"
              >
                Terrain
              </button>

              <button
                type="button"
                onClick={() => setShowMarkers((prev) => !prev)}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  showMarkers
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle Candidate Site Markers"
              >
                Sites
              </button>

              <button
                type="button"
                onClick={() => setShowLabels((prev) => !prev)}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  showLabels
                    ? 'bg-[var(--lm-color-surface-strong)] text-cyan-300 border border-cyan-400/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle Candidate Labels and Badges"
              >
                Labels
              </button>

              <button
                type="button"
                onClick={() => toggleLayer('vectors')}
                className={`px-2 py-1 text-xs rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
                  preferences.showVectors
                    ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40 font-semibold'
                    : 'text-[var(--lm-color-text-muted)] hover:text-white'
                }`}
                title="Toggle Sun Vector and Earth DTE Sightline"
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
                title="Toggle 83°S Polar Coverage Footprint Boundary"
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
                title="Toggle Selenographic Coordinate Graticule"
              >
                Grid
              </button>
            </div>

            {/* 3. Real-Time Ephemeris Time Stepper */}
            <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border-subtle)]">
              <button
                type="button"
                onClick={() => stepTimeHours(-6)}
                className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
                title="Step Backward 6 Hours"
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
                className="p-1 rounded text-[var(--lm-color-text-muted)] hover:text-white transition-colors"
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
