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

## 2026-09-15 NPC angle and stance expansion

User request: expand character profiles with different angles and stances like Lord so they can be animated. Branch codex/npc-animation-profiles starts from merged PR #4. All 14 non-player canonical designs now have eight turnaround views plus four role-specific stance references (168 normalized frames), source sheets, manifests, updated profiles and an interactive public/character-animation-review.html viewer. Two incorrect facing views were regenerated. Exporter isolates neighboring silhouettes instead of clipping regular grid cells. Full production gait loops and runtime NPC animation are subsequent work; this pass does not label two contact poses a finished gait.

Validation: 153 tests pass, typecheck and Pages build pass. Browser review loads all 168 transparent images, checks 14 character selectors, pose controls, turnaround playback and mobile overflow with no runtime errors. Bundled web-game client exercised keyboard navigation; screenshot and state inspected. No game renderer or canonical master changes.

## 2026-09-15 — Static occupational work references

Added 84 static work scenes for all 14 NPC identities, including complete anvils, administrative desks with open ledgers, cutting blocks, mining and repair equipment. New manifests, reproducible export script, profile links, review sheets and static review mode. Corrected Borrin seated-ledger export using the new open-ledger desk composition. Canonical masters and live game renderer unchanged. See docs/CHARACTER-WORK-REFERENCES.md for roster, evidence and next animation pass requirements. Typecheck, 155 tests, Pages build, 84 work/168 stance browser checks, transparent-margin QA and bundled web-game navigation pass. Next request should generate registered animation variations from selected static references, not cycle through unrelated work scenes.

## Work animation variations — active checkpoint

User requests animation variations for every one of the 84 static actions. Active branch codex/work-action-variations from merged PR6 / origin main 42dcdb4. Planned four authored keyframes per action (336 frames). First 30 source sheets generated for Blacksmith, Borrin, Cook, Elder, Quartermaster; Blacksmith repair regenerated to fix extra hands. Exporter creates per-action 640px frames, atlas, APNG and review sheet with shared scale and lower-ground registration. Public work-animation-review.html added with action selector and playback. Browser verification of first18 actions/72frames passes. Remaining generation tracked in docs/work-animation-plan.json; generation records are in docs/work-animation-generation.json. No gameplay integration yet. Full coverage test intentionally requires all84 actions before final commit. Continue all remaining generation, export and inspect, then final tests/build/browser and PR.

### 2026-09-15 completed work-action variation export

All 84 source sheets are saved and exported: 336 individual 640x640 RGBA keyframes across 14 characters, plus per-action atlases, APNGs, source sheets, review sheets, prompts and manifests. Work animation review player is linked from the character viewer. No gameplay renderer change. Known gait and station redraw limitations are documented; productionReady remains false.

Validation: typecheck, all 156 tests, Pages build, browser review of all 84 actions/336 images including keyboard/race/mobile controls, independent web-game harness, and transparent-border check for all 336 frames passed. Work remains isolated on codex/work-action-variations; scratch output is under work/ and must not be committed.


## 2026-09-17 — PR #9 motion-polish follow-up

Active checkout `/opt/codex-work/dwarf-lord`, branch `codex/expanded-character-cycles`. PR9 remains open/draft. Continue here; do not restart asset generation.

Added 25 fixed-station registrations (34 total, measured maximum translation below 0.7 px). Reproducible region config, source/settings-bound residual report and registration helper are checked in. Redrew Ginger tree chopping, Elder rear cane/phase order, and Helga left carry counter-swing/passing poses with original edit inputs and exact prompts retained. Built-in image generation used; exporter only extracts/registers authored poses.

New shared motion playback controller is exercised by the review UI: displacement-driven walking/carry, fractional phase retained on turns and pauses, one-shot completion hold, physical body-size normalization, bounded large time steps. Ground-travel stride is a review estimate. Live game still uses static NPC art; no unapproved production flags were changed.

Remaining: inspect/redraw other non-front gait issues, final cane/tool/log contact and shape continuity, production loop acceptance, workstation physical body calibration and live renderer/task integration. The whole motion-polish request is not complete. See docs/motion-polish.md for precise delivered scope and acceptance work. Scratch logs and browser evidence are in work/expanded-cycles; do not commit work/ or __pycache__/.

Validation for this checkpoint: 173 Node tests, seven Python registration tests, TypeScript check, Pages build, all 153-sequence/1,224-frame browser checks including fractional pause/resume, zero source-edge warnings, and diff whitespace checks pass. Station residual evidence binds to the current source and calibration hashes.


## 2026-09-18 — Live NPC walking integration

Integrated the eight expanded characters' authored walking atlases into the game renderer. Fixed missing NPC facing updates and nominal speed while blocked. Displacement-driven phase includes parent world scale, preserves turns, freezes at collisions, ignores teleports and resets to contact when a new walk begins. Shared lazy GPU atlases are repacked to 1280x640; per-actor UVs prevent actors affecting one another. Six unused atlases retained; active leases and stale async requests handled explicitly.

