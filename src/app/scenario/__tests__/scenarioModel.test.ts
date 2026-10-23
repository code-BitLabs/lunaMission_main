import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveScenarioModel } from '@/app/scenario/model/scenarioModel';
import { DEFAULT_EPOCH_MS } from '@/app/scenario/state/scenarioState';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';
import { MS_PER_HOUR } from '@/domain/constants/time';

const SITE = CANDIDATE_SITES[0];

test('Scenario model: equal inputs derive an equal model', () => {
  const a = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS, 'terrain-aware');
  const b = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS, 'terrain-aware');
  assert.deepEqual(a, b);
});

test('Scenario model: a changed epoch changes the derived geometry', () => {
  const before = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS, 'terrain-aware');
  const after = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS + 6 * MS_PER_HOUR, 'terrain-aware');
  assert.notDeepEqual(after.conditions, before.conditions);
  if (after.conditions.sunElevationDeg.kind === 'available' &&
      before.conditions.sunElevationDeg.kind === 'available') {
    assert.notEqual(after.conditions.sunElevationDeg.value, before.conditions.sunElevationDeg.value);
  } else {
    assert.fail('characterization baseline expects available sun elevation at the sampled epochs');
  }
});

test('Scenario model: the calculation mode is reflected in the terrain horizon and provenance', () => {
  const geometryOnly = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS, 'geometry-only');
  const terrainAware = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS, 'terrain-aware');
  assert.equal(geometryOnly.calculationMode, 'geometry-only');
  assert.equal(geometryOnly.conditions.provenance.calculationMode, 'geometry-only');
  assert.equal(terrainAware.conditions.provenance.calculationMode, 'terrain-aware');
  if (geometryOnly.conditions.localTerrainElevationAtSunAzimuthDeg.kind === 'available') {
    assert.equal(geometryOnly.conditions.localTerrainElevationAtSunAzimuthDeg.value, 0);
  }
});

test('Scenario model: the ISO epoch is a serialization of the canonical milliseconds', () => {
  const model = deriveScenarioModel(SITE, DEFAULT_EPOCH_MS, 'terrain-aware');
  assert.equal(model.epochIsoUtc, '2026-10-21T12:00:00Z');
  assert.equal(new Date(model.epochIsoUtc).getTime(), model.epochMs);
  assert.equal(model.site, SITE);
});
