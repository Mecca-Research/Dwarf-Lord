# Dwarf Lord motion completion report

Checkpoint: **motion36, 2 October 2026**. PR #9 remains a draft. **Full motion polish is incomplete; merge approval is withheld.** The scope stays frozen at 160 cycles. No new character, action or direction was added to the completion obligations in this checkpoint.

## Completed in motion36

- Closed three independent station reviews: Cook vegetable chopping, Borrin open-ledger writing, and Laborer crate placement. All seven existing station actors now have a valid scoped final review. Six have a fixed-view visual loop review. Laborer has a finite once-hold task review: the crate is lifted, placed, released and held. Continuous 7-to 0 replay is explicitly unapproved because the released crate would reappear in his hands.
- Fixed Borrin's quill layering over the ledger. Narrow shaft contours reuse the original actor pixels, keeping the feather, shaft, hand and nib visible over the page while the torso stays behind the desk. Regenerated and inspected the desk preview and browser composites; expanded the atlas-coordinate geometry test to include Borrin.
- Closed two main-library reviews: Elder `eat-stew/reference` and `eat-bread/reference`. Reviewed all eight native/exported poses, prop ownership, seated feet/stool, body scale and 0/7 return. Controlled browser time exposed all 48 poses in the six-activity camp sequence through the actual renderer, with unchanged 125 ms timings. Each activity completed once, held its terminal pose, and reset after departure. The eating approvals cover cosmetic fixed-view gestures; food accounting, moving feet/cane and cross-action seams are excluded. The two pickaxe inspection actions remain unapproved despite passing their playback checks.
- Adopted four individually authored Elder rear gait corrections: contact 0, passing/support 1, opposite contact 4 and passing/support 5. The contact boot reaches forward in depth; the passing boot is airborne rather than presenting another trailing sole. Cane 4/5 is released and recovering. Original poses 2/3/6/7 remain byte-for-byte unchanged. Candidate 0 and 5 needed a second local edit; their unselected inputs, exact prompts, original references and immediate edit references are retained.
- Added opt-in physical body-height/root landmarks to whole-pose assembly. A raised foot now changes pose geometry without changing body scale or pelvis registration. Legacy assemblies retain their exact prior behavior, verified by reconstructing the previously approved Ginger station source and registration.
- Recomputed the Elder rear diagnostics. Simultaneous foot/cane proxy disagreement improved from 95.579 px to **14.009 px**. Cane plant displacement improved from 20.729 px to **18.057 px**. Both remain above the 6 px contact target and use silhouette proxies, not corresponding material points. **No stride, walking contact or full direction approval was adopted.** Runtime walking still uses the existing 1.2-body-height estimate.
- Strengthened review accounting: a finite task cannot inherit a seamless-loop approval, and changed playback mode, end behavior, source, timing, registration or released-prop layer invalidates the task review. Improved the live walking probe so a slow renderer can complete its 32-sample window over multiple routes without comparing planted roots across teleports; missing work assets and browser console errors now fail it.

## Exact current accounting

| Gate | Before motion36 | Current | Still required |
| --- | ---: | ---: | --- |
| Main-library cycles with scoped final approval | 2 of 153 | **4 of 153** | 149 |
| Independent station actors with scoped final approval | 4 of 7 | **7 of 7** | 0 |
| Outstanding final cycle reviews, main + actors | 154 | **149** | 64 walk + 24 directional tool/carry + 61 fixed work |
| Direction families with a recorded verdict | 11 of 11 | **11 of 11** | Correct the findings |
| Direction families with passing continuity approval | 0 of 11 | **0 of 11** | 11 |
| Existing reference actions with gameplay mapping | 11 of 65 | **11 of 65** | 54 activations |
| Elder coordinated moving foot/cane directions approved | 0 of 8 | **0 of 8** | 8, included in the walk count |

These gates overlap. The 149 cycle reviews are **not 149 demonstrated redraw requirements**. They identify assets awaiting final acceptance; each must be inspected before deciding whether it needs redrawing. Playback, export/loading checks and visual/physical contact acceptance are separate. An approved station actor does not automatically approve the older combined reference image for the same action.

### Remaining gameplay activations

| Character | Existing actions still inactive |
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

The action names are listed in `docs/motion-completion-inventory.md`. Each needs a suitable task or ambient context, source-bound body placement, completion/reset behavior, and compatible tools/props. Many older references contain painted furniture or loads; automatically selecting them over an independent station would duplicate props. The existing seven stations remain independently rendered after their workers depart. No new station family or gameplay action was activated in motion36.

## Contact and continuity work still open

