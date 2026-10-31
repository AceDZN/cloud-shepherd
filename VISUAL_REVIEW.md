# Cloud Shepherd — visual review (targets vs real captures)

Reviewed 2026-10-31 by the art helper. The running build (dev server :5241) was compared against the AI design targets in `docs/visual-targets/01–03` (prompts and checklists in `docs/VISUAL_PROMPTS.md`).

**Evidence**

- The lead's captures: `tmp/shots/01–16` (local only, git-ignored).
- My own close-ups and side-by-side comparisons were made with a scratch Playwright script (`tmp/visual-review/closeups.mjs`, same hooks as `scripts/shots.mjs`). They are in `tmp/visual-review/`, which is git-ignored and **local only**:
  - `cmp-01-flight.png`, `cmp-02-plan.png`, `cmp-03-storm.png`, `cmp-03b-jerusalem-closeup.png`
  - `cu-farmer.png`, `cu-jerusalem.png`, `cu-lifeguard.png`, `cu-jeep.png`, `cu-l4-flight.png`
  - `l2-strip.png`, `lod-check.png`

**Repo hygiene (resolved by the lead):** captures now go to the git-ignored `tmp/` folder, and `tmp/shots/` was removed from the repo. The three files in `docs/visual-targets/` are design mockups (deliverables required by the brief), not screenshots, so they stay committed.

Severity scale:

- **blocker**: breaks the identity or the target loop.
- **should**: a clear mismatch worth fixing before delivery.
- **nice**: polish.

No blockers found. The game reads as the target game: a Hebrew RTL HUD with a big RH ring, a chase camera over a relief diorama, ג/ל tokens without wind arrows in the plan, snow on Jerusalem with kids and a snowman, and real Tripo models in the scene.

## 1. Flight view vs target 01 (`04-l1-soak`, `05-l1-pour`, `13`, `14`, `16`)

| Checkpoint | Target | Capture | Verdict |
|---|---|---|---|
| Camera | High chase, about 35–45° down, behind ענני, along the wind, horizon high | Same: a high chase looking down-wind with the horizon at ~15–20% of frame height | ✅ match |
| Cloud occupancy | ~1/6 of frame width, lower centre | About 1/4–1/3 of the width, centred. Bigger than the target, which is fine for readability. | ✅ |
| Cloud silhouette | **One** lumpy cumulus with the face on it, glowing golden rim | **Reads as two objects**: a grey sphere cluster with a small, brighter Tripo cloud character stuck to its front-right, all inside a transparent **glass bubble** | ❌ should (F1) |
| Face direction | Face on the side, three-quarters toward travel | Face three-quarters **toward the camera** (`faceYaw = -heading + 0.55`) | deliberate, OK. It shows the face more; keep it. |
| Backlight / rim | Strong warm rim, backlit by a low sun | Flat grey shading on the puffs, no warm rim; the "rim" is the additive BackSide bubble | ❌ should (F1) |
| HUD language/RTL | Hebrew RTL | Hebrew RTL. Title, goal and target bars at top-right; tool buttons at top-left | ✅ |
| RH label spelling | must be **"לחות יחסית"** (the target image misspells it "להות") | **"לחות יחסית"** is correct in every capture | ✅ |
| RH ring | Big ring with % | Big ring (132 px) bottom-left; at 100% it turns blue and glows | ✅ (placement differs; see next row) |
| Thermometer / altimeter / water bar | Vertical °C thermometer, altimeter gauge, droplet water bar | **Text table only** (`.gstack`: height, temperature, vapour, capacity, ground). No gauges, no water/size bar, and the table is **hidden on mobile** | ❌ should (F3) |
| Pour button | Round button, "גשם" | Round button bottom-right: "להמטיר" before saturation, then "גשם"/"שלג" with a glow. Bottom-right suits RTL and thumb use, since steering is a left-half drag. | ✅ deliberate placement |
| Wind streaks | Faint white streaks | Streaks plus big white tutorial arrows on level 1 (allowed in tutorials) | ✅ |
| Target field + farmer | Brown field with a readable tiny farmer waving | Yellow zone ring and patch. The farmer is a **dark speck** at chase distance (1.6 units tall vs a ~5-unit cloud). | ❌ should (F6) |
| Sea | Turquoise glitter, sun path | Turquoise/blue with wave glitter. From the high plan/intro cameras the wave term **aliases into a visible checkerboard** (`03-l1-intro`, `09-l3-plan`, `07-l1-replay`). | nice (F9) |
| Tilt-shift / diorama | Strong edge blur, earthy cut sides at the frame edge, painted sky with cumulus | Blur is visible only faintly (corners of `14`, `06`). Cut sides are not in flight frames. Sky is a plain gradient with no painted clouds. | nice (F8) |

