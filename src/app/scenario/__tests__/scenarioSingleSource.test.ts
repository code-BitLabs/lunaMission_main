import test from 'node:test';
import assert from 'node:assert/strict';

import { ScenarioState, createInitialScenarioState, scenarioReducer } from '@/app/scenario/state/scenarioState';
import { deriveScenarioModel } from '@/app/scenario/model/scenarioModel';
import { CANDIDATE_SITES, getSiteById } from '@/domain/sites/catalog';

/**
 * The application keeps one canonical scenario state and derives every view from it, so a
 * single dispatch must leave the passport, the inspector, the Time Explorer cursor and the
 * comparison matrix agreeing on the same site and instant. These tests pin that property at
 * the state and derivation layer, which is where a stale intermediate frame could originate.
 */

function modelOf(state: ScenarioState) {
  const site = getSiteById(state.selectedSiteId);
  assert.ok(site, `state holds a site id the catalog cannot resolve: ${state.selectedSiteId}`);
  return deriveScenarioModel(site, state.epochMs, state.calculationMode);
}

test('single source of truth: one dispatch updates every consumer-visible slice at once', () => {
  const before = createInitialScenarioState();
  const after = scenarioReducer(before, { type: 'site/selected', siteId: 'haworth-rim' });

  const model = modelOf(after);
  assert.equal(model.site.id, 'haworth-rim');
  assert.equal(model.epochMs, before.epochMs, 'the instant must not move with a site change');
  assert.equal(model.epochIsoUtc, modelOf(before).epochIsoUtc);
  assert.equal(model.calculationMode, before.calculationMode);
});

test('single source of truth: an epoch change leaves the selected site untouched', () => {
  const start = scenarioReducer(createInitialScenarioState(), { type: 'site/selected', siteId: 'malapert-massif' });
  const epochMs = Date.UTC(2026, 9, 21, 18, 0, 0);
  const next = scenarioReducer(start, { type: 'epoch/changed', epochMs });

  const model = modelOf(next);
  assert.equal(model.site.id, 'malapert-massif');
  assert.equal(model.epochMs, epochMs);
  assert.notEqual(model.ephemeris.subSolarLonDeg, modelOf(start).ephemeris.subSolarLonDeg);
});

test('single source of truth: a mode change moves the provenance without moving site or instant', () => {
  const start = createInitialScenarioState();
  const next = scenarioReducer(start, { type: 'calculationMode/changed', mode: 'geometry-only' });

  const model = modelOf(next);
  assert.equal(model.site.id, start.selectedSiteId);
  assert.equal(model.epochMs, start.epochMs);
  assert.equal(model.calculationMode, 'geometry-only');
});

test('single source of truth: redundant dispatches return the same object, so no extra render frame exists', () => {
  const initial = createInitialScenarioState();
  assert.equal(scenarioReducer(initial, { type: 'site/selected', siteId: initial.selectedSiteId }), initial);
  assert.equal(scenarioReducer(initial, { type: 'epoch/changed', epochMs: initial.epochMs }), initial);
  assert.equal(
    scenarioReducer(initial, { type: 'calculationMode/changed', mode: initial.calculationMode }),
    initial,
  );
});

test('single source of truth: the derived model is a pure function of state alone', () => {
  let state = createInitialScenarioState();
  for (const site of CANDIDATE_SITES) {
    state = scenarioReducer(state, { type: 'site/selected', siteId: site.id });
    assert.deepEqual(modelOf(state), modelOf(state), 'the same state must derive the same numbers');
    assert.equal(state.selectedSiteId, site.id);
  }
});

test('single source of truth: every view input is reachable from the three canonical fields', () => {
  const model = modelOf(createInitialScenarioState());

  assert.deepEqual(Object.keys(model).sort(), [
    'calculationMode',
    'conditions',
    'ephemeris',
    'epochIsoUtc',
    'epochMs',
    'julianDate',
    'site',
  ]);
  assert.equal(model.conditions.epochUtc, model.epochIsoUtc, 'derived values serialize the one instant');
});
