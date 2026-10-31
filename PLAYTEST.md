# Playtest: Cloud Shepherd (רועה העננים)

Browser playtest of the playable 3D build, run 2026-10-31 against the dev server at `http://localhost:5241/`.

- **Browser:** headless Chromium (Playwright) with GPU, 1280×800. Mobile checks used 390×844 with touch emulation.
- **Script:** `node scripts/playtest.mjs [section,…]`. The sections are `solutions naive accept keys ui mobile progress text`. The script never starts or stops the server.
- **Text results:** `docs/playtest/results.json`, one row per check.
- **Screenshots (local only):** `tmp/playtest/*.png`. That folder is git-ignored and **must not be committed**: no screenshots go in the repo. The paths below are references only, not embedded images.

**Result: 123 of 125 automated checks pass and 2 fail.** Both failures are bug 1, the Enter key. By section:
- solutions: 43 pass
- naive: 31 pass
- accept: 8 pass
- keys: 14 pass, 2 fail
- ui: 12 pass
- mobile: 7 pass
- progress: 5 pass
- text: 3 pass

The final run had no console or page errors. Bugs 2–10 below came from reading the captures and the code, not from automated checks.

## How it was driven

- **Scripted pilots.** These run the real game loop (`requestAnimationFrame` replaced by `window.advanceTime`). `window.__game.quickStart(id, plan)` launches a level, and `window.__game.pilot` is set to `routePilot(solution)`, `pourAlways` or `alwaysEast` from `/src/rules/autopilot.ts`.
- **"By hand" play.** Real keyboard events go through Playwright (`keyboard.down/up` and `press`): arrows to steer, Space to pour, Shift to puff, Q for the season, plus P, Esc, F, R, H, M and Enter. A small "player" reads the screen state, turns the chase camera's heading into arrow keys toward the next waypoint, and presses Space inside a target when the ring shows 100 %.
  - Plan slots were clicked with the real mouse at the slot's projected screen position.
  - Hour buttons and the launch button were clicked as buttons.
  - On mobile, the finger drag and the pour-button hold are real CDP touch events.
  - Levels played this way: 1, 2, 3 (mouse plan), 4 (hour button), 15 (Q season dial), 17 and 18 (mouse plan with hour 03:00).

## Results by check

### 1. Every level wins in the real loop with the solution pilot; naive pilots fail where expected

| Level | Result | Stars | Time to win (s) | Absorbed / poured / back to air / still in cloud |
|---|---|---|---|---|
| 1 | won | 3 | 9.9 | 9.9 / 0.5 / 0.0 / 9.4 |
| 2 | won | 3 | 15.0 | 16.7 / 0.7 / 0.1 / 15.9 |
| 3 | won | 3 | 9.8 | 9.9 / 0.4 / 0.0 / 9.5 |
| 4 | won | 3 | 6.4 | 23.2 / 0.0 / 0.0 / 23.2 |
| 5 | won | 3 | 21.3 | 10.1 / 0.6 / 0.0 / 9.6 |
| 6 | won | 3 | 18.5 | 9.5 / 0.8 / 0.4 / 8.3 |
| 7 | won | 3 | 30.1 | 6.2 / 0.8 / 0.0 / 5.5 |
| 8 | won | 3 | 23.1 | 9.0 / 1.4 / 0.2 / 7.4 |
| 9 | won | 3 | 45.3 | 7.1 / 0.7 / 1.2 / 5.2 |
| 10 | won | 3 | 7.1 | 9.5 / 0.5 / 0.0 / 9.0 |
| 11 | won | 3 | 45.0 | 39.4 / 5.3 / 26.1 / 8.0 |
| 12 | won | 3 | 50.0 | 29.8 / 0.6 / 22.4 / 6.7 |
| 13 | won | 3 | 66.8 | 17.0 / 0.4 / 2.2 / 14.4 |
| 14 | won | 3 | 18.0 | 71.3 / 3.0 / 47.2 / 21.0 |
| 15 | won | 3 | 51.6 | 36.2 / 0.6 / 26.1 / 9.6 |
| 16 | won | 3 | 18.0 | 107.8 / 11.1 / 87.9 / 8.8 |
| 17 | won | 3 | 40.0 | 23.7 / 5.6 / 12.1 / 6.1 |
| 18 | won | 3 | 75.0 | 11.7 / 1.6 / 7.9 / 2.1 |

