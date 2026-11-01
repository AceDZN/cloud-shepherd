# Cloud Shepherd · רועה העננים

A 3D browser game in Hebrew for grades 8–9 (weather, grade 8 ch. 3; Israel's climate, grade 9 ch. 2).
You are **ענני**, a small cloud spirit flying over a miniature relief model of Israel. Soak up vapour over
the warm sea, ride the wind from the high (ג) to the low (ל), and climb the slopes until the air cools to
saturation. Then pour: rain on the coast, snow on Jerusalem and the Hermon, water for the Kinneret.
Nothing falls in the rain shadow.

## Play

```bash
npm install
npm run dev        # http://localhost:5241
```

- `npm run build` typechecks and builds to `dist/`; `npm run preview` serves it on port 4241.
- `?level=N` opens level N's intro directly, even when locked. The Workbook player uses this, and the game posts `ready`, `level-start` and `level-complete` to a Workbook parent frame (`src/host.ts`). Catalog entry and poster: [workbook/](workbook/LEVELS.md).
- Progress (best stars) is stored only in this browser's localStorage. There are no accounts, no network calls and no analytics.

### Controls

| | Keyboard | Touch |
|---|---|---|
| Steer across or along the wind (never against it) | arrows / WASD | drag on the map |
| Pour (only at 100 % relative humidity) | hold Space | hold the round button |
| Sideways puff (4 s cooldown) | Shift / E | נשיפה |
| Season dial (level 15) | Q / Tab | סובבו עונה |
| Plan: choose ל/ג, place on a white ring | 1 / 2, click | tap |
| Hint (costs a star) · pause · fast ×3 · restart · mute | H · P/Esc · F · R · M | top buttons |

## What's in it

- **18 authored levels in 4 worlds** ([LEVELS.md](LEVELS.md)):
  - the sea and the shore: H→L wind, saturation, the sea breeze, reading the pressure map
  - over the mountains: windward slopes, snow by altitude, the rain shadow, the Hermon, the windward side
  - Israel's rain map: north–south gradient, the arid line, khamsin, climographs, summer
  - the long winter: weather vs climate, filling the Kinneret, the final storm
- **Rule model** (`src/rules/`, pure TypeScript and deterministic): every number the player sees comes from here.
  - Wind is −K∇P from Gaussian ג/ל cells, so air flows from high to low (no Coriolis).
  - Capacity comes from a temperature table; relative humidity = water ÷ capacity.
  - Temperature falls 0.6 °C per 100 m (marked העשרה, enrichment).
  - The ground temperature decides snow (≤ 1 °C), rain mixed with snow (≤ 3 °C) or rain.
  - Air is lifted by slopes and lows, sinks under highs and down lee slopes, soaks over warm water, and dries in the khamsin and the desert south.
  - Water is conserved: absorbed = held + poured + returned to the air.
- **Relief:** NOAA ETOPO1, 1 arc-minute, lon 34–36° E, lat 29.4–33.5° N. The map is schematic, heights are exaggerated ×5 (stated in the HUD), and the model values are simplified.
- **Art:** Three.js with a tilt-shift miniature look, a sky shader and a water shader, with ground that greens or whitens where precipitation lands. Tripo models (the cloud's face, farmer, kids, jeep, lifeguard tower, boat, stone house, olive, cypress) are listed in [ASSETS.md](ASSETS.md). Sound is synthesized with WebAudio.

## Checks

```bash
npm test                      # 102 node:test tests: all 18 levels, wrong plans fail, rain/snow by height,
                              # H→L wind, rain shadow, water conservation, curriculum map
npx tsx scripts/tune.ts       # per-level table: solution, naive pilots, alternative plans
node scripts/shots.mjs        # real browser captures into tmp/shots (local only, git-ignored)
node scripts/playtest.mjs     # 125 browser checks against the dev server; captures in tmp/playtest
npm run build && npm run test:embed   # workbook bridge in a real iframe: ready → level-start → level-complete
```

## Docs

| File | Contents |
|---|---|
| [GAME_IDENTITY.md](GAME_IDENTITY.md) | first minute, controls, decision, state, failure, camera, art, sound |
| [CURRICULUM.md](CURRICULUM.md) | each level mapped to Workbook modules (snapshots in `docs/curriculum/`) |
| [LEVELS.md](LEVELS.md) | generated level table |
| [ASSETS.md](ASSETS.md) | models, sources, credits spent |
| [VISUAL_REVIEW.md](VISUAL_REVIEW.md) | real captures vs the design targets in `docs/visual-targets/` (AI-generated targets, not screenshots) |
| [PLAYTEST.md](PLAYTEST.md) | browser playtest notes |
| [progress.md](progress.md) | build log and open items |

Elevation data: NOAA National Centers for Environmental Information, ETOPO1 Global Relief Model (public domain).
