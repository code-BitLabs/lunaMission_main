import { Maximize2, Minimize2 } from 'lucide-react';

const FULLSCREEN_ACTIVE_CLASS =
  'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border-[var(--lm-color-selected-site)] font-semibold';
const FULLSCREEN_IDLE_CLASS =
  'bg-[var(--lm-color-surface-raised)] text-[var(--lm-color-text-secondary)] border-[var(--lm-color-border)] hover:text-white hover:bg-[var(--lm-color-surface-strong)]';

interface FullscreenToggleProps {
  isFullscreenActive: boolean;
  onToggleFullscreen: () => void;
}

/** Expands the spatial workspace to the whole viewport; Escape also exits. */
export function FullscreenToggle({ isFullscreenActive, onToggleFullscreen }: FullscreenToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggleFullscreen}
      title={isFullscreenActive ? 'Exit Fullscreen (Esc)' : 'Expand to Fullscreen Spatial Workspace (Mode B)'}
      aria-label={isFullscreenActive ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-sm)] border transition-colors ${
        isFullscreenActive ? FULLSCREEN_ACTIVE_CLASS : FULLSCREEN_IDLE_CLASS
      }`}
    >
      {isFullscreenActive ? (
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
  );
}
