import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EPOCH_MS,
  createInitialScenarioState,
  scenarioReducer,
} from '@/app/scenario/state/scenarioState';
import { CANDIDATE_SITES, DEFAULT_SITE_ID, getSiteById } from '@/domain/sites/catalog';

test('Scenario initial state: documented default site and default epoch constant', () => {
  const state = createInitialScenarioState();
  assert.equal(state.selectedSiteId, DEFAULT_SITE_ID);
  assert.equal(state.selectedSiteId, CANDIDATE_SITES[0].id);
  assert.equal(state.epochMs, DEFAULT_EPOCH_MS);
  assert.equal(new Date(DEFAULT_EPOCH_MS).toISOString(), '2026-10-21T12:00:00.000Z');
  assert.equal(state.calculationMode, 'terrain-aware');
});

test('Scenario transition: selecting a valid site id changes only the site', () => {
  const before = createInitialScenarioState();
  const target = CANDIDATE_SITES[5];
  const after = scenarioReducer(before, { type: 'site/selected', siteId: target.id });
  assert.equal(after.selectedSiteId, target.id);
  assert.equal(after.epochMs, before.epochMs);
  assert.equal(after.calculationMode, before.calculationMode);
  assert.notEqual(after, before, 'reducer must not mutate the previous state');
});

test('Scenario transition: selecting an unknown site id leaves state unchanged', () => {
  const before = createInitialScenarioState();
  assert.equal(getSiteById('not-a-site'), undefined);
  assert.equal(scenarioReducer(before, { type: 'site/selected', siteId: 'not-a-site' }), before);
});

test('Scenario transition: setting epoch milliseconds replaces the canonical instant', () => {
  const before = createInitialScenarioState();
  const next = before.epochMs + 3600_000;
  const after = scenarioReducer(before, { type: 'epoch/changed', epochMs: next });
  assert.equal(after.epochMs, next);
  assert.equal(after.selectedSiteId, before.selectedSiteId);
});

test('Scenario transition: a non-finite epoch is rejected without silent coercion', () => {
  const before = createInitialScenarioState();
  assert.equal(scenarioReducer(before, { type: 'epoch/changed', epochMs: Number.NaN }), before);
});

test('Scenario transition: setting the calculation mode', () => {
  const before = createInitialScenarioState();
  const after = scenarioReducer(before, { type: 'calculationMode/changed', mode: 'geometry-only' });
  assert.equal(after.calculationMode, 'geometry-only');
  assert.equal(scenarioReducer(after, { type: 'calculationMode/changed', mode: 'geometry-only' }), after);
});

test('Scenario transition: an unrecognised action leaves state unchanged', () => {
  const before = createInitialScenarioState();
  // @ts-expect-error deliberately exercising the defensive default branch
  assert.equal(scenarioReducer(before, { type: 'unknown/action' }), before);
});