Shared controller source moved to src/game/motion-playback.ts with generated standalone public/motion-playback.mjs and predev/prebuild sync hooks. Do not directly import public modules from game source: Vite rejects this (caught and fixed in browser). Test guards generated copy consistency.

Validation: 176 Node tests, TypeScript and Pages build pass. New live-game browser test passes in dev AND /Dwarf-Lord/ production: loading, walk progression, turn, collision freeze, arrival/idle fallback. Screenshots inspected under work/expanded-cycles/runtime-browser. Production still emits the pre-existing recoverable React hydration warning documented in prior visual reviews; no page errors from the new motion code.

Art acceptance still open: remaining non-front phase/pose issues, tool/log/cane geometry/contact continuity, workstation physical scales and work-action renderer/task mapping. Full motion-polish task remains incomplete. All existing approval flags remain false; do not infer approval from the successful runtime checks.


## 2026-09-23 — Loading continuity, task reset and contact correction

PR9 remains the active branch. Fixed gait phase freezing during atlas loads; first-load displacement is accumulated in stride units. Idle releases leases and invalidates async responses; failed loads retry after five seconds. Fixed canceled job destinations/work state, protected/invalid assignment movement, and work stopping at day resolution (including immediate runtime reset before save).

Saved and exported an accepted single-pose Blacksmith right-view contact arm correction using built-in imagegen. Source pose 0 now has near right arm forward opposite trailing near leg. Traceable whole-pose assembly retains the original source sheet, generation record and exact edit input/prompt. Other seven poses and final loop remain unapproved. Do not treat this one correction as a complete gait.

Validation: 176 Node tests passed before the final art update; all 11 affected motion tests passed afterward. Typecheck passed. Expanded live-game browser test passed walking, turns, blocked freeze, arrival, job assignment/arrival/cancellation/reassignment/day resolution/next morning. Browser and rendered art screenshots inspected. Full task still incomplete: non-front gait corrections, measured foot/cane contact, tool/log continuity, approved loops and calibrated workstation rendering remain. Job state transitions are implemented; workstation animation mapping is not.


## 2026-09-23 — Calibrated work playback integration

Cook meals now renders the eight-frame chop-vegetables character/workstation atlas. Separate source-hash-bound render calibration uses projected head-to-visible-boot height 540 and root [320,600]; table width does not control character size. Meal approach moved from inside fire collision to [-0.5,4.5]. NpcWorkMotion shares the atlas cache/repacking path, runs once and holds, pauses for dialogue, and releases/resets on cancellation, movement, reassignment, day change and resolution. No animation reward callbacks: economy remains once per day. Removed per-render-frame time cap after software-rendering browser test exposed work taking excessive wall time.

Female Miner limestone/iron jobs now use all eight pickaxe-swing directions with the existing tool-independent 340-pixel calibration. Direction changes preserve fractional work phase and completion state. Full character/station sprites still billboard; persistent standalone stations and remaining job/character mappings are not implemented. No loops promoted and no contact-quality approvals claimed.

Two generated Blacksmith passing candidates were rejected after assembled review due to changed proportions. Existing committed walking art retained. Scratch candidates/prompts under work/expanded-cycles. Do not integrate them as approved art.

Validation so far: 177 Node tests and typecheck/build passed; Cook production browser passed arrival, calibrated station, final hold, cancel/reassign and day completion. Extended production browser passed Female Miner camera turns and retained completion. Screenshot inspection exposed mine shell and backdrop occlusion; added interior shell cutaway and background depth ordering so tool work can be seen. Final production browser rerun passed; inspected Cook and unobstructed mining screenshots. Final 177 Node tests, TypeScript, Pages build and whitespace checks pass. The skill keyboard harness also ran; its only console error was the previously documented recoverable React hydration warning. Remaining full request: non-front gait corrections, measured foot/cane travel, tool/log contact corrections, loop approvals, other workstation mappings and persistent station separation.

## 2026-09-23 — Additional work mappings and rear-view contact diagnostics

Added calibrated Laborer stack-crates/storage and Ginger fell-tree/timber work playback. Loader now accepts calibrated new-work sequences. Moved storage approach outside building collision. Unit coverage exercises both real manifests, physical scale, completion and cancellation.

Added reproducible source/frame-bound Elder back cane/boot silhouette diagnostic. Narrowed boot regions after visual overlay exposed contamination from neighboring boots. Overlay now isolates all three landmarks. Current first-half planted-cane hypothesis predicts 133.696 atlas-pixel drift; do not adopt a stride or claim contact approval from this model. All loop and production approval flags remain false.

Validation: 177 Node tests, nine Python tests, TypeScript and Pages build pass. Live workstation browser validation in progress. Full art/contact/loop acceptance remains unfinished.

A full Blacksmith right-view replacement sheet was generated and rejected: closer passing silhouettes still did not establish alternating anatomical support legs. Candidate/prompt kept under work/expanded-cycles/rejected-blacksmith-right-full.*; committed art unchanged.

