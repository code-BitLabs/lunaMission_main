import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  cameraPoseForPreset,
  createCameraTransitioner,
  GLOBAL_CAMERA_POSITION,
  GLOBAL_LOOK_TARGET,
  NADIR_CAMERA_DISTANCE,
  OBLIQUE_CAMERA_POSITION,
  OBLIQUE_LOOK_TARGET,
  SITE_CAMERA_ALTITUDE,
} from '../interaction/globeCameraPresets';
import { CANDIDATE_SITES } from '@/domain/sites/catalog';

const testSite = CANDIDATE_SITES[0]; // Shackleton Connecting Ridge

test('Camera presets: global preset frames entire Moon with comfortable margins', () => {
  const pose = cameraPoseForPreset('global', testSite);
  assert.deepEqual(
    [pose.camPos.x, pose.camPos.y, pose.camPos.z],
    [...GLOBAL_CAMERA_POSITION]
  );
  assert.deepEqual(
    [pose.lookTarget.x, pose.lookTarget.y, pose.lookTarget.z],
    [...GLOBAL_LOOK_TARGET]
  );
  assert.ok(Math.abs(pose.upVector.length() - 1.0) < 1e-5);
});

test('Camera presets: nadir (South Pole) preset frames South Pole region without screen edge cropping', () => {
  const pose = cameraPoseForPreset('nadir', testSite);
  assert.equal(pose.camPos.y, -NADIR_CAMERA_DISTANCE);
  assert.ok(pose.camPos.length() >= 4.5, 'Camera distance must be >= 4.5 to avoid cropping at 38° FOV');
  assert.deepEqual(pose.lookTarget, new THREE.Vector3(0, 0, 0));
  // Prime meridian (+Z) up to align with 2D polar map
  assert.deepEqual(pose.upVector, new THREE.Vector3(0, 0, 1));
});

test('Camera presets: oblique preset provides perspective across crater relief', () => {
  const pose = cameraPoseForPreset('oblique', testSite);
  assert.deepEqual(
    [pose.camPos.x, pose.camPos.y, pose.camPos.z],
    [...OBLIQUE_CAMERA_POSITION]
  );
  assert.deepEqual(
    [pose.lookTarget.x, pose.lookTarget.y, pose.lookTarget.z],
    [...OBLIQUE_LOOK_TARGET]
  );
  assert.ok(Math.abs(pose.upVector.length() - 1.0) < 1e-5, 'Up vector must be normalized');
});

test('Camera presets: site preset centers directly on the selected candidate site', () => {
  const pose = cameraPoseForPreset('site', testSite);
  // lookTarget should point exactly to site position on Moon surface
  assert.ok(pose.lookTarget.length() > 1.4 && pose.lookTarget.length() < 1.5, 'Target is on Moon surface');
  // camPos distance should be greater than site surface distance
  assert.ok(pose.camPos.length() > pose.lookTarget.length());
});

test('Camera presets: inspection preset provides close-range grazing view of candidate site', () => {
  const pose = cameraPoseForPreset('inspection', testSite);
  // lookTarget should point exactly to site position on Moon surface
  assert.ok(pose.lookTarget.length() > 1.4 && pose.lookTarget.length() < 1.5, 'Target is on Moon surface');
  // camPos distance should be close to site surface distance (within 0.15 units)
  const distToTarget = pose.camPos.distanceTo(pose.lookTarget);
  assert.ok(distToTarget < 0.15, `Inspection camera must be within 0.15 units of site, was ${distToTarget}`);
  assert.ok(distToTarget > 0.05, `Inspection camera must maintain safe altitude > 0.05 units, was ${distToTarget}`);
});

test('Camera transitioner: cancel immediately halts in-flight transition', () => {
  const transitioner = createCameraTransitioner();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, -NADIR_CAMERA_DISTANCE, 0.0001);

  // Fake OrbitControls structure needed for step
  const fakeControls = {
    target: new THREE.Vector3(0, 0, 0),
  } as any;

  transitioner.moveTo('global', testSite);
  transitioner.cancel();

  // Stepping after cancel should do nothing
  const prevPos = camera.position.clone();
  transitioner.step(camera, fakeControls);
  assert.deepEqual(camera.position, prevPos);
});

test('Camera transitioner: step smoothly moves camera and reaches target pose', () => {
  const transitioner = createCameraTransitioner();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 10);
  camera.up.set(0, 1, 0);

  const fakeControls = {
    target: new THREE.Vector3(0, 0, 0),
  } as any;

  transitioner.moveTo('nadir', testSite);

  // Simulate multiple animation frames
  for (let i = 0; i < 40; i++) {
    transitioner.step(camera, fakeControls);
  }

  // After sufficient frames (progress >= 1.0), camera should reach target nadir pose
  assert.ok(Math.abs(camera.position.y - (-NADIR_CAMERA_DISTANCE)) < 0.01);
  assert.ok(Math.abs(camera.up.z - 1.0) < 0.01);
});

test('Camera presets: overhead preset frames candidate nadir with north up', () => {
  const pose = cameraPoseForPreset('overhead', testSite);
  assert.ok(pose.lookTarget.length() > 1.4 && pose.lookTarget.length() < 1.5, 'Target is on Moon surface');
  const dist = pose.camPos.distanceTo(pose.lookTarget);
  assert.ok(dist >= 0.12 && dist <= 0.16, `Overhead camera distance should be ~0.14, was ${dist}`);
  // Up vector is local North
  assert.ok(Math.abs(pose.upVector.length() - 1.0) < 1e-4);
});

test('Camera presets: horizon preset frames eye-level perspective toward terrain horizon', () => {
  const pose = cameraPoseForPreset('horizon', testSite);
  assert.ok(pose.camPos.length() > 1.45, 'Camera sits safely above Moon surface');
  const dist = pose.camPos.distanceTo(pose.lookTarget);
  assert.ok(dist < 0.12, `Horizon view look target distance should be compact, was ${dist}`);
  assert.ok(Math.abs(pose.upVector.length() - 1.0) < 1e-4);
});

