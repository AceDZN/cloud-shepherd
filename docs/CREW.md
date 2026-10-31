# Crew and file ownership

- **Lead** (integration, Git, campaign): `src/**`, `index.html`, `package*.json`, `vite.config.ts`, `tsconfig.json`, `scripts/**`, `README.md`, `progress.md`, `GAME_IDENTITY.md`, `LEVELS.md`, `data/**`. Only the lead commits and pushes.
- **Art/assets helper** (only Tripo operator): `docs/visual-targets/**`, `docs/VISUAL_PROMPTS.md`, `assets-src/**`, `public/models/**`, `ASSETS.md`, `VISUAL_REVIEW.md`, `docs/visual-review/**`.
- **Geography/gameplay QA helper**: `CURRICULUM.md`, `docs/curriculum/**`, `docs/research/**`, `tests/curriculum*.test.ts`, `tests/levels*.test.ts`, `PLAYTEST.md`, `docs/playtest/**`.

Helpers never edit files outside their list; they hand requests for changes in `src/**` to the lead.
