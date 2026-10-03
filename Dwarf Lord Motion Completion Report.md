# Dwarf Lord motion completion report

Checkpoint: **motion39, 3 October 2026**. **PR #9 is not ready to merge.** Five more main-library sequences now have exact finite-task acceptance, reducing outstanding cycle reviews from114 to **109**. Two previously inactive Blacksmith actions now run in the game at independent stations, reducing outstanding reference-action activations from54 to **52**.

The frozen acceptance scope remains **160 cycles:153 main sequences and seven original independent station actors**. The two new derived forge actor layers support existing required reference actions; they do not add obligations to, or remove unfinished cycles from, that frozen scope. They have their own source-bound finite-task approvals.

## Completed in motion39

| Sequence | Correction and accepted scope |
| --- | --- |
| Cook — fillet-fish | Knife remains beside the fish during the opening transition. The separated pink fillet stays beside the opened fish through the held final pose. Eight combined-reference poses accepted as a finite task. |
| Ginger — chop-downed-log | The final split halves remain split rather than regenerating an intact log. Fixed receiving log registration passes the existing correlation bound. Eight combined-reference poses accepted as a finite task. |
| Laborer — shovel-rubble | The receiving barrow retains deposited rubble while the empty shovel recovers. Fixed lower barrow geometry is measured separately from changing load. Eight combined-reference poses accepted as a finite task. |
| Blacksmith — anvil-ready | The final hammer recovery descends from the overhead pose through shoulder/chest height. The same hammer, tongs, billet, anvil and stump persist. Eight combined-reference poses accepted as a finite task, with completion holding7. No seamless repeat approval. |
| Laborer — sweep-wood-chips | The same toolbox view/panels stay fixed. Actual toolbox source roots replace silhouette registration that followed the changing chips. Explicit whole source cells retain detached props and exclude neighboring poses. Eight combined-reference poses accepted as a finite kneeling task. |

Each acceptance binds the selected source, all eight exported frames, atlas, registration, durations, native review and controlled playback evidence. The playback check exposes each pose for its entire authored duration, checks all timed transitions, completion at7, a10-second held terminal state and explicit reset. These local combined-reference acceptances do not certify translating sole contacts, other directions, physical standing height, independent furniture ownership or gameplay activation.

**Expanded the live forge work.** A forge assignment now selects one finite operation for its day: hammer-contact, inspect-tool or repair-pickaxe-handle. The operation holds when finished; it does not silently advance to another operation. Inspection uses the existing independent anvil. Seated handle repair uses a new independent repair bench at3/-7, with the chair owned by the actor. Routing and sprite registration share the operation's station target. The bench is clear of the forge building collider and persists after cancellation, departure and day resolution.

Both new actors have eight distinct whole authored poses. Repair uses separate authored preliminary lift, partial descent and rebound poses; clipped-hammer and incorrectly lowered descent attempts were rejected. Seated boot baselines correct the original row-dependent floor offset without warping limbs. Source-bound foreground contours place the held pickaxe and hands over the independent bench, with the lower shaft/legs behind it. Current standing inspection and seated repair scales are reviewed locally; neither supplies a walking, moving tool-tip or direction-family approval.

The actual game test exercises three days, all eight frames per operation, a5-second completed hold, cancellation, persistent empty furniture, explicit reassignment and day reset. Repair also approaches its distinct bench naturally. The served source and atlas hashes match selected files. The animation controller does not grant inventory or building rewards; those remain owned by the existing day-resolution system.

**Revalidated earlier approvals after the forge update.** The original seven actor sources/frames/atlases/settings, six Elder seated references and Blacksmith right-view gait art are identical to motion38. Fresh live/layered tests support carrying forward their existing limited approvals against current runtime dependencies. The right-view regression covers three complete strides,24 boundaries and152 held samples; maximum rendered boundary jump is1.790px. Existing sole landmarks, timing and body ratio are unchanged. Its analytical whole-stride diagnostic still passes at1.032px; that diagnostic alone grants no visual approval. The earlier scoped right-view visual loop acceptance remains current.

