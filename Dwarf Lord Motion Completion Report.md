# Dwarf Lord motion completion report

Checkpoint: **motion38, 3 October 2026**. **PR #9 is not ready to merge.** This checkpoint closes 32 additional main-library cycle reviews, reducing outstanding reviews from 146 to **114**. The scope remains the same 160 cycles: 153 main-library sequences and seven independent station actors. No new character, action or direction was added to the obligations.

## Completed in motion38

Reviewed the 59 fixed-reference sequences that lacked a final acceptance. The results are **32 accepted, 20 changes required, and seven needing further contact/calibration review**. The six previously accepted Elder references remain current. Every fixed-reference action now has either an exact acceptance or an explicit remaining-work finding.

The 32 new acceptances comprise three visual loops and 29 finite once-hold tasks. Each acceptance binds the source, eight exported frames, atlas, registration, authored durations, native review, browser evidence and relevant playback code. The browser test exposed every pose for its entire authored hold, checked every timed handoff, completion at7, sustained terminal hold and explicit reset. The three loop candidates also passed their exact7-to0 boundary check. Native art was reviewed separately; successful loading never supplies an art verdict.

| Character | Newly accepted reference sequences | Type |
| --- | --- | --- |
| Blacksmith | hammer-raised; hammer-contact | Two scoped visual loops |
| Blacksmith | inspect-tool; file-tool-edge; repair-pickaxe-handle | Three finite tasks |
| Borrin | desk-writing; review-open-ledger; turn-ledger-page; explain-at-desk; stamp-paperwork; explain-closed-ledger; explain-open-ledger | Seven finite tasks |
| Cook | chop-vegetables; peel-potatoes; knead-dough; stir-cauldron; mix-ingredients; serve-stew; cut-boar-meat | Seven finite tasks |
| Female Miner | examine-sample; repair-pickaxe | Two finite tasks |
| Helga | inspect-mineral; bind-tool-handle; pickaxe-ready; pickaxe-contact | Four finite tasks |
| Ginger | sharpen-hatchet; sharpen-axe; saw-timber; build-timber-crate | Four finite tasks |
| Ginger | fell-tree | One scoped cosmetic chopping loop; no actual tree fall |
| Laborer | build-crate; stack-crates | Two finite tasks; delivered crate stays placed |

These acceptances cover the named fixed references at their local sequence scale, visible grips, combined painted props and gallery/shared playback. Physical standing-height calibration, translating sole/cane contacts, direction changes, independent furniture ownership, live gameplay activation and economic output remain separate requirements. Finite tasks are not approved seamless repeats.

**Corrected Borrin's open-ledger identity in all eight poses.** The standing explanation now retains bronze spectacles and two brass-bound grey beard tips. Its static consultation reference uses the same reviewed initial pose. The newly authored faces preserve the original poses, open book and painted furniture. Fresh registration measurement gives0.369px maximum residual translation for this set. The other33 registered fixed-prop sets remain within the existing0.71px test bound.

**Recorded rejected work without counting it as completed.** New `cycle-review.json` records bind specific defects to the current art and evidence. They remain merge blockers. Changed art or evidence invalidates the rejection, and a positive verdict placed in this rejection file cannot grant approval. Four regression tests cover those cases.

Single-pose attempts to fix Blacksmith hammer recovery and Ginger's final split log corrected their intended tool/material state but repainted fixed station geometry. Their registered correlations failed the existing bounds. They were archived and not selected. Two whole-sheet Borrin coin edits retained a duplicate coin in the final hand; a subsequent single-pose edit emptied the hand but changed the desk coin layout. These candidates are also archived and unselected, with exact prompts and inputs. A corrected hand does not justify accepting unrelated prop changes.

## Exact current accounting

| Gate | Before motion38 | Current | Still required |
| --- | ---: | ---: | --- |
| Main-library cycles with scoped final acceptance | 7 of153 | **39 of153** | 114 |
| Independent station actors with scoped acceptance | 7 of7 | **7 of7** | 0 |
| Outstanding cycle reviews, main + actors | 146 | **114** | 63 walk +24 directional tool/carry +27 fixed work |
| Fixed-reference actions with scoped acceptance | 6 of65 | **38 of65** | 20 recorded defects +7 further contact/calibration reviews |
| Direction families with passing continuity approval | 0 of11 | **0 of11** | 11 current changes-required verdicts |
| Existing reference actions mapped to gameplay | 11 of65 | **11 of65** | 54 activations |
| Elder coordinated moving foot/cane views approved | 0 of8 | **0 of8** | Eight, included in the walk count |

The39 main acceptances comprise eight scoped loops and31 finite tasks. Together with the seven independent actors, **46 of the frozen160 cycles have scoped acceptance**. This is a count of accepted review scopes, not a percentage of game development complete. The114 open cycles are not114 demonstrated redraw requirements. Direction and activation gates overlap the cycle work and should not be added together as separate assets.

### Fixed-reference work still open

| Character | Accepted / existing references | Remaining |
| --- | ---: | --- |
| Blacksmith | 5 /7 | anvil-ready; fix-wheelbarrow |
| Borrin | 7 /8 | count-coins |
| Cook | 7 /8 | fillet-fish |
| Elder | 6 /6 | None in the seated reference scope; moving cane gait remains open |
| Female Miner | 2 /6 | pickaxe-ready; pickaxe-contact; shovel-ore; push-ore-barrow |
| Helga | 4 /6 | shovel-stone; carry-mine-timber |
| Ginger | 5 /11 | stack-firewood; haul-firewood; carry-supplies; chop-downed-log; load-logs-cart; build-barrel |
| Laborer | 2 /13 | lift-crate; carry-sack; push-stone-barrow; pull-supply-sled; sweep-wood-chips; roll-barrel; carry-crate; build-barrel; carry-large-stone-ore; repair-boardwalk; shovel-rubble |

