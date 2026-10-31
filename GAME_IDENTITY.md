# Cloud Shepherd — רועה העננים · game identity

A 3D flying game for grades 8–9. You are **ענני**, a puppy-sized cloud spirit. You soak up vapor over the warm Mediterranean, grow, ride pressure-driven winds across a miniature relief diorama of Israel and, when the air is saturated, let go in a big satisfying downpour. Geography decides where every storm goes. You *are* the weather; you do not answer questions about it.

## Promise in one line

Grow fat over the sea, read the ג/ל map, ride the right wind up the right slope, and pour at the right height: rain for Tel Aviv, snow for Jerusalem, never a drop wasted in the rain shadow.

## First minute (level 1, "First breath")

1. 0–5 s: the camera swoops from a high diorama overview (Israel as a tilt-shift miniature under a huge sky) down to a small white cloud with a face, bobbing over glittering sea west of the Carmel. One Hebrew line: "החזיקו ← → כדי לנוע לרוחב הרוח. הרוח נושבת מ־ג אל ל."
2. 5–15 s: wind streaks (tutorial arrows on this level only) flow east toward a ל over the Jezreel side. ענני drifts low over the sea. The water bar fills, the cloud swells and the sound deepens. The RH ring climbs: 60 %, 75 %, 85 %.
3. 15–25 s: the wind carries ענני onto the coast and up the Carmel's western slope. The altimeter climbs, the thermometer drops, the RH ring hits **100 %**, turns blue and pulses; the cloud darkens to slate.
4. 25–35 s: the farmer's field glows ahead. Hold **Space** (or the big pour button on touch): a heavy downpour, rain particles, the brown field spreads green ring by ring, the farmer cheers, a rainbow. Stars: water delivered, water wasted, hint used.

## Controls

| Action | Keyboard (event.code) | Pointer / touch |
|---|---|---|
| Steer across or along the wind (never against it) | ArrowLeft/Right/Up/Down or KeyA/D/W/S | drag on the left half of the screen |
| Pour (rain or snow; works only at RH 100 %) | Space (hold) | big pour button, hold |
| Plan phase: place / remove a ג or ל token | click a slot | tap a slot |
| Plan phase: time of day / season dial | KeyT / KeyY or dial buttons | tap the dial |
| Launch | Enter | "יוצאים" button |
| Hint (costs a star, logged) | KeyH | hint button |
| Pause / resume | Escape or KeyP | pause button |
| Restart level | KeyR | menu |
| Mute | KeyM | speaker button |
| Fullscreen | KeyF | — |

## The decision

Where will the wind take me, and where on that path will I be saturated and at the right height? The plan view shows only ג/ל letters, relief, targets and hazards. No arrows after the tutorials. The player predicts the flow from ג to ל, the lift from west-facing slopes and lows, and the drying from descent, highs and the khamsin. Then they place tokens or choose the time/season and launch. In flight they choose how to use limited lateral steering and when to pour.

## Changing state (all from pure rule modules)

- Position over the relief, altitude (m), parcel temperature (°C from a fixed displayed rate per 100 m, marked העשרה).
- Water carried (grows over warm sea), capacity from a temperature table, **relative humidity = water / capacity**.
- Pressure field (ג/ל cells, player tokens, sea-breeze cell that grows with land–sea temperature difference by hour).
- Targets: rainfall/snow delivered per region (mm, simplified), field greening, Kinneret gauge, snowman progress.
- Hazards: rain shadow (descent → warming → RH drops), khamsin (hot dry wind dissipates the cloud), summer high (sinking air), flash flood on bare wadi slopes.

## Mistake and retry

- Pour at RH < 100 %: nothing falls; the ring flashes, and one Hebrew line explains why ("90 % זה עוד לא רוויה. עלו והתקררו.").
- Pour at the wrong height: slush and a sad snowman, or snow where rain was needed.
- Ride across the ridge full: you descend, warm, RH drops, and you shrivel without a drop.
- Pour hard on a bare desert wadi: a flash flood floats the tourist jeep downstream (level fails).
- After a fail or at the end: a **slow replay** draws your track colored by RH, with wind arrows, and one Hebrew line of cause ("ירדתם 800 מ' מזרחית לרכס; התחממתם והלחות ירדה ל־60 %"). Retry is instant (R), and the plan you made is kept.

## Win and replay

Each level scores 1–3 stars: target met (1), efficiency/no wasted water (2), no hint and no hazard (3). Levels unlock in order; replays keep best stars locally (localStorage only). After the 18 authored levels: generated seasons from a solver (verified solvable; "pour immediately" and "always go east" fail).

## Camera

Third-person chase camera above and behind ענני, looking down the wind, with gentle lag and banking. The tilt-shift diorama look (shallow depth of field at the edges). The plan phase uses a top-down synoptic camera over the same 3D relief, with ג/ל letters as floating 3D tokens. The replay uses a raised orbit camera.

## Art

A hand-made miniature diorama of Israel from real elevation data (NOAA ETOPO1, vertical exaggeration stated in credits): turquoise glittering sea, a yellow kurkar coast, green western slopes, stone-colored Jerusalem, a deep drop to the Dead Sea, a tan Negev, a snowy Hermon. Earthy cut sides of the diorama block. A huge painted sky. ענני: fluffy, backlit, rim-lit layered cloud with a cute face; it grows with water and darkens to slate when saturated. Rain and snow particles, rainbows, green spreading rings. Tripo models: ענני's core, kids, a farmer, a tourist jeep, a lifeguard tower, a Kinneret boat, trees and stone houses.

## Sound

WebAudio, synthesized and bundled: a soft airy pad while drifting, a rising chime as RH climbs, a deep rumble that grows with size, rain hiss and thunder on pour, a cheer and a field "bloom" sting, a dry hiss when shriveling, and a gurgling flood. Mute is persistent.

## What it is not

Not a quiz, not a delivery route with glowing lines, not Storm Proof (shelter building). There is no free up/down control: height comes from slopes, lows, heating and sinking air, so the geography is the controller.
