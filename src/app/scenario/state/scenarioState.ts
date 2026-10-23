import { CalculationMode } from '@/domain/celestial/calculationMode';
import { DEFAULT_SITE_ID, getSiteById } from '@/domain/sites/catalog';

/**
 * Canonical scenario instant: 2026-10-21T12:00:00Z, the Artemis III target epoch
 * the observatory opens on. Stored as integer milliseconds so every consumer
 * derives from the same exact instant instead of re-parsing a string.
 */
export const DEFAULT_EPOCH_MS = Date.UTC(2026, 9, 21, 12, 0, 0);

export const DEFAULT_CALCULATION_MODE: CalculationMode = 'terrain-aware';

/** The three inputs every scientific view in the application derives from. */
export interface ScenarioState {
  selectedSiteId: string;
  epochMs: number;
  calculationMode: CalculationMode;
}

export type ScenarioAction =
  | { type: 'site/selected'; siteId: string }
  | { type: 'epoch/changed'; epochMs: number }
  | { type: 'calculationMode/changed'; mode: CalculationMode };

export function createInitialScenarioState(): ScenarioState {
  return {
    selectedSiteId: DEFAULT_SITE_ID,
    epochMs: DEFAULT_EPOCH_MS,
    calculationMode: DEFAULT_CALCULATION_MODE,
  };
}

/** Pure transitions: invalid input returns the previous state rather than coercing it. */
export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  switch (action.type) {
    case 'site/selected':
      if (!getSiteById(action.siteId)) return state;
      return state.selectedSiteId === action.siteId ? state : { ...state, selectedSiteId: action.siteId };
    case 'epoch/changed':
      if (!Number.isFinite(action.epochMs)) return state;
      return state.epochMs === action.epochMs ? state : { ...state, epochMs: action.epochMs };
    case 'calculationMode/changed':
      return state.calculationMode === action.mode ? state : { ...state, calculationMode: action.mode };
    default:
      return state;
  }
}
