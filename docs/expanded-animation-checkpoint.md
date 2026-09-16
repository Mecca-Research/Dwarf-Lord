# Expanded character animation checkpoint

This branch implements the requested eight-character expansion. The work is ongoing. Exported frames are review candidates, not finished or gameplay-integrated animations.

## Authoritative inventory

- `expanded-animation-plan.json`: 153 planned sequences, eight authored frames each (1,224 target frames).
- `../public/sprites/motion-library.json`: currently exported sequences.
- `../public/sprites/motion-quality.json`: missing sources, export status and specific visual issues. Regenerate after every export.
- `../public/motion-review.html`: interactive frame stepping, playback, speed controls, original references, atlases and animated PNG previews.

The plan covers 64 directional walks, 48 expanded existing work sequences, 17 additional work sequences and 24 directional tool/carry sequences. Each character owns a `motion/<action>/<direction>/` folder. Existing four-frame libraries remain available during review.

## Resume without regenerating completed work

1. Work in the Linux checkout `/opt/codex-work/dwarf-lord`, branch `codex/expanded-character-cycles`.
2. Read the plan and check both `source-sheet.png` and `generation.json` in each destination. Both must exist before exporting. Do not rerun the scratch plan generator; it resets progress.
3. Generate only missing sources with the built-in image generation tool, using each entry's canonical reference. Inspect references first. Keep actual prompts in `generation.json`, and save project images into their destinations immediately after each successful generation.
4. Run `python3 scripts/export-character-motion.py`. It detects changed source hashes and regenerates stale outputs. Do not run multiple exporters at once.
5. Run `python3 scripts/audit-character-motion.py` to refresh the quality report and per-sequence review notes.
6. Run `node --test scripts/*.test.mjs`, `npm run typecheck`, and `npm run build:pages`.
7. Serve `public` on port 8082 and run `node scripts/motion-review-check.mjs`; visually inspect animations in the browser in addition to structural checks.
8. Stage only relevant project files. `work/` and `scripts/__pycache__/` are scratch, not deliverables.

## Completed structural changes

- Added eight-frame extraction, atlases, APNG previews, manifests, source provenance and export validation.
- Added an interactive expanded-animation review page linked from the existing review pages.
- Moved Borrin's seated-ledger and consult-ledger static poses into work references. Updated manifests, profile, exporters and tests accordingly.
- Added explicit per-sequence review notes. Pose captions record intended beats, not verified motion.

## Quality corrections still required

- Female Miner's front walk repeats the leading foot. Generate genuinely opposite contacts and passing poses; do not mirror the sprite or manufacture motion by shifting a static image.
- Helga's carry views disagree about waist versus shoulder placement. Standardize the family on her canonical right-shoulder carry, preserving tool handedness under all camera angles. The replacement left sheet now maintains left facing and shoulder carry, but its gait and grip need further refinement.
- Female Miner's shovel-ore reference cycle retains loose ore. Remove surrounding material for the isolated tool template.
- Inspect source-edge clipping, especially Female Miner's back-right pickaxe, Laborer's build-crate and stack-crates, and Blacksmith's wheelbarrow repair. See the generated report for current edge checks.
- Review newly generated work cycles for station redraw drift and prop contacts. Verify all walks for alternating feet, consistent direction, phase ordering and planted-foot stability.
- Eight authored poses alone are not a smooth loop. Review the last-to-first seam and preserve identity, scale, equipment and handedness through every frame and direction.
- Current registration shares scale within a sequence, not across an entire directional family. Calibrate cross-direction body scale and anchors before gameplay integration.

## Directional template acceptance criteria

Use eight compass views separated by 45 degrees, ordered front, front-right, right, back-right, back, back-left, left, front-left. Every sheet contains one fixed view and eight time-ordered poses; the camera must never rotate within a sheet.

Pickaxe and shovel sequences contain the character and tool only. Keep rocks, ore deposits and impact effects in separate world assets. Preserve the same hand positions on the handle, tool length, swing plane, elevation and contact phase in every view. Align action phase across directions so changing view does not restart the swing.

Helga's timber carry uses the same log on the same anatomical shoulder, with consistent support-hand placement and alternating steps across views. Do not mirror asymmetric costume or equipment to invent missing views.

Export uses 640 × 640 RGBA frames, a 5120 × 640 atlas and an eight-frame APNG at 8 fps. Ground registration is x=320, y=616. Playback speed is a review default, not final gameplay timing. Production acceptance requires manual motion review and cross-direction calibration in addition to file validation.

## Verified checkpoint: 2026-09-16

125 of 153 sequences are exported: 1,000 individual frames. Blacksmith, Borrin, Cook and Elder have all eight planned walking views available as candidates. Female Miner, Ginger, Helga and Laborer still need seven walking views each (28 missing sheets total). Ginger's haul-firewood sequence is now exported. All 17 additional work-task sequences are exported and indexed as supplemental static references.

Validation: 159 Node tests passed; TypeScript checking and the Pages build passed. The browser check passed all 124 sequences / 992 images before the final firewood-hauling sequence was added. No gameplay integration or production-readiness claim is made.

The asset directory is approximately 2 GB with high-resolution sources and redundant PNG review exports. Plan production delivery/packing before publishing the entire library to the game host. The current repository workflow builds but does not upload a Pages artifact.
