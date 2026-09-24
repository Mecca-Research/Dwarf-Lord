# Motion registration and playback polish

This pass improves the existing 153-sequence library. It does not add synthetic in-between frames or mark unreviewed art as production-ready.

## Changes delivered

- Corrected the front walking sequences for all eight characters using redrawn poses and reviewed selections of existing authored poses. The Blacksmith, Female Miner and Laborer have replacement gait sheets; Borrin, Cook, Elder, Ginger and Helga use traceable per-pose assemblies. Female Miner's source order is explicitly `[0,5,6,3,4,1,2,7]`. Seven front views have explicit source-space torso/ground calibration; Laborer uses the shared torso estimate. The corrected front views use contact/down and passing/reach timing; Blacksmith and Female Miner have longer contact/down phases with shorter passing/reach phases.
- Re-exported all 64 walking views with a common 520-pixel body-height target. Median torso registration avoids following an extended hand, cane or stepping boot; a shared source-row floor preserves boot elevation instead of snapping each frame's lowest pixel to the ground.
- Calibrated all 16 Female Miner tool views from helmet to boot independently of the tool's reach. Pickaxe and shovel families share a 340-pixel body target and a projected root at `[320,576]`, leaving room for overhead and below-ground tool travel.
- Calibrated all eight Helga shoulder-carry views to a 520-pixel body target and root `[320,608]`. The root uses the torso rather than the log's silhouette or the stepping feet.
- Registered six Borrin desk actions and three Blacksmith anvil actions to their fixed station. Corrections are bounded whole-pixel translations, measured against pose 0; no warping or prop replacement. The checked measurements in `motion-station-registration-results.json` show maximum residual translation below 0.7 pixels for all nine sequences. They do not measure hand contact or prop shape accuracy.
- Added authored timing for the Blacksmith's heavy strike, tapping and ready motions. Faster downstrokes and slower recovery replace uniform timing for those sequences.
- Work previews default to one-shot playback and hold the final state. This prevents completed crates, served food, loaded carts or ledger changes from immediately resetting. The three reviewed Blacksmith forge sequences and walking remain loop **candidates**, not approved loops. Repeating any other action is an explicit review control.
- Updated the review page with synchronized direction comparison, previous-pose overlay, root/body-height guides, last-to-first seam inspection and manifest-based frame timing. These are inspection tools, not proof that corresponding source poses are correctly phased.

## Follow-up: workstation stability, travel playback and targeted redraws

- Extended fixed-prop registration to **25 additional sequences**, for **34 total**. The new regions cover Blacksmith benches and wheelbarrow, Borrin standing administration scenes, all eight Cook stations, Female Miner inspection/repair, Helga benches, Ginger woodworking stations and Laborer crate construction. The reviewed regions are in `motion-station-regions.json`. `register-motion-stations.py` measures translation, applies only bounded integer corrections and skips previously registered exports. It preserves source-order offsets.
- `motion-station-followup-results.json` records the resulting residual against frame 0: **all 34 sequences remain below 0.7 pixels maximum translation**. Results are tied to source and settings hashes. This measures station translation, not painted shape or hand contact. The old/new comparison is explicitly omitted for Ginger's replaced source artwork.
- Redrew Ginger's tree-chopping backswing, start of downstroke and low return. Eight authored durations emphasize preparation, a short downstroke and recovery. Both edit inputs and exact prompts are saved beside the source. This remains a one-shot candidate; the tree/axe interaction is not a production-approved loop.
- Corrected the Elder's rear-view cane grip and shaft length across both rows. Reordered the two down poses with source order `[0,5,2,3,4,1,6,7]` so each follows its matching contact leg. The original edit input and prompt are retained. Cane placement still needs verification against actual world movement.
- Redrew Helga's left-facing timber carry with free-arm counter-swing and narrower passing poses, retaining the log on her far anatomical right shoulder. Body/floor calibration was refreshed against the new sheet. The opposite-leg phase and painted log contact remain review candidates.
- Added `public/motion-playback.mjs`, a renderer-independent controller used by the review page. Walking and directional timber carrying advance from **actual supplied displacement** and a stride length. Zero displacement freezes the gait. Direction changes retain both the frame index and its fractional phase even when frame durations differ. One-shot completion fires once and holds the final state until explicitly restarted. Large time steps are bounded.
- Added a ground travel test with speed and stride controls, plus common physical body-height display for calibrated actions. The default stride is an adjustable inspection estimate, not a measured foot-lock guarantee. The controller rejects missing body calibration rather than silently resizing a character around its tools.

