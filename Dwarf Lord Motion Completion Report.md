# Dwarf Lord motion completion report

Checkpoint: motion35, 1 October 2026. PR #9 remains a draft. **Full motion polish is not complete and merge approval is withheld.** This report and the generated inventory track a frozen library of 160 cycles, rather than allowing each checkpoint to expand the scope.

## Completed in motion35

- Activated all six existing Elder seated activities in the live camp: eat stew, eat bread, laugh seated, laugh and gesture, inspect a pickaxe in his lap, and examine a pickaxe crack. Each plays its eight authored frames once, holds completion, then advances through a finite sequence. The final activity stays finished. Leaving/returning and a new day reset the sequence; walking, sleep, dialogue poses and production assignments cannot claim seated work. The Elder retains his narrative role and earns no production output.
- Added source-bound seated body placement for the six activities. The 740px standing-equivalent seated height is shared; each action has a reviewed pelvis/root offset. This placement permits gameplay rendering, not moving sole/cane certification.
- Preload the next activity and hold the completed current pose until it is ready. A ready atlas installs in the same render update, avoiding an idle-sprite flash between activities. Texture loading cannot advance authored time. Failed preloads back off; departure releases the leases.
- Passed **two scoped final cycle reviews**, `Elder/laugh-seated/reference` and `Elder/laugh-and-gesture/reference`. All eight exported and live poses, identity/body scale, seated boots/stool, hand movement, prop continuity and the last-to-first return were inspected. Reviews bind the exact frames, source, atlas, timing, calibration and playback implementation. Their scope excludes walking contacts, pickaxe use, other directions and seamless transitions between different activities. Overall production readiness remains false.
- Evaluated **all eleven direction families** together, each with all eight poses in all eight directions. Every family has specific recorded corrections or outstanding contact verification. **None has a passed continuity approval.** Failed reviews now have an explicit `changes-required` verdict; writing notes cannot count as passing a direction family.
- Tried one Elder rear-gait sheet using a new authored vector guide for coordinated support soles and cane tips. The render did not follow the required support travel and passing phase. It was rejected in full: **zero candidate poses were adopted**. Prompt, guide, reference hash, generated file and exact failed constraints are retained. This is not a contact closure.
- Refreshed Elder and pilot contact measurements against the current runtime implementation. No numerical candidate was adopted and no gait was approved.

## Exact current accounting

| Gate | Before motion35 | Current | Still required |
| --- | ---: | ---: | --- |
| Existing reference actions with gameplay mapping | 5 of 65 | **11 of 65** | 54 task/ambient activations |
| Direction families evaluated with a recorded verdict | 0 of 11 | **11 of 11** | Correct findings and pass all 11 |
| Direction families with passing continuity approval | 0 of 11 | **0 of 11** | 11 |
| Main-library cycles with scoped final approval | 0 of 153 | **2 of 153** | 151 |
| Independent station actors with scoped final approval | 4 of 7 | **4 of 7** | 3 |
| Outstanding final cycle approvals, main + actors | 156 | **154** | 64 walk + 24 directional tool/carry + 63 fixed work + 3 independent actors |
| Elder joint moving foot/cane directions approved | 0 of 8 | **0 of 8** | 8, included in the walk count |

These counts overlap by gate. The 154 cycle obligations are **not 154 proven redraw requirements**. An unreviewed asset must be inspected before deciding it is defective. A new generated image or a passing build does not close an art review.

### Remaining gameplay activations

| Character | Existing reference actions still inactive |
| --- | ---: |
| Blacksmith | 6 |
| Borrin | 7 |
| Cook | 7 |
| Elder | 0 |
| Female Miner | 6 |
| Helga | 6 |
| Ginger | 10 |
| Laborer | 12 |
| **Total** | **54** |

The exact action names are in `docs/motion-completion-inventory.md`. These require appropriate task contexts, source-bound body placement, lifecycle/completion tests, and prop/station compatibility. Do not select every existing work image automatically: many include painted furniture, loads or tools that would overlap a persistent independent station. Mining/carry directional templates do not automatically activate their different fixed-reference counterparts.

## Contact and continuity corrections still open