How to read the table:
- The time is in-storm time for the last storm. For multi-storm levels it is not the total time.
- The balance figures are as shown on the result card.
- For all 18 levels, the simulation's balance holds to within 1e-6: absorbed = poured + returned to the air + still in the cloud. The card's four rounded numbers also add up to within 0.15. Water is conserved.
- Level 4 shows "poured 0.0" because its target is shade (a sea-breeze cloud over the beach), not rain. That is correct, but see student note C.

Naive pilots: `pourAlways` and `alwaysEast` both **fail** on levels 2, 7 and 11–18, which is 20 of 20 runs. The fail reasons were timeout, band, targets and dried.

Wrong plans also **fail**:
- Level 3 with ל in the south or the northwest.
- Level 5 with ל in s1, s3 or s4.
- Level 10 with ל in the east.
- Level 13 with ל in the Negev or the center.
- Level 18 with ל over the sea, or at 15:00.
- Level 4 at 06:00.

### 2. Level 1 acceptance, from the title screen as a new player: PASS

- The title screen's שחקו opens the intro, which shows the controls help. The player then presses יוצאים!.
- RH climbs over the sea: 81 → 89 % in the first 3 s.
- On the Carmel slope the cloud reaches **100 % at t = 7.7 s**, and the line «100% לחות יחסית: האוויר רווי. עכשיו אפשר להמטיר!» appears.
- The player pours on the farmer's field. Rain streaks fall and the wet/green terrain layer paints.
- **Won at t = 9.9 s.** Three stars. A rainbow appears over the field on the result screen.
- Captures: `tmp/playtest/l1-intro.png`, `l1-saturated.png`, `l1-downpour.png`, `solution-l01-result.png`.

### 3. Level 2 acceptance: PASS

- The level starts at **91 %**.
- Holding Space (or the pour button) delivers nothing: the target stays 0/18 and the balance shows "poured 0".
- **One line** appears: «הלחות היחסית רק 90%. גשם יורד רק מאוויר רווי (100%): עלו גבוה יותר כדי להתקרר.»
- The same result came from the scripted pilot and from a real Space key press.
- Capture: `tmp/playtest/l2-dry-pour.png`.

### 4. Hebrew, RTL, numbers, units and the water balance: PASS, with notes

- `<html lang="he" dir="rtl">`, the body computes to `rtl`, and the bundled Rubik font loads.
- I opened all 18 intros and HUDs. None contains `undefined`, `NaN`, `null` or `[object`. Every gauge number sits in a `<bdi>`.
- Mixed strings read correctly in the captures, for example "ב־800 מ'", "פחות מ־30%", "0 / 12 מ"מ", "°10", "9.2 ב־10°".
- The water balance is right everywhere (see check 1). Problems with the precipitation **label** on the result card are listed as bug 4.

### 5. Pause, blur, restart, mute, resize, mobile, replay and progress

| Check | Result |
|---|---|
| P pauses: time stops and the הפסקה card appears. P resumes. Esc pauses. | PASS |
| Window `blur` pauses. A hidden tab (`visibilitychange`) pauses. | PASS |
| R in flight restarts at t≈0. R on a plan level returns to the plan with the same token still placed. | PASS |
| M toggles mute, updates the 🔇/🔊 button and persists in `localStorage`. | PASS |
| F runs at 3× (3.0 s of storm per 1 s). | PASS |
| H gives a hint line and costs the third star. Level 18 has no hint button, and H does nothing there. | PASS, but see bug 2 |
| Resize to 900×600 mid-flight: the canvas and the camera aspect follow. | PASS |
| Replay (שחזור המסלול) shows the track coloured by RH, with "גובה 789 מ' · 7° · לחות יחסית 100%". חזרה לתוצאה returns. | PASS |
| Mobile 390×844 layout:<br>• no horizontal scroll<br>• the intro button is on screen<br>• the HUD fits, and the panels don't overlap | PASS |
| Mobile touch:<br>• a finger drag shows the joystick and steers<br>• holding the pour button pours once saturated | PASS |
| Progress:<br>• a fresh save shows only level 1 open<br>• winning level 1 shows לשלב הבא, unlocks level 2 and puts ★★★ on level 1<br>• it survives a reload (the title says המשך)<br>• `?level=12` opens level 12's intro even while it is locked | PASS |
| Enter on the intro or result card | **FAIL** (bug 1) |

