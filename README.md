# The Velvet Vault — a quiet heist game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/slow-respon/velvet-vault-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/slow-respon/velvet-vault-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**The Velvet Vault** is an original top-down 2D stealth heist game, built for the
[make.fun bounty "Make the best heist game"](https://make.fun/bounty/best-heist-game-20261122-0559).
You are Wren, a thief slipping through a museum at night. Three rooms stand between
you and the getaway van: the Painting Gallery, the Vault Hall, and the Rooftop.

## How to play

- **Goal per room:** steal every loot marked ★, then reach the green EXIT door.
- **Lose:** the alarm meter hits 100% — you are caught.
- **Move:** WASD / arrow keys. **Shift** sneaks (slower, harder to spot).
- **E** (hold): grab loot / crack the vault. **Click:** throw a coin to distract
  nearby guards. **F:** smoke puff that breaks every line of sight.
- **1 / 2 / 3:** buy coins, smoke, or a lockpick with your haul. **M:** mute.
  **R:** restart the room. **P:** pause.

Guards patrol with sweeping yellow vision cones and chase the last place they
saw you; wall cameras sweep red cones. Hide in the dark shadow zones to let the
alarm fall again. All art is drawn in code and all sound is synthesised with
WebAudio — no external assets, no network requests.

## Play it

Serve the `game/` folder with any static server and open `index.html` in a
desktop browser:

```sh
python3 -m http.server 8123 --directory game
# open http://localhost:8123/index.html
```

Screenshot scenes are deterministic via `?shot=cover`, `?shot=alarm`,
`?shot=win`, or `?shot=title`. A scripted rules check runs with `?selftest=1`
and writes its result to the page title.

## Layout

- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to the output
  and writes `dossier.json` with `buildDossier`.
- `game/src/` — one clear job per file: `config.js` (tuning), `levels.js`
  (the three rooms), `thief.js`, `guards.js`, `cameras.js`, `alarm.js`,
  `input.js`, `render.js`, `audio.js`, `shots.js`, `main.js` (boot + loop).
- `screenshots/` — four real renders of the game's own code, 1280×800.
- `vendor/makefun-game.ts` — copied unchanged from the make.fun kit.

MIT licensed. Built with the make.fun bounty in mind — good luck, and stay quiet.
