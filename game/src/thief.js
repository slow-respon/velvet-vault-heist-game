// The Velvet Vault — Wren the thief: movement, wall collision, sneaking,
// and the hold-E loot grab. No drawing and no browser in here.

import { THIEF } from './config.js';

/** Push a circle out of a solid rectangle; returns true when a collision happened. */
export function collideCircleRect(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  const distSq = dx * dx + dy * dy;
  if (distSq >= circle.radius * circle.radius) return false;
  if (distSq === 0) {
    circle.y = rect.y - circle.radius;
    return true;
  }
  const dist = Math.sqrt(distSq);
  circle.x = nearestX + (dx / dist) * circle.radius;
  circle.y = nearestY + (dy / dist) * circle.radius;
  return true;
}

export function createThief(start) {
  return {
    x: start.x,
    y: start.y,
    radius: THIEF.radius,
    dirX: 0,
    dirY: -1,
    sneaking: false,
    moving: false,
    /** The loot currently being grabbed, or null. */
    grabbing: null,
    grabProgress: 0,
    /** Seconds left of the smoke cloud the thief carries. */
    smokeLeft: 0,
  };
}

/**
 * Move the thief one step. `move` is {x, y} normalised, `sneak` halves the speed.
 * `solids` are the walls and covers; the thief slides along them.
 */
export function moveThief(thief, move, sneak, dt, solids) {
  const speed = sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
  thief.sneaking = sneak;
  thief.moving = move.x !== 0 || move.y !== 0;
  if (thief.moving) {
    thief.dirX = move.x;
    thief.dirY = move.y;
  }
  thief.x += move.x * speed * dt;
  for (const solid of solids) collideCircleRect(thief, solid);
  thief.y += move.y * speed * dt;
  for (const solid of solids) collideCircleRect(thief, solid);
  if (thief.smokeLeft > 0) thief.smokeLeft = Math.max(0, thief.smokeLeft - dt);
}

/** Is the thief standing inside any shadow zone? Shadows hide the thief. */
export function inShadow(thief, shadows) {
  for (const zone of shadows) {
    if (thief.x > zone.x && thief.x < zone.x + zone.w && thief.y > zone.y && thief.y < zone.y + zone.h) return true;
  }
  return false;
}

/** Distance from the thief to a loot item. */
export function distanceTo(thief, item) {
  return Math.hypot(item.x - thief.x, item.y - thief.y);
}