The live game now uses the eight requested character families' walking atlases while NPCs travel. The renderer loads only needed character/direction atlases, repacks them to 1280x640 for GPU texture limits, shares texture pixels between actors, keeps per-actor frame UVs and phase, and retains at most six unused loaded atlases. Unmounts and stale async loads release their leases. Stationary and unsupported character art still uses the existing canonical sprites.

Walking phase is driven by resolved world displacement, normalized for the actor's actual world scale. Blocked NPCs freeze their feet; teleports do not count as strides. Facing is updated for NPC motion and camera orientation. Turns preserve phase; a new walk after idle starts at contact. The stride/body ratio of 1.2 is still a review estimate, not a per-character planted-foot calibration.

`src/game/motion-playback.ts` is the shared controller source. `scripts/sync-motion-playback.mjs` compiles the standalone review copy during dev/build startup; a regression test prevents divergence. This fixes Vite's restriction on importing modules directly from public/.

## Follow-up: loading continuity and job lifecycle

Walking phase now advances through actual displacement while the next direction atlas loads. Movement before the first atlas arrives accumulates in stride units and is applied on load; zero movement still freezes the gait. Failed loads retry after five seconds. Becoming idle invalidates pending responses and releases the actor's atlas lease.

Canceling an assignment clears its destination and work state. Day resolution immediately stops assigned workers, and the scene also honors the resolved day after loading a saved game. Invalid or protected-character assignments are rejected before changing runtime movement. These transitions preserve the existing once-per-day economy; animation playback does not award resources.

The Blacksmith right-view first contact pose has a targeted arm-only correction: the near right arm swings forward opposite the trailing right leg. Its input, exact prompt and source hashes are retained in `assembly.json` and `authoring-inputs/`. Remaining right-view poses still need correction; this is not a loop approval.

## Cook workstation playback

The Cook now uses the eight-frame `chop-vegetables` workstation when assigned to `meals`. The full authored character/station atlas is repacked through the same shared texture cache as walking. `Cook/motion/render-calibration.json` binds a manually measured 540-pixel projected head-to-visible-boot extent and root to the source hash; the table width does not set character size. This is an approximate projected-body calibration, not a skeletal measurement.

The action plays once after arrival and holds its final frame. Cancel, movement away, reassignment, day change and day resolution reset or release playback. Dialogue pauses animation. Economic output remains owned by day resolution. Work playback accepts elapsed time without a per-rendered-frame cap, so slow rendering does not indefinitely stretch a short action. Work diagnostics expose frame, completion and completion count in `render_game_to_text`.

Moved the meal destination outside the fire obstacle to let workers reach it. The Cook meal mapping and Female Miner limestone/iron pickaxe mappings are integrated. The workstation is part of the full sprite and appears/disappears with that action; persistent independently placed stations and other job/character mappings remain unfinished. Reference work art has one authored viewing angle and follows the existing billboard convention; it is not a 360-degree workstation.

Female Miner mining uses the eight authored `pickaxe-swing` directions and the existing 340-pixel body calibration, independently of tool reach. Camera-driven view changes preserve fractional action phase and the completed state; they never repeat the strike or its completion. Mining remains a one-shot visual action held until task reset. Inside the mine, the exterior rock/roof shell cuts away. Decorative mountains render behind playable geometry without writing depth, preventing the backdrop from obscuring workers and the tunnel floor. This wiring does not approve painted pickaxe length/grip or contact poses.

