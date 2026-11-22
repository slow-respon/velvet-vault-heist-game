// The Velvet Vault — every tuning number and colour in one place.
// Top-down 2D heist game. The playfield is a fixed 1280x800 logical area;
// the renderer scales it to the window, so no rule depends on screen size.

export const FIELD = { width: 1280, height: 800 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

export const THIEF = {
  radius: 14,
  walkSpeed: 210,
  sneakSpeed: 110,
  /** Seconds of holding E to grab ordinary loot. */
  grabTime: 0.8,
  /** Seconds of holding E to crack the vault (1.2 with a lockpick). */
  vaultTime: 2.5,
  vaultTimeLockpick: 1.2,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 95,
  chaseSpeed: 185,
  investigateSpeed: 140,
  /** Vision range in the open; a sneaking thief is spotted much closer. */
  viewRange: 270,
  viewRangeSneak: 150,
  /** Half of the vision cone's opening angle, in radians. */
  viewHalfAngle: 0.61,
  /** How close a guard must get to catch the thief outright. */
  catchRange: 30,
  /** Seconds a guard keeps chasing the last seen spot after losing sight. */
  chaseMemory: 3.5,
};

export const CAMERA = {
  /** Vision range of a wall camera. */
  viewRange: 310,
  viewHalfAngle: 0.5,
  /** Sweep speed, radians per second. */
  sweepSpeed: 0.55,
};

export const ALARM = {
  max: 100,
  /** Points per second while a guard has the thief in sight (after the grace). */
  guardRate: 55,
  /** Points per second while a camera has the thief in sight. */
  cameraRate: 26,
  /** Seconds of being seen before the meter starts climbing ("TERLIHAT!" warning). */
  grace: 0.45,
  /** Points per second the meter falls while unseen. */
  decay: 7,
  /** Extra decay while the thief hides in a shadow zone. */
  shadowDecayBonus: 6,
  /** A guard starts chasing once the meter passes this. */
  chaseThreshold: 25,
};

export const TOOLS = {
  coin: { price: 50, start: 3, max: 6 },
  smoke: { price: 80, start: 2, max: 4 },
  lockpick: { price: 120, start: 0, max: 1 },
};

export const PALETTE = {
  backdrop: '#0b0a12',
  floor: '#232030',
  floorAlt: '#292636',
  carpet: '#6e1423',
  carpetEdge: '#8e1f30',
  wall: '#3a3348',
  wallTop: '#4a4260',
  shadow: '#100e1a',
  shadowEdge: '#241f38',
  caseGlass: '#3d5a73',
  caseFrame: '#8a6d3b',
  rope: '#a31621',
  ropePost: '#c9a227',
  guardCone: 'rgba(242, 201, 76, 0.20)',
  guardConeEdge: 'rgba(242, 201, 76, 0.55)',
  cameraCone: 'rgba(229, 83, 75, 0.20)',
  cameraConeEdge: 'rgba(229, 83, 75, 0.6)',
  thief: '#2b2f3a',
  thiefHood: '#7b2d8b',
  guard: '#2e4a6b',
  guardHat: '#1d3247',
  camera: '#c0392b',
  loot: '#f2c94c',
  lootRequired: '#ffd94d',
  exit: '#3fbf7f',
  exitGlow: 'rgba(63, 191, 127, 0.35)',
  smoke: 'rgba(180, 180, 200, 0.55)',
  panel: '#1a1826',
  text: '#eef1f5',
  muted: '#9a93ad',
  alarmLow: '#3fbf7f',
  alarmMid: '#f2c94c',
  alarmHigh: '#e5534b',
  coin: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best haul is kept between visits (this browser only). */
export const BEST_KEY = 'velvet-vault.best';
