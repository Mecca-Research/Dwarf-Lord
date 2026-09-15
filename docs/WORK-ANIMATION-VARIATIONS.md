# Work action animation variations

This library expands the 84 static occupational references into four authored keyframes per action. Each action keeps its own character, reference viewpoint, equipment and workstation composition. Motion includes preparation, contact, recovery, inspection gestures, writing, food preparation, guard movement and carrying steps.

## Organization

```text
public/sprites/<Character>/work-animations/
  manifest.json
  <action-name>/
    source-sheet.png   # original generated four-frame sheet
    00.png … 03.png    # 640 × 640 transparent keyframes
    atlas.png         # four columns, 2560 × 640
    preview.png       # animated PNG, four frames at 250 ms each
    review.jpg        # labeled still sheet
    manifest.json     # frame order, descriptions, registration, provenance
    prompt.txt        # generation request
```

`public/sprites/work-animation-library.json` indexes available character catalogs. Each action manifest links to its original static work reference. The original static and angle/stance libraries remain available.

`docs/work-animation-plan.json` records the full action list, four requested motion beats and export status. `docs/work-animation-generation.json` records the built-in image-generation requests and output filenames. Generation uses each individual action PNG as the reference, rather than mixing multiple characters into a single request.

## Preview

Open `work-animation-review.html` through the development server or Pages preview. Select a character and action, then step through frames, play once, restart, adjust speed or enable Repeat. The original static composition remains beside the animation. Each action links to its source, atlas, manifest and APNG preview. Arrow keys step; Space plays/pauses when focus is outside form controls.

The live game renderer is not changed by this asset-production pass.

## Export

Run `python3 scripts/export-work-animations.py` from the repository root, or add `--character Blacksmith` to export one character. Dependencies: Pillow, NumPy, SciPy and DejaVu Sans. The exporter keeps missing sources pending so an interrupted generation run can resume without inventing frames.

The four principal scene components are isolated from each source sheet; detached props are assigned by proximity. All four frames share one scale. Registration uses the lower silhouette center and ground contact, leaving room for raised tools. Frame dimensions are 640 × 640 with ground anchor `(320, 616)`. Source bounds, placement and the common scale are recorded in the manifest. The atlas and APNG contain those same authored frames; there are no fabricated intermediate images or whole-sprite bobbing transforms presented as new poses.

## Production limits and next work

These are action-specific keyframe variations. They establish motion poses but are not certified seamless production loops: generated furniture, costume details and body outlines can redraw slightly between frames. Manifests mark `productionReady: false` and describe repeat playback as a review aid. Four keyframes are particularly sparse for walking and forceful tool swings.

For gameplay integration, select the action and view, correct remaining redraw drift, separate stationary workstation layers where useful, add in-between poses and tune contact/hold/recovery timing. Keep tool ownership and hand contact consistent. Lifting, placing masonry, coin transfer and page turns should become one-shot transitions or stateful actions; repeating the review must not be interpreted as real inventory changes. Carry and patrol cycles need foot-contact and root-motion matching before navigation integration. Further directions should be authored from the same approved character identity, not obtained by arbitrary mirroring of asymmetric equipment.

## Validation

- `node --test scripts/work-animations.test.mjs` checks complete correspondence with the 84 static actions, 336 distinct per-action frame exports, PNG format/dimensions, source hashes, references, atlases and APNG animation metadata.
- `node scripts/work-animation-review-check.mjs` exercises every exported character/action, image loading, stepping, play-once, repeat, pause, restart, keyboard control, rapid character selection and mobile overflow. Use `REVIEW_URL` to test a production subpath.
- The bundled develop-web-game client supplies an independent deterministic playback/navigation check.
- Inspect source sheets and exported review images for anatomy, likeness, tools, complete silhouettes and motion intent. Automated structure tests do not certify artistic quality or seamless motion.

### Visual review findings

The source review prompted anatomy corrections for Blacksmith repair-pickaxe-handle and Silver inspect-shovel-handle, plus new carry/patrol variations for Stoneworker and Veteran. Several carrying, cart and hauling sheets still repeat similar leading-leg silhouettes instead of a complete opposite-foot contact sequence. Prioritize Human Laborer carry-timber/push-supply-barrow, Laborer carry-sack/push-rubble-barrow, Silver carry-ore-tub/push-stone-cart, Ginger carry-supplies/haul-firewood, Helga carry-timber and Red Miner carry-ore-buckets for gait correction. Station textures, proportions and feet can drift between drawings; lock workstation layers and improve registration before shipping animation loops.

Validation completed 2026-09-15: TypeScript check, all 156 repository tests and Pages build passed. Browser automation loaded all 84 actions/336 frames and passed playback, stepping, keyboard, rapid-selection and mobile-layout checks with no browser errors. The independent web-game harness passed, and all 336 frame exports have transparent outer borders.
