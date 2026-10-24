/**
 * The option tables behind the spatial toolbar. Data, not markup: the toolbar
 * renders one button per entry, so adding a view mode or layer means adding a
 * row here rather than editing components.
 */

import {
  Columns,
  Compass,
  Crosshair,
  Eye,
  Globe as GlobeIcon,
  Map as MapIcon,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react';
import { CameraPreset, SpatialLayer } from '@/features/spatial/model/spatialPreferences';
import { SpatialViewMode } from '@/features/spatial/model/spatialViewMode';

export interface ViewModeOption {
  mode: SpatialViewMode;
  label: string;
  title: string;
  ariaLabel: string;
  Icon: LucideIcon;
}

export const VIEW_MODES: ViewModeOption[] = [
  {
    mode: 'map2d',
    label: '2D Map',
    title: 'Switch to 2D Polar Stereographic Map (Mode A)',
    ariaLabel: '2D Polar Map view',
    Icon: MapIcon,
  },
  {
    mode: 'dual',
    label: 'Dual View',
    title: 'Switch to Side-by-side Dual View (Mode C)',
    ariaLabel: 'Dual 2D and 3D View',
    Icon: Columns,
  },
  {
    mode: 'globe3d',
    label: '3D Moon',
    title: 'Switch to 3D NASA LRO Moon Globe',
    ariaLabel: '3D Moon Globe view',
    Icon: GlobeIcon,
  },
];

export interface CameraPresetOption {
  preset: CameraPreset;
  label: string;
  title: string;
  Icon: LucideIcon;
  iconClassName: string;
}

/** Camera presets only exist for the globe, so the group is hidden in 2D-only view. */
export const CAMERA_PRESETS: CameraPresetOption[] = [
  {
    preset: 'global',
    label: 'Global',
    title: 'Global Context: Complete Moon sphere overview',
    Icon: GlobeIcon,
    iconClassName: 'w-3 h-3',
  },
  {
    preset: 'nadir',
    label: 'South Pole',
    title: 'South Pole Focus: Centered on candidate region (83°S–90°S)',
    Icon: Compass,
    iconClassName: 'w-3 h-3 text-[var(--lm-color-selected-site)]',
  },
  {
    preset: 'oblique',
    label: 'Oblique',
    title: 'Oblique Terrain: Perspective view across crater rims and relief',
    Icon: Eye,
    iconClassName: 'w-3 h-3',
  },
  {
    preset: 'site',
    label: 'Site Focus',
    title: 'Focus camera on selected candidate site',
    Icon: Crosshair,
    iconClassName: 'w-3 h-3',
  },
  {
    preset: 'inspection',
    label: 'Inspect',
    title: 'Local Site Inspection: Deep zoom grazing view of crater relief and lighting',
    Icon: ZoomIn,
    iconClassName: 'w-3 h-3 text-[var(--lm-color-sun)]',
  },
];

export interface LayerToggleButton {
  layer: SpatialLayer;
  label: string;
  title: string;
  ariaLabel: string;
  /** Full active-state class list; the PSR overlay keeps its own blue rather than the site teal. */
  activeClassName: string;
}

export const LAYER_BUTTONS: LayerToggleButton[] = [
  {
    layer: 'grid',
    label: 'Grid',
    title: 'Toggle Coordinate Grid',
    ariaLabel: 'Toggle grid',
    activeClassName:
      'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-text-primary)] border border-[var(--lm-color-border)]',
  },
  {
    layer: 'vectors',
    label: 'Vectors',
    title: 'Toggle Sun and Earth Direction Vectors',
    ariaLabel: 'Toggle celestial vectors',
    activeClassName:
      'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-sun)] border border-[var(--lm-color-sun)]/40',
  },
  {
    layer: 'shadowRegions',
    label: 'PSR',
    title: 'Toggle Permanently Shadowed Regions (PSR) & Footprint',
    ariaLabel: 'Toggle shadow regions',
    activeClassName: 'bg-[var(--lm-color-surface-strong)] text-[#8CCBFF] border border-[#8CCBFF]/40',
  },
];

/** Shared resting state for every toolbar button. */
export const TOOLBAR_BUTTON_IDLE_CLASS = 'text-[var(--lm-color-text-muted)] hover:text-white';

/** Common chrome for each button group. */
export const TOOLBAR_GROUP_CLASS =
  'flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs';

/** The camera group collapses below the `sm` breakpoint, where there is no globe on screen. */
export const CAMERA_GROUP_CLASS =
  'hidden sm:flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-1 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)] shadow-xs';
