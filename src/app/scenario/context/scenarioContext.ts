import { createContext, useContext, useMemo } from 'react';
import { CalculationMode } from '@/domain/celestial/calculationMode';
import { ScenarioAction, ScenarioState } from '@/app/scenario/state/scenarioState';
import { ScenarioModel } from '@/app/scenario/model/scenarioModel';

/** Command surface exposed to consumers so no component builds an action literal. */
export interface ScenarioCommands {
  selectSite: (siteId: string) => void;
  setEpoch: (epochMs: number) => void;
  setCalculationMode: (mode: CalculationMode) => void;
}

/** Split contexts: writers can depend on the stable command object without re-rendering on state. */
export const ScenarioStateContext = createContext<ScenarioState | null>(null);
export const ScenarioModelContext = createContext<ScenarioModel | null>(null);
export const ScenarioCommandsContext = createContext<ScenarioCommands | null>(null);

function requireContext<T>(value: T | null, hookName: string): T {
  if (value === null) {
    throw new Error(`${hookName} must be used inside <ScenarioProvider>`);
  }
  return value;
}

export function useScenario(): ScenarioState {
  return requireContext(useContext(ScenarioStateContext), 'useScenario');
}

export function useScenarioModel(): ScenarioModel {
  return requireContext(useContext(ScenarioModelContext), 'useScenarioModel');
}

export function useScenarioCommands(): ScenarioCommands {
  return requireContext(useContext(ScenarioCommandsContext), 'useScenarioCommands');
}

type Dispatch = (action: ScenarioAction) => void;

export function useCommandFactory(dispatch: Dispatch): ScenarioCommands {
  return useMemo(
    () => ({
      selectSite: (siteId) => dispatch({ type: 'site/selected', siteId }),
      setEpoch: (epochMs) => dispatch({ type: 'epoch/changed', epochMs }),
      setCalculationMode: (mode) => dispatch({ type: 'calculationMode/changed', mode }),
    }),
    [dispatch],
  );
}

export function useSelectSite(): (siteId: string) => void {
  return useScenarioCommands().selectSite;
}

export function useSetEpoch(): (epochMs: number) => void {
  return useScenarioCommands().setEpoch;
}

export function useSetCalculationMode(): (mode: CalculationMode) => void {
  return useScenarioCommands().setCalculationMode;
}
