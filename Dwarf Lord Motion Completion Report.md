# Dwarf Lord motion completion report

Checkpoint: **motion37, 3 October 2026**. PR #9 remains a draft. **Full motion polish is incomplete; merge approval is withheld.** The scope remains frozen at 160 cycles: 153 main-library sequences and seven independent station actors. This checkpoint adds no new action, character or direction to the obligations.

## Completed in motion37

- **Approved the Blacksmith right-view walking loop.** Authored new contact0, down1 and reach7 boot-overlap/inner-side corrections. The near anatomical right leg trails in0/1/7 and leads in3/4/5; its arm opposes that leg. Passing2/6 approach neutral. Exact edit references, prompts, original sheet and selected inputs are retained. Poses2/3/5/6 preserve their prior pixels exactly;4 differs only at a small antialias fringe. No limb transformation or synthetic in-between was applied.
- **Adopted a measured stride for that view.** Reviewed corresponding visible heel/toe material at all eight boundaries, including7-to0. Registered timing is `[109,232,135,46,164,118,111,85]` ms, with stride0.880769 body heights. Whole-boundary measurement is1.032px maximum; the actual rendered mesh/camera proof covers three complete strides,24 handoffs and moving held-pose samples. The saved renderer evidence reports the exact maxima. The approval is limited to this view at0.6-radian camera elevation on flat ground. It does not approve turns, other views, terrain or equipment.
- **Fixed late-atlas pose planting.** A first visible pose could arrive partway through a stride, but its root was reconstructed using only the last update's movement. The controller now uses the complete pose fraction and retained resolved heading, including a decode that finishes during a collision stop. A delayed-decoder regression catches that case. Teleports, idle reset, turning and collision behavior remain covered.
- **Added guarded runtime travel calibration.** The game and review page use an explicitly bound measured ratio when available. Other walks retain the1.2-body-height estimate. Changed source, settings, direction or timings invalidate a calibration. Export recomputes all eight reviewed material boundaries; a cached pass flag is insufficient. Added a read-only actual sprite/camera geometry probe to distinguish rendered contacts from controller-root diagnostics.
- **Corrected five local Laborer rear-left poses.** Selected authored0/3/4/5/7 correct opposing near-left arm phases3/4/5, leading-heel depth4, support depth5 and trailing toe/ankle geometry0/7. A second local0 edit restores positive7-to0 toe progression. Original1/2/6 remain pixel-exact. These are local improvements, not a stride or loop approval. Additional1/2/6 and7 attempts failed the required contact/pose constraints and remain unselected with their exact provenance.
- **Accepted two Elder finite inspection tasks.** Reviewed all eight native/exported and live camp poses for `inspect-pickaxe-in-lap` and `examine-pickaxe-crack`: identity, seated placement, visible grip, connected pick head/shaft, props, completion, terminal hold and departure reset. They remain once-hold actions; continuous replay and seams between distinct activities are unapproved. The crack reference includes its painted table and is not certified as an independent station. These reviews do not approve the moving cane gait or hidden finger anatomy.
- **Revalidated existing station and seated reviews.** All seven independent station actors retain their scoped acceptance. Six have fixed-view loop acceptance; Laborer crate placement has finite-task acceptance. The crate remains placed after release and cannot implicitly regenerate on replay. The review page now distinguishes approved finite tasks, scoped loops and pending reviews.

## Exact current accounting

| Gate | Before motion37 | Current | Still required |
| --- | ---: | ---: | --- |
| Main-library cycles with scoped final review | 4 of153 | **7 of153** | 146 |
| Independent station actors with scoped final review | 7 of7 | **7 of7** | 0 |
| Outstanding final cycle reviews, main + actors | 149 | **146** | 63 walk +24 directional tool/carry +59 fixed work |
| Direction families with a current recorded verdict | 11 of11 | **11 of11** | Correct recorded findings |
| Direction families with passing continuity approval | 0 of11 | **0 of11** | 11 |
| Existing reference actions with gameplay mapping | 11 of65 | **11 of65** | 54 activations |
| Elder coordinated moving foot/cane views approved | 0 of8 | **0 of8** | 8, included in the walk count |

The seven main reviews comprise five scoped loops and two finite tasks. The frozen160-cycle scope has14 scoped acceptances in total. A finite task is not a seamless-loop approval. These gates overlap: the146 unapproved cycles are **not146 demonstrated redraw requirements**. Review each before deciding whether it needs new art. Successful loading/playback does not approve anatomy or contacts.