**Preserved failed work as failed.** Three new Laborer rear-left candidates miss the required supporting-sole perspective or path. They are archived with exact prompts/input/output hashes and are unselected. No walking gate closed in motion39. The unchanged selected rear-left diagnostic remains failed at63.079px maximum boundary jump, with material correspondences unapproved. The Elder moving cane diagnostic still fails at18.057px, and simultaneous foot/cane root disagreement remains14.009px. Updating these diagnostics to the additive forge runtime does not improve their geometry or grant approval.

## Exact current accounting

| Gate | Before motion39 | Current | Still required |
| --- | ---: | ---: | --- |
| Main cycles with scoped final acceptance |39 of153 | **44 of153** |109 |
| Original independent actors with scoped acceptance |7 of7 | **7 of7** |0 |
| Outstanding frozen cycle reviews |114 | **109** |63 walk +24 directional tool/carry +22 fixed work |
| Fixed references with scoped acceptance |38 of65 | **43 of65** |16 recorded defects +6 further contact/calibration reviews |
| Direction families with passing continuity approval |0 of11 | **0 of11** |11 current changes-required verdicts |
| Existing reference actions mapped to gameplay |11 of65 | **13 of65** |52 activations |
| Elder coordinated moving foot/cane views approved |0 of8 | **0 of8** |All eight, included in walking count |

The44 main acceptances comprise eight scoped loops and36 finite tasks. With the seven original station actors, **51 of the frozen160 cycles have scoped acceptance**. The two additional forge actor approvals are recorded separately. These numbers describe accepted review scopes, not the percentage of game development completed. Open reviews do not imply that every corresponding asset needs redrawing. Direction and gameplay gates overlap the cycle work and must not be added as separate asset counts.

### Fixed-reference work still open

| Character | Accepted / existing references | Remaining |
| --- | ---: | --- |
| Blacksmith |6 /7 |fix-wheelbarrow |
| Borrin |7 /8 |count-coins |
| Cook |8 /8 |None in combined-reference scope; seven gameplay activations remain |
| Elder |6 /6 |None in seated reference scope; moving cane gait remains open |
| Female Miner |2 /6 |pickaxe-ready; pickaxe-contact; shovel-ore; push-ore-barrow |
| Helga |4 /6 |shovel-stone; carry-mine-timber |
| Ginger |6 /11 |stack-firewood; haul-firewood; carry-supplies; load-logs-cart; build-barrel |
| Laborer |4 /13 |lift-crate; carry-sack; push-stone-barrow; pull-supply-sled; roll-barrel; carry-crate; build-barrel; carry-large-stone-ore; repair-boardwalk |

The six further contact/calibration reviews concern Female Miner pickaxe-ready and Laborer lift-crate, carry-sack, pull-supply-sled, roll-barrel and carry-crate. Lift-crate still needs a lower recovery beat as well as sole registration. A calibration-required status is not a final acceptance.

Recorded defects include tools appearing/disappearing without placement, changing hands without a handoff, duplicate deposited coins, lost shovel loads, clipped receiving/cart/ore fragments, and opposite half-strides using the same supporting leg. These require corrected authored poses and retained material/prop state before approval. Existing motion38 findings remain historical evidence; motion39 exact acceptances supersede only the five named sequences.

### Existing reference actions awaiting gameplay activation

| Character | Actions still inactive |
| --- | ---: |
| Blacksmith |4 |
| Borrin |7 |
| Cook |7 |
| Female Miner |6 |
| Helga |6 |
| Ginger |10 |
| Laborer |12 |
| **Total** | **52** |

Exact action names and cycle IDs are in `docs/motion-completion-inventory.md`. Each activation needs a suitable context, source-bound scale/placement, coherent tool/material ownership, completion and reset. Furniture-containing references cannot simply be painted over independent props. This gate does not require a new furniture family for every action; compatible operations can share a reviewed station. Additional workstation variants and their own actor/prop reviews remain necessary where ownership or geometry changes.

