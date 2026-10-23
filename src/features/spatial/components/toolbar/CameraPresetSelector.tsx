import {
  CAMERA_GROUP_CLASS,
  CAMERA_PRESETS,
  TOOLBAR_BUTTON_IDLE_CLASS,
} from '@/features/spatial/config/spatialToolbarOptions';
import { CameraPreset, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';

const CAMERA_BUTTON_ACTIVE_CLASS =
  'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] font-semibold';

interface CameraPresetSelectorProps {
  preferences: SpatialPreferences;
  onCameraPresetChange: (preset: CameraPreset) => void;
}

/** Globe camera presets, collapsed below the `sm` breakpoint where no globe is on screen. */
export function CameraPresetSelector({ preferences, onCameraPresetChange }: CameraPresetSelectorProps) {
  return (
    <div className={CAMERA_GROUP_CLASS}>
      {CAMERA_PRESETS.map(({ preset, label, title, Icon, iconClassName }) => (
        <button
          key={preset}
          type="button"
          onClick={() => onCameraPresetChange(preset)}
          title={title}
          className={`flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            preferences.cameraPreset === preset ? CAMERA_BUTTON_ACTIVE_CLASS : TOOLBAR_BUTTON_IDLE_CLASS
          }`}
        >
          <Icon className={iconClassName} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
