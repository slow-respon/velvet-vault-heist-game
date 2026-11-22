// The Velvet Vault — wall cameras: a fixed mount sweeping its red cone back
// and forth. A camera that sees the thief raises the alarm, but it never moves.

import { CAMERA } from './config.js';
import { losBlocked } from './guards.js';

export function createCameras(defs) {
  return defs.map((def, index) => ({
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    sweep: def.sweep ?? 0.8,
    /** Fixed phase per camera, so screenshot scenes are deterministic. */
    phase: (index * 0.37) % 1,
    angle: def.baseAngle,
  }));
}

/** Sweep every camera one step; the angle oscillates around its base angle. */
export function stepCameras(cameras, dt) {
  for (const camera of cameras) {
    camera.phase = (camera.phase + (dt * CAMERA.sweepSpeed) / (Math.PI * 2)) % 1;
    camera.angle = camera.baseAngle + Math.sin(camera.phase * Math.PI * 2) * camera.sweep;
  }
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Can this camera see the thief right now? Cone + range + clear line of sight. */
export function cameraSeesThief(camera, thief, solids, hidden) {
  const dist = Math.hypot(thief.x - camera.x, thief.y - camera.y);
  if (hidden && dist > 70) return false;
  if (dist > CAMERA.viewRange) return false;
  const toThief = Math.atan2(thief.y - camera.y, thief.x - camera.x);
  if (Math.abs(angleDiff(toThief, camera.angle)) > CAMERA.viewHalfAngle) return false;
  return !losBlocked(camera.x, camera.y, thief.x, thief.y, solids);
}