Captures: `tmp/playtest/ui-pause.png`, `ui-hint.png`, `ui-replay-l8.png`, `ui-resized-900x600.png`, `mobile-title.png`, `mobile-levels.png`, `mobile-intro.png`, `mobile-joystick.png`, `mobile-pour.png`.

### Hand play (real keys and mouse)

| Level | How it was played | Result |
|---|---|---|
| 1 | Enter on the intro, then arrows and Space | won |
| 2 | Space at 90 % first (dry-pour line appears), then fly and pour | won |
| 3 | Mouse: click south, then east (the single ל moves), then launch | won |
| 4 | Mouse: hour button 14:00, then launch, then arrows | won (Enter on the intro: **bug 1**) |
| 15 | Arrows, Space, Shift, and Q (season dial) at t = 22 s | won |
| 17 | Arrows, Space, Shift (3 storms) | won, Kinneret 125.6 |
| 18 | Mouse: center slot, hour 03:00, launch, then arrows, Space and Shift | won: coast 6.2, Jerusalem 11, Hermon 15, Kinneret 35.9 |

## Fixed after this playtest

The crew lead applied these fixes after the run below, then reran `node scripts/playtest.mjs`: **125 of 125 checks pass** with no console errors. The bug list that follows is kept as found.

| Bug | Fix |
|---|---|
| 1. Enter launches flight | Enter clicks the overlay's primary button, or the launch button only in plan mode. The launch button now lives outside the plan panel and is hidden with it. |
| 2. Hints give away the answer | The flight hint shows wind arrows around the cloud for 8 s and asks a question about the cause (`flightHintLine` in `explain.ts`). The plan hint previews the wind of the player's own plan; no slot is marked. |
| 3. Level 18 always night | `night: true` removed; 03:00 is night through the hour. |
| 4. Result names one kind | The card lists each target in its own unit (✓/✗, מ"מ) and every kind that fell: rain, rain mixed with snow, snow. The water balance is labelled as cloud units, not מ"מ on the ground. |
| 5. Plan hint behind the launch button | The plan toast sits above the launch pill (and at the top on phones). |
| 6. Phones lose height and temperature | A compact height · temperature line sits inside the RH ring on narrow screens. |
| 7. Keyboard keys on touch | Touch wording under `(pointer: coarse)`. |
| 9. No campaign end | Winning level 18 shows an end-of-campaign line. |

Not fixed: 8 (labels under HUD panels) and 10 (dry-pour line keeps the RH of the key press).

## Ranked bug list

1. **Enter skips the plan and can launch the wrong level (high).**
   - **File:** `src/game/game.ts`, `bindInput`, at the `code === 'Enter'` branch (about line 1028).
   - **Cause:** `overlay.querySelector('.btn.primary')?.click() ?? planPanel.querySelector('[data-act=launch]')?.click()` always runs both sides, because `click()` returns `undefined`. The plan panel's HTML also survives after it is hidden.
   - **Repro (a), the intro:** open level 4 and press Enter on the intro. The game goes straight to flight at the default 06:00, and the level can't be won.
   - **Repro (b), the result card:** win level 4 and press Enter on the result card (לשלב הבא). Level 5 starts flying immediately, with no intro and no plan, because the stale enabled launch button from level 4 is clicked.
   - **Wider effect:** once any plan level has left an *enabled* launch button behind (level 4, or any slot level after its ל was placed), every later Enter on an overlay also fires that stale button. The intro, the result card and the title's המשך all jump straight into flight.
   - **Fix:**
     ```ts
     const btn = this.overlay.querySelector<HTMLButtonElement>('.btn.primary')
       ?? (this.mode === 'plan' ? this.planPanel.querySelector<HTMLButtonElement>('[data-act=launch]') : null);
     btn?.click();
     ```
     Also clear `planPanel.innerHTML` wherever the panel is hidden (`leaveLevel`, `startFlight`).
   - **Covered by:** `scripts/playtest.mjs keys` ("L4: Enter on the intro…" and "Enter on the result card…").

2. **The hints give away the answer, against the handoff (high, design contract).**
   - **Flight hint:** `game.ts` `flightHint()` (about line 507) draws a green dashed line along `level.solution.routes[storm]`, with the line «הקו הירוק: דרך אפשרית». The handoff says the hint highlights the nearest ל and the slope that will lift you, and "never draws the route".
   - **Plan hint:** `planHint()` (about line 312) puts the green ring on the exact solution slot.
   - **Repro:** level 6, press H, and see `tmp/playtest/ui-hint.png`. For the plan, level 3, press רמז, and see `tmp/playtest/l3-plan-hint.png`.
   - **Fix, flight:** pulse the nearest active ל token. Then tint the windward slope along the wind between the cloud and the target, where the terrain rises. Use a line like «חפשו מדרון שהרוח דוחפת אליו: שם האוויר עולה ומתקרר».
   - **Fix, plan:** preview the wind arrows that the currently selected slot would create. You could also ring the target together with two candidate slots. Either way, the hint should not mark the one correct slot.

3. **Level 18 is always night, even when the player picks 15:00 (medium).**
   - **File:** `src/rules/levels.ts` lines 338–339. Both level 18 storms set `night: true`. `applyMood` (`game.ts` about line 621) ORs `env.night` with the hour, so the chosen hour never changes the look.
   - **Repro:** level 18 at 15:00 versus 03:00 gives identical dark skies. Compare `tmp/playtest/l18-flight-hour15.png` and `l18-flight-hour03.png`.
   - **Why it matters:** the level's lesson is that the night is colder, so 03:00 gives snow and 15:00 gives slush. The visuals currently contradict the player's choice.
   - **Fix:** remove `night: true` from the level 18 storms. `hour < 6` already makes 03:00 night.

4. **The result card's precipitation label is wrong for mixed falls and ignores slush (medium).**
   - **File:** `game.ts` `showResult()` (about line 813): `ירד ${kinds.snow > kinds.rain ? 'כשלג' : 'כגשם'}`.
   - **Repro:** win level 7. The card says «ירד כשלג 0.8», but the level's whole point is rain in Tel Aviv **and** snow in Jerusalem. Level 18 also shows only «כשלג», and slush is never named. See `tmp/playtest/solution-l07-result.png`.
   - **Fix:** show the kinds that actually fell, for example `ירד: גשם 0.5 · שלג 0.3 · גשם מעורב בשלג 0.0`. Another option is a neutral «ירד» label with a small rain/snow/slush split underneath. Keep the "slush" wording that `explain.ts` already uses («גשם מעורב בשלג»).

5. **The plan hint toast is hidden behind the launch button (low–medium).**
   - **File:** `src/style.css` about lines 122–124. `.toast` (bottom 20 px, z 12) sits under `.launch-wrap` (bottom 24 px, z 15).
   - **Repro:** level 3 plan, press רמז. The hint sentence is cut in the middle by יוצאים! (`tmp/playtest/l3-plan-hint.png`).
   - **Fix:** in plan mode, lift the toast above the launch button (`bottom: 96px`) or move it to the top.

6. **Phones lose the temperature and height readouts (low–medium, learning impact).**
   - **File:** `src/style.css` `@media (max-width: 760px)`, which sets `.gstack { display: none }` and `.targets { display: none }`.
   - **Effect:** on a 390 px phone the player sees only the RH ring. Height, cloud temperature, capacity and ground temperature are gone. Those are the variables levels 6–8, 13 and 18 teach (0.6° per 100 m, snow versus rain).
   - **Fix:** add a one-line compact readout (`<bdi>570 מ'</bdi> · <bdi>10°</bdi>`) above the RH ring.
   - **Also:** the 760 px block declares `.targets` twice. The first rule (`top:auto; bottom:168px`) is dead because the later rule sets `display: none`.

7. **The intro shows keyboard help on touch devices (low).**
   - **File:** `game.ts` `loadLevel` intro, the `.controls-help` block.
   - **Repro:** 390×844 touch. The card shows arrow, Shift, P and F keys (`tmp/playtest/mobile-intro.png`).
   - **Fix:** when `matchMedia('(pointer: coarse)')` matches, show «גררו על המסך כדי להטות את ענני · החזיקו "להמטיר" כדי להוריד גשם · "נשיפה" לדחיפה לצד».

8. **Floating world labels slide under the HUD panels (low).**
   - **Repro:** level 7: the «בובת השלג בירושלים 0/12» label sits under the targets panel (`tmp/playtest/hud-l07.png`). Level 18: the Jerusalem label sits under the level card and the storm bar (`l18-flight-hour03.png`).
   - **Fix:** in `src/scene/labels.ts`, hide or fade a label whose screen rectangle intersects `.hud-level`, `.targets` or `.storm-bar`. Another option is to clamp labels below the HUD band.

9. **The last level has no ending (low).**
   - **Repro:** win level 18. The card shows retry, replay and levels, but nothing marks the end of the campaign (`tmp/playtest/solution-l18-result.png`).
   - **Fix:** when `!next && won`, add a closing line such as «סיימתם את כל 18 השלבים! עכשיו אתם יודעים למה יורד יותר גשם בצפון ובהרים». Make the primary button "levels" and show the star total.

10. **The dry-pour line freezes the RH figure (trivial).**
    - **Repro:** on level 2 the line says "רק 90%" while the ring already shows 91 %, because the line is built once when the player presses.
    - **Fix:** this is acceptable as is. Optionally say «פחות מ־100%» instead of quoting the number.


## Things a grade 8–9 student may find confusing

- **A. Two unit systems on one screen.**
  - The result card counts water in **ג'/מ"ק** (cloud units), while the targets fill in **מ"מ**. On level 1 the card says «ירד כגשם 0.5» and «נשאר בענן 9.4», yet the field shows 12/12 מ"מ.
  - A student will read this as "my cloud hardly rained and kept 94 % of its water".
  - **Suggestion:** add a line such as «0.5 יחידות מים מהענן = 12 מ"מ על השדה». Also explain that a cloud only drops the excess above saturation, so most of its water stays aloft.
- **B. "ענני" as the cloud's name.** «ענני ספג» and «ענני יכול להכיל» can read as construct-plural "clouds of…". Consider niqqud (עֲנָנִי) or quotes on first use.
- **C. Level 4 result shows "ירד 0.0".** The goal is shade from a sea-breeze cloud, so the balance card looks like nothing happened. A sentence like «ביעד הזה רצינו צל, לא גשם» on the card would help.
- **D. "Absorbed" is shown as a concentration unit.** «ענני ספג 107.8 ג'/מ"ק» (level 16) is a cumulative amount, not a concentration. The fine print «יחידות מים מפושטות» is right, but the unit label invites a physics objection from a sharp student. Consider dropping the unit or calling it «יחידות מים».
- **E. "רמז" draws the route** (bug 2). Students will learn to press H rather than read the wind and the slope, and it costs only one star.
- **F. On phones, the lapse-rate lesson is invisible** (bug 6).

## Captures (local only, git-ignored, do not commit)

All files are in `tmp/playtest/`:
- **Level results:** `solution-l01/07/08/11/14/17/18-result.png`
- **Level 1 and 2:** `l1-intro`, `l1-saturated`, `l1-downpour`, `l2-dry-pour`
- **Plans:** `l3-plan-clicked`, `l3-plan-hint`, `l4-plan-hour14`
- **Level 17, 18 and HUDs:** `l17-keys-result`, `l18-keys-result`, `l18-flight-hour03`, `l18-flight-hour15`, `hud-l07`, `hud-l11`, `hud-l13`
- **UI:** `ui-pause`, `ui-hint`, `ui-replay-l8`, `ui-resized-900x600`
- **Mobile:** `mobile-title`, `mobile-levels`, `mobile-intro`, `mobile-joystick`, `mobile-pour`

To regenerate them, run `node scripts/playtest.mjs`. Three captures came from a one-off check rather than the script: `l3-plan-hint`, `l18-flight-hour03` and `l18-flight-hour15`. To repeat them, open the plan hint on level 3, and run level 18 at each hour with no pilot.