The exact pose findings and hashes are in `docs/art-review/motion38/cycle-findings.json` and the individual review files. Examples of demonstrated defects are:

- Blacksmith ready6-to7 skips the hammer recovery. Wheelbarrow repair introduces and removes the carried hammer without an explicit pickup/placement.
- Borrin's original count-coins retains a finger coin after the apparent deposit. Cook's fillet-fish raises the knife above the dwarf's head and loses the separated fillet in the final pose.
- Female Miner's fixed pickaxe contact skips most of its descent4-to5; the shovel-ore reference never shows a load. Helga's shovel bucket is clipped or fragmented and the blade becomes empty before discharge.
- Ginger's placed firewood is lifted back out at the end; his split log regenerates as a whole log. The cart-loading set contains clipped/neighboring cart fragments. Barrel construction lacks a visible mallet return to the bench.
- Several barrow, supply and timber references label opposite half-strides while retaining the same leading/trailing boot. These need actual contralateral phases and whole-stride contact proof.
- Laborer ore carry contains clipped bin/pickaxe fragments; boardwalk repair changes hammer hands without a handoff; barrel construction introduces a hoop without placement. Shovel-rubble makes the loaded receiving barrow empty in the final pose.

Seven further reviews remain for Female Miner pickaxe-ready and Laborer lift-crate, carry-sack, pull-supply-sled, sweep-wood-chips, roll-barrel and carry-crate. They need the recorded phase/contact, fixed-prop or whole-stride measurements before acceptance. Their preliminary observations do not grant a final approval.

### Existing work actions awaiting gameplay activation

| Character | Existing actions still inactive |
| --- | ---: |
| Blacksmith | 6 |
| Borrin | 7 |
| Cook | 7 |
| Female Miner | 6 |
| Helga | 6 |
| Ginger | 10 |
| Laborer | 12 |
| **Total** | **54** |

The exact action names and cycle IDs are in `docs/motion-completion-inventory.md`. Each activation needs an appropriate context, source-bound body placement, coherent prop ownership, completion and reset. Older references often include painted furniture; displaying those over an independent station duplicates props. No new gameplay mapping or station family was activated in motion38.

## Moving contact and direction work still open

**Blacksmith right view remains the completed walking pilot.** Motion37 reviewed all eight visible material heel/toe boundaries and adopted0.880769-body stride with109/232/135/46/164/118/111/85ms holds. Whole-boundary residual was1.032px maximum; the saved actual renderer proof covers three strides,24 handoffs and held-pose travel. Its scope is this view at0.6-radian camera elevation on flat ground. Other directions, turns, terrain and equipment remain unapproved.

**Laborer rear-left:** retained local authored0/3/4/5/7 improvements are not a completed stride. The current whole-boundary candidate residual remains63.079px, with14.679px proposed perpendicular registration against a12px bound. Correct boot ground-plane perspective and support travel around2/3 and6/7; review material correspondence throughout both support halves, then remeasure and prove all boundaries in the actual renderer. Do not fit a numerical stride to unverified landmarks.

**Elder moving gait:** all eight views still need coordinated foot/cane plant, rigid cane geometry, recovery and replant. Rear proxy disagreement remains14.009px joint and18.057px cane displacement, above6px. These are failed silhouette-proxy diagnostics, not matching material evidence. The seated Elder inspection acceptances do not approve supported movement.

**Other walking and direction families:**63 walking reviews and24 directional tool/timber reviews remain open. Check anatomical lead/support legs, phases0/4 and2/6, opposing arms, complete sole travel, wrist/shaft grip, connected heads/handles, tool elevation, log cut ends/foreshortening and shoulder support. Cross-direction scale and transitions need their own explicit passing review against current art and runtime. All11 families remain changes-required.

## Completion order and merge conditions

1. Correct the20 recorded fixed-reference defects and finish the seven contact/calibration reviews. Preserve rejected inputs; verify retained deposits, grips and terminal state before approving a finite task. Approve repeat only where its seam is coherent.
2. Finish the Laborer rear-left whole-stride pilot and Elder rear joint foot/cane pilot with material-contact authoring, bounded registration and actual-rendered held/transition proof.
3. Complete remaining walking and directional tool/carry reviews, then pass all11 direction-family continuity reviews against current bindings.
4. Activate the54 existing work actions with appropriate placement, independent or combined prop ownership and task lifecycle. Add stations only where an existing action requires one.
5. Recompute the frozen inventory and resolve every open review, stale export and required mapping. Changed evidence must revoke acceptance.
6. Give merge approval only when cycle reviews, direction-family failures and required unmapped actions are all zero, and checks pass on the exact pushed PR commit. A green build alone does not satisfy the motion acceptance gates.

## Evidence and validation

Current accounting is regenerated in `docs/motion-completion-status.json` and `docs/motion-completion-inventory.md`. Motion38 findings, individual bindings,32 controlled-time proofs, native/browser captures and fresh station residual measurements are in `docs/art-review/motion38/`. `docs/motion38-review-summary.json` records this checkpoint's closures and remaining gates. Motion37's renderer/contact evidence remains historical and current for its unchanged scope.

Motion38 validation: **201 Node tests,67 Python tests, type checking, Pages build and whitespace checks pass**. Browser checks cover all153 sequences/1,224 images, all seven independent workstation layers, the32 exact-duration reviews and their task/loop lifecycle, corrected Borrin static consultation and two inspected headed gameplay movement captures. These checks do not certify the unresolved gait, material-contact, direction or activation work.

**PR #9 remains a draft. Motion38 closed32 reviews;114 cycle reviews,11 direction-family approvals and54 gameplay activations still block merge approval.**