## 2. Plan view vs target 02 (`09-l3-plan`, `03-l1-intro`)

| Checkpoint | Target | Capture | Verdict |
|---|---|---|---|
| Camera | Steep top-down over the whole country block, cut sides visible | Steep oblique, framed on the level's area. Block edge is visible as a thin dark line, with a plain light-grey void around it. | ✅ framing / nice for the void (F8) |
| ג/ל coins | Big glossy coins (~1/10 frame height) floating, with ripple rings below | Coins are **small** (~25 px at 1280×800: `makeToken(..., 7)` seen from h≈300). No ripples. | ❌ should (F4) |
| Slots | Clear placeable spots | White rings plus a faint pillar; readable but plain | nice (F4) |
| Targets / hazards | Droplet pin, gauge, snowman, desert hazard pin | Target name chips (HTML labels) and zone rings. Fine, and clearer than the target. | ✅ |
| No wind arrows | none | none in the plan | ✅ |
| Token tray | Right-side vertical tray with ל/ג coins and counts | Inside the top-right panel (`.plan-panel`): coin + "שקע" + "נותרו 0" | ✅ (compact) |
| Launch | Big green "יוצאים" button, bottom centre | Small green "יוצאים!" inside the panel | should (F4) |
| Season/time dial | Round dial | Hour chips on levels that use time (not in this capture) | nice |

## 3. Storm / snow / night vs target 03 (`10-l7-jerusalem-snow`, `15-l18-storm`, `12-l10-night`, `cu-jerusalem`)

| Checkpoint | Target | Capture | Verdict |
|---|---|---|---|
| Cloud colour when saturated | **Slate-dark**, huge, with lightning inside | Day (`10`): puffs grey-slate, but the **face core stays white**. Night storm (`15`, `12`): the cloud is **near white/lavender**, because the night tint is applied after the slate tint and lightens it. | ❌ should (F2) |
| Lightning | Bolts and an electric rim in the belly | `fx.lightning` bolt and exposure flash exist, but no inner glow on the cloud; none visible in captures | should (F2) |
| Snow | Thick column of big flakes | Sparse small dots (`PointsMaterial size 0.16`) | ❌ should (F7) |
| Jerusalem | Snow-covered limestone houses, warm window lights | ~220 procedural limestone **boxes** with no snow caps, 4 Tripo stone houses at the zone edge. Night houses are blue-grey with **no window lights**. | should (F7) |
| Kids + snowman | Kids cheering around the snowman, readable | Snowman grows ✅. Two Tripo kids (orange jacket, red hat) are present but **tiny and hidden among boxes**; they only cheer once the target is met. | should (F6) |
| Rain on coast + rainbow | Rain curtains on the coast; rainbow | Tel Aviv shows a rainbow when met (seen in `cu-jerusalem`) ✅. No distant rain curtains (only the cloud rains). | nice |
| Sky | Dusk gradient, orange horizon | Night/purple gradient with stars ✅. A storm-dusk orange horizon would match better. | nice |
| HUD | RH 100% glowing, thermometer near 0 °C with snowflake, "שלג" | RH 100% glow ✅. "שלג" button ✅. Temperature only as table text ("-5°"). | covered by F3 |

## 4. Tripo model usage

| Model | Where it appears | Seen in capture | Notes |
|---|---|---|---|
| `anani.glb` | Hero face core, every flight | ✅ all flight shots | It is smaller than the procedural puff cluster and reads as a separate character (F1). |
| `farmer.glb` | Field/wheat targets (L1, 2, 5, 13, 15, 16…) | ✅ `cu-farmer` (good quality); a speck at chase distance | Only `idle`/`cheer` are used. `wave_goodbye_02` and `defeat_02` are unused (F6). |
| `kid.glb` | Snowman targets (L7, 9, 18) | ✅ `cu-jerusalem`, tiny in `10` | Two kids. Use more, bigger, and play `cheer` while snow lands (F6). |
| `jeep.glb` | Wadis (L18 and others) | ✅ `cu-jeep` (reads well), small in `15` | OK |
| `lifeguard-tower.glb` | L4 lifeguard target | ✅ `cu-lifeguard` | **Buried among Tel Aviv tower blocks.** Its back faces the camera; the umbrellas float on roofs (F5). |
| `boat.glb` | Two fishing boats off the coast | ✅ `03`, `04`, `07`, `cu-lifeguard` | None on the **Kinneret** (the brief: "Kinneret fishing boat"). Add one there (F6). |
| `stone-house.glb` | 4 per snowman target, 6 per city target | ✅ `cu-jerusalem` | Most of each town is still procedural boxes (F7). |
| `olive.glb` | Forest / aquifer targets | ✅ `11` (bottom) | The scattered map trees are procedural icosahedra (fine for count). |
| `cypress.glb` | Fire and forest targets | ✅ `12` (forest), fire level | OK |