### Remaining gameplay activations

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

The exact action names and cycle IDs are listed in `docs/motion-completion-inventory.md`. Each activation needs an appropriate context, source-bound body placement, tools/prop ownership, completion and reset. Many older references include painted furniture; selecting them over an existing independent station would duplicate props. No additional gameplay action or station family was activated in motion37.

## Contact and continuity work still open

**Laborer rear-left:** current candidate whole-boundary residual is63.079px. The bounded proposal still requires14.679px perpendicular registration, above12px. All proposed holds are now within valid bounds and return travel no longer reverses. Material correspondence remains unapproved. Current candidate landmarks changed alongside the art; this is not a verified before/after sole measurement. Correct the boot ground-plane perspective and support travel around2/3 and6/7, review heel/toe correspondence throughout both support halves, then remeasure the registered export and prove all eight boundaries in the game. Do not adopt an oversized registration correction or a numerical fit to unverified landmarks.

**Elder moving gait:** complete all eight views. Rear0/1/4/5 have retained local improvements from motion36, but the remaining sole phases, simultaneous first-half foot/cane plant, rigid cane geometry, recovery and replant need contact-controlled authoring and visible material landmarks. Joint rear proxy disagreement remains14.009px and cane plant displacement18.057px, both above6px. These are silhouette-proxy diagnostics, not corresponding material proof. A seated narrative NPC given a destination is not a walking demonstration; use an intentional supported movement context for the actual contact review.

**Other walking views:**63 walking cycles remain unapproved, including the Blacksmith's other seven views. Check leading/support identities, contact halves0/4, passing2/6, reach3/7, opposing arms and complete sole travel before approving loops. Reach3 and contact4 legitimately share the same advancing leg. Preserve character scale and phase across adjacent directions; a passed fixed-view stride does not approve a turn.

**Directional tools and timber:** all24 cycle reviews remain open. Check visible wrist/shaft grips, connected rigid heads/handles, strike/cast planes, tool elevation, log foreshortening, cut ends and shoulder support in all eight directions. Occlusion cannot certify hidden anatomy. The Elder seated inspection task acceptance does not approve these translating or directional tools.

**Other fixed work:**59 main-library fixed work reviews remain open. Review the exact task context, foot/body placement, furniture/tool layering, props and lifecycle. The seven independent station actors are already accepted within their recorded fixed-view scopes; their acceptance does not automatically cover the older combined references.

## Completion order and merge conditions

1. Finish the Laborer rear-left pilot using contact-controlled pose references. All eight corresponding visible support boundaries must pass after bounded registration; prove held contacts, return and lifecycle in the actual renderer. Preserve rejected inputs instead of relabeling them as passed.
2. Finish the Elder rear coordinated foot/cane plant/recovery/replant and supported movement review, then its seven other views.
3. Resolve the other walking and three directional tool/carry families. Re-review all11 families against current art, registration and runtime. Every family needs an explicit passing continuity verdict.
4. Activate the54 named existing work actions with suitable placement, prop ownership and lifecycle. Add an independent station only where required by an existing action; do not expand the frozen obligations automatically.
5. Close all146 remaining final cycle reviews against exact artifacts and dependencies. Use finite-task acceptance for genuine once-hold actions; use loop acceptance only when repeat continuity has been reviewed. Changed evidence must revoke stale acceptance.
6. Give merge approval only when the generated inventory reports zero outstanding final reviews, zero missing/failed direction approvals, zero required unmapped actions, and passing checks on the exact pushed PR commit. A green build alone is insufficient.

## Evidence and validation

Current accounting is generated in `docs/motion-completion-status.json` and `docs/motion-completion-inventory.md`. `docs/motion37-runtime-review.json` binds this checkpoint to current runtime, art, calibration and browser evidence. Native pose sheets, actual rendered contacts, Elder frames and station captures are in `docs/art-review/motion37/`. Motion34/35/36 evidence remains historical.

Validation covers201 Node tests,63 Python tests, type checking, a Pages build, all153 sequences/1,224images in the review controls, all seven workstation layers, all48 actual-rendered Elder activity poses, NPC walking/turning/collision/arrival and task cancellation/day completion, and gameplay captures. The Blacksmith renderer proof verifies three complete strides and material contact handoffs. These checks do not approve the unresolved art and activation gates.

**PR #9 is not green to merge. Motion37 closed three main reviews;146 final cycle reviews,11 passing direction-family reviews and54 gameplay activations remain.**
