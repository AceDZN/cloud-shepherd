Original prompt: build Cloud Shepherd (רועה העננים), a 3D weather/Israel-climate flying game, 18 levels (handoff: /Users/acedzn/idea-plotter/handoffs/geography-2026-10-31/cloud-shepherd/BUILD_HANDOFF.md).

## History

- 2026-10-31: the build was briefly paused by the planning lead (possible overlap with Windshift Riders). The user chose **"Resume the build"**, and the original handoff applies again.
- Rule model and the 18 levels were tuned first (`scripts/tune.ts`). Then the art helper made the visual targets and Tripo models, and the QA helper wrote the curriculum map and 102 tests. After that the 3D game, the browser captures, and finally the visual review and playtest.

## State

- **Playable:** title, level select, intro, plan (ג/ל tokens, hour), flight, result, replay, for all 18 levels. Dev server on `http://localhost:5241`.
- **Rules** (`src/rules/`), pure and deterministic:
  - `atmosphere.ts`: capacity, lapse rate, precipitation type, pressure and wind, sea breeze.
  - `sim.ts`: the cloud step, targets, wadis, storms, the season dial, stars.
  - `levels.ts`: the 18 levels.
  - `autopilot.ts`: scripted pilots for tests and captures.
- **Model change after QA:** the rain-shadow loophole is closed. On a lee slope, sinking air follows the ground faster and loses the low's extra lift. Its drops evaporate, so a pour there gives `sinking` feedback and no rain.
- **Scene** (`src/scene/`):
  - `terrain.ts`: ETOPO1 diorama, water shader, greening and snow.
  - `cloud.ts`: Tripo face core and puffs.
  - `fx.ts`: rain, snow, mist, streaks, arrows, lightning.
  - `props.ts`: targets, characters, coins, slots, wadis, haze, rainbow.
  - `assets.ts`: GLB loader with procedural fallbacks.
  - `world.ts`: renderer, sky, tilt-shift, mood.
- **Game** (`src/game/`): `game.ts` (states, HUD, plan, camera, input, test hooks), `explain.ts` (Hebrew cause and feedback lines), `audio.ts`, `progress.ts`.
- **Test hooks:** `window.render_game_to_text()`, `window.advanceTime(ms)`, `__game.quickStart(id, plan)` and `__game.pilot`, used by `scripts/shots.mjs`.

## Checks (latest)

- `npm test`: 102/102 pass.
- `npx tsc --noEmit`: clean.
- Real browser captures (16 scenes, no console errors) are kept locally in `tmp/shots/` (git-ignored; screenshots are never committed).
- Level 1 acceptance: the cloud soaks to 95 %, climbs the Carmel, hits 100 % at about 9 s, pours, and wins at about 12 s.
- Level 2 acceptance: pouring at 90 % delivers 0 mm and shows one line: "הלחות היחסית רק 90%…".

## Open items / limits

- Solver-generated seasons after level 18 (optional in the handoff) are not built.
- Ambience is synthesized only; there is no recorded audio.
- The ground greening is a vertex-colour paint, not a growth animation of plants.
- On low-end GPUs the 136k-vertex diorama with shadows may run slowly; there is no quality toggle yet.