**Elder moving gait:** complete all eight views. Rear0/1/4/5 now have better local leg phases, but soles2/3/6/7, simultaneous first-half foot/cane support, physical cane length/depth, and recovery/replant need corresponding material landmarks and contact-controlled geometry. Rear diagnostic disagreement is 14.009 px, above 6 px; cane plant displacement is 18.057 px. Neither measures a verified anatomical sole. Preserve the new physical root/scale while correcting remaining poses. The Elder is a seated narrative NPC in gameplay; a destination request does not create a walking demonstration. A genuine moving-contact test requires an intentional supported movement context, rather than treating a forced destination as proof.

**Laborer rear-left:** arm counter-swing in 3-5, contact 4/support 5 geometry and 6-to 7 spacing remain unresolved. The whole-stride candidate boundary residual remains 110.265 px. The bounded registration proposal is rejected: 25.136 px perpendicular displacement exceeds 12 px and a proposed hold falls below 40 ms. No valid stride calibration has been adopted.

**Blacksmith right:** current whole-boundary residual remains 60.128 px; changing one stride ratio leaves 35.679 px. A bounded, unapplied proposal uses 0.875 body heights, durations `[121, 174, 136, 46, 165, 119, 116, 123]` and up to 5.75 px vertical registration, predicting 1.269 px at candidate marks. It still requires actual sole/material correspondence review, a registered export, runtime adoption and live full-stride/loop proof. A numerical fit to unverified marks is not an approval.

**Other gait families:** side/rear contact halves 0/4, passing phases 2/6, support-foot identity and opposite arm phases need correction/verification against the front convention. Reach 3 and touchdown 4 legitimately use the same advancing leg; do not swap them merely to change frame parity. All eight views and turning transitions must retain character scale, anatomical phase and held-foot contact. All 64 walking cycles remain unapproved.

**Directional tools and timber:** all 24 cycle reviews remain open. Check strike/cast planes, wrist/shaft grips, tool-head elevation, and log foreshortening/cut ends/shoulder contact in all eight views. Visible rear occlusion does not verify hidden hand anatomy. The two Elder seated pickaxe inspection cycles also need rigid tool/shaft and grip review; successful playback does not close them.

**Final work-cycle reviews:** review the remaining 61 main-library fixed work cycles in their actual task contexts. Existing source-bound station approvals stay limited to their fixed view and exact artifacts. Laborer placement requires an explicit new-task reset; it is not a repeating crate-generation loop. Overall `productionReady` remains false.

## Completion order and stopping conditions

1. Finish the Laborer rear-left and Blacksmith right pilots with real corresponding sole points at every support boundary, including7-to 0; correct anatomy/arm phases first, then adopt only verified registration, stride and timing. Prove held contacts, transitions, turning, collision freeze and arrival in the live renderer.
2. Finish Elder rear joint foot/cane support and rigid recovery/replant, then apply the verified method to the seven other Elder directions. Give movement an intentional gameplay/review context while retaining his narrative role.
3. Resolve the remaining seven other walking families and the three directional tool/carry families. Re-review each complete eight-direction family with current source/registration/runtime bindings. All 11 families must receive explicit passing verdicts.
4. Activate the 54 named existing work actions in appropriate contexts and review their body placement, prop layering and lifecycle. Add an independent station only where an action actually requires one; do not expand the frozen cycle scope automatically.
5. Close all 149 remaining final cycle reviews against exact artifacts and dependencies. Re-export any changed art, revoke stale approvals automatically, and rerun the relevant browser/gameplay checks.
6. Give merge approval only when the generated inventory has zero remaining cycle reviews, zero failed/missing direction approvals, zero unmapped required actions, and passing checks on the exact pushed PR commit. A successful CI build alone is insufficient.

## Evidence and verification

`docs/motion-completion-status.json` and the generated inventory are the current accounting source. `docs/motion36-runtime-review.json` binds the checkpoint to exact runtime, art, calibration, review and browser-probe files. Current native pose sheets and browser captures are in `docs/art-review/motion36/`. Historical motion34/35 records retain their original claims and hashes; they are not relabeled as current approvals.

Validation is recorded in the bound motion36 evidence after the final checks. Local checks cover198 Node tests, 62 Python tests, type checking, a Pages build, all 153 sequence/1, 224-image review controls, all seven station layers, controlled-clock48-pose Elder rendering, normal-time lifecycle probes, real walking/turning/collision/arrival behavior, and bundled gameplay captures. These checks do not approve unresolved anatomy or tool geometry.

**PR #9 is not green to merge. Motion36 closed five reviews and improved four gait poses; 149 final reviews, 11 passing direction-family reviews and 54 gameplay activations still remain.**
