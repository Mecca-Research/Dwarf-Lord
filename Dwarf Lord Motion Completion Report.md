# Dwarf Lord motion completion report

Checkpoint: 1 October 2026. PR #9 remains a draft. This report covers the existing expanded library and its seven independent workstation actor variants.

**Neither the Laborer rear-left stride nor the Blacksmith right stride has full contact approval. PR #9 is not all green to merge.** This checkpoint selects five local pose corrections, measures all eight contact boundaries for each pilot, fixes the ground-review display, and verifies that both exact updated atlases run through every pose and a logical cycle return in the game. It closes zero final cycle approvals. The distinction between delivery, local artwork correction and whole-stride acceptance is explicit below.

## What is actually left

| Work area | Existing scope | Recorded acceptance | Still open |
| --- | ---: | ---: | --- |
| Main walking cycles | 64 cycles / 512 frames | 0 final cycle approvals | Review all 64; correct demonstrated phase and arm defects; verify whole-stride sole contacts |
| Non-front walks, included above | 56 cycles / 448 frames | 0 final cycle approvals | Seven views for each of eight characters; these are review obligations, not 56 presumed redraws |
| Elder foot/cane coordination, included in walking | 8 walking views | 0 complete joint-contact approvals | Shared foot/cane support, lift, recovery and replant in each view |
| Directional tool and timber cycles | 24 cycles / 192 frames | 0 final cycle approvals | Female Miner pickaxe 8, shovel 8, Helga timber carry 8; geometry, grip, phase and contact acceptance |
| Fixed-view reference work | 65 cycles / 520 frames | 0 final cycle approvals | Frame/prop/contact review and correct loop or one-shot terminal behavior |
| Separate independent workstation actor variants | 7 cycles / 56 frames | 4 scoped reviews | Cook chopping, Laborer crate transfer and Borrin writing still need final reviews/corrections |
| Cross-direction continuity | 11 families of eight views | 0 final family review records | Eight walk families plus pickaxe, shovel and timber carry; consistent phase, body size, equipment and turning |
| Live activation of fixed-view reference work | 65 existing work actions | 5 have a mapped independent actor counterpart | 60 actions have no task or ambient activation rule in the current game |

There are **153 main cycles / 1,224 frames**, plus **7 actor variants / 56 frames**: **160 existing cycles / 1,280 frames** in this scope. Four workstation variants have narrowly scoped approvals, leaving **156 cycle-review obligations**. This number is **not a redraw estimate** and is **not a claim that the full project is 4/160 complete**. Accepted station variants do not approve their older combined reference cycles. The 11 family reviews and 60 activation rows are additional checks/integration work, not additional sprite cycles. The categories above overlap and must not be added together as separate animation totals.

The number of images that actually need redrawing is currently **unknown**. A review must identify a defect before a redraw enters the correction queue. Exported images, descriptive phase captions, passing builds and zero motion inside a held pose cannot establish that a full stride is correct.

## Character breakdown

| Character | Walk cycles | Directional tool/carry | Fixed work | Total main cycles | Fixed actions without live activation |
| --- | ---: | ---: | ---: | ---: | ---: |
| Blacksmith | 8 | 0 | 7 | 15 | 6 |
| Borrin | 8 | 0 | 8 | 16 | 7 |
| Cook | 8 | 0 | 8 | 16 | 7 |
| Elder | 8 | 0 | 6 | 14 | 6 |
| Female Miner | 8 | 16 | 6 | 30 | 6 |
| Ginger | 8 | 0 | 11 | 19 | 10 |
| Helga | 8 | 8 | 6 | 22 | 6 |
| Laborer | 8 | 0 | 13 | 21 | 12 |
| **Total** | **64** | **24** | **65** | **153** | **60** |

The five mapped fixed-reference actions are Cook/chop-vegetables, Blacksmith/hammer-contact, Ginger/fell-tree, Laborer/stack-crates and Borrin/desk-writing, using their independent actor variants. Female Miner's directional pickaxe and shovel have live mappings separately. Stoneworker and Quartermaster add two independently rendered station actors outside the eight-character main expansion. Together the game currently selects nine action families: seven production visuals and two passive administration visuals. Economic rewards remain owned by task/day resolution.

