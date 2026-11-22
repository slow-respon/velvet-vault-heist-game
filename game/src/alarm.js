// The Velvet Vault — the alarm meter, 0 to 100. Being seen raises it (after
// a short "TERLIHAT!" grace so the player can break line of sight); hiding
// lets it fall, faster inside a shadow zone. At 100 the thief is caught.

import { ALARM } from './config.js';

export function createAlarm() {
  return { value: 0, seenByGuard: false, seenByCamera: false, graceLeft: 0, spotted: false };
}

/**
 * Advance the meter one step. `seenGuard` / `seenCamera` say whether anyone
 * has the thief in sight this frame; `hidden` says the thief is in shadow.
 * Returns true the moment the meter hits 100.
 */
export function stepAlarm(alarm, seenGuard, seenCamera, hidden, dt) {
  alarm.seenByGuard = seenGuard;
  alarm.seenByCamera = seenCamera;
  alarm.spotted = seenGuard || seenCamera;
  if (alarm.spotted) {
    if (alarm.graceLeft <= 0) alarm.graceLeft = ALARM.grace;
    alarm.graceLeft -= dt;
    if (alarm.graceLeft <= 0) {
      alarm.value += (seenGuard ? ALARM.guardRate : 0) * dt;
      alarm.value += (seenCamera ? ALARM.cameraRate : 0) * dt;
    }
  } else {
    alarm.graceLeft = 0;
    const decay = ALARM.decay + (hidden ? ALARM.shadowDecayBonus : 0);
    alarm.value = Math.max(0, alarm.value - decay * dt);
  }
  if (alarm.value >= ALARM.max) {
    alarm.value = ALARM.max;
    return true;
  }
  return false;
}

/** Colour of the meter at its current value: green, amber, then red. */
export function alarmColor(value) {
  if (value < 40) return '#3fbf7f';
  if (value < 70) return '#f2c94c';
  return '#e5534b';
}