Two individual Blacksmith passing-pose candidates were rejected after assembly because their proportions caused visible scale changes. They remain scratch references, and the previously committed gait is retained.

## Selected-pose assemblies

Borrin, Cook, Elder, Ginger and Helga retain source sheets, prompts and selected pose indices in `assembly.json` and `authoring-inputs/`. The assembly helper extracts complete authored poses, uniformly scales them and preserves their source-row floor. It does not mirror, interpolate or edit limbs. Borrin's missing left passing pose was generated by editing the legs of his existing right passing sprite; his ledger stays in the left arm. Laborer's replacement uses the corrected Blacksmith poses as a motion guide while retaining the Laborer's own face, brown beard and waistcoat.

To change selections, run `python3 scripts/assemble-reviewed-motion.py "public/sprites/CHARACTER/motion/walk/front"` before the exporter. Hash binding catches changed assembly selections or input artwork. Do not overwrite `authoring-inputs/original-sheet.png` when repeating this process.

## Authoring contract

Each optional `motion-polish.json` is tied to the source sheet's SHA-256. Replacing the source requires recalibration. The exporter refuses stale calibration or any placement that clips the 640-pixel canvas rather than quietly scaling one direction differently.

Coordinates and `offsetsPx` are in **source pose order**, before `generation.json.frameOrder` is applied. `landmarks[].root` uses absolute coordinates in the original sheet. `bodyHeight` and `landmarks[].bodyHeight` exclude raised tools. `sourceRowGround` records the two source-row ground planes. `durationsMs` is in **playback order**.

`registration.targetAnchor` is the projected animation origin. It is not necessarily the pixel position of a planted boot. A front-facing foot moves in screen Y as it travels in depth. Gameplay must couple an in-place gait to character velocity; pinning every lowest pixel to one horizontal line creates its own contact errors.

The 520-pixel walk/carry and 340-pixel tool targets are preview/atlas packing scales. **Do not render every 640-pixel canvas at the same world size.** For a character with physical body height H, use sprite-plane height `H * 640 / registration.targetBodyHeight` so switching between walk and tool actions preserves body size. Workstation sequences with no body calibration still require a physical-scale calibration before integration.

`playback.mode` distinguishes `once-hold` from `loop-candidate`. `frames[].durationMs` is authoritative. Preview speed is a multiplier relative to nominal 8 fps. APNG timing matches the manifest; one-shot APNGs play once. The engine must preserve task state at completion and author any needed reset/return transition.

## Validation

- Seven Python registration tests cover reordered source landmarks, lifted boots, tool-independent scaling, clipping rejection, bounded station corrections and playback timing/state semantics.
- Repository tests additionally verify every frame's placement, source calibration binding, APNG timing/repeat count and shared directional targets.
- Browser checks decode all 1,224 images, exercise every sequence, and test precise contact timing, synchronized views, overlays, seam mode, zero-speed travel, fractional phase retention on turns and pause/resume, request races and mobile layout. Eight controller tests cover travel, direction changes, one-shot completion, long time steps, scale and invalid inputs.
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
2. Calibrate each gait's stride against planted-foot travel and verify the Elder's cane-ground contact. Live NPC walking is now integrated and collision-tested; its stride/body ratio still needs art-specific tuning.
3. Inspect and correct remaining tool grip/length changes and Helga's log shape/shoulder contact across all phases. Translation registration cannot repair an inconsistent painted grip or changing prop geometry.
4. Review every last-to-first transition before promoting a loop candidate. One-shot actions need explicit gameplay completion/reset transitions rather than forced circular playback.
5. Calibrate body/world scale for workstation actions and register any remaining stationary props outside the 34 measured sequences. Preserve each character's asymmetric equipment; never mirror images to invent a direction.

