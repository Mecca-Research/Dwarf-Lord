# Motion57: whole-stride authoring constraints and rejected rear-left trials

The new offline guide tools render eight complete volume poses in each of the eight standard directions. Rigid equal-length thigh/shin segments, rigid heel/toe geometry, alternate support legs, lifted passing feet and opposed arms share one world rig. The guides include the closed7-to0 handoff and fixed34-degree camera projection. All64 rendered volumes fit their canvases, and three mathematical tests verify the guide constraints. These gray volumes and projected controls are authoring constraints; they do not establish observed sprite material, visible anatomical correspondence, a physical sprite root, moving foot/cane contact or final loop acceptance.

From the repository root, render a fresh guide set with:

```bash
node scripts/render-motion-volume-guide.mjs --direction all --output work/motion-volume-guides
```

`volume-guides/` records the exact rendered constraints and control data from the reusable helper. `authoring-inputs/volume-guide57.html` and its original image/control file retain the earlier prototype used in attempt3; its composition anchor differs from the reusable helper's540px default. The current helper is not claimed to reproduce that earlier prototype's pixels exactly.

## Actual source attempts and findings

Seven builtin image-generation requests author one full eight-pose strip or correct a complete figure inside that strip. Their exact prompts, ordered reference digests and1774×887 transparent raw outputs are retained in `authoring-requests57.json` and `authoring-inputs/`.

1. The first strip repeats older airborne-boot and partial-phase geometry.
2. The wire-guide-first strip improves counter-arms but leaves support depth and material correspondence unresolved.
3. The shaded-volume-first strip improves the boot perspective, but its first passing phase uses the wrong leg.
4. A whole pose2 correction switches the passing leg. The other seven normalized native figures are copied literally.
5. A complete push-off3 correction changes the near arm into the wrong phase. Its actual opaque sole hypotheses leave a3-to4 necessary minimum8.767484px, above6px.
6. The next full-figure correction still has the wrong near-arm phase and lowers the supporting boot. On its unreviewed opaque observations, the3-to4 necessary minimum is8.257453px, still above6px.
7. The guide-first edit changes source slot2 despite the request for slot3. That complete new figure is imported as phase3, retaining the other seven native figures exactly. Its near-arm phase improves, but the supporting sole plane, corresponding material and complete stride remain unapproved.

The latest complete trial is `native-trial/Laborer/motion/walk/back-left/`. Its review sheet and APNG show the eight actual authored figures. `native-selection57.json` proves that every whole native RGBA frame equals its retained input, including all existing translucent edge pixels; all eight frame hashes are distinct. Six figures come from the initial normalized attempt3, one whole passing2 comes from attempt4 and one complete push-off3 from attempt7. There is no local limb warp, painting, mirror, per-pose body fit, duplicate or synthetic in-between.

Original attempt3 pose0 has an actual opaque crown at y16 and boot extent at y434: one419px common basis and520/419 uniform whole-strip scale. Cell-center/row-floor anchors describe composition. They remain explicitly unverified as physical anatomical roots. The separate literal whole-cell assembly avoids a failed tight-alpha recrop that lost faint existing fringe pixels; that failed export supplies no positive evidence.

## Source-bound contact failure

Every recorded native sole point is read from actual opaque material, with RGBA values retained in `sole-pixel-reads57.json`. These are hypotheses with all anatomical/material correspondence flags false. The initial transparent candidate5 point and alpha15 candidate6 fringe point are separately rejected before any complete observation/calibration is written. No guide, hidden foot or intended target supplies observed material.

The latest trial covers all eight handoffs, including7-to0. Equal125ms timing at the default1.2 ratio leaves82.968px maximum contact jump; the fixed-duration fitted ratio0.820093 still leaves62.922px. A private1000ms bounded proposal, retaining±12px integer whole-pose component offsets and40ms minimum holds, leaves9.931111px after integer rounding. Proposed1200/1600/2000ms variants leave9.356440/8.796182/8.370781px. None passes6px or is adopted. Unequal long holds do not have native cadence approval.

The hypothetical point[300,549] in the numeric target files is an unobserved authoring constraint. Its smaller fitted residual is not a source observation or acceptance result. The closed-cycle necessary bound0.392623px and lack of a single perpendicular-bound failure in the latest trial do not approve anatomy, material tracking, held frames, source roots, equipment, direction transitions or loops. This demonstrates why an isolated necessary-bound pass cannot close a gait.

Historical candidate5/6 diagnostics in `earlier-diagnostics/` preserve their original private paths and dates; raw and literal normalized inputs are retained for reproduction. The top-level observations and measurement bind directly to the archived latest trial, its source/settings/frames/atlas/timings and current unchanged runtime.

## Retained runtime and exact merge gates

`retained-assets-audit57.json` verifies all4932 tracked runtime/public blobs against4e1b64b, all71 current scoped source acceptances, the frozen scope and selected failed Laborer/Elder records. No selected public sprite, task dispatch, workstation, calibration, approval or game source changes in this checkpoint. The source-bound runtime coverage remains25/65 live,40 inactive;21 approved station/actor variants use14 physical live props.

All222 Node tests pass freshly. Motion56's104 Python tests, typecheck, Pages build, seven actual forge days,21 approved previews and two headed full-scene movement captures keep their original provenance and limited scopes, supported by the exact code/art/dependency audit. The new offline guide browser check covers eight views/64 volumes; it is not a new gameplay or motion acceptance.

The frozen inventory still has50 main plus7 original actor scoped acceptances:103 individual reviews remain, comprising62 walks,24 directional tool/carry cycles and17 fixed references. All11 direction families remain changes-required; all eight coordinated moving Elder cane views remain open inside the62 walks. Fourteen derived finite actors remain outside the frozen denominator. These review, direction and activation categories overlap and must not be added into an invented asset total. PR9 remains Draft and is not ready to merge.

Continue source authoring from the full world-volume constraints and actual material findings. Resolve corresponding sole geometry and natural support/arm phases before another calibration can be adopted; then require actual held-frame, boundary and final-cycle playback proof. Do not rerun the rejected text-only toe-shift method or accept an unobserved numeric target.
