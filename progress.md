Original prompt: Rebuild Dwarf Lord assets to match the supplied reference and create a PR; use the WSL filesystem.

Active persistent checkout: /opt/codex-work/dwarf-lord. Branch: codex/rebuild-reference-assets.

Implemented: individual-board timber hall with exposed rafters and damage tied to condition, sagging A-frame tents, framed crates, stave barrels, low boardwalk, continuous cliff skirt, 2,400 instanced stones and 650 moss pieces, readable neutral material tint, responsive camera zoom and larger illustrated characters. Removed duplicate billboard props. New games begin in camp.

Visual review rejected a simplified 3D dwarf replacement; existing detailed sprite art is retained at larger size. Roof slope sign corrected after screenshot review. This remains a draft art pass: secondary structures/layout and character animation fidelity need further art work to reach the reference. Do not call it a complete asset/reference match.

Checks: 143 tests pass; typecheck pass; Pages build pass; production browser movement and Borrin dialogue passed with no runtime errors; refreshed screenshot inspected and saved in docs/art-review.png. Browser may need 12+ seconds for textures/shaders under SwiftShader. Static preview: python3 -m http.server 8081 --directory /opt/codex-work/dwarf-lord-preview; /Dwarf-Lord points to .output/public. Run node scripts/reference-visual-check.mjs.

Latest pass: reduced gravel size/brightness, cleared main paths and fire circle, and rebuilt cookfire with horizontal logs and several shorter flames. Draft PR will preserve this reviewable work.

Final browser pass succeeds for movement and Borrin interaction; bundled skill harness also exercised, with the pre-existing recoverable Pages hydration console warning documented in docs/art-review.md.


## 2026-09-08 detailed sprite follow-up
Branch: codex/dwarf-art-detail-pass, based on merged PR #2 (6f962fc).
Three new generated high-resolution characters integrated: camp-workers-atlas.png (two seated workers, separate UV cells) and laborer-detailed.png (standing worker). Alpha verified at ~48% transparent. Standing size 1.95 and seated 1.65 before stage scaling. New matching contact-shadow sizes. Timber UV grain alignment corrected, canvas patch lifted above roof, ambient fill and bump detail increased. Typecheck, 143 tests and Pages build pass. Browser screenshot and interaction checks rerun.
Next priorities: a consistent eight-direction player idle/walk set, specialist character variants, a compact reference-like camp composition, then richer terrain and secondary-building models. Do not redo completed asset generation. New files are committed with provenance; active repo remains /opt/codex-work/dwarf-lord.

## 2026-09-08 — Twelve dwarf designs
- Expanded the three-design pass with nine individual generated sprites, including Borrin's elder and two beardless, long-haired, helmeted female designs.
- Stable per-NPC appearance mapping in `src/game/world/dwarf-appearances.ts`; all twelve designs used. Player animation preserved. New NPC art has one authored pose per identity.
- Removed superseded generic NPC texture loads. Added roster coverage tests and a browser alpha/contact-sheet check.
- Continue from `/opt/codex-work/dwarf-lord`, branch `codex/dwarf-art-detail-pass`; PR #3 remains the active review.
- Checkpoint: all nine new PNGs saved, typecheck/lint/146 tests/Pages build/gameplay movement/Borrin dialogue passed. Browser review inspected.
- Resolved: user authorized local image processing. Cook checkerboard removed with a neutral-matte mask and cleaned edge alpha; original saved under work/checks/cook-original.png. All assets remain in public/sprites.
- Final verification: all 12 designs pass browser alpha checks; corrected roster and gameplay screenshots inspected. Movement and Borrin dialogue pass with no page errors. Typecheck, 146 tests and Pages build pass. Review images refreshed in docs and user outputs.

## 2026-09-09 — Comprehensive development roadmap
- Reviewed the full 4,888-line user development notes and current code baseline ba36e50.
- Added root `Dwarf Lord Development Roadmap.md`: 18 dependency-ordered phases, 144 actionable tasks, 22 gap resolutions, acceptance gates, complete content families, production graph and source coverage.
- Incorporated the user's confirmed universal currency revision: 100 copper bits = 1 silver; 100 silver = 1 gold; 100 gold = 1 platinum. Opening road exports return coins; later silver/gold minting and platinum progression have material/accounting constraints. No runtime money changes made in this documentation task.
- Validated phase/task order, uniqueness, Markdown tables, currency examples and diff whitespace. User-facing copy is in outputs. Next work follows DL-001 onward after roadmap review; PR #3 remains unmerged.