New LOD files I made for instancing (art-owned, see ASSETS.md):

- `public/models/stone-house-lo.glb`: 3,464 tris, 258,668 B.
- `public/models/olive-lo.glb`: 5,240 tris, 419,728 B.
- Silhouettes were checked side by side in `tmp/visual-review/lod-check.png`. The house is near-identical; the olive is a bit sparser.

## 5. Mobile (`16-mobile-flight`, 390×844)

- ✅ The RH ring, pour, puff and top buttons fit; the level title wraps to 2 lines; Hebrew RTL holds.
- ❌ should (F3): `.gstack` is `display: none`, so on phones there is **no altitude or temperature at all**. Those are core to the decision.
- should: the cloud fills ~90% of the width and the target chip sits on top of it. Pull the camera back on portrait.
- should: two `.line` messages stack and overlap (a faded "100% לחות יחסית…" behind the cause line). Hide `.line` while `.cause` shows on small screens, or move `.cause` above.
- nice: `.targets` is hidden on mobile. Show a single compact progress pill instead.

## 6. Other

- nice (F10): `08-l2-dry-pour` is a washed-out frame. The flight sim (and the dry-pour feedback line) starts while the camera is still swooping down from the overview (~1 s; see `tmp/visual-review/l2-strip.png`). The first feedback can therefore fire while the cloud is off-screen.

## Fixes (concrete, for src/)

