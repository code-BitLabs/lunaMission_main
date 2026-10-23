import {
  TOOLBAR_BUTTON_IDLE_CLASS,
  TOOLBAR_GROUP_CLASS,
  VIEW_MODES,
} from '@/features/spatial/config/spatialToolbarOptions';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';

const VIEW_MODE_BUTTON_ACTIVE_CLASS =
  'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/60 font-semibold shadow-xs';

interface ViewModeSelectorProps {
  viewMode: SpatialViewMode;
  onViewModeChange: (mode: SpatialViewMode) => void;
}

/** Which visualisations are on screen: 2D map, dual, or the 3D globe. */
export function ViewModeSelector({ viewMode, onViewModeChange }: ViewModeSelectorProps) {
  return (
    <div className={TOOLBAR_GROUP_CLASS}>
      {VIEW_MODES.map(({ mode, label, title, ariaLabel, Icon }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onViewModeChange(mode)}
          title={title}
          aria-label={ariaLabel}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--lm-radius-xs)] transition-colors ${
            viewMode === mode ? VIEW_MODE_BUTTON_ACTIVE_CLASS : TOOLBAR_BUTTON_IDLE_CLASS
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
