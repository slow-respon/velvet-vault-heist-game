// The Velvet Vault — the three rooms of the heist. Each level is pure data:
// walls (solid, block movement and sight), covers (display cases and pillars,
// block sight and movement), shadow zones (safe dark corners), loot, guards,
// cameras, the thief's start and the exit door. Coordinates are in the 1280x800 field.

function wall(x, y, w, h) {
  return { x, y, w, h };
}

export const LEVELS = [
  {
    name: 'Galeri Lukisan',
    objective: 'Ambil 2 lukisan bertanda bintang, lalu kabur lewat pintu timur.',
    start: { x: 90, y: 700 },
    exit: { x: 1160, y: 60, w: 84, h: 40 },
    walls: [
      wall(0, 0, 1280, 24), wall(0, 776, 1280, 24),
      wall(0, 0, 24, 800), wall(1256, 0, 24, 800),
      wall(420, 0, 26, 240), wall(420, 420, 26, 356),
      wall(820, 180, 26, 596),
    ],
    covers: [
      { x: 180, y: 180, w: 130, h: 60, kind: 'case' },
      { x: 560, y: 520, w: 130, h: 60, kind: 'case' },
      { x: 980, y: 560, w: 130, h: 60, kind: 'case' },
      { x: 600, y: 120, w: 54, h: 54, kind: 'pillar' },
      { x: 1020, y: 240, w: 54, h: 54, kind: 'pillar' },
    ],
    shadows: [
      { x: 40, y: 300, w: 150, h: 110 },
      { x: 470, y: 640, w: 160, h: 110 },
      { x: 900, y: 90, w: 150, h: 90 },
    ],
    loot: [
      { id: 'lukisan-senja', label: 'Lukisan Senja', x: 640, y: 220, value: 400, required: true, kind: 'painting' },
      { id: 'lukisan-badak', label: 'Lukisan Badak', x: 250, y: 620, value: 300, required: true, kind: 'painting' },
      { id: 'permata-biru', label: 'Permata Biru', x: 1080, y: 420, value: 250, required: false, kind: 'gem' },
      { id: 'koin-emas', label: 'Koin Emas', x: 940, y: 700, value: 120, required: false, kind: 'gold' },
    ],
    guards: [
      { waypoints: [{ x: 300, y: 120 }, { x: 300, y: 700 }, { x: 760, y: 700 }, { x: 760, y: 120 }], pause: 1.2 },
      { waypoints: [{ x: 1120, y: 200 }, { x: 920, y: 200 }, { x: 920, y: 640 }, { x: 1120, y: 640 }], pause: 0.8 },
    ],
    cameras: [
      { x: 446, y: 300, baseAngle: 0, sweep: 0.9 },
      { x: 820, y: 776, baseAngle: -Math.PI / 2, sweep: 0.7 },
    ],
  },
  {
    name: 'Aula Vault',
    objective: 'Buka brankas velvet (tahan E), ambil Berlian Velvet, lalu ke pintu utara.',
    start: { x: 90, y: 700 },
    exit: { x: 600, y: 24, w: 84, h: 40 },
    walls: [
      wall(0, 0, 1280, 24), wall(0, 776, 1280, 24),
      wall(0, 0, 24, 800), wall(1256, 0, 24, 800),
      wall(300, 300, 26, 476), wall(980, 0, 26, 476),
      wall(520, 0, 26, 200), wall(740, 0, 26, 200),
    ],
    covers: [
      { x: 560, y: 330, w: 160, h: 90, kind: 'vault' },
      { x: 120, y: 120, w: 130, h: 60, kind: 'case' },
      { x: 1030, y: 620, w: 130, h: 60, kind: 'case' },
      { x: 420, y: 560, w: 54, h: 54, kind: 'pillar' },
      { x: 860, y: 560, w: 54, h: 54, kind: 'pillar' },
    ],
    shadows: [
      { x: 40, y: 420, w: 150, h: 110 },
      { x: 1090, y: 90, w: 150, h: 100 },
      { x: 560, y: 620, w: 160, h: 110 },
    ],
    loot: [
      { id: 'berlian-velvet', label: 'Berlian Velvet', x: 640, y: 300, value: 900, required: true, kind: 'vault', vault: true },
      { id: 'emas-batangan', label: 'Emas Batangan', x: 180, y: 420, value: 350, required: false, kind: 'gold' },
      { id: 'jam-saku', label: 'Jam Saku Emas', x: 1150, y: 200, value: 280, required: false, kind: 'gem' },
      { id: 'lukisan-kecil', label: 'Lukisan Kecil', x: 1120, y: 700, value: 220, required: true, kind: 'painting' },
    ],
    guards: [
      { waypoints: [{ x: 180, y: 640 }, { x: 180, y: 120 }, { x: 480, y: 120 }, { x: 480, y: 640 }], pause: 1.0 },
      { waypoints: [{ x: 880, y: 640 }, { x: 880, y: 120 }, { x: 1180, y: 120 }, { x: 1180, y: 640 }], pause: 1.0 },
      { waypoints: [{ x: 640, y: 520 }, { x: 380, y: 520 }, { x: 380, y: 240 }, { x: 900, y: 240 }, { x: 900, y: 520 }], pause: 0.6 },
    ],
    cameras: [
      { x: 640, y: 24, baseAngle: Math.PI / 2, sweep: 0.8 },
      { x: 300, y: 776, baseAngle: -Math.PI / 2, sweep: 0.7 },
      { x: 1006, y: 776, baseAngle: -Math.PI / 2, sweep: 0.7 },
    ],
  },
  {
    name: 'Atap — Jalan Kabur',
    objective: 'Ambil Mahkota Rubi, hindari sorot lampu atap, kabur ke van di pintu selatan.',
    start: { x: 640, y: 90 },
    exit: { x: 600, y: 716, w: 84, h: 40 },
    walls: [
      wall(0, 0, 1280, 24), wall(0, 776, 1280, 24),
      wall(0, 0, 24, 800), wall(1256, 0, 24, 800),
      wall(240, 200, 26, 380), wall(1014, 200, 26, 380),
      wall(520, 420, 240, 26),
    ],
    covers: [
      { x: 120, y: 300, w: 90, h: 70, kind: 'vent' },
      { x: 1070, y: 300, w: 90, h: 70, kind: 'vent' },
      { x: 600, y: 560, w: 80, h: 60, kind: 'vent' },
      { x: 380, y: 120, w: 54, h: 54, kind: 'pillar' },
      { x: 850, y: 120, w: 54, h: 54, kind: 'pillar' },
    ],
    shadows: [
      { x: 40, y: 120, w: 150, h: 110 },
      { x: 1090, y: 620, w: 150, h: 110 },
      { x: 300, y: 640, w: 160, h: 100 },
    ],
    loot: [
      { id: 'mahkota-rubi', label: 'Mahkota Rubi', x: 640, y: 330, value: 1200, required: true, kind: 'gem' },
      { id: 'emas-1', label: 'Emas Batangan', x: 140, y: 620, value: 350, required: false, kind: 'gold' },
      { id: 'emas-2', label: 'Emas Batangan', x: 1140, y: 620, value: 350, required: false, kind: 'gold' },
      { id: 'lukisan-atap', label: 'Lukisan Atap', x: 640, y: 640, value: 300, required: true, kind: 'painting' },
    ],
    guards: [
      { waypoints: [{ x: 120, y: 120 }, { x: 1160, y: 120 }, { x: 1160, y: 420 }, { x: 120, y: 420 }], pause: 0.9 },
      { waypoints: [{ x: 400, y: 700 }, { x: 880, y: 700 }, { x: 880, y: 480 }, { x: 400, y: 480 }], pause: 0.9 },
      { waypoints: [{ x: 640, y: 200 }, { x: 300, y: 200 }, { x: 300, y: 560 }, { x: 980, y: 560 }, { x: 980, y: 200 }], pause: 0.7 },
    ],
    cameras: [
      { x: 24, y: 400, baseAngle: 0, sweep: 0.9 },
      { x: 1256, y: 400, baseAngle: Math.PI, sweep: 0.9 },
      { x: 640, y: 776, baseAngle: -Math.PI / 2, sweep: 0.6 },
    ],
  },
];
