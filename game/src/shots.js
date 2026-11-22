// The Velvet Vault — the screenshot scenes behind ?shot=cover|alarm|win|title.
// Each one plays the real rules forward from a fresh game for a fixed number
// of steps, steered by a simple autopilot (walk to the nearest required loot,
// hold E to grab it, then head for the exit, sneaking near guards), so the
// frame is what a short game really looks like and is the same every run.
// The alarm value is then staged to the scene's target, the way a director
// sets the lights: the meter, the cones and the thief are all drawn by the
// game's own renderer from the game's own state.

import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const COVER_SECONDS = 6;
const ALARM_SECONDS = 8;

/** Steer the thief toward the nearest required loot, then toward the exit. */
function autopilot(state) {
  const thief = state.thief;
  let target = null;
  for (const item of state.loot) {
    if (!item.required || item.taken) continue;
    if (target === null || Math.hypot(item.x - thief.x, item.y - thief.y) < Math.hypot(target.x - thief.x, target.y - thief.y)) target = item;
  }
  if (target === null) target = { x: state.level.exit.x + state.level.exit.w / 2, y: state.level.exit.y + state.level.exit.h / 2 };
  const dx = target.x - thief.x;
  const dy = target.y - thief.y;
  const dist = Math.hypot(dx, dy);
  const nearLoot = state.loot.some((item) => !item.taken && Math.hypot(item.x - thief.x, item.y - thief.y) < 44);
  let sneak = false;
  for (const guard of state.guards) {
    if (Math.hypot(guard.x - thief.x, guard.y - thief.y) < 170) sneak = true;
  }
  return {
    move: dist < 4 ? { x: 0, y: 0 } : { x: dx / dist, y: dy / dist },
    sneak,
    interact: nearLoot,
    click: null,
    actions: 0,
  };
}

function playForward(api, state, seconds) {
  const steps = Math.floor(seconds / STEP);
  for (let index = 0; index < steps; index += 1) {
    if (state.status !== 'playing') break;
    api.stepGame(state, autopilot(state), STEP);
  }
}

/**
 * Set `state` to the named scene and return the screen to draw over it.
 * `api` is { newGame(levelIndex), stepGame(state, ctrl, dt) } from main.js.
 */
export function stageShot(name, api) {
  if (name === 'title') {
    const state = api.newGame(0);
    return { state, screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'win') {
    const state = api.newGame(2);
    for (const item of state.loot) if (item.required) item.taken = true;
    state.score = 2450;
    state.exitOpen = true;
    state.thief.x = state.level.exit.x + state.level.exit.w / 2;
    state.thief.y = state.level.exit.y - 70;
    state.alarm.value = 12;
    state.elapsed = 187;
    return { state, screen: SCREEN_PLAY, best: 2450 };
  }
  if (name === 'alarm') {
    const state = api.newGame(0);
    playForward(api, state, ALARM_SECONDS);
    state.alarm.value = 78;
    state.alarm.spotted = true;
    state.alarm.seenByGuard = true;
    // The nearest guard sprints at Wren, cone right on the thief.
    let nearest = null;
    for (const guard of state.guards) {
      if (nearest === null || Math.hypot(guard.x - state.thief.x, guard.y - state.thief.y) < Math.hypot(nearest.x - state.thief.x, nearest.y - state.thief.y)) nearest = guard;
    }
    if (nearest !== null) {
      nearest.x = state.thief.x - 120;
      nearest.y = state.thief.y - 40;
      nearest.angle = Math.atan2(state.thief.y - nearest.y, state.thief.x - nearest.x);
      nearest.mode = 'chase';
      nearest.lastSeenX = state.thief.x;
      nearest.lastSeenY = state.thief.y;
      nearest.chaseLeft = 3;
    }
    return { state, screen: SCREEN_PLAY, best: 0 };
  }
  // cover (and anything else): a quiet moment mid-heist, alarm climbing.
  // The autopilot sometimes gets caught; retry shorter runs so the staged
  // frame always shows a live heist, never a caught thief.
  let state = api.newGame(0);
  for (const seconds of [COVER_SECONDS, 2.5, 1.5]) {
    state = api.newGame(0);
    playForward(api, state, seconds);
    if (state.status === 'playing') break;
  }
  state.alarm.value = 35;
  return { state, screen: SCREEN_PLAY, best: 0 };
}
