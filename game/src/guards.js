// The Velvet Vault — guards: waypoint patrols, vision cones, chasing the
// last seen spot, and investigating a thrown coin. Also the shared line-of-
// sight geometry (a wall or a display case between two points blocks sight).

import { GUARD } from './config.js';

function pointInRect(px, py, rect) {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** True when the segment between two points crosses a rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
  const { x, y, w, h } = rect;
  return (
    segmentsCross(x1, y1, x2, y2, x, y, x + w, y) ||
    segmentsCross(x1, y1, x2, y2, x + w, y, x + w, y + h) ||
    segmentsCross(x1, y1, x2, y2, x + w, y + h, x, y + h) ||
    segmentsCross(x1, y1, x2, y2, x, y + h, x, y)
  );
}

/** True when any solid blocks the line of sight between two points. */
export function losBlocked(x1, y1, x2, y2, solids) {
  for (const solid of solids) {
    if (segmentHitsRect(x1, y1, x2, y2, solid)) return true;
  }
  return false;
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** Can this guard see the thief right now? Cone + range + clear line of sight. */
export function guardSeesThief(guard, thief, solids, hidden) {
  const dist = Math.hypot(thief.x - guard.x, thief.y - guard.y);
  const range = thief.sneaking ? GUARD.viewRangeSneak : GUARD.viewRange;
  if (hidden && dist > 70) return false;
  if (dist > range) return false;
  const toThief = angleTo(guard.x, guard.y, thief.x, thief.y);
  if (Math.abs(angleDiff(toThief, guard.angle)) > GUARD.viewHalfAngle) return false;
  return !losBlocked(guard.x, guard.y, thief.x, thief.y, solids);
}

export function createGuards(defs) {
  return defs.map((def) => ({
    waypoints: def.waypoints,
    pause: def.pause ?? 1,
    x: def.waypoints[0].x,
    y: def.waypoints[0].y,
    angle: 0,
    waypointIndex: 1,
    pauseLeft: 0,
    /** patrol | chase | investigate | return */
    mode: 'patrol',
    lastSeenX: 0,
    lastSeenY: 0,
    chaseLeft: 0,
    investigateX: 0,
    investigateY: 0,
    investigateLeft: 0,
    speed: GUARD.patrolSpeed,
  }));
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

/**
 * Advance all guards one step. `seen` is the per-guard sighting result from
 * this frame (computed by the caller, which owns the alarm grace); a guard
 * that sees the thief chases the thief's position.
 */
export function stepGuards(guards, seen, thief, dt) {
  for (let i = 0; i < guards.length; i += 1) {
    const guard = guards[i];
    if (seen[i]) {
      guard.lastSeenX = thief.x;
      guard.lastSeenY = thief.y;
      guard.chaseLeft = GUARD.chaseMemory;
      if (guard.mode !== 'chase') guard.mode = 'chase';
    } else if (guard.chaseLeft > 0) {
      guard.chaseLeft -= dt;
    }

    if (guard.mode === 'chase') {
      const arrived = moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.chaseSpeed, dt);
      if (arrived || guard.chaseLeft <= 0) {
        guard.mode = 'patrol';
        guard.chaseLeft = 0;
      }
    } else if (guard.mode === 'investigate') {
      const arrived = moveToward(guard, guard.investigateX, guard.investigateY, GUARD.investigateSpeed, dt);
      guard.investigateLeft -= dt;
      if (arrived || guard.investigateLeft <= 0) guard.mode = 'patrol';
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        guard.angle += dt * 0.6;
      } else {
        const arrived = moveToward(guard, target.x, target.y, GUARD.patrolSpeed, dt);
        if (arrived) {
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          guard.pauseLeft = guard.pause;
        }
      }
    }
  }
}

/** Send every guard near a point to investigate a thrown coin. */
export function distractGuards(guards, x, y) {
  for (const guard of guards) {
    if (Math.hypot(guard.x - x, guard.y - y) < 340) {
      guard.mode = 'investigate';
      guard.investigateX = x;
      guard.investigateY = y;
      guard.investigateLeft = 3;
      guard.chaseLeft = 0;
    }
  }
}

/** Has any guard caught the thief (close enough to grab)? */
export function guardCaughtThief(guards, thief) {
  for (const guard of guards) {
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < GUARD.catchRange) return true;
  }
  return false;
}
