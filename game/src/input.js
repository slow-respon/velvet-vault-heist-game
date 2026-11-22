// The Velvet Vault — keyboard and mouse input. Held keys give a movement
// direction (WASD or arrows, Shift to sneak); one-shot presses (confirm,
// pause, restart, mute, tools, smoke) are queued as bit flags and taken once
// by the loop, so a press between two frames is never lost or counted twice.
// A mouse click on the floor throws a coin there to distract nearby guards.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;
export const ACTION_SMOKE = 16;
export const ACTION_BUY_COIN = 32;
export const ACTION_BUY_SMOKE = 64;
export const ACTION_BUY_LOCKPICK = 128;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sneak = false;
  let interact = false;
  let actions = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = true;
    else if (event.code === 'KeyE') interact = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyR') {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (event.code === 'KeyF') {
      if (!event.repeat) actions |= ACTION_SMOKE;
    } else if (event.code === 'Digit1') {
      if (!event.repeat) actions |= ACTION_BUY_COIN;
    } else if (event.code === 'Digit2') {
      if (!event.repeat) actions |= ACTION_BUY_SMOKE;
    } else if (event.code === 'Digit3') {
      if (!event.repeat) actions |= ACTION_BUY_LOCKPICK;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = false;
    else if (event.code === 'KeyE') interact = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = down = left = right = sneak = interact = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    click = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });

  return {
    /** Normalised movement direction, {x, y}. */
    move() {
      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const y = (down ? 1 : 0) - (up ? 1 : 0);
      if (x === 0 && y === 0) return { x: 0, y: 0 };
      const len = Math.hypot(x, y);
      return { x: x / len, y: y / len };
    },
    get sneak() {
      return sneak;
    },
    get interact() {
      return interact;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The last click in canvas pixels since the last call, or null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}
