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

- Female Miner's front walk now has opposite contacts and reordered passing poses. Refine arm counter-swing and foot-contact stability without mirroring the sprite or shifting a static image.
- Helga's carry views now use right-shoulder carrying, including rear-view handedness corrections. Further refine grip, log dimensions and gait across views.
- Female Miner's shovel-ore cycle has been cleaned to an empty shovel in every frame.
- Clipped source edges were repaired for Female Miner's back-right pickaxe, Laborer's build-crate and stack-crates, and Blacksmith's wheelbarrow repair. See the generated report for current edge checks.
- Review newly generated work cycles for station redraw drift and prop contacts. Verify all walks for alternating feet, consistent direction, phase ordering and planted-foot stability.
- Eight authored poses alone are not a smooth loop. Review the last-to-first seam and preserve identity, scale, equipment and handedness through every frame and direction.
- Current registration shares scale within a sequence, not across an entire directional family. Calibrate cross-direction body scale and anchors before gameplay integration.

## Directional template acceptance criteria

Use eight compass views separated by 45 degrees, ordered front, front-right, right, back-right, back, back-left, left, front-left. Every sheet contains one fixed view and eight time-ordered poses; the camera must never rotate within a sheet.

Pickaxe and shovel sequences contain the character and tool only. Keep rocks, ore deposits and impact effects in separate world assets. Preserve the same hand positions on the handle, tool length, swing plane, elevation and contact phase in every view. Align action phase across directions so changing view does not restart the swing.

Helga's timber carry uses the same log on the same anatomical shoulder, with consistent support-hand placement and alternating steps across views. Do not mirror asymmetric costume or equipment to invent missing views.

Export uses 640 × 640 RGBA frames, a 5120 × 640 atlas and an eight-frame APNG at 8 fps. Ground registration is x=320, y=616. Playback speed is a review default, not final gameplay timing. Production acceptance requires manual motion review and cross-direction calibration in addition to file validation.

## Verified checkpoint: 2026-09-17

All 153 planned sequences are exported: 1,224 individual frames. All eight characters have eight walking views. All 48 existing work cycles and 17 new work tasks have eight-frame candidates. Female Miner's pickaxe/shovel and Helga's carry families each cover eight directions.

Validation: 160 Node tests passed after the final corrections. TypeScript checking and the Pages build passed. Browser validation passed for all 153 sequences / 1,224 images, including decoding, playback controls, selection races and mobile layout. The source-edge audit reports no edge warnings.

Corrections saved: Elder's back-view walk keeps the stick in the right hand; Female Miner's front walk now has opposite lead-foot poses, reordered using generation.json frameOrder; Helga's left carry keeps a constant left-facing view and shoulder carry. These still require contact, grip and gait polish. All Helga carry directions now use shoulder carries, including corrected rear-view handedness; log dimensions, grip and gait still need cross-view polish. Other known issues are recorded in motion-quality.json.

PR #8 was merged at the 125-sequence checkpoint. Follow-up draft PR: https://github.com/Mecca-Research/Dwarf-Lord/pull/9 . Resume on the existing branch and update PR #9 for the remaining motion polish.

The asset directory contains high-resolution sources and redundant PNG review exports. Plan production delivery/packing before publishing the entire library. The current repository workflow builds but does not upload a Pages artifact. For this large binary push, git -c pack.window=0 -c pack.compression=0 push avoids lengthy delta compression; allow the upload to finish rather than restarting it.

The machine-readable `public/sprites/directional-motion-templates.json` links all 24 directional sequences and records view angles, intended phase order and prop rules for future characters. These are explicitly review templates until motion/scale approval.

## Motion-polish checkpoint: PR #9 follow-up

See [motion-polish.md](motion-polish.md) for exact changes, registration/playback contracts and remaining acceptance tasks. This pass redraws two front gaits, calibrates all 88 directional sequences (64 walks, 16 tools, eight carries), registers nine fixed-station sequences, gives the Blacksmith authored strike timing, and prevents automatic one-shot state resets. All 153 sequences have version-2 manifests with explicit timing and registration metadata.

The review page now supports synchronized direction comparison, previous-pose overlays, root/body guides and last-to-first seam mode. Contact and direction approval remains separate from structural tests. Do not describe the complete motion-polish request as finished: remaining gait phases, tool/log grip/shape continuity, physical action scale and gameplay movement coupling still need review and correction. The earlier uncalibrated-export descriptions above are historical; the new motion-polish document describes the current export behavior.

### Front-walk continuation

All eight front views now have corrected pose/order candidates. Borrin, Cook, Elder, Ginger and Helga use source-traceable authored-pose assemblies; Laborer uses an identity-preserving pose-template transfer. See assembly.json and authoring-inputs in each relevant front/walk folder. The assembler does not synthesize in-betweens or mirror characters. Borrin's left passing pose was corrected again to preserve his original head/body proportions. Non-front gait phase approval and remaining hand/tool/log continuity are still pending; keep productionReady false.

Validation after the front-walk continuation: 163 Node tests and seven Python registration tests passed; TypeScript checking and the Pages build passed. The station registration report remains valid because this continuation changes only front walks and provenance handling.
