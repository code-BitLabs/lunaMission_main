import React, { useMemo, useReducer } from 'react';
import { getSiteById } from '@/domain/sites/catalog';
import { CandidateSite } from '@/domain/sites/candidateSite';
import { createInitialScenarioState, scenarioReducer } from '@/app/scenario/state/scenarioState';
import { deriveScenarioModel } from '@/app/scenario/model/scenarioModel';
import {
  ScenarioCommandsContext,
  ScenarioModelContext,
  ScenarioStateContext,
  useCommandFactory,
} from '@/app/scenario/context/scenarioContext';

interface ScenarioProviderProps {
  children: React.ReactNode;
}

/** Sole owner of the canonical scenario inputs: selected site, epoch and calculation mode. */
export function ScenarioProvider({ children }: ScenarioProviderProps) {
  const [state, dispatch] = useReducer(scenarioReducer, undefined, createInitialScenarioState);
  const commands = useCommandFactory(dispatch);

  const site = useMemo<CandidateSite>(() => {
    const found = getSiteById(state.selectedSiteId);
    if (!found) {
      throw new Error(`Scenario state holds an unknown site id: ${state.selectedSiteId}`);
    }
    return found;
  }, [state.selectedSiteId]);

  const model = useMemo(
    () => deriveScenarioModel(site, state.epochMs, state.calculationMode),
    [site, state.epochMs, state.calculationMode],
  );

  return (
    <ScenarioStateContext.Provider value={state}>
      <ScenarioModelContext.Provider value={model}>
        <ScenarioCommandsContext.Provider value={commands}>
          {children}
        </ScenarioCommandsContext.Provider>
      </ScenarioModelContext.Provider>
    </ScenarioStateContext.Provider>
  );
}
