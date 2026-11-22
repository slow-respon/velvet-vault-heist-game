// The Velvet Vault — boot and the one loop: input is read every frame, the
// world advances in fixed 1/60 s steps (several in a slow frame, none in a
// fast one), and the renderer paints what is there. The game moves between
// six screens: title, play, paused, caught, level complete and getaway.
//
// ?shot=cover|alarm|win|title stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.
// ?selftest=1 runs a scripted rules check and writes the result to
// document.title and a #selftest div.

import { BEST_KEY, FIELD, STEP, THIEF, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { createThief, moveThief, inShadow, distanceTo } from './thief.js';
import { createGuards, stepGuards, guardSeesThief, distractGuards, guardCaughtThief } from './guards.js';
import { createCameras, stepCameras, cameraSeesThief } from './cameras.js';
import { createAlarm, stepAlarm } from './alarm.js';
import { createAudio } from './audio.js';
import {
  ACTION_BUY_COIN, ACTION_BUY_LOCKPICK, ACTION_BUY_SMOKE, ACTION_CONFIRM,
  ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, ACTION_SMOKE, createInput,
} from './input.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_LEVEL, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const selftest = params.get('selftest') === '1';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const sfx = createAudio();

/** Build a fresh state for a level, carrying score and tools over from `carry`. */
export function newGame(levelIndex, carry) {
  const level = LEVELS[levelIndex];
  const state = {
    levelIndex,
    level,
    thief: createThief(level.start),
    guards: createGuards(level.guards),
    cameras: createCameras(level.cameras),
    loot: level.loot.map((item) => ({ ...item, taken: false })),
    alarm: createAlarm(),
    score: carry?.score ?? 0,
    coins: carry?.coins ?? TOOLS.coin.start,
    smoke: carry?.smoke ?? TOOLS.smoke.start,
    lockpick: carry?.lockpick ?? false,
    elapsed: 0,
    status: 'playing',
    exitOpen: false,
    snapshot: { score: carry?.score ?? 0, coins: carry?.coins ?? TOOLS.coin.start, smoke: carry?.smoke ?? TOOLS.smoke.start, lockpick: carry?.lockpick ?? false },
  };
  return state;
}

function solidsOf(state) {
  return state.level.walls.concat(state.level.covers);
}

/**
 * One fixed step of the heist. `ctrl` is { move: {x,y}, sneak, interact,
 * click: {x,y} in field coords | null, actions } — the same shape the loop
 * builds from real input, the autopilot builds for screenshots, and the
 * self-test builds by hand.
 */
export function stepGame(state, ctrl, dt) {
  if (state.status !== 'playing') return;
  state.elapsed += dt;
  const solids = solidsOf(state);
  const thief = state.thief;

  // Tools bought with the haul: 1 coin, 2 smoke, 3 lockpick.
  if (ctrl.actions & ACTION_BUY_COIN && state.coins < TOOLS.coin.max && state.score >= TOOLS.coin.price) {
    state.score -= TOOLS.coin.price;
    state.coins += 1;
    sfx.buy();
  }
  if (ctrl.actions & ACTION_BUY_SMOKE && state.smoke < TOOLS.smoke.max && state.score >= TOOLS.smoke.price) {
    state.score -= TOOLS.smoke.price;
    state.smoke += 1;
    sfx.buy();
  }
  if (ctrl.actions & ACTION_BUY_LOCKPICK && !state.lockpick && state.score >= TOOLS.lockpick.price) {
    state.score -= TOOLS.lockpick.price;
    state.lockpick = true;
    sfx.buy();
  }
  // F: a smoke puff that breaks every line of sight for a few seconds.
  if (ctrl.actions & ACTION_SMOKE && state.smoke > 0 && thief.smokeLeft <= 0) {
    state.smoke -= 1;
    thief.smokeLeft = 4;
    sfx.coin();
  }
  // A click throws a coin: nearby guards walk over to investigate it.
  if (ctrl.click && state.coins > 0) {
    state.coins -= 1;
    distractGuards(state.guards, ctrl.click.x, ctrl.click.y);
    sfx.coin();
  }

  // Move; grabbing loot needs the thief to stand still and hold E.
  const moving = ctrl.move.x !== 0 || ctrl.move.y !== 0;
  moveThief(thief, ctrl.move, ctrl.sneak, dt, solids);
  let nearestLoot = null;
  for (const item of state.loot) {
    if (item.taken) continue;
    if (distanceTo(thief, item) < 46 && (nearestLoot === null || distanceTo(thief, item) < distanceTo(thief, nearestLoot))) nearestLoot = item;
  }
  if (nearestLoot !== null && ctrl.interact && !moving) {
    const need = nearestLoot.vault ? (state.lockpick ? THIEF.vaultTimeLockpick : THIEF.vaultTime) : THIEF.grabTime;
    thief.grabbing = nearestLoot;
    thief.grabProgress += dt / need;
    if (Math.floor(thief.grabProgress * 4) !== Math.floor((thief.grabProgress - dt / need) * 4)) sfx.vaultClick();
    if (thief.grabProgress >= 1) {
      nearestLoot.taken = true;
      state.score += nearestLoot.value;
      thief.grabbing = null;
      thief.grabProgress = 0;
      sfx.loot();
    }
  } else {
    thief.grabbing = null;
    thief.grabProgress = 0;
  }

  // Sight: shadows and smoke hide the thief; covers and walls block sight.
  const hidden = inShadow(thief, state.level.shadows) || thief.smokeLeft > 0;
  const seenByGuard = state.guards.map((guard) => guardSeesThief(guard, thief, solids, hidden));
  const anyGuard = seenByGuard.some(Boolean);
  const seenByCamera = state.cameras.some((camera) => cameraSeesThief(camera, thief, solids, hidden));
  stepGuards(state.guards, seenByGuard, thief, dt);
  stepCameras(state.cameras, dt);
  if (stepAlarm(state.alarm, anyGuard, seenByCamera, inShadow(thief, state.level.shadows), dt)) {
    state.status = 'caught';
    sfx.caught();
    return;
  }
  if (guardCaughtThief(state.guards, thief)) {
    state.alarm.value = 100;
    state.status = 'caught';
    sfx.caught();
    return;
  }

  // Exit opens once every required loot is taken.
  state.exitOpen = state.loot.every((item) => !item.required || item.taken);
  if (state.exitOpen) {
    const exit = state.level.exit;
    if (thief.x > exit.x - 10 && thief.x < exit.x + exit.w + 10 && thief.y > exit.y - 10 && thief.y < exit.y + exit.h + 10) {
      state.status = state.levelIndex >= LEVELS.length - 1 ? 'won' : 'levelDone';
      sfx.win();
    }
  }
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best haul then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, { newGame, stepGame });
  // Paint synchronously, twice, so a headless screenshot taken right after
  // load already sees the finished frame (requestAnimationFrame may not
  // have fired yet when the screenshot is taken).
  renderer.draw(scene.state, scene.screen, scene.best, performance.now());
  renderer.draw(scene.state, scene.screen, scene.best, performance.now());
  window.__shotReady = true;
}

