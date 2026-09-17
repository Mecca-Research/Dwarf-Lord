# Motion registration and playback polish

This pass improves the existing 153-sequence library. It does not add synthetic in-between frames or mark unreviewed art as production-ready.

## Changes delivered

- Redrew the Blacksmith and Female Miner's front walking sheets to correct opposite-leg support and arm counter-swing. Female Miner's source order is explicitly `[0,5,6,3,4,1,2,7]`. Both have source-space torso/ground calibration and longer contact/down phases with shorter passing/reach phases.
- Re-exported all 64 walking views with a common 520-pixel body-height target. Median torso registration avoids following an extended hand, cane or stepping boot; a shared source-row floor preserves boot elevation instead of snapping each frame's lowest pixel to the ground.
- Calibrated all 16 Female Miner tool views from helmet to boot independently of the tool's reach. Pickaxe and shovel families share a 340-pixel body target and a projected root at `[320,576]`, leaving room for overhead and below-ground tool travel.
- Calibrated all eight Helga shoulder-carry views to a 520-pixel body target and root `[320,608]`. The root uses the torso rather than the log's silhouette or the stepping feet.
- Registered six Borrin desk actions and three Blacksmith anvil actions to their fixed station. Corrections are bounded whole-pixel translations, measured against pose 0; no warping or prop replacement. The checked measurements in `motion-station-registration-results.json` show maximum residual translation below 0.7 pixels for all nine sequences. They do not measure hand contact or prop shape accuracy.
- Added authored timing for the Blacksmith's heavy strike, tapping and ready motions. Faster downstrokes and slower recovery replace uniform timing for those sequences.
- Work previews default to one-shot playback and hold the final state. This prevents completed crates, served food, loaded carts or ledger changes from immediately resetting. The three reviewed Blacksmith forge sequences and walking remain loop **candidates**, not approved loops. Repeating any other action is an explicit review control.
- Updated the review page with synchronized direction comparison, previous-pose overlay, root/body-height guides, last-to-first seam inspection and manifest-based frame timing. These are inspection tools, not proof that corresponding source poses are correctly phased.

## Authoring contract

Each optional `motion-polish.json` is tied to the source sheet's SHA-256. Replacing the source requires recalibration. The exporter refuses stale calibration or any placement that clips the 640-pixel canvas rather than quietly scaling one direction differently.

Coordinates and `offsetsPx` are in **source pose order**, before `generation.json.frameOrder` is applied. `landmarks[].root` uses absolute coordinates in the original sheet. `bodyHeight` and `landmarks[].bodyHeight` exclude raised tools. `sourceRowGround` records the two source-row ground planes. `durationsMs` is in **playback order**.

`registration.targetAnchor` is the projected animation origin. It is not necessarily the pixel position of a planted boot. A front-facing foot moves in screen Y as it travels in depth. Gameplay must couple an in-place gait to character velocity; pinning every lowest pixel to one horizontal line creates its own contact errors.

The 520-pixel walk/carry and 340-pixel tool targets are preview/atlas packing scales. **Do not render every 640-pixel canvas at the same world size.** For a character with physical body height H, use sprite-plane height `H * 640 / registration.targetBodyHeight` so switching between walk and tool actions preserves body size. Workstation sequences with no body calibration still require a physical-scale calibration before integration.

`playback.mode` distinguishes `once-hold` from `loop-candidate`. `frames[].durationMs` is authoritative. Preview speed is a multiplier relative to nominal 8 fps. APNG timing matches the manifest; one-shot APNGs play once. The engine must preserve task state at completion and author any needed reset/return transition.

## Validation

- Seven Python registration tests cover reordered source landmarks, lifted boots, tool-independent scaling, clipping rejection, bounded station corrections and playback timing/state semantics.
- Repository tests additionally verify every frame's placement, source calibration binding, APNG timing/repeat count and shared directional targets.
- Browser checks decode all 1,224 images, exercise every sequence, and test precise contact timing, synchronized views, overlays, seam mode, request races and mobile layout.
- `verify-station-registration.py` reproduces the fixed-prop translation measurement with Pillow, NumPy and OpenCV. OpenCV is required only for this measurement helper, not the exporter or game.

```bash
python3 -m unittest discover -s scripts -p '*_test.py'
python3 scripts/export-character-motion.py
python3 scripts/audit-character-motion.py
python3 scripts/verify-station-registration.py --before-ref 0912950 --out docs/motion-station-registration-results.json
node --test scripts/*.test.mjs
npm run typecheck
npm run build:pages
# With public/ served on port 8082:
node scripts/motion-review-check.mjs
```

To export just one changed sequence, use `--character`, `--action` and `--direction`. Timing or calibration changes invalidate the relevant export automatically.

## Remaining acceptance work

The changes above fix export registration, selected authored gait poses, timing and preview state transitions. **The full motion-polish request is not yet complete.** All sequences retain `productionReady: false` and `loopApproved: false`:

1. Visually approve and, where necessary, redraw the remaining walk phases. Common body scale does not establish correct opposite-foot passing poses or phase agreement across directions.
2. Match planted-foot travel to runtime movement speed and verify the Elder's cane grip/contact. The current changes are asset exports and review tooling; gameplay has not been switched to this library.
3. Inspect and correct remaining tool grip/length changes and Helga's log shape/shoulder contact across all phases. Translation registration cannot repair an inconsistent painted grip or changing prop geometry.
4. Review every last-to-first transition before promoting a loop candidate. One-shot actions need explicit gameplay completion/reset transitions rather than forced circular playback.
5. Calibrate the other workstation actions, including body/world scale across action changes. Preserve each character's asymmetric equipment; never mirror images to invent a direction.

Keep these acceptance tasks separate from the successful structural checks. Passing file, timing or browser tests is not final animation approval.
