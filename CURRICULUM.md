# Cloud Shepherd · רועה העננים: curriculum map

**Scope authority:** Workbook geography, grade 8 chapter 3 (מזג אוויר ואקלים) and grade 9 chapter 2 (מערכות הנוף
בישראל). The seven snapshots, retrieved 2026-10-31, are in `docs/curriculum/`, with URLs and hashes in
`docs/curriculum/SOURCES.md`. Every number the rule model uses, and its source, is in `docs/research/model-values.md`.
Workbook defines the requested scope. **No Ministry of Education approval or endorsement is claimed.** The levels,
missions, numbers and the simplified model are our own teaching scenarios.

Modules used (only these seven IDs):

| Short name | Canonical URL |
|---|---|
| atmosphere | https://geography.workbook.co.il/grade-8/chapter-3/atmosphere |
| sun-energy | https://geography.workbook.co.il/grade-8/chapter-3/sun-energy |
| weather-phenomena | https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena |
| climate-zones | https://geography.workbook.co.il/grade-8/chapter-3/climate-zones |
| israel-climate | https://geography.workbook.co.il/grade-9/chapter-2/israel-climate |
| natural-water-sources | https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources |
| landform-belts | https://geography.workbook.co.il/grade-9/chapter-2/landform-belts |

## Misconception codes

From the build handoff (primary):

- **LH**: wind blows from low (ל) to high (ג).
- **HR**: humidity equals rain (high humidity → it will rain).
- **HV**: clouds rain because they are "heavy"/big, regardless of saturation and temperature.
- **SD**: snow depends on distance from the sea instead of altitude.
- **EW**: the east (lee) side of a mountain gets rain too.
- **WC**: one rainy year (or week) means the climate changed.
- **LS**: land and sea heat at the same rate.

Our additions (secondary, caught where the level naturally exposes them):

- **RN**: rain is spread evenly over Israel, or "enough effort" can water any place (ignores the N→S decrease and the aridity line).
- **KH**: hot wind = a moist/stormy wind (a khamsin brings rain).
- **SUM**: summer has no rain only because "there are no clouds"; a big enough cloud would rain anyway (ignores the summer ג and sinking air).
- **KC**: rain anywhere fills the Kinneret (ignores the catchment and the watershed line).

## Rule summary (what the pure modules compute)

Each rule shows its module source. Numbers come from `docs/research/model-values.md`. Rules marked *(simplified)* are labelled simplified in the game.

1. **Wind ג → ל** (weather-phenomena). Sun-heated air becomes light and rises → שקע (ל, low pressure). Cool air
   sinks → רמה (ג, high pressure). Air always flows from ג to ל, and a bigger pressure difference makes a stronger wind.
   Synoptic maps mark ל and ג. No Coriolis (not taught). *(simplified: the wind vector points straight down the pressure gradient.)*
2. **Humidity and saturation** (weather-phenomena). לחות = the vapor in the air; לחות יחסית = the percentage of the maximum the air can
   hold at its temperature; 100 % = רוויה. Only saturated air that cools further condenses into cloud and rain.
   "לחות גבוהה לא תמיד אומרת גשם." Model: RH = water ÷ capacity(T); **pour works only at RH ≥ 100 %**. Capacity
   from the external table (≈ doubles per +10 °C) *(העשרה)*.
3. **Altitude cooling** (atmosphere: weather happens in the troposphere; weather-phenomena: Jerusalem 800 m snow vs Tel Aviv;
   israel-climate: "כמה עשיריות המעלה על כל מאה מטרים"). Parcel temperature = sea-level temperature − 0.6 °C per 100 m,
   going up and coming down *(0.6 is העשרה / simplified)*. Precipitation type at the pour point: ≤1 °C snow,
   1–3 °C mixed, ≥3 °C rain *(simplified)*.
4. **Land/sea heating and the sea breeze** (weather-phenomena; sun-energy for albedo). In the day the land (sand,
   asphalt) heats much faster than the sea → ל over the coast, ג over the sea → a cool breeze onto the shore that
   **peaks in the afternoon**, with the reverse at night. Model: breeze ∝ land−sea temperature difference by hour (0 at dawn).
5. **Rain shadow** (israel-climate; landform-belts for the relief). The western slope forces moist air up, it cools and
   condenses. Beyond the ridge the air descends and dries, which is the rain shadow (מדבר יהודה). Model: descent → warming
   → capacity rises → RH falls → pouring impossible; the cloud evaporates back into vapor (**water is conserved,
   not destroyed**).