/** Scripted rules check: move, see, hide, grab, win a level, get caught. */
function runSelfTest() {
  const results = [];
  function check(name, ok) {
    results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  }
  const idle = { move: { x: 0, y: 0 }, sneak: false, interact: false, click: null, actions: 0 };

  // 1. The thief moves.
  let state = newGame(0);
  const x0 = state.thief.x;
  stepGame(state, { ...idle, move: { x: 1, y: 0 } }, STEP * 60);
  check('thief-moves', state.thief.x > x0 + 50);

  // 2. A guard that sees the thief raises the alarm.
  state = newGame(0);
  const guard = state.guards[0];
  guard.x = 200;
  guard.y = 400;
  state.thief.x = 400;
  state.thief.y = 400;
  guard.angle = 0;
  guard.mode = 'investigate';
  guard.investigateX = 400;
  guard.investigateY = 400;
  guard.investigateLeft = 10;
  const alarm0 = state.alarm.value;
  for (let i = 0; i < 180; i += 1) stepGame(state, idle, STEP);
  check('guard-raises-alarm', state.alarm.value > alarm0 + 20 || state.status === 'caught');

  // 3. A shadow hides the thief from the same guard.
  state = newGame(0);
  const zone = state.level.shadows[0];
  state.thief.x = zone.x + zone.w / 2;
  state.thief.y = zone.y + zone.h / 2;
  const guard3 = state.guards[0];
  guard3.x = state.thief.x + 150;
  guard3.y = state.thief.y;
  guard3.angle = Math.PI;
  const solids3 = state.level.walls.concat(state.level.covers);
  check('shadow-hides-thief', guardSeesThief(guard3, state.thief, solids3, true) === false);
  check('guard-sees-thief-in-open', guardSeesThief(guard3, state.thief, solids3, false) === true);

  // 4. Holding E grabs loot and adds its value.
  state = newGame(0);
  const loot = state.loot[0];
  state.thief.x = loot.x;
  state.thief.y = loot.y + 20;
  const score0 = state.score;
  for (let i = 0; i < 90; i += 1) stepGame(state, { ...idle, interact: true }, STEP);
  check('loot-grabbed', loot.taken && state.score === score0 + loot.value);

  // 5. Taking the required loot and reaching the exit finishes the level.
  state = newGame(0);
  for (const item of state.loot) if (item.required) item.taken = true;
  state.exitOpen = true;
  state.thief.x = state.level.exit.x + state.level.exit.w / 2;
  state.thief.y = state.level.exit.y + state.level.exit.h / 2;
  stepGame(state, idle, STEP);
  check('exit-finishes-level', state.status === 'levelDone');

  // 6. Alarm 100 means caught.
  state = newGame(0);
  state.alarm.value = 99;
  const guard6 = state.guards[0];
  guard6.x = 200;
  guard6.y = 400;
  state.thief.x = 400;
  state.thief.y = 400;
  guard6.angle = 0;
  guard6.mode = 'investigate';
  guard6.investigateX = 400;
  guard6.investigateY = 400;
  guard6.investigateLeft = 10;
  for (let i = 0; i < 240; i += 1) {
    stepGame(state, idle, STEP);
    if (state.status === 'caught') break;
  }
  check('alarm-100-caught', state.status === 'caught');

  // 7. A thrown coin distracts a nearby guard.
  state = newGame(0);
  const guard7 = state.guards[0];
  state.coins = 3;
  stepGame(state, { ...idle, click: { x: guard7.x + 60, y: guard7.y } }, STEP);
  check('coin-distracts-guard', guard7.mode === 'investigate' && state.coins === 2);

  // 8. The vault opens with a held E (lockpick halves the time).
  const vaultState = newGame(1);
  const vault = vaultState.loot.find((item) => item.vault);
  vaultState.lockpick = true;
  vaultState.thief.x = vault.x;
  vaultState.thief.y = vault.y + 20;
  for (let i = 0; i < 90; i += 1) stepGame(vaultState, { ...idle, interact: true }, STEP);
  check('vault-opens-with-lockpick', vault.taken === true);

  const passed = results.filter((r) => r.startsWith('PASS')).length;
  const text = `SELFTEST ${passed}/${results.length} ${results.join(' | ')}`;
  document.title = text;
  const div = document.getElementById('selftest');
  if (div) div.textContent = text;
  window.__selftest = text;
  renderer.draw(newGame(0), SCREEN_TITLE, 0, performance.now());
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let state = newGame(0);
  let accumulator = 0;
  let last = performance.now();
  let stepSoundAt = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    state = newGame(0);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Playing. ${LEVELS[0].name}. ${LEVELS[0].objective}`);
  }

  function nextLevel() {
    const carry = { score: state.score, coins: state.coins, smoke: state.smoke, lockpick: state.lockpick };
    state = newGame(state.levelIndex + 1, carry);
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Level ${state.levelIndex + 1}. ${state.level.name}. ${state.level.objective}`);
  }

  function endRun() {
    if (state.score > best) {
      best = state.score;
      saveBest(best);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sfx.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && screen === SCREEN_PLAY) {
      const snap = state.snapshot;
      state = newGame(state.levelIndex, snap);
      announce('Level restarted.');
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_CAUGHT || screen === SCREEN_WIN)) startGame();
    else if (actions & ACTION_CONFIRM && screen === SCREEN_LEVEL) nextLevel();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    // Actions the world consumes this frame (buying tools, smoke).
    state.pendingActions = actions;
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    const clickPx = input.takeClick();
    const click = clickPx === null ? null : renderer.toField(clickPx.x, clickPx.y);
    const ctrl = {
      move: input.move(),
      sneak: input.sneak,
      interact: input.interact,
      click,
      actions: state.pendingActions ?? 0,
    };
    state.pendingActions = 0;
    const before = state.thief.x;
    stepGame(state, ctrl, STEP);
    if (state.thief.moving && Math.abs(state.thief.x - before) > 0.01) {
      const now = performance.now();
      if (now - stepSoundAt > 380) {
        stepSoundAt = now;
        sfx.step();
      }
    }
    sfx.alarmBeep(state.alarm.value, performance.now());
    if (state.status === 'caught') {
      endRun();
      screen = SCREEN_CAUGHT;
      announce(`Caught! Haul $${state.score}.`);
    } else if (state.status === 'levelDone') {
      screen = SCREEN_LEVEL;
      announce(`${state.level.name} clear. Haul $${state.score}.`);
    } else if (state.status === 'won') {
      endRun();
      screen = SCREEN_WIN;
      announce(`Getaway! Final haul $${state.score}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(state, screen, best, now);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });
  canvas.addEventListener('pointerdown', () => sfx.unlock());
  window.addEventListener('keydown', () => sfx.unlock(), { once: true });

  announce('The Velvet Vault. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (selftest) runSelfTest();
else if (shot) runShot(shot);
else runGame();
