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
