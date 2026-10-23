import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { GlobeStatus } from '@/features/spatial/globe/scene/globeStatus';

export function GlobeUnavailablePanel() {
  return (
    <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center p-6 bg-[var(--lm-color-canvas)] border border-[var(--lm-color-border)] rounded-[var(--lm-radius-lg)] text-center">
      <AlertCircle className="w-8 h-8 text-[var(--lm-color-warning)] mb-3" />
      <h3 className="text-base font-semibold text-[var(--lm-color-text-primary)]">
        WebGL Acceleration Unavailable
      </h3>
      <p className="text-xs text-[var(--lm-color-text-secondary)] max-w-sm mt-1 mb-4 leading-relaxed">
        The 3D lunar globe requires WebGL. Please use the high-precision 2D South-Pole Map or candidate
        selection ribbon below.
      </p>
    </div>
  );
}

export function GlobeLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--lm-color-canvas)]/85 backdrop-blur-xs text-center p-4">
      <Loader2 className="w-8 h-8 text-[var(--lm-color-selected-site)] animate-spin mb-2.5" />
      <div className="text-xs font-semibold text-[var(--lm-color-text-primary)]">
        Loading NASA LRO Scientific Surface Model...
      </div>
      <div className="text-[11px] text-[var(--lm-color-text-muted)] font-mono mt-1">
        Applying LROC photometric albedo & LOLA DEM topographic relief
      </div>
    </div>
  );
}

export function GlobeTextureErrorBanner({ message }: { message: string }) {
  return (
    <div className="absolute top-14 left-3 right-3 z-20 flex items-center gap-2 p-2 rounded-[var(--lm-radius-sm)] bg-[var(--lm-color-surface-raised)] border border-[var(--lm-color-warning)]/40 text-xs text-[var(--lm-color-warning)]">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
