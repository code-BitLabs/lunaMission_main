import { useState } from 'react';
import { Info } from 'lucide-react';
import { PointPassport } from '@/features/passport/ui/PointPassport';
import { CandidateRibbon } from '@/features/spatial/components/cards/CandidateRibbon';
import { PassportDrawer } from '@/features/spatial/components/panels/PassportDrawer';
import { SpatialToolbar } from '@/features/spatial/components/toolbar/SpatialToolbar';
import { SpatialViewport } from '@/features/spatial/ui/SpatialViewport';
import {
  DEFAULT_SPATIAL_VIEW_MODE,
  spatialViewModeLabel,
  SpatialViewMode,
} from '@/features/spatial/model/spatialViewMode';
import { useSpatialPreferences } from '@/features/spatial/hooks/useSpatialPreferences';
import { useWorkspaceFullscreen } from '@/features/spatial/hooks/useWorkspaceFullscreen';

export interface SpatialWorkspaceProps {
  onOpenMethodDetails: () => void;
}

/**
 * Composition shell for the spatial workspace: which panels are shown
 * (`viewMode`), how large they are drawn (fullscreen), and the display
 * preferences both visualizations share. Scenario state comes from the
 * scenario provider, so the panels read it without prop drilling.
 */
export function SpatialWorkspace({ onOpenMethodDetails }: SpatialWorkspaceProps) {
  const [viewMode, setViewMode] = useState<SpatialViewMode>(DEFAULT_SPATIAL_VIEW_MODE);
  const { preferences, toggleLayer, selectCameraPreset } = useSpatialPreferences();
  const {
    workspaceRef,
    isActiveFullscreen,
    showPassportOverlay,
    toggleFullscreen,
    togglePassportOverlay,
    closePassportOverlay,
  } = useWorkspaceFullscreen();

  const toolbar = (
    <SpatialToolbar
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      preferences={preferences}
      onToggleLayer={toggleLayer}
      onCameraPresetChange={selectCameraPreset}
      isFullscreenActive={isActiveFullscreen}
      onToggleFullscreen={toggleFullscreen}
    />
  );

  const viewport = (
    <SpatialViewport
      viewMode={viewMode}
      preferences={preferences}
      onToggleLayer={toggleLayer}
      onCameraPresetChange={selectCameraPreset}
      onGlobeFallbackTo2D={() => setViewMode('map2d')}
    />
  );

  if (isActiveFullscreen) {
    return (
      <section
        ref={workspaceRef}
        aria-label="Spatial Workspace Fullscreen"
        className="fixed inset-0 z-50 rounded-none border-none p-3 sm:p-5 bg-[var(--lm-color-canvas)] overflow-hidden w-screen h-screen flex flex-col gap-3"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[var(--lm-color-border-subtle)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--lm-color-text-primary)] uppercase tracking-wider font-mono">
                Spatial Workspace
              </span>
              <span className="px-2 py-0.5 rounded-[var(--lm-radius-xs)] bg-[var(--lm-color-selected-site)]/15 border border-[var(--lm-color-selected-site)]/40 text-[11px] font-mono text-[var(--lm-color-selected-site)] font-medium">
                Fullscreen Active
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--lm-color-text-muted)] hidden md:inline">
              Press <kbd className="px-1 py-0.5 rounded bg-[var(--lm-color-surface-strong)] border border-[var(--lm-color-border)] text-[var(--lm-color-text-secondary)]">Esc</kbd> to exit
            </span>
          </div>

          <div className="flex items-center gap-2">
            {toolbar}

            <button
              type="button"
              onClick={togglePassportOverlay}
              title="Toggle Point Passport overlay in fullscreen"
              aria-label="Toggle Point Passport overlay"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors ${
                showPassportOverlay
                  ? 'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)] font-semibold'
                  : 'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border-[var(--lm-color-border)] hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Point Passport</span>
            </button>
          </div>
        </header>

        <div className="flex-1 w-full min-h-0 relative overflow-hidden flex flex-col rounded-[var(--lm-radius-md)] border border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-canvas)]">
          {viewport}

          {showPassportOverlay && (
            <PassportDrawer onClose={closePassportOverlay} onOpenMethodDetails={onOpenMethodDetails} />
          )}
        </div>

        <CandidateRibbon />
      </section>
    );
  }

  return (
    <section
      ref={workspaceRef}
      aria-label="Spatial Workspace"
      className="flex flex-col bg-[var(--lm-color-surface)] border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-lg)] p-4 sm:p-5 gap-4 w-full min-w-0"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--lm-color-border-subtle)] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--lm-color-text-primary)] uppercase tracking-wider font-mono">
            Spatial Workspace
          </span>
          <span className="text-xs text-[var(--lm-color-text-muted)] font-mono hidden sm:inline">
            [
            {spatialViewModeLabel(viewMode)}
            ]
          </span>
        </div>

        {toolbar}
      </header>

      {/* Main Workspace Grid (Left: 2D/3D Visualization, Right: Point Passport) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full min-w-0">
        <div className={`${viewMode === 'dual' ? 'lg:col-span-8' : 'lg:col-span-7'} min-w-0 flex flex-col gap-2`}>
          <div className="w-full h-[560px] sm:h-[620px] lg:h-[700px] xl:h-[740px] min-h-[480px] relative rounded-[var(--lm-radius-md)] overflow-hidden border border-[var(--lm-color-border-subtle)] bg-[var(--lm-color-canvas)] flex flex-col">
            {viewport}
          </div>
        </div>

        <div className={`${viewMode === 'dual' ? 'lg:col-span-4' : 'lg:col-span-5'} min-w-0 flex flex-col`}>
          <PointPassport onOpenMethodDetails={onOpenMethodDetails} />
        </div>
      </div>

      <CandidateRibbon />
    </section>
  );
}
