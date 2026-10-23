import React from 'react';
import { formatCoordinate, formatElevation } from '@/shared/formatting/formatters';
import { useScenario, useScenarioCommands, useScenarioModel } from '@/app/scenario/context/scenarioContext';
import type { CalculationMode } from '@/domain/celestial/calculationMode';

/**
 * Passport identity block: which point is selected, how it is described, the
 * reference coordinates, and the terrain-aware/geometry-only switch.
 */

const MODE_BUTTON_BASE =
  'px-2 py-0.5 text-[11px] font-mono rounded-[var(--lm-radius-xs)] transition-colors';
const MODE_BUTTON_ACTIVE =
  'bg-[var(--lm-color-surface-strong)] text-[var(--lm-color-selected-site)] border border-[var(--lm-color-selected-site)]/50 font-semibold';
const MODE_BUTTON_IDLE = 'text-[var(--lm-color-text-muted)] hover:text-white';

function ModeButton({
  mode,
  label,
  title,
  activeMode,
  onSelect,
}: {
  mode: CalculationMode;
  label: string;
  title: string;
  activeMode: CalculationMode;
  onSelect: (mode: CalculationMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mode)}
      title={title}
      className={`${MODE_BUTTON_BASE} ${activeMode === mode ? MODE_BUTTON_ACTIVE : MODE_BUTTON_IDLE}`}
    >
      {label}
    </button>
  );
}

export function PassportSiteHeader() {
  const { calculationMode } = useScenario();
  const { setCalculationMode } = useScenarioCommands();
  const { site } = useScenarioModel();

  return (
    <div className="flex flex-col gap-2 pb-3.5 border-b border-[var(--lm-color-border-subtle)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-[var(--lm-color-selected-site)] font-semibold bg-[var(--lm-color-surface-strong)] px-1.5 py-0.5 rounded-[var(--lm-radius-xs)] border border-[var(--lm-color-selected-site)]/30">
              {site.code}
            </span>
            <span className="text-xs text-[var(--lm-color-text-muted)] font-mono">
              {site.priority}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--lm-color-text-primary)] tracking-tight">
            {site.name}
          </h2>
        </div>

        {/* Mode Switcher: Terrain-aware vs Geometry-only */}
        <div className="flex items-center gap-1 bg-[var(--lm-color-surface-raised)] p-0.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
          <ModeButton
            mode="terrain-aware"
            label="Terrain-Aware"
            title="Terrain-aware calculation using LRO LOLA DEM"
            activeMode={calculationMode}
            onSelect={setCalculationMode}
          />
          <ModeButton
            mode="geometry-only"
            label="Geometry-Only"
            title="Geometry-only calculation against mathematical sphere"
            activeMode={calculationMode}
            onSelect={setCalculationMode}
          />
        </div>
      </div>

      {/* Site Description */}
      <p className="text-xs text-[var(--lm-color-text-secondary)] leading-relaxed">
        {site.description}
      </p>

      {/* Coordinates and Reference Metadata Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono-num text-xs bg-[var(--lm-color-surface-raised)] p-2.5 rounded-[var(--lm-radius-sm)] border border-[var(--lm-color-border)]">
        <div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] uppercase">Latitude</div>
          <div className="font-semibold text-[var(--lm-color-text-primary)]">
            {formatCoordinate(site?.coordinates?.latitudeDeg, 'latitude', 3)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[var(--lm-color-text-muted)] uppercase">Longitude</div>
          <div className="font-semibold text-[var(--lm-color-text-primary)]">
            {formatCoordinate(site?.coordinates?.longitudeDeg, 'longitude', 3)}
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[10px] text-[var(--lm-color-text-muted)] uppercase">Elevation (DEM)</div>
          <div className="font-semibold text-[var(--lm-color-text-primary)]">
            {formatElevation(site?.coordinates?.elevationMeters)}
          </div>
        </div>
      </div>
    </div>
  );
}