Live production browser passed all four work mappings, final holds, cancellation and the mining camera turn. Screenshots inspected; added a clearing around the timber job so decorative pines do not obscure the authored tree/axe work. Rechecking that final presentation change.

Final targeted production check passed Laborer/Ginger arrival, completion and cancellation after the clearing change; inspected final forest screenshot and confirmed visible axe/tree. Final typecheck, Pages build, 177 Node tests, nine Python tests and whitespace check passed. Existing recoverable React hydration warning persists. No new loop approvals.

## 2026-09-23 — Persistent cooking station, actor-only motion and shovel integration

Generated Cook actor-only chopping sheet and separate empty cutting block via built-in imagegen, preserving source/prompt/provenance. Exported eight actor frames under Cook/motion/chop-vegetables/actor. Original combined work references retained. Runtime renders independent persistent table; actor-only body behind it and source-bound triangulated forearm/knife contours in front. Common body calibration/root and working visual-root registration preserve station contact despite approach tolerance. Station remains after cancellation/day completion. Fixed-view billboards remain; other independent stations are unfinished.

Mapped Female Miner shaft2 to directional shovel-cycle. Unit tests cover reset from pickaxe to shovel, actor placement and foreground UV mapping; provenance tests cover runtime layer and prop exports.

Elder back assembled seven retained poses plus a modest final cane lift. Rejected full-sheet pose 6 (shortened shaft) and additional single-pose edit (unnatural high arm). Full support contact/recovery arc remains unapproved. Contact report regenerated AFTER audit to bind final manifest; first-half drift hypothesis remains 133.696 pixels. Still no verified stride or final loop approvals.

Validation in progress: 179 Node tests, nine Python tests, typecheck passed. Production workstation browser checks running. Runtime layer exporter: scripts/export-runtime-motion-layers.py; plan docs/runtime-motion-layers.json. Render occlusion polygons are in Cook/motion/render-calibration.json and tied to source SHA.

Added Blacksmith hammer-contact mapping through a new Repair forge fittings job (existing daily repair mechanism; no animation-triggered output). Calibration 564-pixel visible body, root [280,592], source-bound. New economy regression verifies idle gives no repair and assignment repairs forge without resource output. 180 Node tests now pass.

First production run passed persistent cooking prop after cancel, shovel completion, mining view turns and previous Laborer/Ginger work. Inspected screenshots and found entrance shell hiding shovel work from the approach; expanded cutaway to nine units around MineAdit. Final browser rerun includes forge assignment and cutaway fix. No loop approval or measured stride adopted.

## 2026-09-24 — Resume and publish verified checkpoint

Recovered the completed validation outputs after usage interruption. Final production browser passed all six mappings: Cook, mining, shoveling, Blacksmith forge, Laborer storage and Ginger timber; cancellation/completion, persistent empty table and mining camera turns verified. Inspected final Cook/empty-table, forge and unobstructed shaft-clearing screenshots. Keyboard skill harness captured gameplay/state; its only error was the previously documented recoverable React #418 hydration warning. TypeScript, Pages build, 180 Node tests, nine Python tests and whitespace checks passed. No additional code changes after validation. Full non-front gait/contact/stride/loop acceptance and independent stations beyond cooking remain unfinished.

## 2026-09-24 — Independent forge, contact measurement and layered review

Added Blacksmith actor-only eight-frame hammer/tongs/billet sheet and separate persistent anvil/stump using built-in imagegen. Source inputs, prompts, hashes and whole-pose assembly are retained. Actor and prop use shared 520-pixel scale/root; per-frame foreground tool contours render over the station. Generalized station root registration from Cook-only to Cook and Blacksmith. Anvil remains when Grit leaves or cancels. Corrected cutting-block exporter crop fringe/clipping while preserving its apparent placement.

Added reproducible layered APNG/contact-sheet previews and workstation-review.html with scrubbing, layer toggles and once-hold/seam playback. Browser checks cover both stations/all frames. New source-bound projected billet/anvil measurement: maximum outside working face 0.233 atlas pixels; not a physical contact or loop approval. Python regressions reject stale actor/prop calibration.

Rejected Blacksmith right eight-frame pose-guide output (wrong support sequence, opaque background) and Elder rear full cane recovery output (apparent cane shortening). Existing gait assets retained. Local rejected images/prompts saved; full non-front gait redraws, tracked-foot stride calibration, cane recovery, log/tool consistency, loops and other independent stations remain unfinished.

Validation: 181 Node tests and 11 Python tests pass; typecheck, production build and layered-review browser checks pass. First full gameplay browser run passed all six mappings, persistent empty anvil/table, cancellation and day completion. Final rerun with adjusted anvil/cutting-block placement also passed; inspected the final eight-frame anvil composite and cooking/forge/empty-anvil screenshots. Existing recoverable React #418 hydration warning remains.