## Remaining moving-contact and direction requirements

- **63 walking cycles:** the existing Blacksmith right-view cycle is the only accepted walking view. Other views still need anatomically consistent opposite-leg and arm phases, stable corresponding heel/toe contacts across all eight boundaries including7-to0, grounded support-foot spacing, and actual renderer evidence through held frames and transitions. Body ratios/root registration must be measured from visible material landmarks, within unchanged bounds; target guides and a small fitted residual are not substitute observations.
- **Eight Elder moving foot/cane views, within that63:** complete plant, trailing shaft/hand articulation, lift, forward recovery and replant coordinated with changing support feet. The four partial rear corrections do not certify the remaining phases or a whole moving cycle. Matching one cane tip point cannot hide inconsistent feet.
- **24 directional tool/carry cycles:** Female Miner pickaxe-swing and shovel-cycle plus Helga carry-mine-timber, eight views each. Review connected head/shaft geometry, correct grip and tool reach/height, load retention/discharge, log rotation/occlusion and body scale. Physically occluded rear hands can be accepted only for visible occlusion; hidden anatomy is not certified.
- **11 direction families:** all eight walking character families plus those three directional tool/carry families have current changes-required reviews. Compare synchronized phase, body scale, equipment geometry and direction transitions only after corresponding authored defects are fixed. Approving an isolated view does not approve the family.

## Ordered path to merge approval

1. Complete and verify one full Laborer rear-left material-sole stride using a revised pose-authoring method. Preserve anatomical correspondence, ground perspective and original contact tolerances; reject large registration corrections or changed thresholds used to conceal bad poses.
2. Apply the proven method to the other unaccepted walking views, with actual arm/leg phases and whole-stride contact evidence. Treat Elder cane coordination as an additional coupled constraint.
3. Correct the remaining directional tool/log geometry and retained loads/grips, then review their complete eight-view families.
4. Correct and close the22 remaining fixed-reference reviews. Keep finite completion acceptance separate from seamless-loop acceptance.
5. Activate the52 remaining existing reference actions in appropriate tasks or ambient contexts, separating props where necessary and testing arrival, held completion, cancellation, departure, direction changes and day resets. Keep economic rewards owned by gameplay state.
6. Close all eleven direction-family reviews and outstanding final cycle approvals against the exact current artifacts. Recompute the frozen inventory; no missing, stale or invalid export/evidence may remain.
7. Run the complete test/build/browser suite on the final committed revision and verify GitHub checks on that exact PR head. Only then give an all-green merge recommendation. A passing build or local task approval cannot close the remaining art/gameplay gates.

## Validation and evidence

Motion39 validation: **204 Node tests and70 Python tests pass**, type checking and Pages build pass; the153-sequence/1,224-image main gallery passes; all nine independent workstation variants pass their layered, fixed-prop and finite-completion checks; five corrected references pass full-duration/terminal/reset checks. Current forge, original NPC lifecycle, Elder activities and right-view walking renderer regressions pass. The36 measured fixed-prop registrations remain below the unchanged0.71px residual bound, with maximum0.699px.

Evidence is stored under `docs/art-review/motion39/`, including exact native findings, timed captures, actual forge and NPC lifecycle reports, station-layer reports, runtime revalidation and the right-view whole-stride renderer result. The exporter regression tests verify that explicit authored source cells preserve detached props without attaching neighboring pixels or granting any approval.

The generated `docs/motion-completion-status.json` recalculates approvals from current source/frame/atlas/registration/timing/dependency hashes. New forge activation also binds its actor artifacts, exact task approval records, props and runtime proof; changed files make coverage unknown until revalidated. `productionReady` and the aggregate review gate remain false. **PR #9 remains Draft; all-green merge approval has not been given.**