6. **Rain decreases N→S and W→E** (israel-climate; weather-phenomena figures; climate-zones "ממצפון לדרום: ירידה
   בגשם"). Latitude sets the overall picture (Israel is at the northern edge of the desert belt). Sea, altitude and slope
   direction change it locally. Model: storm water supply weakens southward; slope and altitude factors add rain on
   west-facing highs.
7. **Aridity line** (israel-climate). קו הצחיחות ≈ 200 mm/yr; from it southward rain-fed (בעל) farming is impossible.
8. **Three climates** (israel-climate; climate-zones). ים תיכוני (rainy winter, dry summer; north and centre), ערבתי
   (narrow semi-arid transition around the aridity line), מדברי (south; very little rain, large temperature range).
   Climographs: rain in winter = Mediterranean; almost no rain = desert (climate-zones).
9. **Summer high** (israel-climate: the high-pressure desert belt moves north in summer; weather-phenomena: in a ג "אוויר
   יורד, מתחמם, מוריד לחות", and the Israeli summer is "רמה קבועה"). Model: in a ג cell the parcel is pushed down → warms →
   cannot saturate.
10. **Weather vs climate** (weather-phenomena; climate-zones). Weather = the state of the atmosphere now. Climate = an average of
    ≥ 30 years. One rainy autumn does not change Tel Aviv's climate. Real climate change happens over decades.
11. **Khamsin** (weather-phenomena; atmosphere). Hot, dry, dusty air from the deserts of Arabia and North Africa, in the
    troposphere; very low humidity; common in the transitional seasons (Mar–May, Sep–Nov). Model: a hot dry cell
    raises the parcel's temperature and dries it; weaker over the sea and up high *(simplified)*.
12. **Water to the Kinneret and the aquifers** (natural-water-sources). Hermon snow and Galilee rain → Dan, Banias,
    Hatzbani → Jordan → Kinneret. The mountain aquifer is recharged by rain on the Judean and Samarian hills, the coastal aquifer by rain on the
    coastal-plain sands. The watershed line (קו פרשת המים) runs along the mountain spine.

---

## Level map (18 levels)

Each level lists the modules, skill, scenario, state/action relationship (what the player does and which rule decides the
outcome), feedback in Hebrew (success / failure), the misconception it catches, and transfer evidence.
Hebrew lines are proposals. Wrap numbers, units and %, ג/ל tokens in `<bdi>` in the UI. Titles are the handoff's exact
titles; the Hebrew titles are proposals.

### World 1: The Sea and the Shore · הים והחוף

#### 1. First breath · נשימה ראשונה
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (wind ג→ל; humidity/saturation; the Israeli water cycle "התאדות בים התיכון … מתקררים בגובה ומתעבים … עננים נתקלים בהרי ישראל"), https://geography.workbook.co.il/grade-9/chapter-2/landform-belts (coastal plain → Carmel relief).
- **Skill:** the water-cycle chain: evaporation over a warm sea → the west wind carries vapor → rising up a slope cools → saturation → rain.
- **Scenario:** warm sea west of the Carmel, tutorial wind arrows toward a ל to the east. A farmer's field waits on the Carmel's **western slope or ridge top** (not in the Jezreel lee, so the tutorial doesn't contradict Level 8).
- **State/action:** the player only steers sideways in the current. Over the sea, water grows (evaporation). On the slope, altitude follows the terrain → T falls 0.6 °C/100 m → capacity falls → RH rises. Hold Space to pour. **Rule:** `canPour = RH ≥ 100 %`.
- **Feedback:** ✔ «הגעתם ל־<bdi>100%</bdi> – האוויר רווי! התקררתם על המדרון, והגשם יורד על השדה.» ✘ (pour early) «<bdi>85%</bdi> זה עוד לא רוויה. תנו למדרון להרים אתכם – בגובה מתקררים.»
- **Misconception:** HR (introduced), LH (arrows show ג→ל).
- **Transfer evidence:** none (tutorial). Log the RH of the first pour attempt as a baseline.

#### 2. Full but dry · מלא אבל יבש
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena ("לחות גבוהה לא תמיד אומרת גשם. צריך שהאוויר יגיע לרוויה ויתקרר").
- **Skill:** relative humidity is a share of a temperature-dependent maximum. Cooling, not size, brings saturation.
- **Scenario:** ענני is large, grey and at 90 % over the warm coast. Pouring does nothing. A slope or rising air inland gives the cooling.
- **State/action:** pour at 90 % → nothing falls, the ring flashes. The player must ride to higher ground. **Rule:** RH = water ÷ capacity(T); capacity falls as T falls; `canPour = RH ≥ 100 %`.
- **Feedback:** ✔ «עליתם, התקררתם, והאוויר כבר לא יכול להחזיק את כל האדים – <bdi>100%</bdi>. עכשיו יורד גשם.» ✘ «<bdi>90%</bdi> זה עוד לא רוויה. לחות גבוהה לא תמיד אומרת גשם – צריך לעלות ולהתקרר.»
- **Misconception:** **HR**, **HV** (a big, dark-ish cloud at 90 % still can't rain).
- **Transfer evidence:** in Levels 6 and 18, count pour attempts below 100 % before the first success (fewer = transfer).

#### 3. From ג to ל · מ־ג אל ל
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena ("אוויר תמיד זורם מהרמה אל השקע"; synoptic map letters).
- **Skill:** predict the wind from the pressure letters; a bigger difference means a stronger wind.
- **Scenario:** a forest fire on the Carmel. A ג sits over the sea. Choose one of three ל slots; only one makes the flow pass over the fire.
- **State/action:** place a ל token, then launch. **Rule:** the wind field points from ג to ל, with strength ∝ pressure difference ÷ distance. One distractor slot is the "reverse" choice that would work only if the wind blew ל → ג.
- **Feedback:** ✔ «בדיוק! האוויר זרם מהרמה אל השקע – ישר אל היער הבוער.» ✘ «הרוח זרמה מה־<bdi>ג</bdi> אל ה־<bdi>ל</bdi> שהנחתם, והרחיקה אתכם מהכרמל. רוח נושבת תמיד מלחץ גבוה ללחץ נמוך.»
- **Misconception:** **LH**.
- **Transfer evidence:** Level 5 (new layout, no arrows).

#### 4. Sea breeze · בריזת ים
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (the sea-breeze question: the beach heats faster, ל over the coast, ג over the sea, "בשעות אחר הצהריים הבריזה מגיעה לשיאה"; "בלילה – ההפך"), https://geography.workbook.co.il/grade-8/chapter-3/sun-energy (sand/asphalt absorb more; albedo).
- **Skill:** differential heating of land and sea creates a local ל/ג pair and a breeze that depends on the time of day.
- **Scenario:** a summer day in Tel Aviv. A sunburnt lifeguard needs shade. The time dial offers dawn / 10:00 / 14:00.
- **State/action:** choose the hour, then launch. **Rule:** breeze strength ∝ T_land − T_sea(hour): 0 at dawn, onset ≈10:00, peak 13–15. At dawn ענני drifts nowhere. **Goal is shade, not rain** (summer is dry, israel-climate), so pouring is disabled or produces nothing.
- **Feedback:** ✔ «בצהריים החוף התחמם הרבה יותר מהר מהים. נוצר שקע מעל החוף, והבריזה הביאה אתכם אל המציל.» ✘ (dawn) «בשחר החוף והים כמעט באותה טמפרטורה – עוד אין שקע מעל החוף, ואין בריזה.»
- **Misconception:** **LS**.
- **Transfer evidence:** Level 5 (reading ג/ל without arrows). Level 15's optional monsoon line (the same rule at a continental scale).

#### 5. Transfer, the forecaster's map · העברה: המפה של החזאי
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena ("מפות שמציגות את אזורי הלחץ נקראות מפות סינופטיות … מטאורולוגים קוראים מפות אלה כדי לחזות").
- **Skill:** read a synoptic-style map (letters only) and predict the path.
- **Scenario:** plan view with only ג/ל letters, relief and a target (for example a thirsty orchard in the Jezreel Valley). The layout is rotated or mirrored compared with Level 3, so a memorized slot fails. No arrows. Place one token and launch.
- **State/action:** one token placement, then flight with lateral steering only. **Rule:** the same wind field as Level 3.
- **Feedback:** ✔ «קראתם מפה סינופטית כמו חזאים – מ־<bdi>ג</bdi> אל <bdi>ל</bdi>, בלי חצים.» ✘ «המסלול יצא מה־<bdi>ג</bdi> ונמשך אל ה־<bdi>ל</bdi> הקרוב ביותר – לא אל המטע. איפה צריך לשים את ה־<bdi>ל</bdi> כדי שהרוח תעבור מעליו?»
- **Misconception:** **LH**.
- **Transfer evidence:** **first-attempt success without a hint** on an unseen layout. Log the token slot chosen first.

### World 2: Over the Mountains · מעל ההרים

#### 6. Up the slope · במעלה המדרון
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("המדרון המערבי מאלץ את האוויר הלח לעלות, להתקרר ולהתעבות לעננים"), https://geography.workbook.co.il/grade-9/chapter-2/landform-belts (coastal plain → mountain spine), https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (Jerusalem gets more rain than Tel Aviv because of the mountains).
- **Skill:** slope lift → cooling → saturation on the windward (western) slopes.
- **Scenario:** a west wind carries ענני from the coast over the Shephelah up the Judean foothills; terraced fields on the western slopes.
- **State/action:** steer to the slope that the wind will climb; pour when the RH ring is full. **Rule:** terrain altitude → T(h) → capacity → RH; `canPour = RH ≥ 100 %`.
- **Feedback:** ✔ «המדרון המערבי הרים אתכם, התקררתם והגעתם לרוויה – הגשם ירד בדיוק על המדרונות.» ✘ «במישור החוף עוד חם מדי – הלחות רק <bdi>92%</bdi>. תנו למדרון להרים אתכם.»
- **Misconception:** HR, HV.
- **Transfer evidence:** Level 10 (an unlabeled ridge with a different orientation).

#### 7. Snow in Jerusalem, rain in Tel Aviv · שלג בירושלים, גשם בתל אביב
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena ("ירושלים יושבת בגובה 800 מ' … תל אביב יושבת ברמת הים … גורם הגובה הוא גורם מקומי קריטי"), https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("בצפת ובירושלים יורד לעיתים שלג"), https://geography.workbook.co.il/grade-8/chapter-3/atmosphere (troposphere).
- **Skill:** precipitation type depends on the temperature at your altitude.
- **Scenario:** one cold winter storm (sea level 5 °C). Targets: rain for Tel Aviv, snow for the snowman contest in Jerusalem. *Optional decoy:* kids in a low inland place (for example Tiberias, below sea level and far from the Mediterranean) also want snow, and it can't happen there.
- **State/action:** decide where to pour and how much water to save for the climb. **Rule:** T at the pour point = 5 − 0.6 × h/100 → ≤1 °C snow, 1–3 °C mixed, ≥3 °C rain. Tel Aviv 4.9 °C rain; Shephelah 450 m 2.3 °C slush; Jerusalem 800 m 0.2 °C snow.
- **Feedback:** ✔ «בתל אביב, בגובה פני הים, ירד גשם. בירושלים, בגובה <bdi>800</bdi> מ', קר מספיק – שלג!» ✘ (slush) «בגובה <bdi>450</bdi> מ' עוד <bdi>2°</bdi> – יצא גשם מעורב בשלג, ובובת השלג נמסה. עלו גבוה יותר.» ✘ (decoy) «טבריה רחוקה מהים, אבל היא מתחת לפני הים – שם חם מדי לשלג. מה שקובע הוא הגובה, לא המרחק מהים.»
- **Misconception:** **SD**, HV.
- **Transfer evidence:** Level 9 (Hermon vs the Hula floor), Level 18 (snow in Jerusalem and on Hermon, unaided).

#### 8. Rain shadow · צל גשם
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("מעבר לרכס האוויר יורד ומתייבש … מזרחית לקו הרכס נוצר צל גשם שבו משתרע מדבר יהודה"), https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources ("אקוויפר ההר נטען מן הגשם שמחלחל בהרי יהודה ושומרון"; watershed along the mountain spine), https://geography.workbook.co.il/grade-9/chapter-2/landform-belts (the sharp drop to the rift).
- **Skill:** windward vs lee: descending air warms and its RH falls, so the east of the ridge stays dry.
- **Scenario:** fill the mountain aquifer's recharge zone (ridge and western slopes) with one storm. A bonus sign east of the ridge («הפריחו את המדבר!») is the trap. Stars come from water delivered into the recharge zone.
- **State/action:** decide where to pour before the ridge, and resist crossing full. **Rule:** descent Δh → T += 0.6 × Δh/100 → capacity ↑ → RH ↓ → `canPour` false. The cloud evaporates back into vapor (water conserved). Replay draws the track coloured by RH.
- **Feedback:** ✔ «מילאתם את אזור ההחדרה של אקוויפר ההר. מזרחית לרכס האוויר יורד ומתחמם – ולכן שם משתרע מדבר יהודה.» ✘ «ירדתם <bdi>1,200</bdi> מ' מזרחית לרכס, התחממתם והלחות ירדה ל־<bdi>63%</bdi>. הענן התאדה בחזרה לאדים – בלי טיפה אחת למדבר.»
- **Misconception:** **EW**.
- **Transfer evidence:** Level 10 (predict the wet and shadow sides of an unseen ridge), Level 17 (avoid the shadow while filling the Kinneret).
- **Note:** say «התאדה בחזרה לאדים», never «נעלם». The water still exists as vapor (water is conserved, as COMMON.md requires).

#### 9. Hermon · החרמון
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources ("הירדן נוצר ממפגש של נחלים איתנים שמקורם בשלג ובמשקעים של החרמון"; Dan, Banias, Hatzbani), https://geography.workbook.co.il/grade-9/chapter-2/landform-belts (Hermon about 2,236 m), https://geography.workbook.co.il/grade-9/chapter-2/israel-climate (altitude cools; the north gets more).
- **Skill:** at high altitude even a mild storm gives snow. The snowpack is stored water that feeds the Jordan's sources in spring.
- **Scenario:** climb the northern current up the Hermon. At the summit, snow. A time-lapse shows spring melt flowing into the three streams.
- **State/action:** choose the right current at the junction (one stays low over the Hula Valley) and pour high. **Rule:** a mild storm (sea level 10 °C) → summit 2,236 m ≈ −3.4 °C snow; Hula floor (≈70 m) ≈ 9.6 °C rain.
- **Feedback:** ✔ «שלג על פסגת החרמון! באביב הוא יימס ויזין את הדן, הבניאס והחצבני – מקורות הירדן.» ✘ «בעמק החולה חם מדי לשלג – ירד גשם. כדי לבנות מאגר שלג צריך לעלות לפסגה.»
- **Misconception:** **SD** (Hermon is inland *and* high; the low inland Hula gets only rain).
- **Transfer evidence:** Level 18 (snow on Hermon without labels).

#### 10. Transfer, a new ridge · העברה: רכס חדש
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("כיוון המדרון מכריע אם המדרון פונה אל הרוחות הגשומות מן הים או מסתתר מאחורי הרכס"), https://geography.workbook.co.il/grade-9/chapter-2/landform-belts.
- **Skill:** windward/lee from the wind direction alone, on a ridge never seen before.
- **Scenario:** the Galilee at night, with lightning (visual only; no term taught). An unlabeled ridge (schematic, about 1,200 m, Meron-like). **Use an east–west ridge** (the Galilee's ridges run roughly E–W) with a south-west wind from the ג/ל letters, so the *south*-facing slope is windward. "West is always wet" then fails, while the geography stays real. The player marks the wet side and the shadow side, then launches to check.
- **State/action:** one prediction (tap a side), then flight. **Rule:** the windward slope is the one facing the incoming wind → lift; the opposite slope → descent and drying.
- **Feedback:** ✔ «צדקתם: הצד שפונה אל הרוח קיבל את הגשם, והצד שמאחורי הרכס נשאר בצל גשם.» ✘ «סימנתם את הצד המזרחי כרטוב, אבל הרוח הגיעה מדרום־מערב – הצד הדרומי פגש אותה ראשון.»
- **Misconception:** **EW**, plus memorizing "west = wet".
- **Transfer evidence:** **prediction correct on the first attempt, unaided, on a new ridge orientation**. Log prediction vs outcome separately from the flight result.

### World 3: Israel's Rain Map · מפת הגשם

#### 11. North gets more · הצפון מקבל יותר
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("כמות המשקעים יורדת מכמה מאות מילימטרים בשנה בגליל לעשרות בודדות באילת"; "גשום יותר בצפון ובמערב"), https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (Kinneret about 400, Tel Aviv about 520, Jerusalem about 550, Eilat about 25 mm), https://geography.workbook.co.il/grade-8/chapter-3/climate-zones ("ממצפון לדרום: ירידה בגשם").
- **Skill:** the N→S (and W→E) rainfall gradient as a map pattern.
- **Scenario:** one winter with a fixed number of storms (for example 8). Each region has a yearly target from model-values §1 (Metula 750, Safed 690, Tel Aviv 520, Jerusalem 550, Be'er Sheva 200, Eilat 25…).
- **State/action:** route each storm (token placement and pour decisions). **Rule:** a storm's water budget shrinks with distance south of its entry point; west-facing highs get a slope bonus; the lee gets a penalty. The north reaches its target easily, and the south can't be over-filled.
- **Feedback:** ✔ «כל אזור קיבל את הכמות השנתית שלו: הצפון הכי הרבה, הדרום הכי מעט – בדיוק כמו במפת הגשם של ישראל.» ✘ «שלחתם שלוש סערות לנגב, אבל הן נחלשו בדרך והגיעו כמעט יבשות. הגשם בישראל פוחת מצפון לדרום.»
- **Misconception:** **RN**, EW.
- **Transfer evidence:** Level 12 (the aridity line), Level 17.

#### 12. The aridity line · קו הצחיחות
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("קו הצחיחות: קו 200 מ״מ גשם"; "ממנו ודרומה כבר אי אפשר להסתמך על חקלאות בעל").
- **Skill:** use the 200 mm boundary to judge where rain-fed farming works.
- **Scenario:** farmers at several latitudes ask where to sow wheat without irrigation. Fields south of the line fail however you fly. At the end the line is drawn on the map.
- **State/action:** choose which fields to serve and route storms. **Rule:** a field succeeds if its modeled seasonal rain is ≥ 200 mm. Storm budgets die out southward (Level 11's rule), so southern fields cannot reach 200.
- **Feedback:** ✔ «החיטה צמחה בשדות שמצפון לקו הצחיחות – שם יורדים יותר מ־<bdi>200</bdi> מ״מ בשנה.» ✘ «השדה ליד מצפה רמון קיבל רק כ־<bdi>80</bdi> מ״מ. מדרום לקו הצחיחות אי אפשר לגדל חיטה בלי השקיה.»
- **Misconception:** **RN**.
- **Transfer evidence:** Level 14 (Be'er Sheva's climograph on the line), Level 18.

#### 13. Khamsin · חמסין
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (khamsin: hot, dry, dusty air from the deserts of Arabia and Africa, very low humidity, "נפוץ בתקופות המעבר (מרץ-מאי, ספטמבר-נובמבר)"; יורה/מלקוש), https://geography.workbook.co.il/grade-8/chapter-3/atmosphere (khamsin happens in the troposphere, arriving through a pressure arrangement).
- **Skill:** hot, dry air raises the capacity and lowers RH, so it dries a cloud. Seasonality of the khamsin.
- **Scenario:** spring (April). A khamsin pushes in from the south-east. Survive the crossing (stay high and over the sea) and bring the season's last rain (מלקוש) to the Galilee.
- **State/action:** choose a route and altitude band through the hot cell. **Rule:** inside the khamsin cell T += ≈10 °C and ambient RH ≈ 10–20 % → capacity ↑, water evaporates. The effect is weaker over the sea and higher up.
- **Feedback:** ✔ «שרדתם את החמסין! נשארתם גבוה ומעל הים, ושמרתם מספיק מים למלקוש בגליל.» ✘ «נכנסתם לאוויר החם והיבש של החמסין. הטמפרטורה קפצה, הלחות היחסית צנחה והטיפות התאדו.»
- **Misconception:** **KH**, HR.
- **Transfer evidence:** Level 18 (a hazard appears without labels). The player avoids hot, dry cells on the first attempt.

#### 14. Climograph detective · בלש הקלימוגרפים
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/climate-zones (how to read a climograph; "אם הגשם בחורף … = ים תיכוני … אם כמעט ללא גשם כלל = מדברי"; Tel Aviv 520, Eilat 25), https://geography.workbook.co.il/grade-9/chapter-2/israel-climate (three climates; steppe around the aridity line).
- **Skill:** link a climograph (monthly temperature line plus rain bars) to a climate type and place.
- **Scenario:** three climographs, three cities: Tel Aviv (Mediterranean, about 520 mm), Be'er Sheva (steppe, about 200 mm), Eilat (desert, about 25 mm). Fly a "season" to each city so its bars match.
- **State/action:** month-by-month pouring builds bars live. **Rule:** match the target totals and the winter-only shape within a tolerance (for example ±15 %). Summer months stay at 0 (no pouring in summer, Level 15's rule).
- **Feedback:** ✔ «הקלימוגרף של באר שבע מתאים: גשם רק בחורף, וכ־<bdi>200</bdi> מ״מ בשנה – אקלים ערבתי, ממש על קו הצחיחות.» ✘ «נתתם לאילת <bdi>150</bdi> מ״מ – זה כבר לא אקלים מדברי. באילת יורדים כ־<bdi>25</bdi> מ״מ בשנה.»
- **Misconception:** RN. Climograph misreading (summer rain = Mediterranean).
- **Transfer evidence:** end card: one **unlabeled** fourth climograph (Jerusalem: winter-only, about 550 mm, summer 26 / winter 9 °C, from climate-zones) to classify, first try unaided.

#### 15. Transfer, summer stays dry · העברה: הקיץ נשאר יבש
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/israel-climate ("בקיץ החגורה נעה צפונה ומשתלטת על האזור, ולכן אין כאן כמעט גשמי קיץ"), https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (in a רמה "אוויר יורד, מתחמם, מוריד לחות"; "קיץ ישראלי הוא בעצם רמה קבועה"), https://geography.workbook.co.il/grade-8/chapter-3/climate-zones (almost no rain June–September).
- **Skill:** a ג (sinking air) prevents saturation; the season decides.
- **Scenario:** summer, a ג over Israel. ענני can't rise or rain. The goal flips: carry water out to sea and wait for winter with the season dial.
- **State/action:** decide *not* to pour, steer seaward, turn the dial to winter (the ג retreats south). **Rule:** inside a ג cell, vertical motion is down → descent warming → RH < 100 % over land, so `canPour` is false.
- **Feedback:** ✔ «בקיץ רמה יושבת מעל ישראל, והאוויר היורד לא נותן לענן לעלות. חיכיתם לחורף – וזה השתלם.» ✘ «ניסיתם לטפס מעל הרמה, אבל האוויר היורד דחף אתכם למטה, חימם וייבש אתכם.»
- *Optional replay line (monsoon, העשרה from weather-phenomena):* «בהודו דווקא בקיץ יורד הכי הרבה גשם: היבשה מתחממת יותר מהאוקיינוס, נוצר שקע ענק, ורוח לחה מהים מביאה מונסון. אותו כלל – מ־ג אל ל – בקנה מידה ענק.»
- **Misconception:** **SUM**, HV.
- **Transfer evidence:** the goal-flip itself. Success requires *not* applying "pour when big" or "always go east". Log whether the first action was a pour attempt.

### World 4: The Long Winter · החורף הארוך

#### 16. Weather or climate? · מזג אוויר או אקלים?
- **Modules:** https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena (the "rainy autumn in Tel Aviv" question; "אקלים נקבע לפי ממוצע של 30 שנה לפחות"), https://geography.workbook.co.il/grade-8/chapter-3/climate-zones (climate as typical temperature and rain).
- **Skill:** distinguish a single event or season from a ≥30-year average.
- **Scenario:** one unusually rainy week. The farmers' council asks whether the climate changed. The player flies a decade-long time-lapse, and a 30-year bar compares the averages. *Real hook (העשרה, IMS):* Be'er Sheva got 328 mm in 2025/26 against a 197 mm 1991–2020 average. Adding it to a 30-year mean moves the mean by only about 4 mm.
- **State/action:** fly the time-lapse (each winter's storms vary), then answer the council (changed / not changed). **Rule:** climate = mean over ≥ 30 seasons; one outlier shifts it by (x − mean)/30.
- **Feedback:** ✔ «שנה גשומה אחת הזיזה את הממוצע הרב־שנתי בכמה מילימטרים בלבד. זה מזג אוויר, לא שינוי אקלים.» ✘ «שבוע גשום אחד הוא מזג אוויר. אקלים הוא ממוצע של <bdi>30</bdi> שנה לפחות – בדקו שוב את הממוצע.»
- **Misconception:** **WC**.
- **Transfer evidence:** a variant with a *dry* outlier year in another city, answered correctly on the first try. Wording must not imply that climate never changes: the module itself says real climate change happens over decades.

#### 17. Fill the Kinneret · למלא את הכנרת
- **Modules:** https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources (Kinneret level from Hermon and Galilee rain, pumping, summer evaporation; the red line; watershed line), https://geography.workbook.co.il/grade-9/chapter-2/israel-climate (the north gets more; rain shadow).
- **Skill:** catchment thinking: only rain inside the Kinneret's basin raises it; the snowpack releases water later.
- **Scenario:** a multi-storm winter campaign. Rain on the Galilee and the Golan, snow on Hermon, avoid the rain shadow and the Mediterranean-draining side of the watershed. Keep the gauge above the red line through the summer.
- **State/action:** route several storms; choose where to pour. **Rule:** gauge += inflow from the catchment (rain now, snowmelt in spring) − summer evaporation − pumping. Rain west of the watershed drains to the Mediterranean and adds nothing.
- **Feedback:** ✔ «מפלס הכנרת עלה מעל הקו האדום: הגשם בגליל ובגולן והשלג בחרמון זרמו אליה דרך הירדן.» ✘ «רוב הגשם ירד מערבית לקו פרשת המים – המים זרמו לים התיכון ולא לכנרת.»
- **Misconception:** **KC**, EW.
- **Transfer evidence:** Level 18 (Kinneret objective without labels).

#### 18. Final, the great storm (no hints) · הגמר: הסערה הגדולה
- **Modules:** all seven: https://geography.workbook.co.il/grade-8/chapter-3/atmosphere, https://geography.workbook.co.il/grade-8/chapter-3/sun-energy, https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena, https://geography.workbook.co.il/grade-8/chapter-3/climate-zones, https://geography.workbook.co.il/grade-9/chapter-2/israel-climate, https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources, https://geography.workbook.co.il/grade-9/chapter-2/landform-belts (flash-flood dilemma: israel-climate "בנייה במורד ואדי בנגב … הופך לשיטפון בתוך דקות").
- **Skill:** integrate everything: ג→ל routing, saturation, altitude/type, rain shadow, catchment, hazards.
- **Scenario:** night, a long winter storm from the west across Israel. Objectives: rain on the coast, snow in Jerusalem and on Hermon, the Kinneret filled, **no flash flood** in the desert. No hints, no labels.
- **State/action:** place tokens and choose timing; fly. **Rule:** all rules. Flash-flood hazard: heavy pouring on the **upper catchment of a desert wadi** (for example the eastern edge of the ridge above the Judean Desert, where the player can still be saturated) → runoff on bare rock → a flood downstream at the Dead Sea. This keeps the hazard consistent with the rain-shadow rule. It's impossible to pour once you're deep in the shadow.
- **Feedback:** ✔ «סערה מושלמת: גשם בחוף, שלג בירושלים ובחרמון, הכנרת מתמלאת – ואף טיפה מיותרת בוואדי.» ✘ (flood) «שפכתם גשם עז במעלה הוואדי. על סלע חשוף המים לא מחלחלים – הם זורמים במורד הערוץ כשיטפון.»
- **Misconception:** all primary codes (HR, LH, SD, EW), plus KC.
- **Transfer evidence:** **unaided completion** (hint button absent). Log the first-attempt result per objective separately from retries.

---

## Hebrew glossary (handoff terms vs the snapshots)

| Term | Meaning (for the team) | In snapshots | Notes |
|---|---|---|---|
| לחץ אוויר | air pressure | weather-phenomena, atmosphere | "אזור של לחץ אוויר נמוך" |
| רמה (ג) | high-pressure area | weather-phenomena | marked 'ג' (or H) |
| שקע (ל) | low-pressure area | weather-phenomena | marked 'ל' (or L) |
| רוח | wind | weather-phenomena | "זרימה זו היא הרוח" |
| לחות | humidity (vapor in the air) | weather-phenomena | |
| לחות יחסית | relative humidity | weather-phenomena | the % of the maximum at that temperature |
| רוויה | saturation | weather-phenomena | at 100 % |
| התאדות | evaporation | weather-phenomena | water cycle |
| התעבות | condensation | weather-phenomena | |
| משקעים | precipitation | weather-phenomena, israel-climate, climate-zones | |
| ענן | cloud | weather-phenomena | "כך נוצרים עננים" |
| בריזת ים | sea breeze | weather-phenomena | |
| צל גשם | rain shadow | israel-climate | "בצל הגשם" |
| קו הצחיחות | aridity line (≈200 mm) | israel-climate | |
| אקלים ים תיכוני | Mediterranean climate | israel-climate, climate-zones | |
| אקלים ערבתי | steppe (semi-arid) climate | israel-climate | only in grade 9 |
| אקלים מדברי | desert climate | israel-climate, climate-zones | |
| חמסין | khamsin | weather-phenomena, atmosphere | |
| מזג אוויר | weather | weather-phenomena | |
| אקלים | climate | weather-phenomena, climate-zones, israel-climate | |
| קלימוגרף | climograph | climate-zones | |
| מפה סינופטית | synoptic map | weather-phenomena | |
| טרופוספרה | troposphere | atmosphere | "מטבח מזג האוויר" |
| Extra, found in the modules and useful in UI | | | |
| אקוויפר ההר / אקוויפר החוף | mountain / coastal aquifer | natural-water-sources | Level 8 uses the mountain aquifer |
| קו פרשת המים | watershed line | natural-water-sources, landform-belts | Level 17 |
| אגן היקוות | catchment | natural-water-sources | Level 17 |
| הקו האדום | the Kinneret's red line | natural-water-sources | Level 17 |
| שדרת ההר / בקע | mountain spine / rift | landform-belts | relief labels |
| חקלאות בעל | rain-fed farming | israel-climate | Level 12 |
| יורה / מלקוש | first / last rain of the season | weather-phenomena | Level 13 flavour |
| מונסון | monsoon | weather-phenomena, climate-zones | העשרה line only (Level 15) |
| גשם מעורב בשלג / שלג רטוב | sleet / slush | **not in the snapshots** | our wording for the mixed band. Label it simplified |
| חזית, הסעה, גשם אורוגרפי | front, convection, orographic rain | **not in the snapshots** | **don't use** |

---

## Source simplifications and inconsistencies (recorded, not assessed)

These are in the Workbook snapshots. The game avoids turning any of them into an assessed fact.

1. **Khamsin's origin is described two ways in the same module.** atmosphere answers that hot dry air "מגיע ממדבר ערב
   ומצפון אפריקה … כתוצאה מסידור לחץ אטמוספרי (שקע עמוק)", then its takeaway line says "החמסין הוא רוח מקומית ישראלית
   שמקורה בקרינת שמש על מדבריות האזור". weather-phenomena lists it under "רוחות מקומיות" as "רוח ישראלית" while saying the air comes
   from the deserts of Arabia and Africa. *Game:* hot dry desert air carried by the pressure arrangement. We never say "local wind
   caused by solar radiation".
2. **Khamsin season vs synoptic card.** weather-phenomena: "נפוץ בתקופות המעבר (מרץ-מאי, ספטמבר-נובמבר)", but its synoptic card
   says "שקע ערבי בקיץ = חמסין". *Game:* the khamsin level is in spring.
3. **Why Jerusalem gets snow.** weather-phenomena: altitude ("גורם הגובה הוא גורם מקומי קריטי"). atmosphere's storm card:
   "כי היא גבוהה ומרוחקת מהים". The second wording feeds misconception SD. *Game:* altitude decides; distance from the sea is never a rule.
4. **Rainfall figures: modules vs IMS.** The modules agree with each other (Tel Aviv 520, Jerusalem 550, Eilat 25,
   Kinneret 400). IMS 1991–2020 normals differ: Tel Aviv Coast 443 (Bet Dagan 541), Jerusalem Center 522, Eilat 22,
   Kinneret shore stations 384–447. *Game:* module values for those four places; IMS values for regions the modules don't cover
   (details in model-values.md §1).
5. **Lapse rate.** The handoff says Workbook gives no number, but israel-climate says "כמה עשיריות המעלה על כל מאה מטרים". Our
   0.6 °C/100 m fits that phrase and is still labelled העשרה.
6. **"Heavy" droplets and snow formation.** weather-phenomena: droplets fall "כשהן נעשות כבדות מספיק … בהתאם לטמפרטורה",
   and at 800 m "אדי המים יקפאו לשלג". Both are simplifications, and the first can feed misconception HV. *Game:* rain needs
   saturation plus cooling; the type is decided by the temperature at the pour altitude.
7. **The water cycle and the aquifers.** weather-phenomena: rain on Israel's mountains, "חלק מהמים מחלחל לאקוויפר החוף", then tap
   water returns to the sea "דרך הנהרות (נגר)". natural-water-sources: the mountain aquifer is recharged in the Judean and Samarian hills,
   the coastal aquifer in the coastal-plain sands. The weather-phenomena chain also merges used (waste) water with runoff. *Game:*
   Level 8 uses the mountain aquifer; tap water and sewage aren't simulated.
8. **Eilat's climate explanation.** climate-zones calls Tel Aviv and Eilat "ים תיכוניות-סוב-טרופיות … בדרגות שונות" yet
   Eilat "נחשבת כבר לאקלים מדברי", and explains it by Eilat being far from the Mediterranean and "יותר פנים-יבשתית" (Eilat is on
   the Gulf of Eilat coast). It gives Eilat's latitude as 30°, while israel-climate gives Israel's southern edge as 29.5°.
   israel-climate attributes the N→S decrease to latitude. *Game:* Eilat = desert. The explanation stays at "far south, at the edge of
   the desert belt, far from the Mediterranean storms".
9. **One climate vs three.** climate-zones: "ישראל נמצאת באזור אקלים ים תיכוני". israel-climate: three climates meet.
   *Game:* three climates (grade 9 framing); the Mediterranean is dominant in the north and centre.
10. **Be'er Sheva listed as Mediterranean.** israel-climate's "אקלים ים תיכוני בתוך המרחב הישראלי" paragraph names Haifa, Yavne
    and Be'er Sheva as getting rain in the same months, while Be'er Sheva sits on the 200 mm line (steppe). *Game:* Be'er Sheva = steppe.
11. **Albedo and humidity.** sun-energy: the Carmel forests are darker "ולכן הכרמל סופג יותר חום ולח יותר". Albedo alone
    doesn't set the actual surface temperature, and it doesn't make a place more humid (COMMON.md). *Game:* albedo appears
    only as faster heating of sand and asphalt in the sea-breeze level, never as a humidity source.
12. **Summer pressure picture.** weather-phenomena: "קיץ ישראלי הוא בעצם רמה קבועה מעל האזור"; israel-climate: the
    subtropical high belt moves north. This simplifies the real summer pattern. *Game:* uses the simplified "summer ג" and labels it simplified.
13. **Implausible example.** weather-phenomena's weather example "היום בתל אביב 32 מעלות וגשום" is a rare combination
    for Israel's dry summer. Don't reuse it.
14. **Sandstorm vs khamsin.** atmosphere lists "סופות חמסין" under sandstorms. Dust is typical of a khamsin, but a khamsin is a
    hot dry air mass first. *Game:* haze and dust visuals are fine; the rule is heat and dryness.
15. **Rounded relief figures.** landform-belts: Hermon about 2,236 m, Dead Sea "more than 430 m" below sea level and dropping about 1 m/yr (recent
    external estimates are about −436 to −438 m). natural-water-sources: Kinneret "about 200 m" below (the real lake level is about −209 to −215 m).
    *Game:* uses rounded schematic values and says so.

## Honest limits

- **Schematic map.** The relief comes from real elevation data with stated vertical exaggeration, but ridges, wadis, field
  and target positions, and every region boundary are schematic. No GIS-accurate claim. West/east, coast/highland/rift and
  north/south relationships are kept.
- **Simplified model and time.** One air parcel, a fixed lapse rate (0.6 °C/100 m, העשרה), a capacity table, threshold
  rules for rain, slush and snow, pressure cells as point sources, and no Coriolis, fronts or cloud microphysics. Seasons and decades are
  compressed into minutes, and the time-lapse is labelled as compressed. Rain amounts in mm are game units scaled to the
  normals in model-values.md, not forecasts.
- **Numbers.** Module values are used where the modules give them; IMS 1991–2020 normals elsewhere, labelled העשרה.
  No current water-policy, legal or infrastructure statistics are simulated.
- **No learning-gain claims.** Transfer evidence is logged locally (first unaided attempt vs retries, hint use) for
  playtesting only. Without a student evaluation we don't claim the game teaches anything.
- **No Ministry approval.** Workbook modules define the requested curriculum scope only. Neither Ministry of Education
  endorsement nor independent accreditation is implied.
- **Privacy.** Progress and stars are stored in localStorage only. No personal data and no remote analytics.