There are seven independent stations: cutting block, anvil, forestry trunk, storage pallet, ledger desk, masonry bench and weighing table. Blacksmith, Ginger, Stoneworker and Quartermaster have scoped actor review records. The 60 unmapped reference actions do **not** imply 60 new workstation models: desk, anvil, cutting block and other props can be shared. Each action needs a deliberate activation rule, suitable actor/prop separation where furniture must persist, and completion/reset behavior. Preview availability alone is not gameplay integration.

## Pilot results and exact remaining work

All frame indices below are zero based. The marked heel/toe edges are **candidate material landmarks**, not approved sole-contact tracking. Some overlap/occlusion still needs anatomical confirmation. Pixel residuals describe a flat-ground model at elevation 0.6 radians and the runtime's estimated stride ratio 1.2. They are diagnostics, not verified gameplay foot-slip distances.

### Laborer rear-left

Four locally inspected authored replacements are selected: passing pose 2 (near-left airborne, far-right support), reach pose 3 (near-left airborne forward reach with the rear-left camera retained), passing pose 6 (far-right boot passes close behind near-left support), and return pose 7 (near-left supporting toe brought under the pelvis). Their sources, prompts, input/reference hashes and selections are retained. Three other contact/reach/support candidates were excluded for camera/torso drift; the arm-only support attempt was excluded for repeating the wrong counter-swing. The larger guide sheet contributed only its locally correct passing pose.

**Still required:**

1. Correct near-left arm counter-swing in reach pose 3, contact pose 4 and support pose 5. The arm still advances with the same-side leading/support leg in these poses.
2. Redraw the contact pose 4/support pose 5 foot geometry using controlled projected support positions. Candidate heel handoff 4-to 5 has 110.265 px residual, including 81.281 px perpendicular disagreement. Retiming cannot remove the perpendicular error.
3. Resolve support spacing through 6-to 7 and registration through the initial heel roll 0-to 1. The current marked path would require a 6-to 7 hold below the allowed 40 ms. Its smallest cyclic perpendicular registration solution still needs 25.136 px; allowed registration shifts are at most 12 px.
4. Confirm actual corresponding heel/toe material points through **all eight** boundaries, including occluded passing contacts. Register/re-export, then verify both full world travel and the last-to-first visual transition. The narrower return pose 7 no longer reverses the marked support travel; it is not a final loop approval.

A single stride-ratio fit still leaves 118.314 px maximum residual. There is no acceptable whole-stride calibration to adopt from the current landmark candidates. The largest current-model residual is 110.265 px. All eight candidate boundaries are covered:

| Boundary | Laborer candidate residual (px) | Blacksmith candidate residual (px) |
| --- | ---: | ---: |
|0 to 1|46.807|33.108|
|1 to 2|33.336|2.344|
|2 to 3|18.112|3.027|
|3 to 4|28.611|60.128|
|4 to 5|110.265|12.400|
|5 to 6|40.668|1.833|
|6 to 7|55.426|55.034|
|7 to 0|48.314|8.692|

### Blacksmith right

Return 7 now has a narrower near-right trailing support leg. The new whole-boundary audit shows that the earlier six-point fit did not cover the complete contact cycle. Its old frame 7 toe coordinate is no longer the corresponding toe after the redraw. The old 2.363 px sampled fit is archived as historical; the corrected current six-point observation gives 17.504 px residual and **fails**. Updating hashes without updating that material point would have falsely preserved the old green result.

**A bounded numerical candidate is available**, with stride/body ratio 0.875, durations `[121,174,136,46,165,119,116,123]` ms, and vertical registration shifts no larger than 5.75 px. It predicts 1.269 px maximum handoff residual for the marked material candidates. Its shortest pose is 46 ms, so it respects the 40 ms minimum. It has not changed the runtime stride, which remains 1.2.

**Still required:** confirm material/anatomical foot correspondence; apply the candidate registration and timing to a reviewed re-export; bind and adopt the verified stride in the game; repeat actual travel/contact tracking across every held pose and boundary; approve identity/scale, counter-swing and the visual loop return. A numerical proposal is not a completed calibration or final motion approval. The current runtime model still has 60.128 px maximum candidate boundary residual; merely changing its single ratio leaves 35.679 px.

### What was verified live

Both exact current atlases were checked against the served source and atlas hashes. Each pilot has 64 live movement samples covering all eight frame selections and a logical phase return. Laborer has 52 moving same-frame intervals and Blacksmith 51; rendered x/z roots move 0 world units inside those holds. Screenshots were inspected. This proves current asset delivery and the held-pose mechanism; it does not establish that the correct anatomical sole stays on the terrain or that the visual loop is seamless.