**Elder:** all eight moving foot/cane views remain unapproved. The rear diagnostic has 20.729px cane plant displacement, 36.639px largest cane boundary jump, and **95.579px disagreement between the root travel required by simultaneous cane/foot proxies**. These are silhouette diagnostics, not verified corresponding material points. Retiming a cane alone cannot solve conflicting foot support. Required work is contact-controlled support poses, physical cane lift/recovery/replant, material sole/tip correspondence across every boundary, and live movement proof. The rejected guide sheet is not a substitute. Use individually authored or rigged contact-controlled poses rather than repeating the same failed sheet request.

**Laborer rear-left:** arm counter-swing in3-5, contact4/support5 geometry and6-to7 spacing are unresolved. Whole-stride candidate boundary residual reaches110.265px. The bounded registration proposal is rejected: it needs25.136px perpendicular displacement, beyond12px, and a hold below40ms. There is no valid calibration to adopt.

**Blacksmith right:** the old six-point fit was invalidated by the moved return toe. Current whole-boundary residual reaches60.128px; changing a single stride ratio still leaves35.679px. A bounded, unapplied candidate at0.875 body heights with durations `[121,174,136,46,165,119,116,123]` and up to5.75px vertical registration predicts1.269px for candidate marks. It still needs reviewed material/anatomical correspondence, a registered re-export, runtime adoption and live full-stride/loop proof.

**Other walking families:** side/rear contact halves0/4, passing feet2/6, and anatomical support identity still require confirmation against the front phase convention. Reach3 and touchdown4 deliberately share the advancing leg; that is not itself a required leg swap. Rear-right first-half/return cases and same-side arm advances have specific notes in the bound family records. Correct those poses before approving turns; matching frame indices or a common520px height cannot establish anatomical continuity.

**Directional tools and timber:** the three families have reviewed open findings for matched strike/cast planes, hidden hand/shaft grips, blade elevation, and log foreshortening/cut-end/shoulder geometry. All24 final cycle reviews remain open.

**Independent stations:** Cook blade/food/block contact, Borrin quill/paper contact and Laborer crate release/reset still need final approval. Existing scoped approvals for Blacksmith, Ginger, Stoneworker and Quartermaster remain separate from their main reference cycles. Further independent actions must preserve an independently owned prop through cancellation, completion and worker departure.

## Finite completion order

1. Author coordinated Elder support/cane poses and validate one full rear stride against genuine material landmarks; carry the accepted contact method through the other seven views.
2. Correct the documented Laborer rear-left defects and verify the Blacksmith right calibration before adopting any runtime stride changes.
3. Work through the remaining side/rear walking findings in the eleven bound family records; measure complete strides, including7-to0 and direction switches.
4. Correct/review the pickaxe, shovel and timber geometry, then approve their full directional families.
5. Activate the54 named existing reference actions with calibrated placements and real task/ambient contexts; retain independent prop ownership where those stations are used.
6. Close the154 remaining cycle obligations, recording only source-bound passed reviews. Re-evaluate changed dependencies. Merge readiness requires every gate to pass.

## Evidence and validation

- `docs/motion-completion-status.json` and `docs/motion-completion-inventory.md`: regenerated source-bound accounting.
- `docs/motion-completion-scope.json`: unchanged160-cycle scope, eleven blocked direction-review records, eleven audited reference mappings, and dispatch/calibration dependency hashes.
- `docs/motion35-rejected-attempts.json` and `docs/art-review/motion35/`: rejected Elder guide source and the eleven direction contact sheets.
- `docs/motion35-runtime-review.json`: current activity samples, validation totals, dependency hashes, completed delta and remaining merge blockers. The archived live screenshot is in `docs/art-review/motion35/elder-live-laugh-and-gesture.png`.
- `public/sprites/Elder/motion/*/reference/loop-approval.json`: the two narrowly scoped passed seated-cycle reviews.
- Live six-activity check: once-hold completion, finite terminal hold, departure/return reset; all eight live frames of both approved laughter cycles;464 consecutive recorded activity samples with no idle fallback during handoffs. The first stew cycle was not sampled at every frame in the software-rendered live probe and has no final cycle approval.
- Automated library browser review:153 sequences,1,224 images, controls, phase preservation, seam comparison and mobile layout. This is functional review-tool validation, not automatic anatomical approval.
- Static Pages startup now mounts its empty client shell directly; server-rendered pages retain hydration with visible recovery errors. The final live activity check and the two movement-burst captures have no console errors.
- Motion35 adds activity/loader lifecycle tests and strict blocked-review accounting.198 Node tests,57 Python tests, type checking, Pages build, browser review and whitespace checks pass. GitHub build status is a separate delivery check; full motion acceptance remains blocked.
