# Model values for the pure rule modules

Every number the rule model may use, with its source. Each value has one of these tags:

- **[module]**: stated in a Workbook snapshot in `docs/curriculum/` (file named). This is curriculum scope.
- **[העשרה / external]**: from a public external source (IMS, a standard reference, a paper). Show it as
  העשרה if it's displayed, and never assess it as a curriculum fact.
- **[tuning]**: a game design value we chose. It's labelled simplified, and has no factual claim.

Compiled 2026-10-31 by the geography/gameplay QA helper. All maps and model values are schematic and simplified.

---

## 1. Annual rainfall per game region (mm/yr)

Main external source: Israel Meteorological Service (השירות המטאורולוגי), *Monthly summary, May 2026*,
Table 2, "Rainfall amounts from the beginning of the season to the end of May compared with the average",
column "Multi-year average for the entire season". The footnote says the multi-year average refers to
**1991–2020**, and that at stations which didn't operate for the whole period the averages are adjusted to those years.
URL: https://ims.gov.il/sites/default/files/2026-06/May%202026%20Summary.pdf (accessed 2026-10-31; English edition).

| Game region | Module value [module] | IMS 1991–2020 normal, nearest station(s) [external] | **Game target** | Tag of game value |
|---|---|---|---|---|
| Upper Galilee / Metula | "מטולה מקבלת מאות מילימטרים של גשם בשנה" (israel-climate). No number. | Kefar Giladi **757** (about 2–3 km south of Metula; Metula itself isn't in the table) | **750** | external |
| Safed | none (israel-climate gives Safed's height, ~900 m) | Zefat Har Kenaan **688**; Meron 881; Harashim 988 (higher western Upper Galilee) | **690** | external |
| Golan | none | Merom Golan Picman **811**; El Rom 901; Gamla 578 (southern Golan, lower) | **850** (northern/central Golan) | external |
| Hermon slopes | none (natural-water-sources: Hermon snow and rain feed the Jordan) | Majdal Shams **≈1,100** (derived: 1,131 mm reported as 103 % of average → ≈1,098). Nimrod Fortress 816; Banias 690 (foot of the mountain) | **1,100** (upper slopes) | external (derived) |
| Haifa / Carmel | none | Haifa Technion **671** (on the Carmel's slope); Haifa Port 566 (coast) | **670** Carmel ridge / **570** Haifa coast | external |
| Kinneret / Tiberias | **≈400** "כנרת מקבלת כ-400 מ"מ בשנה" (weather-phenomena) | Kefar Nahum 443, Ginosar 447 (north-west shore), Zemah 384 (south shore) | **400** | module |
| Tel Aviv | **≈520** (weather-phenomena; climate-zones, twice) | Tel Aviv Coast **443**; Bet Dagan 541; Kefar Shmaryahu 534 | **520** | module |
| Jerusalem | **≈550** (weather-phenomena; climate-zones "ירושלים … גשם: 550 מ"מ, רק בחורף") | Jerusalem Center **522**; Zova 656 (western edge) | **550** | module |
| Western slopes: Shephelah | none (israel-climate: west-facing slopes get more) | Beit Jamal **506**; Netiv HaLamed-Heh 452 | **480** lower Shephelah | external |
| Western slopes: Judean foothills / upper slopes | none | Zur Hadassa **636**; Rosh Zurim 558 | **620** upper western slopes | external |
| Judean Desert (just east of the ridge) | rain shadow, no number (israel-climate) | Ma'ale Adummim **276** (desert edge about 7 km east of Jerusalem) | **270** desert edge | external |
| Dead Sea | none | Sedom **39**; Beit HaArava 94; Gilgal 171 (Jordan Valley, further north) | **40** | external |
| Be'er Sheva | aridity line ≈200 mm (israel-climate, no Be'er Sheva number) | Beer Sheva **197** | **200** | external (matches module's 200 mm line) |
| Central Negev | none | Sede Boqer **87**; Mizpe Ramon 70 | **80** | external |
| Eilat | **≈25** (weather-phenomena; climate-zones) | Eilat **22**; Timna 25 | **25** | module |

Patterns the table must keep (all **[module]**, israel-climate and weather-phenomena):
- North → south: Metula 750 > Tel Aviv 520 > Be'er Sheva 200 > central Negev 80 > Eilat 25.
- West → east across the ridge: western slopes 620 / Jerusalem 550 > Judean Desert edge 270 > Dead Sea 40.
- The mountain gets more than the coast at the same latitude: Jerusalem 550 > Tel Aviv 520
  (weather-phenomena: "ירושלים יותר גשומה מתל אביב כי הרים גורמים לאוויר הלח לעלות ולהתקרר").
- Same latitude, different height: Safed (~900 m, 690) vs Tiberias/Kinneret (below sea level, 400)
  (israel-climate: "טבריה … וצפת … כמעט על אותו קו רוחב. הגובה … יוצר ביניהן את ההפרש").

### Module vs IMS disagreements (record only; game uses the module value)
- Tel Aviv: module 520 vs IMS Tel Aviv Coast 443 (Bet Dagan, inland, 541). The module figure is close to older or inland
  normals. Keep 520.
- Jerusalem: module 550 vs IMS Jerusalem Center 522.
- Kinneret: module 400 vs IMS 384–447 depending on the shore. 400 is fine.
- Eilat: module 25 vs IMS 22.
The modules agree with each other on all four (weather-phenomena and climate-zones both give TA 520, Jerusalem 550, Eilat 25).

### One real season, for Level 16 (weather vs climate) [העשרה / external]
Same IMS table, season 2025/26: **Beer Sheva 328 mm = 166 % of the 197 mm average**. IMS adds that in more than
100 years of Beer Sheva records only 3 seasons were wetter (last in 1971/72). Eilat 19 mm (86 %). Gush Dan was
below 70 % in places (Tel Aviv Coast 416 mm, 94 %; Ben Gurion Airport 400 mm, 74 %).
→ One very wet season in the same country, the same year, as dry pockets elsewhere. Adding one 328 mm season to
a 30-year mean of 197 moves the mean by only (328 − 197)/30 ≈ **+4.4 mm**.

---

## 2. Elevations (m above sea level)

| Place | Module [module] | External [העשרה / external] | **Game value** |
|---|---|---|---|
| Tel Aviv | "תל אביב יושבת ברמת הים" (weather-phenomena) | about 5 m (Wikipedia "Tel Aviv"); the city spans roughly 0–40 m | **10** |
| Haifa / Carmel ridge | none | Highest point 546 m near Isfiya (Britannica "Mount Carmel", https://www.britannica.com/place/Mount-Carmel); Wikipedia infobox 525 m | **500** ridge crest (schematic) |
| Jerusalem | **800 m** (weather-phenomena, twice: "ירושלים יושבת בגובה 800 מ'") | Jerusalem is about 754 m (Wikipedia "Jerusalem"); city spread roughly 700–830 m | **800** |
| Safed | **≈900 m** "צפת על הר שגובהו כ-900 מטר" (israel-climate) | — | **900** |
| Mount Meron (for Level 10's Galilee ridge) | none | 1,204 m (Wikipedia "Mount Meron") / 1,208 m (other sources) | **1,200** (schematic ridge) |
| Hermon summit in Israel | **≈2,236 m** "כ-2,236 מטרים בשלוחת החרמון שבשליטת ישראל" (landform-belts) | — | **2,236** |
| Kinneret | **≈−200 m** "כמאתיים מטרים מתחת לפני הים" (natural-water-sources); Tiberias "מתחת לפני הים" (israel-climate) | lake level fluctuates around −209 to −215 m | **−210** |
| Dead Sea shore | **below −430 m**, dropping about 1 m/yr "יותר מ-430 מטרים מתחת לפני הים … ממשיך לרדת בכמטר בכל שנה" (landform-belts) | about −436 to −438 m in 2022–2024 (Guinness World Records citing Israel's Environmental Protection Ministry, about 1.1 m/yr) | **−435** (schematic "about") |
| Be'er Sheva | none | about 260–300 m (Wikipedia "Beersheba") | **280** |
| Eilat | none (coastal) | sea level | **0** |

Vertical exaggeration of the diorama is a separate art value, stated in the credits.

---

## 3. Saturation vapor capacity by temperature

**Workbook gives no capacity table.** weather-phenomena gives only the concepts (לחות יחסית = the percentage of the
maximum the air can hold; at 100 % → רוויה). So every number below is **[העשרה / external]**.

Source 1 (table): HyperPhysics, R. Nave, Georgia State University, "Saturated Vapor Pressure and Density for Water",
https://hyperphysics.gsu.edu/hbase/Kinetic/watvap.html (accessed 2026-10-31): −10 °C 2.36, 0 °C 4.85, 5 °C 6.8,
10 °C 9.4, 15 °C 12.83, 20 °C 17.3, 25 °C 23.0, 30 °C 30.4, 40 °C 51.1 g/m³.
Source 2 (formula, fills 5 °C steps and checks source 1): Bolton, D. (1980), "The computation of equivalent potential
temperature", *Monthly Weather Review* 108, 1046–1053: eₛ(T) = 6.112·exp(17.67·T/(T+243.5)) hPa over liquid water.
Vapor density ρᵥ = eₛ/(Rᵥ·T_K), Rᵥ = 461.5 J kg⁻¹ K⁻¹. The two agree to within 0.1 g/m³ at every listed point.

| T (°C) | eₛ (hPa) | **Capacity (g/m³)**, game value | g/kg at sea level (for reference) |
|---:|---:|---:|---:|
| −10 | 2.87 | **2.36** | 1.8 |
| −5 | 4.22 | **3.41** | 2.6 |
| 0 | 6.11 | **4.85** | 3.8 |
| 5 | 8.72 | **6.79** | 5.4 |
| 10 | 12.27 | **9.39** | 7.6 |
| 15 | 17.04 | **12.81** | 10.6 |
| 20 | 23.37 | **17.27** | 14.7 |
| 25 | 31.67 | **23.02** | 20.1 |
| 30 | 42.46 | **30.35** | 27.2 |
| 35 | 56.31 | **39.60** | 36.6 |
| 40 | 73.95 | **51.17** | 49.0 |

Implementation note for the lead (tuning): either interpolate linearly between the rows or use the closed form
`capacity(T) = 216.7 * 6.112 * exp(17.67*T/(T+243.5)) / (T + 273.15)` g/m³ (216.7 = 100·1000/461.5).
Below 0 °C the values are over **liquid water** (as in HyperPhysics). Over ice they would be a little lower
(−10 °C: 2.14). We ignore that difference, and it's labelled simplified. The game treats the parcel as a fixed volume.
Real parcels expand as they rise, which we also ignore.

Rule of thumb you can show (from the table): **every +10 °C roughly doubles the capacity** (5→15 °C: 6.8→12.8; 20→30 °C: 17.3→30.4).

---

## 4. Altitude cooling (lapse rate)

- **[module]** atmosphere: weather happens in the troposphere, and "ככל שעולים גבוה יותר, הלחץ יורד ויש פחות אוויר"
  (no temperature rate). weather-phenomena: Jerusalem (800 m) is cold enough for snow while Tel Aviv at sea level
  is not. israel-climate: "ככל שעולים בהר האוויר מתקרר", and, importantly, **"הגובה, שמוריד את הטמפרטורה בכמה עשיריות
  המעלה על כל מאה מטרים של עלייה"**. So Workbook *does* give a rough magnitude ("a few tenths of a degree per
  100 m"), though not an exact number. The handoff's "Workbook gives no number" is slightly stronger than the source says.
- **[העשרה / external]** Standard atmosphere: the troposphere's mean environmental lapse rate is 6.5 °C per km
  (U.S. Standard Atmosphere 1976, NOAA/NASA/USAF, https://www.ngdc.noaa.gov/stp/space-weather/online-publications/miscellaneous/us-standard-atmosphere-1976/us-standard-atmosphere_st76-1562_noaa.pdf;
  the same value as the ICAO Standard Atmosphere). The dry adiabatic rate is about 9.8 °C/km and the saturated one about 4–7 °C/km
  (not to be taught).
- **Game value [tuning, displayed as העשרה]: 0.6 °C per 100 m**, the same rate going up and coming down.
  Reasons: it fits Workbook's "כמה עשיריות המעלה", it's close to the standard 0.65, it's easy to do in your head
  (800 m → −4.8 °C), and a single rate keeps the displayed rule honest. The rain shadow still emerges because
  (a) the water was rained out on the windward side, and (b) the lee descent is long (Jerusalem 800 m → Dead Sea −435 m
  = 1,235 m → +7.4 °C).
  Worked check: saturated at the ridge, 800 m, 7 °C → capacity ≈ 7.7 g/m³. Descend to −435 m → 14.4 °C →
  capacity ≈ 12.4 g/m³ → RH ≈ **63 %**, which matches the replay line in GAME_IDENTITY ("הלחות ירדה ל־60%").
- Optional [tuning]: if playtests show the shadow is too weak, use 1.0 °C/100 m for *unsaturated descent only*
  (a dry adiabatic flavour) without displaying a second number. Not recommended for the first build.

Display text (Hebrew, העשרה badge): «בערך 0.6° פחות על כל 100 מ' של עלייה (העשרה – ערך מקורב)».

---

## 5. Rain / mixed / snow by temperature (simplified)

- **[module]** weather-phenomena: droplets "נופלות בצורות שונות בהתאם לטמפרטורה"; Jerusalem gets snow because at
  800 m "הטמפרטורה נמוכה מספיק". No threshold given.
- **[העשרה / external]** Jennings, K. S., Winchell, T. S., Livneh, B., Molotch, N. P. (2018), "Spatial variation of
  the rain–snow temperature threshold across the Northern Hemisphere", *Nature Communications* 9, 1148,
  https://doi.org/10.1038/s41467-018-03629-7 (PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC5861046). The surface air
  temperature at which rain and snow are equally likely averages **1.0 °C** (−0.4 to 2.4 °C for 95 % of stations),
  and relative humidity matters most between about 0.6 and 3.4 °C. Maritime climates have cooler thresholds.
- **Game rule [tuning, labelled simplified]**, applied to the parcel/surface temperature at the pour point:

| T at pour point | Result | Hebrew label |
|---|---|---|
| T ≤ 1.0 °C | snow | שלג |
| 1.0 °C < T < 3.0 °C | mixed / slush (the "sad snowman") | גשם מעורב בשלג (שלג רטוב) |
| T ≥ 3.0 °C | rain | גשם |

  Consistency check with 0.6 °C/100 m. For Jerusalem to get snow (≤1 °C at 800 m) the storm's sea-level temperature must be
  **≤5.8 °C**. Suggested Level 7 storm: 5 °C at sea level → Tel Aviv 4.9 °C rain, Shephelah 450 m 2.3 °C slush,
  Jerusalem 800 m 0.2 °C snow, Safed 900 m −0.4 °C snow, Hermon 2,236 m −8.4 °C snow.
  Real Jerusalem snow days usually have Tel Aviv around 6–9 °C, an observed gap of about 0.7–1 °C/100 m in cold
  unstable air. Our 0.6 makes the storms a little colder than real. That's fine, because the map is labelled schematic.

---

## 6. Sea breeze timing

- **[module]** weather-phenomena: in the day the land heats faster than the sea, a שקע forms over the coast and a
  רמה over the sea, the breeze blows sea → land, **"בשעות אחר הצהריים הבריזה מגיעה לשיאה"**, **"בלילה – ההפך"**, and
  "תל אביב נעימה בבוקר ולחה בצהריים". sun-energy: dark/low-albedo surfaces (asphalt) absorb more.
- **[העשרה / external]** Naor, Potchter, Shafir & Alpert (2015), *Theoretical and Applied Climatology*: the
  Mediterranean sea breeze develops in the morning along the coast and penetrates inland in the afternoon
  (https://www.tau.ac.il/~pinhas/papers/2017/Naor_et_al_TAC_2015-final.pdf). Uzan & Alpert (2012): sea-breeze transport
  of pollutants inland is measured 12:00–15:00 local time (https://www.tau.ac.il/~pinhas/papers/2012/Uzan_Alpert_TOASJ_2012.pdf).
- **Game model [tuning]**: breeze strength ∝ (T_land − T_sea) with a summer day curve:
  dawn 05:00–08:00 **0** (no breeze, land ≈ sea); onset **≈10:00**; peak **13:00–15:00**; fades by sunset
  **≈18:00–19:00**; night: weak land breeze offshore (optional, never needed to win). Level 4's dial options: dawn / 10:00 / 14:00.
  Summer sea-breeze clouds give **shade, not rain** (summer is dry, israel-climate). Don't award rain in Level 4.

## 7. Khamsin

- **[module]** weather-phenomena: hot, dry, dusty air from the deserts of Arabia and Africa, very low humidity,
  high temperatures, low visibility, **common in the transitional seasons (March–May, September–November)**.
  atmosphere: it happens in the troposphere and arrives "כתוצאה מסידור לחץ אטמוספרי (שקע עמוק)". (See the inconsistencies in CURRICULUM.md.)
- **Game model [tuning]**: a khamsin cell adds about +8 to +12 °C to parcel temperature and pulls the
  water toward a low ambient RH (about 10–20 %). Over the sea and high up the effect is weaker. Level 13 is set in **April**.

## 8. Aridity line and the three climates

- **[module]** israel-climate: **קו הצחיחות = the line joining places that get about 200 mm of rain a year**. It's a rough
  boundary between arid and semi-arid, and from it southward rain-fed (בעל) farming isn't possible. Three climates:
  ים תיכוני (north and centre, rainy winter, dry summer), ערבתי (a narrow transition belt around the aridity line),
  מדברי (south, very little rain, a large temperature range).
- **Game classification [tuning]**: desert < 200 mm; steppe 200 to about 350 mm; Mediterranean ≥ about 350 mm. The
  Workbook modules give **no** upper number for the steppe belt. 350 is ours. Don't display it as a fact; show only the 200 mm line.
- Rainy season **[module]**, climate-zones: almost no rain June–September; most rain November–March.

## 9. Monsoon, fronts and convective rain: can they be used?

- **מונסון [module, weather-phenomena]**: it appears in the text, not only the keywords: "מונסון – הודו ודרום מזרח אסיה:
  עונת גשמים דרמטית שנגרמת מהבדל לחץ בין ים ויבשה. בקיץ, הודו מתחממת יותר מהאוקיינוס, נוצר שקע ענק ורוח לחה מהים
  מביאה גשמים כבדים." climate-zones also mentions Diwali and the end of the monsoon season.
  **Verdict:** usable as a *transfer/flavour* line (the same land–sea heating rule as the sea breeze, at a continental
  and seasonal scale, giving summer rain, which contrasts with Israel's dry summer under a ג). Not usable as an Israel
  mechanic or as an assessed skill. Suggested use: one optional line in the Level 15 replay (see CURRICULUM.md).
- **Fronts (חזית) and convective / orographic rain terminology (הסעה, קונבקטיבי, אורוגרפי)**: **absent from all
  seven snapshots** (a text search for חזית, הסעה, קונבק, אורוגרפ, ברד and ברק finds nothing). "סופת רעמים" appears only in the
  atmosphere module's tornado card. **Verdict:** don't name them. Use the module's own wording: "המדרון המערבי מאלץ את
  האוויר הלח לעלות, להתקרר ולהתעבות" (israel-climate) for slope lift, and "השמש מחממת אזור, האוויר … נעשה קל ועולה"
  (weather-phenomena) for heating-driven rising. Lightning can be a visual only, with no term or explanation.

## 10. Quick reference for the rule model

| Quantity | Value | Tag |
|---|---|---|
| Wind direction | from ג to ל; stronger with a bigger pressure difference | module |
| Lapse rate (up and down) | 0.6 °C / 100 m | tuning, shown as העשרה |
| Capacity | table §3 (≈ doubles per +10 °C) | external |
| Pour allowed | RH ≥ 100 % | module (rule) |
| Snow / mixed / rain | ≤1 / 1–3 / ≥3 °C | tuning (simplified), external basis |
| Aridity line | 200 mm/yr | module |
| Climate averaging period | ≥ 30 years | module |
| Khamsin season | Mar–May, Sep–Nov | module |
| Rainy season | Nov–Mar (none Jun–Sep) | module |
| Sea breeze | 0 at dawn, onset ≈10:00, peak 13–15, fades ≈18–19 | module (peak) + tuning (hours) |
