# Dwarf Lord motion completion report

Checkpoint: 30 September 2026. PR #9 remains a draft. This report covers the existing expanded library and its seven independent workstation actor variants.

**The full motion-polish work is not complete, and it is not just a few final touches away.** The artwork export and playback infrastructure are substantially built. The visual and physical acceptance work is still open. Previous checkpoints added useful corrections, stations and diagnostics, but did not close the main-library acceptance gates. Repeating the same broad remaining-work list concealed that distinction.

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

## Demonstrated blockers and limits of the measurements

| Evidence | What it establishes | What remains |
| --- | --- | --- |
| Laborer rear-left phase review | Frame 1 now has far-right support with near-left lift and a small opposing arm swing; opposite-half selected corrections are retained | Retained frame 2 still supports the wrong leg for that half. Initial contact, reach, other arms, sole correspondence, body-width continuity and the seam need review/correction |
| Blacksmith right-view sole sample fit | Six sampled points fit an estimated stride/body ratio of 1.176428 with maximum residual 2.363 px | Anatomical material-point correspondence is unapproved; heel/toe rolls, contact changes and the full cycle are not covered. Runtime still uses the estimated 1.2 ratio |
| Elder rear-view cane diagnostic | The tested cane support window has 20.729 px maximum displacement from its first sampled point; its largest adjacent jump is 36.639 px | Foot/cane coordination is not solved. Existing silhouette proxies show 95.579 px disagreement between simultaneous required root motions; this is a diagnostic, not verified anatomical sole tracking |
| Held-pose runtime test | The rendered root remains fixed inside a held image while physical movement continues | Sprite travel advances at pose boundaries. Boundary contacts, new support/replant, turns and loop return still need calibration |
| Helga visible contact review | All 64 directional carrying poses have a recorded visible hand/log inspection without visible detachment | Hidden anatomy, projected log geometry/length, gait, sole travel and view transitions remain unapproved |
| Fixed-prop translation measurements | 34 combined work sequences have measured station translation residual below 0.7 px | Painted prop shape, hand/tool contact, material continuity and loop quality are separate checks |

Other known open cases include Blacksmith and Ginger rear-right first-half/return phases, Cook blade-to-food/block contact, Borrin quill-to-paper contact, and Laborer crate release/reset continuity. These are specific correction or review targets; the rest of the library has not received equivalent final scrutiny.

## Changes in this checkpoint

1. Selected one new authored Laborer rear-left support pose, replacing the repeated support leg in frame 1. Its exact input, reference and prompt are archived. The export preserves the 520-pixel body target, registration origin and eight 125 ms durations. This is a local pose correction, **not** an approved stride.
2. Rejected the following passing-pose attempt because its lifted boot stayed behind the supporting calf instead of passing under the pelvis. The image and exact failure record are saved. The failed image is not selected for playback. No repeated recovery-pose retries were made in this checkpoint.
3. Added a frozen scope inventory with stable paths for all 160 existing cycles and all 11 direction families. A changed plan, missing scope entry or duplicate destination cannot silently enlarge or shrink the completion denominator.
4. Added a reproducible completion audit. It recalculates review validity against actual source, exported frames, atlas, registration, timing and workstation dependencies. A cached approval flag cannot close an item. If runtime selection code changes, the old activation count becomes unknown until that coverage audit is refreshed.
5. Added a full per-cycle inventory and the exact 60 unmapped reference action names so the next run can resume from named items rather than another vague phase of polishing.

This checkpoint closes **one local support-pose correction**. It closes **zero final cycle approvals**, **zero full-stride calibrations**, **zero Elder joint-contact approvals**, **zero cross-direction family approvals**, and **zero new runtime activation rows**. The remaining cycle-review count is still 156. Recording that explicitly prevents counting generated pictures as completed motion work.

## Finite completion order

1. **Finish one Laborer rear-left pilot cycle.** Resolve its remaining contact/passing/reach and arm phases, inspect all eight poses at game size, identify corresponding sole landmarks, measure the whole stride including support changes and 7-to-0, then record a source-bound final review. Stop adding stations while this pilot remains unaccepted.
2. **Finish Blacksmith right-view stride calibration.** Extend the existing sampled fit to reviewed material contacts across the whole cycle, validate the chosen stride in live travel, and adopt it only after the contact and transition checks pass. These two pilot closures establish a repeatable method before processing the remaining walking views.
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

- `docs/motion-completion-scope.json`: explicit frozen scope, direction families, runtime coverage binding and retry policy.
- `docs/motion-completion-status.json`: current per-cycle bindings, valid scoped review counts and unmapped actions.
- `docs/motion-completion-inventory.md`: readable list of all 160 cycles, 11 family review obligations and 60 unmapped actions.
- `docs/laborer-back-left-phase-review.json`: exact-frame local correction and remaining phase findings.
- `docs/motion33-rejected-attempts.json`: rejected recovery candidate, exact prompt/reference hashes and reason.
- Run `python3 scripts/motion_completion.py` from the repository root to regenerate the status and readable inventory. It does not promote sprite manifests or mark production readiness.

**Merge decision:** full-motion acceptance is still blocked. A green build verifies that the game builds and the tests pass; it does not prove the motion library is finished. Keep PR #9 draft until the named acceptance and integration gates close, or explicitly agree on a smaller separately labeled deliverable.

Validation for this checkpoint: 189 Node tests, 43 Python tests, type checking, Pages build and whitespace checks pass. Browser validation passes for all 153 cycles / 1,224 images and the updated Laborer support pose. A headed gameplay movement capture shows the camp and characters; the existing recoverable React #418 hydration warning remains. No new asset/page errors occurred in the motion-library review. These checks verify delivery and playback, not the open anatomical contact gates.
