import { isLayerVisible, SpatialLayer, SpatialPreferences } from '@/features/spatial/model/spatialPreferences';
import {
  LAYER_BUTTONS,
  TOOLBAR_BUTTON_IDLE_CLASS,
  TOOLBAR_GROUP_CLASS,
} from '@/features/spatial/config/spatialToolbarOptions';

interface LayerToggleGroupProps {
  preferences: SpatialPreferences;
  onToggleLayer: (layer: SpatialLayer) => void;
}

/** Overlay visibility: graticule, celestial vectors, and the shadowed-region mask. */
export function LayerToggleGroup({ preferences, onToggleLayer }: LayerToggleGroupProps) {
  return (
    <div className={TOOLBAR_GROUP_CLASS}>
      {LAYER_BUTTONS.map(({ layer, label, title, ariaLabel, activeClassName }) => (
        <button
          key={layer}
          type="button"
          onClick={() => onToggleLayer(layer)}
          title={title}
          aria-label={ariaLabel}
          className={`px-2 py-0.5 text-[11px] rounded-[var(--lm-radius-xs)] font-medium transition-colors ${
            isLayerVisible(preferences, layer) ? activeClassName : TOOLBAR_BUTTON_IDLE_CLASS
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