The review page previously moved the floor under a fixed sprite. It now offsets the whole pose to hold its projected root while the floor advances, and uses the same 0.6 radian flat-ground projection as the diagnostic. Source-generated playback is shared with the game. Turning, camera offsets and real terrain are outside this review-floor model.

### Other recorded blockers

- Elder: all eight joint foot/cane approvals remain open. The previously recorded rear cane diagnostic has 20.729 px maximum displacement and 36.639 px largest adjacent jump; silhouette proxies are not verified anatomical contacts.
- Directional tools/logs: all 24 final cycle reviews and three direction-family reviews remain open. Helga's recorded visible grip inspections do not approve hidden grip geometry, foot travel, projected log length or view transitions.
- Workstations: four of seven independent actor variants retain scoped reviews. Cook blade/food/block contact, Borrin quill/paper contact and Laborer crate release/reset remain outstanding.
- Known other walking targets include Blacksmith and Ginger rear-right first-half/return phases. The remaining library has not received equivalent final contact scrutiny.

## Changes in this checkpoint

1. Selected four local Laborer leg-phase/spacing corrections and one Blacksmith return support correction. Both still have eight authored frames and the 520-pixel body target. No synthetic limb interpolation, canvas warping or automatic production approval was added.
2. Added a source-bound eight-boundary measurement/checker, annotated sole-edge review sheets, bounded calibration proposals and 13 Python regression tests. Missing 7-to 0, transparent/out-of-canvas points, changed source/frames/atlas/actual settings/timing/runtime, unreviewed correspondence, reversed stance, invalid hold times and oversized registration cannot silently pass.
3. Replaced the obsolete current Blacksmith sampled measurement after identifying its moved toe landmark. The old fit remains explicitly historical.
4. Fixed the held-pose ground-review display and projection, with three additional Node tests. Added browser checks for both the review model and both exact live pilot atlases.
5. Updated the named phase review, excluded-attempt records and pilot status. Frozen scope remains 160 existing cycles; no new workstation family or main cycle was added.

**This checkpoint closes five local pose corrections and zero final cycle approvals, verified whole strides, Elder joint-contact approvals, direction-family reviews or new work activation rows.** Remaining cycle-review obligations stay 156. The next art work is the named Laborer arm/contact geometry, rather than another unnamed polish pass. Persistent projected-contact failures need an authored support-plane reference or a rig with ground constraints before rendering another candidate; the repository currently has no editable rig/model asset for these rendered characters.

## Finite completion order

1. **Finish one Laborer rear-left pilot cycle.** Resolve its remaining contact/passing/reach and arm phases, inspect all eight poses at game size, identify corresponding sole landmarks, measure the whole stride including support changes and 7-to-0, then record a source-bound final review. Stop adding stations while this pilot remains unaccepted.
2. **Finish Blacksmith right-view stride calibration.** Review the marked material contacts, apply the bounded whole-cycle candidate to a registered export, validate it in live travel, and adopt it only after every held-pose and transition contact passes. These two pilot closures establish a repeatable method before processing the remaining walking views.
3. **Close the 64-view walking matrix by character.** Eight front views are already correction candidates, not accepted gaits. Audit the remaining 56 non-front views, redraw only failed phases, then calibrate each accepted view. Preserve asymmetrical equipment and anatomical handedness.
4. **Close Elder's shared support in all eight views.** Measure foot and cane from the same poses and runtime movement. Verify plant, lift, recovery and replant; independent timing fits that make the cane and foot disagree do not count. The rear view is the first pilot.
5. **Close the 24 tool/carry cycles and their three direction families.** Review handle/log landmarks, anatomical hand/shoulder grip, projected geometry, tool elevations/contact phase and carrying gait. Reuse a proven template only after it passes all eight views.
6. **Review all 65 reference work cycles and the three remaining actor variants.** A repeatable action needs a valid last-to-first transition. A state-changing action needs a valid one-shot terminal pose and an explicit reset/handoff; it must not be forced into a false loop. Rejects get named frame/contact corrections, not blanket regeneration.
7. **Resolve the 60 existing work activation rows.** Assign each to a production task, consultation/dialogue trigger or ambient behavior; calibrate its actor and reusable station; validate arrival, completion, cancellation, departure and reset. Add necessary shared station families from this list. New unspecified tasks/characters do not enter this pass automatically.
8. **Close all 11 direction-family reviews and final runtime checks.** Review adjacent views in both turn directions at contact, passing and opposite-half phases. Confirm scale, phase retention, tools and root continuity. Verify existing station persistence and task completion without duplicate economic output. Then run the complete regression suite and inspect the current PR head.

