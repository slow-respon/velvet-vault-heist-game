// The Velvet Vault — drawing only: the world's state and the current screen
// in, pixels out. The 1280x800 playfield is scaled to fit the window and
// centred, the margin filled with the backdrop colour. Flat shapes, canvas
// text for the HUD and the panels. Text that holds a number is rebuilt only
// when the number changes, so a frame allocates nothing.

import { FIELD, FONT, PALETTE } from './config.js';
import { alarmColor } from './alarm.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL = 'level';
export const SCREEN_WIN = 'win';

const PANEL = { width: 640, top: 150, line: 34, bottom: 76 };
const TILE = 80;

function cachedLabel(prefix) {
  let value = null;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Loot $');
  const timerLabel = cachedLabel('');
  const alarmLabel = cachedLabel('ALARM ');
  const finalLabel = cachedLabel('Haul $');
  const bestLabel = cachedLabel('Best $');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Convert canvas pixels (a mouse click) to playfield coordinates. */
  function toField(px, py) {
    return { x: (px * (window.devicePixelRatio || 1) - view.x) / view.scale, y: (py * (window.devicePixelRatio || 1) - view.y) / view.scale };
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function cone(x, y, angle, halfAngle, range, fill, edge) {
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = edge;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
    context.moveTo(x, y);
    context.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
    context.stroke();
  }

  function drawFloor(state) {
    const level = state.level;
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    for (let ty = 0; ty < FIELD.height / TILE; ty += 1) {
      for (let tx = 0; tx < FIELD.width / TILE; tx += 1) {
        if ((tx + ty) % 2 === 0) {
          context.fillStyle = PALETTE.floorAlt;
          context.fillRect(tx * TILE, ty * TILE, TILE, TILE);
        }
      }
    }
    // Red carpet down the middle of the room.
    context.fillStyle = PALETTE.carpet;
    context.fillRect(FIELD.width / 2 - 70, 24, 140, FIELD.height - 48);
    context.fillStyle = PALETTE.carpetEdge;
    context.fillRect(FIELD.width / 2 - 74, 24, 4, FIELD.height - 48);
    context.fillRect(FIELD.width / 2 + 70, 24, 4, FIELD.height - 48);

    // Shadow zones: dark corners where the thief is safe.
    for (const zone of level.shadows) {
      context.fillStyle = PALETTE.shadow;
      context.fillRect(zone.x, zone.y, zone.w, zone.h);
      context.strokeStyle = PALETTE.shadowEdge;
      context.lineWidth = 2;
      context.strokeRect(zone.x, zone.y, zone.w, zone.h);
    }

    // Walls.
    for (const w of level.walls) {
      context.fillStyle = PALETTE.wall;
      context.fillRect(w.x, w.y, w.w, w.h);
      context.fillStyle = PALETTE.wallTop;
      context.fillRect(w.x, w.y, w.w, 4);
    }

    // Covers: display cases, pillars, the vault, vents.
    for (const cover of level.covers) {
      if (cover.kind === 'vault') {
        context.fillStyle = '#2c2f3a';
        context.fillRect(cover.x, cover.y, cover.w, cover.h);
        context.strokeStyle = PALETTE.loot;
        context.lineWidth = 3;
        context.strokeRect(cover.x + 4, cover.y + 4, cover.w - 8, cover.h - 8);
        context.fillStyle = PALETTE.loot;
        context.beginPath();
        context.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, 14, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#2c2f3a';
        context.beginPath();
        context.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, 7, 0, Math.PI * 2);
        context.fill();
      } else if (cover.kind === 'pillar') {
        context.fillStyle = PALETTE.wallTop;
        context.beginPath();
        context.arc(cover.x + cover.w / 2, cover.y + cover.h / 2, cover.w / 2, 0, Math.PI * 2);
        context.fill();
      } else if (cover.kind === 'vent') {
        context.fillStyle = '#1c2733';
        context.fillRect(cover.x, cover.y, cover.w, cover.h);
        context.strokeStyle = '#4a6a86';
        context.lineWidth = 2;
        for (let i = 1; i < 4; i += 1) {
          context.beginPath();
          context.moveTo(cover.x + 8, cover.y + (cover.h / 4) * i);
          context.lineTo(cover.x + cover.w - 8, cover.y + (cover.h / 4) * i);
          context.stroke();
        }
      } else {
        context.fillStyle = PALETTE.caseFrame;
        context.fillRect(cover.x - 4, cover.y - 4, cover.w + 8, cover.h + 8);
        context.fillStyle = PALETTE.caseGlass;
        context.fillRect(cover.x, cover.y, cover.w, cover.h);
        context.strokeStyle = 'rgba(255,255,255,0.25)';
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(cover.x + 8, cover.y + cover.h - 8);
        context.lineTo(cover.x + cover.w - 8, cover.y + 8);
        context.stroke();
      }
    }

    // Velvet rope in front of each painting loot.
    for (const item of state.loot) {
      if (item.taken || item.kind !== 'painting') continue;
      context.strokeStyle = PALETTE.rope;
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(item.x - 46, item.y + 34);
      context.quadraticCurveTo(item.x, item.y + 48, item.x + 46, item.y + 34);
      context.stroke();
      context.fillStyle = PALETTE.ropePost;
      context.fillRect(item.x - 50, item.y + 26, 6, 16);
      context.fillRect(item.x + 44, item.y + 26, 6, 16);
    }

    // Exit door: green, glowing once every required loot is taken.
    const exit = level.exit;
    if (state.exitOpen) {
      context.fillStyle = PALETTE.exitGlow;
      context.fillRect(exit.x - 14, exit.y - 14, exit.w + 28, exit.h + 28);
    }
    context.fillStyle = state.exitOpen ? PALETTE.exit : '#2c5a41';
    context.fillRect(exit.x, exit.y, exit.w, exit.h);
    text('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 6, 18, '#eef1f5', 'center');
  }

  function drawLoot(state, now) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const pulse = 0.6 + 0.4 * Math.sin(now / 300 + item.x);
      context.save();
      context.translate(item.x, item.y);
      if (item.kind === 'painting') {
        context.fillStyle = '#8a6d3b';
        context.fillRect(-26, -20, 52, 40);
        context.fillStyle = item.required ? '#7b2d8b' : '#3d5a73';
        context.fillRect(-21, -15, 42, 30);
        context.fillStyle = 'rgba(255,255,255,0.35)';
        context.fillRect(-21, -15, 42, 8);
      } else if (item.kind === 'gem') {
        context.fillStyle = PALETTE.loot;
        context.beginPath();
        context.moveTo(0, -16);
        context.lineTo(14, 0);
        context.lineTo(0, 16);
        context.lineTo(-14, 0);
        context.closePath();
        context.fill();
      } else if (item.kind === 'vault') {
        // The vault loot glints above the safe itself.
        context.fillStyle = `rgba(242, 201, 76, ${pulse})`;
        context.beginPath();
        context.arc(0, -58, 10, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillStyle = PALETTE.loot;
        context.fillRect(-12, -8, 24, 16);
        context.fillStyle = '#b8860b';
        context.fillRect(-12, -8, 24, 4);
      }
      if (item.required) {
        context.fillStyle = `rgba(255, 217, 77, ${pulse})`;
        context.font = '20px sans-serif';
        context.textAlign = 'center';
        context.fillText('★', 20, -16);
      }
      context.restore();
    }
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      cone(guard.x, guard.y, guard.angle, 0.61, 270, PALETTE.guardCone, PALETTE.guardConeEdge);
    }
    for (const guard of state.guards) {
      context.fillStyle = guard.mode === 'chase' ? '#e5534b' : PALETTE.guard;
      context.beginPath();
      context.arc(guard.x, guard.y, 15, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = PALETTE.guardHat;
      context.fillRect(guard.x - 13, guard.y - 20, 26, 8);
      context.fillStyle = '#eef1f5';
      context.beginPath();
      context.arc(guard.x + Math.cos(guard.angle) * 8, guard.y + Math.sin(guard.angle) * 8, 3, 0, Math.PI * 2);
      context.fill();
      if (guard.mode === 'chase') {
        text('!', guard.x, guard.y - 28, 22, '#e5534b', 'center');
      }
    }
  }

  function drawCameras(state) {
    for (const camera of state.cameras) {
      cone(camera.x, camera.y, camera.angle, 0.5, 310, PALETTE.cameraCone, PALETTE.cameraConeEdge);
      context.fillStyle = PALETTE.camera;
      context.beginPath();
      context.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#eef1f5';
      context.beginPath();
      context.arc(camera.x + Math.cos(camera.angle) * 6, camera.y + Math.sin(camera.angle) * 6, 3, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawThief(state) {
    const thief = state.thief;
    if (thief.smokeLeft > 0) {
      context.fillStyle = PALETTE.smoke;
      context.beginPath();
      context.arc(thief.x, thief.y, 46, 0, Math.PI * 2);
      context.fill();
    }
    context.save();
    context.translate(thief.x, thief.y);
    if (thief.sneaking) context.globalAlpha = 0.75;
    context.fillStyle = PALETTE.thiefHood;
    context.beginPath();
    context.moveTo(0, -18);
    context.lineTo(13, 8);
    context.lineTo(-13, 8);
    context.closePath();
    context.fill();
    context.fillStyle = PALETTE.thief;
    context.beginPath();
    context.arc(0, 2, 12, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#eef1f5';
    context.beginPath();
    context.arc(Math.cos(Math.atan2(thief.dirY, thief.dirX)) * 5, Math.sin(Math.atan2(thief.dirY, thief.dirX)) * 5, 3, 0, Math.PI * 2);
    context.fill();
    context.restore();
    // Hold-E progress ring over the loot being grabbed.
    if (thief.grabbing) {
      const p = thief.grabProgress;
      context.strokeStyle = PALETTE.loot;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(thief.grabbing.x, thief.grabbing.y, 26, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      context.stroke();
    }
  }

  function drawHud(state, now) {
    const alarm = state.alarm.value;
    context.fillStyle = 'rgba(11, 10, 18, 0.85)';
    context.fillRect(0, 0, FIELD.width, 64);
    context.textBaseline = 'top';
    text('ALARM', 24, 14, 24, alarmColor(alarm), 'left');
    context.fillStyle = '#2a2636';
    context.fillRect(130, 16, 300, 26);
    context.fillStyle = alarmColor(alarm);
    context.fillRect(130, 16, Math.max(4, 300 * (alarm / 100)), 26);
    context.strokeStyle = '#4a4260';
    context.lineWidth = 2;
    context.strokeRect(130, 16, 300, 26);
    text(alarmLabel(Math.round(alarm)), 440, 14, 24, alarmColor(alarm), 'left');
    if (state.alarm.spotted && alarm < 100) {
      const blink = Math.floor(now / 200) % 2 === 0;
      if (blink) text('TERLIHAT!', 500, 16, 24, '#e5534b', 'left');
    }
    text(scoreLabel(state.score), 640, 14, 24, PALETTE.loot, 'left');
    text(`Koin ${state.coins}  Asap ${state.smoke}  Lockpick ${state.lockpick ? '✓' : '—'}`, 640, 40, 15, PALETTE.muted, 'left');
    text(state.level.name, FIELD.width - 24, 12, 22, PALETTE.text, 'right');
    text(timerLabel(fmtTime(state.elapsed)), FIELD.width - 24, 38, 15, PALETTE.muted, 'right');
    context.textBaseline = 'alphabetic';
    context.fillStyle = 'rgba(11, 10, 18, 0.85)';
    context.fillRect(0, FIELD.height - 30, FIELD.width, 30);
    text(state.level.objective, 24, FIELD.height - 9, 16, PALETTE.muted, 'left');
    const requiredLeft = state.loot.filter((item) => item.required && !item.taken).length;
    text(requiredLeft === 0 ? 'Semua loot wajib didapat — ke EXIT!' : `Loot wajib tersisa: ${requiredLeft} ★`, FIELD.width - 24, FIELD.height - 9, 16, requiredLeft === 0 ? PALETTE.exit : PALETTE.text, 'right');
  }

  function fmtTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(11, 10, 18, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = PALETTE.loot;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.coin, 'center');
  }

  function drawField(state, now) {
    drawFloor(state);
    drawLoot(state, now);
    drawGuards(state);
    drawCameras(state);
    drawThief(state);
  }

  /** Paint one frame: the field, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best, now) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawField(state, now);
    if (screen === SCREEN_TITLE) {
      drawPanel(
        'THE VELVET VAULT',
        [
          'Wren si pencuri membobol museum di tengah malam.',
          'Ambil loot bertanda ★, hindari cone kuning guard',
          'dan cone merah kamera. Alarm 100% = tertangkap!',
          'WASD/panah gerak · Shift menyelinap · E ambil loot',
          'Klik lempar koin · F asap · 1/2/3 beli tools · M mute',
          bestLabel(best),
        ],
        'Tekan Spasi atau klik untuk mulai',
      );
      return;
    }
    drawHud(state, now);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Para guard ikut menunggu.'], 'Tekan P untuk lanjut');
    } else if (screen === SCREEN_CAUGHT) {
      drawPanel('TERTANGKAP!', [`Alarm mencapai 100%. Haul $ ${state.score}.`, bestLabel(best)], 'Tekan Spasi untuk coba lagi');
    } else if (screen === SCREEN_LEVEL) {
      drawPanel(`${state.level.name} — BERSIH!`, [`Haul sejauh ini $ ${state.score}.`, 'Ruangan berikutnya lebih dijaga.'], 'Tekan Spasi untuk lanjut');
    } else if (screen === SCREEN_WIN) {
      drawPanel('KABUR DENGAN SEMPURNA!', [`Haul akhir $ ${state.score}.`, finalLabel(state.score), bestLabel(best)], 'Tekan Spasi untuk main lagi');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toField };
}