**F1 (should, #1): one cloud, warm rim, no bubble.** `src/scene/cloud.ts`

- Make the core part of the body:
  - Change `assets.anani(2.2)` to `assets.anani(3.0)`.
  - Set `core.position` to `(0, 0.05, 0.25)` so the front puffs (`[-0.75,0.6,0.1]`, `[0.75,0.62,0.1]`, `[±0.9,-0.45,0.25]`) overlap its edges.
  - Optionally drop the two front-bottom puffs that hide its "feet".
- Match the puff shading to the core:
  - Set `puffMat` to `color '#f7f9ff'` and `emissive '#ffffff'`, with `emissiveIntensity 0.32` (×(1−sat)).
  - Keep `roughness 1`.
- Replace the BackSide additive `rim` sphere (the visible "glass bubble") with a per-puff fresnel rim:
  - Add it via `puffMat.onBeforeCompile`, injecting before `#include <emissivemap_fragment>`: `float fr = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0); totalEmissiveRadiance += rimColor * fr * rimStrength;`
  - Use uniforms `rimColor` = `#ffd9a0` (day), `#9fd7ff` (saturated/storm).
  - Use `rimStrength` 0.6, and 0.9 pulsing when `excess > 0`.
  - Delete `this.rim` (or set `rim.visible = false`).

**F2 (should): storm darkness + lightning in the belly.** `src/scene/cloud.ts`, `src/game/game.ts:720`

- Change the colour order to `WHITE.clone().lerp(NIGHT, night*0.4).lerp(SLATE_DARK, sat*0.9)` with `SLATE_DARK = '#3d465c'` (slate applied last).
- Set puff `emissiveIntensity = (0.32 + night*0.15) * (1 - sat*0.8)`.
- Core: `m.color.lerp(SLATE, sat*0.6)` and `emissiveIntensity = 0.14*(1 - sat*0.5) + night*0.15`. The eyes stay dark because they come from the map.
- Add a `THREE.PointLight('#cfe6ff', 0, 12)` in `body`. When `game.ts` fires `fx.lightning`, also set its intensity to ~40 and decay it over 0.2 s, giving the inner flash of target 03.

**F3 (should): real gauges, also on mobile.** `src/game/game.ts` (HUD template ~l.424), `src/style.css`

- Add to `.gauges`:
  - A vertical thermometer bar: a 0 °C tick and snowflake icon, fill blue below 0 and orange above.
  - A vertical altimeter bar: a cloud marker plus a marker for the ground height under the cloud. This makes "slope lifts you" visible.
  - A horizontal water/size bar under the ring: `W / cap`.
- Keep `.gstack` as a smaller detail table on desktop.
- In `@media (max-width:760px)`, show the two bars (thin, ~70 px tall) instead of `display:none`.

**F4 (should): plan coins and launch.** `src/scene/props.ts`, `src/game/game.ts`, `src/style.css`

- In plan mode, scale fixed and placed tokens ×2.2. Lift them to `holder.position.y = size*1.1` and add a slow bob (`sin(time)*0.3`).
- Add a `drapedRing` ripple under each coin with animated scale and opacity.
- Lerp the tokens back to ×1 in flight.
- Move the `data-act="launch"` button out of `.plan-panel` into a fixed bottom-centre `.launch` pill (big, green, `min-width:220px; font-size:24px`).

**F5 (should): lifeguard tower on the beach.** `src/scene/props.ts`

- Remove town boxes inside target zones the same way as trees. In the `houses` loop, skip points inside any `level.targets` lifeguard/snowman/field zone. That needs a per-level rebuild or a hide mask, e.g. per-level `setMatrixAt` with zero scale for instances inside the zones.
- Place the tower at the zone's sand/water edge (search west until `waterAt` is `'sea'`, then step 1 km east).
- Rotate it so its +Z side (the striped front with the ring) faces the sea: `rotation.y = Math.PI/2` for a west-facing coast, instead of `-π/2`.
- Stand the umbrellas on `surfaceY`.

**F6 (should): characters readable and expressive.** `src/scene/props.ts`

- Make the farmer `actor('farmer', 2.6)` and the kids `actor('kid', 1.8)`, with 3–4 kids around the snowman (`SkeletonUtils` clones).
- Farmer clips:
  - `wave_goodbye_02` when the cloud is within ~15 km.
  - `cheer` when the target is met.
  - `defeat_02` on a fail or when water is wasted downwind.
- Kids play `cheer` whenever `frac` increases (snow landing), not only when met.
- Add one `boat.glb` on the Kinneret (`PLACES.kinneret`, at the lake's surface height).

**F7 (should): Jerusalem in snow.** `src/scene/fx.ts`, `src/scene/props.ts`

- Snow particles:
  - `size 0.16` → `0.32`.
  - Spawn rate ×1.5 (`rate*dt*500` → `750`).
  - Slower fall (`1.6` → `1.1`).
- Snow caps: in the snowman target `update`, add white roof caps scaled by `frac`. Either a flattened white `InstancedMesh` box on each house in the zone, or lerp the instanced house colour toward `#ffffff` via `setColorAt`.
- Replace the procedural boxes for `jerusalem` and `safed` with instanced `stone-house-lo.glb` (`assets.parts('stone-house', h)` already exists; switch it to the `-lo` file for instancing).
- Night: add `emissive '#ffb347'` at 0.6×night through a small window-light instanced quad on the houses.

**F8 (nice): miniature look.** `src/scene/world.ts`, `src/game/game.ts`

- Flight `setFocus(0.5, 1)` → `setFocus(0.55, 1.8)` for stronger top/bottom blur.
- Add 6–10 big soft billboard cumulus sprites far around the map, for the painted-sky feel.
- Give the plan/overview void a warm table colour (`scene.background = '#d8cbb2'`) and a darker earthy band on the block's cut sides in `terrain.ts`.

**F9 (nice): sea checkerboard.** `src/scene/terrain.ts` sea shader: fade the wave term and glitter with distance:

```
float far = smoothstep(60.0, 220.0, vFog);
c += waves * 0.025 * (1.0 - far);
g *= 1.0 - far;
```

**F10 (nice): launch swoop.** `src/game/game.ts`: don't step the sim (or hold feedback lines) until `camBlend ≥ 1`, or shorten the swoop to ~0.6 s.

## Ranked top fixes

1. **F1**: one cloud with a warm fresnel rim, no glass bubble. This is the biggest identity gap.
2. **F3**: thermometer/altimeter/water gauges, also on mobile (mobile currently shows no height or temperature).
3. **F2**: slate storm cloud at night plus an inner lightning flash.
4. **F6**: bigger farmer and kids with the full clip set; a boat on the Kinneret.
5. **F4**: big floating plan coins and a big bottom-centre "יוצאים".
6. **F7**: thick snow, snow caps, stone-house-lo instancing for Jerusalem, warm night windows.
7. **F5**: lifeguard tower on the sand, facing the sea, out of the tower blocks.
8. F8, F9, F10: tilt-shift strength, sky clouds, sea aliasing, launch swoop.
