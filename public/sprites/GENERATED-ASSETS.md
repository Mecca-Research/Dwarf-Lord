# Detailed camp dwarves

Generated for Dwarf Lord with OpenAI image generation on 2026-09-08. These are new assets, not crops of the supplied reference image.

- `camp-workers-atlas.png`: 1536 × 1024 RGBA, two equal horizontal cells. Left: seated ginger-bearded laborer facing right. Right: seated silver-bearded laborer facing left. Rendered through texture repeat/offset; use cell aspect ratio 768/1024. Transparent alpha verified before integration.
- `laborer-detailed.png`: standing brown-bearded laborer, rendered through the existing NPC sprite path.

Art brief: short broad dwarf anatomy, muscular forearms, large hands and boots, individual beard strands, worn linen and leather, orthographic downward view, neutral lighting and transparent background. Seated figures contain no seat geometry, allowing the game's crates and logs to remain three-dimensional.

Player direction and gait frames, helmeted standing miners, and Helga retain the previous art in this pass. A coherent replacement directional animation set remains future work.

## Twelve-design roster (2026-09-08)

Nine additional individual transparent PNGs were generated with the built-in OpenAI image tool, using `laborer-detailed.png` as the style reference. Final prompts are in `docs/dwarf-sprite-prompts.md`. All source PNGs are preserved at their generated resolution.

| Asset | Design | Primary NPC |
| --- | --- | --- |
| elder.png | Elder, white beard, heavy wool coat, walking stick | Borrin |
| helga.png | Stocky woman, no beard, long copper braids, riveted steel helmet | Helga |
| female-miner.png | Stocky woman, no beard, long dark hair, iron helmet | Nessa |
| blacksmith.png | Dark skin, black beard, charcoal smith apron | Grit |
| red-miner.png | Auburn beard, iron helmet, rust-red tunic | Pip |
| quartermaster.png | Forked blond beard, olive waistcoat, belt pouches | Fenn |
| stoneworker.png | Grey-streaked black beard, sleeveless slate tunic | Hob |
| cook.png | Round face, brown moustache, cream apron | Kori |
| veteran.png | Iron-grey beard, nasal helmet, studded brigandine | Durgan |

Together with the original two atlas cells and standing laborer, this gives exactly 12 distinct NPC designs. Every design is used in the starting settlement. Additional residents share appropriate designs; identity selection uses NPC ID rather than position or movement. Borrin has dedicated elder art; female NPCs retain female art while moving or working. The new designs are single-pose sprites, not directional animation sheets. Player direction and gait frames are unchanged. `dwarf-appearances.ts` records each sprite's authored pose, avoiding standing art being squashed when simulation state says seated.

Run `node scripts/dwarf-roster-check.mjs` against the production preview to check all images load, verify alpha, and render a review sheet.

Cook post-processing: the generated cook contained an opaque checkerboard. With explicit user authorization, local Python/Pillow/SciPy processing removed the neutral matte, retained the connected figure, and softened the silhouette edge. RGB character detail is preserved; the production PNG has real alpha. The built-in edit attempt had reached its usage limit.
