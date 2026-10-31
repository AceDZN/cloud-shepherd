# Curriculum sources

These seven Markdown files are verbatim copies of the Workbook module snapshots in
`/Users/acedzn/idea-plotter/reports/geography-games-2026-10-31/curriculum/`. They were
retrieved on **2026-10-31** (snapshot file times 14:13 local) and copied here unchanged on the same day.
They define the curriculum scope this game uses. They don't imply Ministry of Education approval.

| Snapshot file | Module (Hebrew title) | Canonical URL | Retrieved | SHA-256 (first 16) |
|---|---|---|---|---|
| `grade-8_chapter-3_atmosphere.md` | האטמוספרה: שכבות והרכב | https://geography.workbook.co.il/grade-8/chapter-3/atmosphere | 2026-10-31 | `eb6f3c9c9853d6d2` |
| `grade-8_chapter-3_sun-energy.md` | השמש כמקור אנרגיה ומאזן הקרינה | https://geography.workbook.co.il/grade-8/chapter-3/sun-energy | 2026-10-31 | `03a067c71abc72af` |
| `grade-8_chapter-3_weather-phenomena.md` | תופעות מזג אוויר: רוחות ומשקעים | https://geography.workbook.co.il/grade-8/chapter-3/weather-phenomena | 2026-10-31 | `66099859719f92af` |
| `grade-8_chapter-3_climate-zones.md` | אזורי אקלים בעולם | https://geography.workbook.co.il/grade-8/chapter-3/climate-zones | 2026-10-31 | `9d4ed81eac6cd2ba` |
| `grade-9_chapter-2_israel-climate.md` | אקלים ישראל | https://geography.workbook.co.il/grade-9/chapter-2/israel-climate | 2026-10-31 | `557c9b0babfd89ba` |
| `grade-9_chapter-2_natural-water-sources.md` | מקורות המים הטבעיים | https://geography.workbook.co.il/grade-9/chapter-2/natural-water-sources | 2026-10-31 | `ab14c41f854c7618` |
| `grade-9_chapter-2_landform-belts.md` | רצועות האורך ותהליכי עיצוב הנוף | https://geography.workbook.co.il/grade-9/chapter-2/landform-belts | 2026-10-31 | `11cc643c15579ad1` |

Module IDs are exactly those in the build handoff
(`/Users/acedzn/idea-plotter/handoffs/geography-2026-10-31/cloud-shepherd/BUILD_HANDOFF.md`) and in each
snapshot's own `מודול:` / `כתובת:` lines. No other module IDs are used in `CURRICULUM.md`.

## What the snapshots don't capture

Several modules contain interactive tables, illustrations and simulations that the snapshot shows only as
a heading (for example "נתוני אקלים של ערים בישראל" and "תרגול אינטראקטיבי: הבלש האקלימי" in climate-zones,
"טמפרטורות עונתיות בישראל לפי עיר (ממוצעים)" and "סוגי משקעים ואיך הם נוצרים" in weather-phenomena,
"אלבדו של משטחים שונים" in sun-energy). On 2026-10-31 I re-rendered climate-zones through the Workbook
markdown API (`/geography/grade-8/chapter-3/climate-zones`) and it returned the same text, still without
the table contents. Any numbers inside those components are therefore **not** in our source of truth. If
someone later reads them on the live page, record them in `docs/research/model-values.md` with the date.

## External (non-Workbook) sources

The external numbers (IMS rainfall normals, the saturation table, lapse rate, the rain/snow threshold) are
listed with URLs and access dates in `docs/research/model-values.md`. They are העשרה (enrichment) or tuning
values, never assessed curriculum facts.
