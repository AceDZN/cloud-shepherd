# Cloud Shepherd · רועה העננים: workbook catalog entry

- **Slug:** `cloud-shepherd`
- **Hebrew title:** רועה העננים
- **English title:** Cloud Shepherd
- **Tagline (he):** הובילו את ענני מעל הים, במעלה ההרים ועד הכנרת: רק אוויר שמתקרר עד רוויה מוריד גשם, ומעבר לרכס משתרע צל הגשם.
- **Grades:** 8, 9
- **Orientation:** any (plays on a portrait phone: touch drag to steer, hold the button to pour)
- **Levels:** 18 authored levels; `?level=N` opens level N's intro card directly, even when locked.

Module paths come only from `acedzn-tools/packages/catalog-geography/src` (`ids.ts`, `grade-8.ts`, `grade-9.ts`). The per-level reasoning and source quotes are in [../CURRICULUM.md](../CURRICULUM.md).

| n | Level title | Skill | Modules |
|---|---|---|---|
| 1 | נשימה ראשונה | אדים, רוויה ומשקע בהר | `grade-8/chapter-3/weather-phenomena`, `grade-9/chapter-2/landform-belts` |
| 2 | מלא אבל יבש | לחות גבוהה אינה גשם | `grade-8/chapter-3/weather-phenomena` |
| 3 | מ־ג אל ל | הרוח נושבת מרמה לשקע | `grade-8/chapter-3/weather-phenomena` |
| 4 | בריזת ים | בריזה וחימום יבשה וים | `grade-8/chapter-3/weather-phenomena`, `grade-8/chapter-3/sun-energy` |
| 5 | מפת החזאי | קריאת מפה סינופטית | `grade-8/chapter-3/weather-phenomena` |
| 6 | במעלה המדרון | גשם במדרון הפונה לרוח | `grade-9/chapter-2/israel-climate`, `grade-9/chapter-2/landform-belts`, `grade-8/chapter-3/weather-phenomena` |
| 7 | שלג בירושלים, גשם בתל אביב | גובה, טמפרטורה וסוג משקע | `grade-8/chapter-3/weather-phenomena`, `grade-9/chapter-2/israel-climate`, `grade-8/chapter-3/atmosphere` |
| 8 | צל הגשם | צל גשם ומילוי אקוויפר ההר | `grade-9/chapter-2/israel-climate`, `grade-9/chapter-2/natural-water-sources`, `grade-9/chapter-2/landform-belts` |
| 9 | חרמון | שלג בחרמון ומקורות הירדן | `grade-9/chapter-2/natural-water-sources`, `grade-9/chapter-2/landform-belts`, `grade-9/chapter-2/israel-climate` |
| 10 | רכס חדש | כיוון הרוח קובע צד רטוב | `grade-9/chapter-2/israel-climate`, `grade-9/chapter-2/landform-belts` |
| 11 | הצפון מקבל יותר | ירידת הגשם מצפון לדרום | `grade-9/chapter-2/israel-climate`, `grade-8/chapter-3/weather-phenomena`, `grade-8/chapter-3/climate-zones` |
| 12 | קו הצחיחות | קו 200 מ"מ וחקלאות בעל | `grade-9/chapter-2/israel-climate` |
| 13 | חמסין | חמסין: אוויר חם ויבש | `grade-8/chapter-3/weather-phenomena`, `grade-8/chapter-3/atmosphere` |
| 14 | בלש הקלימוגרף | קריאת קלימוגרף ואזורי אקלים | `grade-8/chapter-3/climate-zones`, `grade-9/chapter-2/israel-climate` |
| 15 | הקיץ נשאר יבש | רמה קיצית ויובש בקיץ | `grade-9/chapter-2/israel-climate`, `grade-8/chapter-3/weather-phenomena`, `grade-8/chapter-3/climate-zones` |
| 16 | מזג אוויר או אקלים? | מזג אוויר לעומת אקלים | `grade-8/chapter-3/weather-phenomena`, `grade-8/chapter-3/climate-zones` |
| 17 | למלא את הכנרת | אגן ההיקוות של הכנרת | `grade-9/chapter-2/natural-water-sources`, `grade-9/chapter-2/israel-climate` |
| 18 | הסערה הגדולה | סיכום: סערת חורף בישראל | `grade-8/chapter-3/atmosphere`, `grade-8/chapter-3/sun-energy`, `grade-8/chapter-3/weather-phenomena`, `grade-8/chapter-3/climate-zones`, `grade-9/chapter-2/israel-climate`, `grade-9/chapter-2/natural-water-sources`, `grade-9/chapter-2/landform-belts` |

## Host notes

- Bridge: `src/host.ts` matches pie-duel's file. `ready` is posted after the first rendered frame, then `level-start` when a level opens (deep link, level select, next or retry), and `level-complete` `{level, stars, durationMs}` once per won run. Returning from the route replay posts nothing. `durationMs` is wall time since the level opened, including intro, plan and pauses.
- `?level=N` skips the title and opens the level's intro card (title, brief, targets). Levels 3, 4, 5, 10, 13 and 18 then go to the plan step (place ל/ג or choose an hour) before flight. The intro is one click and is not skipped.
- Check: `npm run build && node tests/host-embed.mjs` (serves `dist/` with `vite preview` on :4241 and iframes it at `?level=2`).
