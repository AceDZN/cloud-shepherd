# Cloud Shepherd — visual targets (prompts and reference checklists)

**These are AI-generated design targets for gameplay, not captures of built software.** Real browser captures are the implementation evidence; compare them against the checklists below (in VISUAL_REVIEW.md).

- **Tool/mode:** ChatGPT (chatgpt.com) in the user's own Chrome, art helper's own tab, built-in image generation inside a normal chat ("Create an image: ..."). The model picker showed **"Instant"**; the image model itself was not named in the UI (ChatGPT's built-in gpt-image generation). One request per image, all three in one conversation so the hero stays consistent: https://chatgpt.com/c/6ae5df40-87d0-83ed-91af-f71fc5bc422f
- **Date:** 2026-10-31, ~14:30–14:34 IST.
- **Download:** the viewer's download button (normal UI). ChatGPT named the files "Cloud Over the Golden Coast.png", "Weather Strategy Map_ First Storm.png", "Snowy Jerusalem Under a Friendly Storm Cloud.png"; copied unchanged.
- **Output:** 1672 × 941 PNG each (≈16:9).

| File | sha256 |
|---|---|
| docs/visual-targets/01-flight-carmel.png | d90f5dfe3391b5df21c54835c6744c47048a1f0749bdf3a5f9eda87ce889cb8d |
| docs/visual-targets/02-plan-pressure-map.png | 57464b79dbbf275c25e9aa835e60d1d2c988f6fe7783822586e0c22149256d34 |
| docs/visual-targets/03-storm-jerusalem-snow.png | a09b4d38c6aa4f3eb318e958a22517cc8b7ec8856933478276face0f782eaf80 |

**Known generator artefacts (do not copy into the game):**
- The RH ring label is spelled **"להות יחסית"** in images 1 and 3 (ה instead of ח). The game must say **"לחות יחסית"**.
- Hebrew is otherwise legible: "גשם", "שלג", "450 מ'", "800 מ'", "יוצאים", "שלב 3 · הסערה הראשונה", "סמלי מזג אוויר", "חורף/קיץ", "בוקר/צהריים/ערב".
- Geography in the images is impressionistic (image 2's coast, Kinneret and Dead Sea positions are approximate; image 1's Carmel has a city at its foot like Haifa seen from the south). Runtime terrain comes from real elevation data, not from these images.
- Images 2 and 3 show a gold-domed building and Old City walls for "Jerusalem". In-game Jerusalem should be generic pale limestone houses and hills (no specific religious landmark is needed).
- Image 3 shows lightning more as glowing electric rim/sparkle than as bolts.

## 01 — Flight view, level 1 (`01-flight-carmel.png`)

Prompt (exact):

> Create an image: a wide 16:9 in-game screenshot (design target mockup) of a stylized 3D browser game called "רועה העננים" (Cloud Shepherd). Third-person chase camera, slightly above and behind the hero, looking east down the wind. The hero, ענני, is a small cute fluffy white cloud spirit with a simple face (big round eyes, small happy grin), backlit by the low sun with a glowing golden rim light, soft layered puffy volume, in the lower-center third of the frame. It drifts east over a glittering turquoise Mediterranean sea toward the yellow sandy coast and the green forested slope of Mount Carmel, part of a tilt-shift miniature relief diorama of Israel: the land is a hand-made model block whose earthy brown cut sides (soil layers) are visible at the edges of the frame, with shallow depth of field blurring the far edges. A huge painted sky with soft cumulus fills the top half. Faint white wind streaks flow from the sea toward the slope. Ahead on the lower slope: a small brown plowed thirsty field with a tiny farmer in a hat waving. Minimal clean game HUD in Hebrew, right-to-left: on the right edge a vertical thermometer labeled °C at 18°C; top-right a circular relative-humidity ring showing "85%" with the label "לחות יחסית"; under it a horizontal water/size bar with a droplet icon; on the left edge a slim altimeter showing "450 מ'"; bottom-left a round blue pour button with a rain icon labeled "גשם". Bright, warm, cozy Pixar-like materials, readable silhouettes, no clutter, no watermark.

Reference checklist:
- **Camera:** high chase, ~35–45° down, behind and above ענני, looking along the wind toward the coast; the horizon sits at ~25% from the top. The land rises toward the upper right, the sea fills the left and centre.
- **Silhouette:** ענני is a round, lumpy cumulus puff about 1/6 of the frame width, with a bright glowing rim and a small cute face (two big dark eyes, a pink grin) on the side facing the travel direction. No limbs. Soft white wind streaks fan out behind and past it.
- **Occupancy:** sea ≈ 45%, land (coast + Carmel slope) ≈ 35%, sky ≈ 20%. The hero is in the lower-centre third. The farmer's field is a clear brown rectangle on the slope ahead (right third), with the tiny farmer waving.
- **Palette:** turquoise to deep teal sea with a sun-glitter path; warm yellow sand; saturated green trees and cypresses; pale limestone cliffs; warm white-gold clouds; blue sky going golden at the horizon.
- **Lighting:** low warm sun on the left, back-lighting the cloud (strong rim), long soft shadows; tilt-shift blur on the foreground and the far edges.
- **Diorama read:** a layered brown soil cut edge along the bottom-right; blurred foreground rocks.
- **HUD (RTL):** top-right RH ring ("85%") with label below, then the droplet water bar; right edge vertical thermometer (18°C, orange fill); top-left slim altimeter panel (mountain icon, "450 מ'", slider dot); bottom-left big round blue pour button (cloud + rain icon, "גשם"). Dark translucent rounded panels, white text, blue accents. No minimap, no route lines.
- **Visible verbs/feedback:** drifting with the wind (streaks), growing over the sea (water bar ~75%), pouring (button), target ahead (field + farmer).

## 02 — Plan view, synoptic map (`02-plan-pressure-map.png`)

Prompt (exact):

> Create an image: a wide 16:9 in-game screenshot (design target mockup) of the planning screen of the same stylized 3D browser game "רועה העננים" (Cloud Shepherd). Top-down synoptic camera (about 70 degrees down) over a tilt-shift miniature 3D relief diorama of Israel on a table-like block with earthy cut sides: turquoise Mediterranean on the left (west), yellow coast, green Carmel and Galilee, the blue Kinneret lake in the north-east, stone-colored Jerusalem hills, the deep Dead Sea valley, a tan Negev desert in the south, snowy Hermon at the top. Floating glossy 3D letter tokens hover above the map like weather-map symbols: a big Hebrew letter "ג" in warm orange (high pressure) over the sea to the south-west and a big Hebrew letter "ל" in cool blue (low pressure) over the north-east. Target icons stand on the map: a thirsty brown field with a small water-drop marker on the coastal plain, a rain gauge pole at the Kinneret, a tiny snowman and ski slope sign on the Jerusalem hills. A red-orange hazard badge (sun with heat waves) floats over the desert. NO wind arrows anywhere. Hebrew right-to-left UI: on the right side a vertical tray panel with placeable tokens (two blue "ל" coins and one orange "ג" coin, with "2/3" counters), top-left a round season and time-of-day dial (winter snowflake / summer sun, morning / noon), top center the level title "שלב 3 · הסערה הראשונה", and at the bottom center a big rounded green launch button reading "יוצאים". Soft daylight, clean bright toy-like materials, readable, no watermark.

Reference checklist:
- **Camera:** steep oblique top-down (~60–70°), north up, the whole country block in view with its brown layered cut sides visible at the bottom and right; slight tilt-shift blur at the frame edges.
- **Silhouette/tokens:** ג and ל are thick glossy coins (~1/10 of frame height), floating with soft concentric ripple rings on the surface below them. ג = orange-red with a yellow letter; ל = royal blue with a white letter. Target markers are small upright pins/icons (blue droplet pin over the field, a gauge pole at the Kinneret, a snowman + ski sign on the Jerusalem hills). The hazard is a red-orange map pin with a sun and heat waves over the Negev.
- **Occupancy:** the diorama fills ~80% of the frame; sea on the left third with soft cloud banks hugging the left edge; the UI tray takes the right ~12%.
- **Palette:** turquoise/blue sea, yellow coast, bright greens in the north, white snow on the Hermon, tan/orange Negev and Arava cliffs, pale stone city; warm wooden table around the block.
- **Lighting:** soft bright daylight, gentle shadows, toy-like glossy tokens with specular highlights.
- **HUD (RTL):** top centre parchment banner with the level title; top-left round season dial (חורף ❄ / קיץ ☀) with three time-of-day chips (בוקר / צהריים / ערב); right vertical cream tray titled "סמלי מזג אוויר" with ל, ל, ג coins and dark "2/3" count pills; bottom centre big pill-shaped green "יוצאים" button with a cloud icon.
- **Must NOT show:** wind arrows or route lines (the image honours this).
- **Visible verbs/feedback:** place/remove tokens from the tray, turn the season/time dial, launch.

## 03 — Later state: the great storm (`03-storm-jerusalem-snow.png`)

Prompt (exact):

> Create an image: a wide 16:9 in-game screenshot (design target mockup) of a later, dramatic moment in the same stylized 3D browser game "רועה העננים" (Cloud Shepherd). Third-person chase camera above and behind the hero at dusk in a winter storm. The hero ענני, the same cute cloud spirit with a simple face (big eyes, determined happy grin), is now HUGE, billowing and slate-dark blue-grey, with crackling lightning inside its belly and a bright rim light, filling the upper middle of the frame. It pours thick white snow down onto the Jerusalem hills of a tilt-shift miniature diorama of Israel: little pale limestone stone houses with flat roofs and arched windows getting covered in sparkling snow, a group of small kids in colorful winter jackets cheering with raised arms and building a snowman in a square. In the distance to the west (left), grey rain curtains fall on the coastal plain and the sea, and at the edge of the frame a bright green field spreads in rings with a rainbow arching over it. Earthy cut sides of the diorama block visible at the frame edge, shallow tilt-shift depth of field. Hebrew right-to-left game HUD: top-right a relative-humidity ring at "100%" glowing bright blue and pulsing; on the right edge a vertical thermometer near "0°C" with a snowflake icon; a full water/size bar; left edge altimeter "800 מ'"; bottom-left the round pour button lit and pressed, labeled "שלג"; a small star counter at the top. Moody dusk lighting with cold blue shadows and warm window lights, cozy and triumphant, not scary. No watermark.

Reference checklist:
- **Camera:** chase from behind and above, a bit lower than image 1 (~25–30° down); the coast and sea on the left horizon, Jerusalem hills filling the lower two thirds.
- **Silhouette:** ענני is now huge (≈ 55% of frame width, top-centre), a dark slate-blue billowing mass with bright electric-blue rim and inner glow, with the same face (white eyes, black pupils, determined brows, open grin) facing the camera. A dense column of white snow particles falls from its underside.
- **Occupancy:** cloud ≈ 30% (top), city and hills ≈ 50%, distant coast/sea and sky ≈ 20%. Kids + snowman are a clear foreground group (lower centre-right) at readable size.
- **Palette:** slate/indigo storm, electric blue rim, white snow, warm amber window lights and street lamps, pale limestone, dark green pines; orange sunset glow on the left horizon; rainbow + bright green fields at the left.
- **Lighting:** dusk; cold blue fill, warm points (windows), strong cloud rim/inner glow; grey rain curtains over the coast on the left.
- **HUD (RTL):** same layout as image 1. RH ring "100%" glowing bright blue (with halo); full water bar; thermometer at 0°C with a blue fill and a snowflake bulb; altimeter "800 מ'"; star pill "3/3" at the top-left beside the altimeter; pour button glowing, snowflakes + drops icon, label "שלג".
- **Visible verbs/feedback:** saturation (100% ring glows), pouring snow vs rain by temperature/height (snow on Jerusalem, rain on the coast), success feedback (kids cheering and a snowman, green field rings + rainbow, stars).
