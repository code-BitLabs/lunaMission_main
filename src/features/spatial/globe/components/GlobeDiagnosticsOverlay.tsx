import React, { useEffect, useState } from 'react';
import { GlobeDiagnosticsMetrics } from '@/features/spatial/globe/scene/globeSceneBuilder';
import { CandidateSite } from '@/domain/sites/candidateSite';

export interface GlobeDiagnosticsOverlayProps {
  getDiagnostics: () => GlobeDiagnosticsMetrics | null;
  selectedSite: CandidateSite;
  epochIsoUtc?: string;
  isVisible: boolean;
  onToggleVisible?: () => void;
}

export function GlobeDiagnosticsOverlay({
  getDiagnostics,
  selectedSite,
  epochIsoUtc,
  isVisible,
  onToggleVisible,
}: GlobeDiagnosticsOverlayProps) {
  const [metrics, setMetrics] = useState<GlobeDiagnosticsMetrics | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      const data = getDiagnostics();
      if (data) setMetrics(data);
    }, 200);
    return () => clearInterval(interval);
  }, [isVisible, getDiagnostics]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-14 right-3 z-30 pointer-events-auto bg-[var(--lm-color-canvas)]/90 backdrop-blur-md border border-[var(--lm-color-border-subtle)] rounded-[var(--lm-radius-sm)] p-3 shadow-lg font-mono text-[11px] text-[var(--lm-color-text-secondary)] w-72 max-w-[calc(100vw-24px)] flex flex-col gap-2">
      <div className="flex items-center justify-between border-b border-[var(--lm-color-border-subtle)] pb-1.5">
        <span className="font-semibold text-[var(--lm-color-selected-site)] tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--lm-color-selected-site)]" />
          3D ENGINE DIAGNOSTICS
        </span>
        {onToggleVisible && (
          <button
            type="button"
            onClick={onToggleVisible}
            className="text-[var(--lm-color-text-muted)] hover:text-white text-xs px-1"
          >
            ✕
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        <span className="text-[var(--lm-color-text-muted)]">Frame Rate:</span>
        <span className="text-right font-medium text-[var(--lm-color-text-primary)]">
          {metrics ? `${metrics.fps} FPS` : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Frame Time (med):</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? `${metrics.frameTimeMs.toFixed(1)} ms` : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Frame Time (p95):</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? `${metrics.frameTimeP95Ms.toFixed(1)} ms` : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Draw Calls:</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? metrics.drawCalls : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Triangles:</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? metrics.triangles.toLocaleString() : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Dist to Target:</span>
        <span className="text-right text-[var(--lm-color-selected-site)]">
          {metrics ? `${metrics.cameraTargetDistance.toFixed(3)} u` : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Camera Near:</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? `${metrics.cameraNear.toFixed(3)} u` : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Pixel Ratio:</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? `${metrics.pixelRatio}x` : '—'}
        </span>

        <span className="text-[var(--lm-color-text-muted)]">Hardware Accel:</span>
        <span className="text-right text-[var(--lm-color-text-primary)]">
          {metrics ? (metrics.isSoftwareGl ? 'Software GL' : 'GPU Active') : '—'}
        </span>
      </div>

      <div className="pt-1.5 border-t border-[var(--lm-color-border-subtle)] flex flex-col gap-0.5 text-[10px]">
        <div className="flex justify-between">
          <span className="text-[var(--lm-color-text-muted)]">Site:</span>
          <span className="text-[var(--lm-color-selected-site)] truncate max-w-[170px]" title={selectedSite.name}>
            {selectedSite.name}
          </span>
        </div>
        {epochIsoUtc && (
          <div className="flex justify-between">
            <span className="text-[var(--lm-color-text-muted)]">UTC Epoch:</span>
            <span className="text-[var(--lm-color-text-secondary)]">{epochIsoUtc}</span>
          </div>
        )}
      </div>
    </div>
  );
}
