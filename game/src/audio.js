// The Velvet Vault — all sound is synthesised with WebAudio: footsteps,
// the loot chime, the alarm beep (faster as the meter climbs), the vault
// clicks and the getaway jingle. No audio files, no network.

export function createAudio() {
  let context = null;
  let muted = false;
  let lastBeep = 0;

  function ensure() {
    if (context === null) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        context = new Ctor();
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(freq, dur, type, gainValue, when = 0) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(gainValue, ctx.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    step() {
      tone(180, 0.05, 'sine', 0.04);
    },
    coin() {
      tone(1320, 0.12, 'sine', 0.08);
      tone(1760, 0.18, 'sine', 0.08, 0.09);
    },
    loot() {
      tone(880, 0.12, 'triangle', 0.1);
      tone(1174, 0.12, 'triangle', 0.1, 0.08);
      tone(1568, 0.22, 'triangle', 0.1, 0.16);
    },
    vaultClick() {
      tone(2400, 0.04, 'square', 0.05);
    },
    buy() {
      tone(660, 0.1, 'triangle', 0.08);
      tone(990, 0.16, 'triangle', 0.08, 0.07);
    },
    deny() {
      tone(160, 0.16, 'square', 0.06);
    },
    caught() {
      tone(220, 0.3, 'sawtooth', 0.1);
      tone(165, 0.4, 'sawtooth', 0.1, 0.22);
    },
    win() {
      [523, 659, 784, 1046].forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.1, i * 0.11));
    },
    /** The alarm beep, called every frame: interval shrinks as the meter climbs. */
    alarmBeep(value, now) {
      if (value < 15 || muted) return;
      const interval = value < 40 ? 0.9 : value < 70 ? 0.55 : 0.3;
      if (now - lastBeep >= interval * 1000) {
        lastBeep = now;
        tone(value < 70 ? 980 : 1240, 0.09, 'square', 0.05);
      }
    },
  };
}