These steps share work; Elder and Helga support checks overlap the walking/carry gates. Their subtotals are not separate new cycles. A trustworthy time estimate is unavailable until the two pilot strides pass: authoring a new pose is unpredictable, while checking an already-correct cycle is comparatively bounded. Giving a percentage or an hour estimate now would hide that uncertainty.

## How to prevent another endless loop

- **Freeze the denominator.** The existing 153 main cycles and seven actor variants are listed in `docs/motion-completion-scope.json`. Explicitly revise scope before adding another family or character; do not increase the backlog by default while claiming to finish it.
- **Count acceptance, corrections and integration separately.** Each checkpoint reports final cycles closed, full strides approved, Elder views approved, direction families approved, activation rows closed, selected pose corrections and rejected attempts. A source export is not an acceptance closure.
- **Use at most two attempts on the same pose constraint in one checkpoint.** Repeated failure stops that generation path. Archive the failed constraint and change the method; do not repeat a broad sheet prompt with the same failure indefinitely. This is a checkpoint policy, not a promise that two attempts finish a pose.
- **Change authoring methods if contact pilots do not converge.** Raster generation has repeatedly preserved identity while repeating the wrong support leg or recovery position. It does not supply a controlled skeleton or rigid prop attachment. Persistent whole-stride failures require explicitly authored pose references or a rigged-character workflow with ground constraints and a rigid cane/tool/log before rendering the final sprites. That is substantial additional asset work; it is not implemented by the current sprite exporter.
- **Revoke stale reviews.** Changed images, frame order/timing, registration or dependent props require review again. Keep scope-specific station reviews separate from main-library and full production acceptance.
- **Require a measurable next closure.** The next target is one complete pilot stride, not another additional station plus the same generic remaining-work sentence.

## Files and reproducibility

- `docs/motion-completion-scope.json`: frozen 160-cycle scope, 11 direction families and runtime coverage binding.
- `docs/motion-completion-status.json` and `docs/motion-completion-inventory.md`: current full per-cycle obligations and exact 60 unmapped action names.
- `docs/motion-pilot-status.json`: selected corrections, open pilot gates and unchanged completion counts.
- `docs/laborer-back-left-phase-review.json`: exact current phase findings.
- `docs/laborer-back-left-whole-stride-observations.json` and `docs/blacksmith-right-whole-stride-observations.json`: source-bound eight-boundary candidate points. Correspondence is explicitly unapproved.
- Matching `*-whole-stride-measurement.json`, `*-whole-stride-candidate.json` and `*-whole-stride-review.jpg` files: numerical failures/proposals and annotated actual exported frames.
- `docs/motion34-runtime-review.json`: current source/atlas bindings and 64 live samples per pilot; narrow delivery/held-root/phase scope.
- `docs/motion34-rejected-attempts.json`: excluded inputs, exact generation records and reasons.
- `docs/blacksmith-right-gait-before-motion34.json`: historical sampled fit, superseded after the return redraw.

Reproduce contact diagnostics with `python3 scripts/whole_stride.py docs/laborer-back-left-whole-stride-observations.json --out docs/laborer-back-left-whole-stride-measurement.json --candidate docs/laborer-back-left-whole-stride-candidate.json --overlay docs/laborer-back-left-whole-stride-review.jpg`, then the equivalent Blacksmith paths. Run `python3 scripts/motion_completion.py` for the frozen inventory. These tools never manufacture an anatomical/loop approval.

**Merge decision:** keep PR #9 draft. Neither pilot is fully verified, and the full motion library has 156 remaining cycle-review obligations, 11 direction-family reviews and 60 unmapped work actions. These are overlapping acceptance/integration obligations, not 156 presumed redraws. A passing build cannot turn the numerical/contact failures into a merge approval.

Validation: 192 Node tests, 56 Python tests, type checking, Pages build and whitespace checks pass. Browser review passes for 153 cycles/1,224 images, both pilot review controls and both current live atlases. The bundled web-game client exercised movement; gameplay and pilot screenshots were inspected. The existing recoverable React #418 hydration warning remains; no new motion-page/asset errors or live page exceptions were recorded. No final anatomical foot, full-stride or visual loop acceptance is claimed.
