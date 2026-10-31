Original prompt: build Cloud Shepherd (רועה העננים), a 3D weather/Israel-climate flying game, 18 levels (handoff: /Users/acedzn/idea-plotter/handoffs/geography-2026-10-31/cloud-shepherd/BUILD_HANDOFF.md).

## Status: PAUSED by the lead (2026-10-31)

The planning lead paused this build: its core mechanics duplicate Windshift Riders (`~/dev/AceDZN-exp/windshift-riders`, a 3D weather flight game over Israel's relief), and the user doesn't allow duplicate mechanics across games. Nothing was pushed. No dev server was running.

## State at pause

- Scaffold: Vite 8 + TS + Three.js 0.186, ports 5241/4241 (strict). No renderer/UI yet.
- Pure rule model in `src/rules/`: ETOPO1 relief of Israel (`demData.ts`, built by `scripts/build-dem.mjs`), geo/places, atmosphere (capacity table, 0.6 °C/100 m, rain/slush/snow by ground temperature, wind = −K∇P from ג/ל cells, sea breeze), deterministic cloud sim (`sim.ts`), scripted pilots (`autopilot.ts`), 18 level definitions (`levels.ts`).
- Tuning (`npx tsx scripts/tune.ts`): solutions win for levels 1–15 and 17; 16 (decade bands) and 18 (final) still untuned. Wrong token/hour choices fail in 3, 4, 5, 10, 13; L5's "no token" case still wins. Southern wheat fields in L12 get 0 mm as intended.
- QA helper: `CURRICULUM.md`, `docs/curriculum/` (7 snapshots + SOURCES.md), `docs/research/model-values.md`.
- Art helper (stopped mid-work): 3 ChatGPT gameplay targets in `docs/visual-targets/` with prompts in `docs/VISUAL_PROMPTS.md`; models in `public/models/` (raw in `assets-src/tripo/`). ASSETS.md was not written yet; see `docs/visual-targets/STATUS.md`.

## Loose ends

- The art helper was stopped while a Tripo jeep generation may still have been running in its own Chrome tab; the tab may still be open.
- Credits: only one confirmed new generation (anani, task ca70b4c4-a358-4e83-9968-20b8d977de28); farmer and kid are reused owned assets. Balances were not recorded before the stop.
