# Character identity repair review

- `characters.jpg`: all 15 canonical character masters, composited on a solid background to expose transparency defects.
- `lord-frames.jpg`: the 60 Lord animation images and standing master. Legacy step numbers are retained for compatibility even where their authored direction differs from the number.
- `lord-alpha.json`: all 61 images have no enclosed transparent pixels at the alpha threshold of 128. This is a mask check, supported by visual review; it cannot judge anatomy by itself.
- `roster-alpha.json`: browser image loading and alpha measurements for all 13 NPC designs.
- `borrin-dialogue.png`, `elder-dialogue.png`: production-build screenshots showing their separate characters and matching portraits.
- `browser-identities.json`: separate conversations, 18 residents (16 workers, Borrin and Elder), no missing sprite responses or uncaught runtime errors.

Validation commands: `npm run typecheck`, `npm test`, `npm run build:pages`, `node scripts/dwarf-roster-check.mjs`, `node scripts/reference-visual-check.mjs`, and `node scripts/character-identity-check.mjs`. Browser scripts default to `http://localhost:8081/Dwarf-Lord/`; override with `REVIEW_URL`.

The approved props and individual NPC masters were preserved; approved Helga, Elder, Human Laborer and the four props were additionally compared byte-for-byte with the previous commit. New Borrin, Ginger and Silver were inspected beside the rest of the roster. Lord face repairs were reviewed as direction sheets and a full-size side view.

NPC artwork still uses single poses. Shared residents still reuse established designs. Full NPC directional animation and human recruitment remain roadmap work.