Keep these acceptance tasks separate from the successful structural checks. Passing file, timing or browser tests is not final animation approval.

## Additional job integrations and contact diagnostics (2026-09-23)

Laborer storage assignments now use `stack-crates`, and Ginger timber assignments use `fell-tree`. Each uses a source-bound projected body-height/root calibration rather than scaling the complete workstation canvas as a body. The storage approach is outside its building collision radius. Decorative pines leave a five-unit clearing around the timber assignment so the authored tree and axe swing remain visible. Both actions share the once-and-hold lifecycle and cancel/reassignment behavior used by cooking. These are full sprite/workstation billboards; independent persistent station meshes and camera-correct station views remain outstanding.

`python3 scripts/measure-motion-contacts.py` reproduces the Elder rear-view diagnostic in `docs/elder-back-contact-measurement.json`, with frame/source hashes and a visual marker overlay in `work/expanded-cycles/elder-contact-measurement.png`. Manually isolated regions identify the ferrule and each boot silhouette. The original cane tip moved through a vertical range of only 4 pixels; the final-pose lift expands this to 32 pixels in the current export. Under the explicitly hypothetical first-half plant, current 1.2-body-height stride and 0.6-radian camera elevation, projected cane drift reaches 133.696 pixels in a 640-pixel atlas. This is a model-space diagnostic, not measured world-space contact or an approved plant schedule. Boot-bottom proxies also shift as soles rotate; the report therefore does not fit or adopt a stride from them. Authored cane recovery/contact and tracked material landmarks are still needed before approving this gait.

## Independent Cook station and actor layers (2026-09-23)

Cooking now renders an independently owned, persistent cutting block at the meal job location. The actor-only eight-frame atlas contains the Cook and knife, without table or food pixels. A separately authored prop contains the fixed table, bowl and vegetables. The station remains present before assignment, after cancellation and after day resolution.

`Cook/motion/render-calibration.json` binds both body placement and per-frame foreground contours to the actor source hash. The full actor renders behind the station; triangulated forearm/knife regions reuse the same atlas pixels in front. These are render occlusion contours, not redrawn or interpolated animation pixels. Actor and station use the same 520-pixel body scale and root. While working, the actor's visual root registers to the station independently of movement-arrival tolerance. The two objects still use the game's fixed-view billboard convention; this is not a multi-angle 3D workstation.

Rebuild the actor sheet with `assemble-reviewed-motion.py public/sprites/Cook/motion/chop-vegetables/actor`, then run `export-runtime-motion-layers.py`. The latter also reproduces the independent prop placement and rejects changed prop sources/exports. The 153-sequence review library remains intact; the runtime actor layer adds eight separate frames without replacing the combined reference artwork.

Female Miner `shaft2` assignments now use the eight-direction `shovel-cycle`. Switching from mining to clearing resets the action; view changes retain its phase/completion state. All these actions remain one-shot holds, with no animation-triggered economic reward.

The Elder rear view now selects a modest final-pose cane lift from a new authored source; seven existing support/passing poses remain selected. More dramatic candidates were rejected because they shortened the shaft or raised the hand unnaturally. The retained lift does not repair the first-half plant: the same diagnostic hypothesis still predicts 133.696 atlas-pixel drift. No stride calibration or loop approval is inferred from it. Run the contact measurement **after** the audit, which updates the manifest hash.

Blacksmith `forge` work now renders the body-calibrated `hammer-contact` sequence at an accessible approach outside the forge collision circle. The new "Repair forge fittings" assignment uses the existing craft/capability and daily building-repair calculation (12 capability, up to the normal fill cap). Rendering produces no repair or inventory rewards. Its anvil is still embedded in the authored reference frames; only cooking has been split into independent runtime layers in this pass. The mine shell now also cuts away near the entrance so the shovel action at Shaft Two is visible from the approach.
