import { Info, HelpCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';

interface HeaderStatusControlsProps {
  /** Switches the data-source badge between the demo and live-ephemeris wording. */
  isDemoMode: boolean;
  onOpenProvenance: () => void;
  onOpenGuide: () => void;
}

/** Data-provenance badge and the guide entry point. */
export function HeaderStatusControls({ isDemoMode, onOpenProvenance, onOpenGuide }: HeaderStatusControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {isDemoMode ? (
        <button
          type="button"
          onClick={onOpenProvenance}
          aria-label="Demo data active notice"
          className="cursor-pointer"
        >
          <Badge variant="demo" icon={<Info className="w-3 h-3" />}>
            Demo Data
          </Badge>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenProvenance}
          aria-label="Ephemeris model status"
          className="cursor-pointer"
        >
          <Badge variant="success" icon={<span className="w-1.5 h-1.5 rounded-full bg-[var(--lm-color-success)]" />}>
            Live Ephemeris
          </Badge>
        </button>
      )}

      <a
        href="#/scenario/3d-lab"
        onClick={(e) => {
          e.preventDefault();
          try {
            window.history.pushState(null, '', '/scenario/3d-lab');
            window.dispatchEvent(new PopStateEvent('popstate'));
          } catch {
            window.location.hash = '#/scenario/3d-lab';
          }
        }}
        aria-label="Open 3D Lab Test Route"
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/40 bg-[var(--lm-color-selected-site)]/10 text-[var(--lm-color-selected-site)] hover:bg-[var(--lm-color-selected-site)]/20 hover:border-[var(--lm-color-selected-site)] transition-colors cursor-pointer shadow-xs"
        title="Open Standalone 3D Scientific Lab"
      >
        <span>🔬 3D Lab</span>
      </a>

      <button
        type="button"
        onClick={onOpenGuide}
        aria-label="Observatory Guide & Documentation"
        className="p-1.5 text-[var(--lm-color-text-muted)] hover:text-[var(--lm-color-text-primary)] hover:bg-[var(--lm-color-surface-raised)] rounded-[var(--lm-radius-xs)] transition-colors"
        title="Observatory Guide"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
    </div>
  );
}
