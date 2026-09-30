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

## Independent forge and layered contact review (2026-09-24)

Blacksmith `hammer-contact/actor` adds eight authored actor-only poses. Hammer, tongs and billet stay in the actor layer; a separately generated anvil/stump is a persistent world object at the forge job. Both layers share body height 520 and root [320,616]. Three source-bound tool contours per frame place the hammer and tong jaws/billet over the anvil. The original combined reference remains available. `workstation-sites.ts` now supplies common actor-root registration and persistent-prop locations for both cooking and forging. Movement, cancellation and resolved days release the actor root without deleting the station.

The anvil's reviewed opaque crop is 310 pixels wide at [245,343]. The cutting block's prior faint-alpha crop extended beyond the canvas; its solid silhouette crop now preserves apparent scale and placement within one pixel without clipping. `export-runtime-motion-layers.py` reproduces both actor exports, both prop sprites and `public/workstation-library.json`, rejecting stale hashes. `render-workstation-previews.py` produces the eight-frame layered APNG and contact sheet beside each prop.

`public/workstation-review.html` displays the actual actor/prop/foreground composition, with frame scrubbing, individual layer switches, tool-contour outlines, once-and-hold playback and optional seam repetition. It rejects mismatched source or actor/prop registration. `workstation-review-check.mjs` checks both characters and all eight frames, including pixel-identical station output while the actor frame changes, visible foreground composition changes, task completion and repeat playback.

The manually traced anvil working-face polygon and hot-billet selector are stored in `docs/forge-contact-regions.json`. `python3 scripts/measure-forge-contact.py` reproduces the source/prop/frame-bound report. Maximum billet-bottom displacement outside the projected working face is **0.233 pixels**. This verifies projected placement at sprite resolution; it does not establish 3D load, hammer force, grip continuity or final animation/loop acceptance. Tests reject changed actor/prop inputs and require reviewed placement to remain within one pixel.

Two art candidates were rejected in this pass: the Blacksmith right walk still repeated leg phases despite a near/far-limb pose guide and had an opaque backdrop; the Elder rear recovery changed apparent cane length rather than authoring a coherent full arm recovery. Neither candidate replaced existing gameplay frames. Local candidates and prompts are retained under `work/expanded-cycles/rejected-blacksmith-guide-gait.*` and `rejected-elder-full-recovery.*` to avoid repeating failed approaches.

Remaining acceptance work is still substantial: non-front limb redraws, tracked material-point foot/cane calibration (runtime 1.2-body stride remains an estimate), complete cane recovery, remaining tool/log grip consistency, source-bound loop approvals, and independent props for combined actions such as Laborer crate stacking and Ginger tree work. The existing 153 sequences and the two actor-only runtime variants have not received blanket production or loop approval. Cooking and forging are fixed-view billboards, not camera-correct 3D stations.

## Blacksmith right-facing pose corrections (2026-09-24 follow-up)

Five further whole-pose edits replace frames 1, 2, 3, 6 and 7 in the right walk. The two passing poses now show different leg depth order: the near raised shin crosses in front of the far support leg, then the far raised shin is behind the near support leg. Arms approach neutral in both passing poses. Forward-recovery poses use opposing arm swings, and frame 1's near arm now returns from the forward contact swing toward neutral instead of immediately jumping backward. Existing contact poses and frame 5 are retained.

Every selected pose has its exact edit reference, prompt and hash in the sequence's `authoring-inputs` and `assembly.json`. Initial passing edits based on the static profile were rejected because their narrower camera/body profile differed from the walking sequence. The selected replacements derive from actual walk art, preserve its body target/root, and use whole-pose extraction only. No mirroring, limb warping or synthetic in-betweens were used.

The updated atlas, APNG and review sheet were inspected at the normalized 640-pixel frame size. Browser checks loaded the new source hash, scrubbed all eight frames and exercised repeat/seam controls without page or asset errors. This is pose-level improvement, not a full gait approval: support-point spacing remains nonuniform, planted-foot stride is not verified, and loop acceptance is still pending. The other non-front directions remain on the outstanding list.

## 2026-09-25: forestry separation and intermediate cane recovery

Ginger's timber job now uses eight actor-only axe poses and an independent forestry trunk/root prop. The station is persistent through task cancellation and uses the same actor/station registration. Source sheets, exact prompts, input hashes, assembly selections, measured boot-root x coordinates, body-height calibration and foreground contours are retained. The original combined work reference remains available. This is a fixed-view chopping station, not a completed tree-fall animation or a 360-degree station.

Whole-pose assembly now supports explicit input root x coordinates, shared normalization height and exported registration. These prevent a raised axe from being treated as the head/root and preserve tool clearance without independently resizing frames. A reproduction test rebuilds the reviewed actor sheet and registration exactly.

Elder rear frame 6 now has a small authored cane lift with a low elbow before the existing frame 7 lift. The rejected high-arm candidate was not used. Reviewed contact regions still isolate the ferrule/boots after this change; source-bound measurements were regenerated. The unchanged first-half planted-cane hypothesis still drifts 133.696 pixels at the estimated runtime stride. This remains a diagnostic failure, not a verified stride or approved loop.

Retried rejected support-foot corrections: one candidate moved the planted boot too far backward; a follow-up overshot forward, and the opposite support-leg edit did not reach the required position. None was adopted. Existing Blacksmith right support spacing remains unresolved. Other non-front directions, complete cane replant, remaining tool/log grips, loop approvals and additional station families remain open. No production/loop approval flags were enabled.

## 2026-09-25: side support spacing, measured stance timing and scoped forge approval

Blacksmith right passing poses 2 and 6 now use authored support-leg spacing edits. The supporting boot no longer remains so far forward before the next recovery pose. Source references and selections are retained. Authored durations are now `[140,130,100,130,140,89,173,98]` milliseconds, reproducible from assembly.json rather than overwritten by assembly defaults.

`blacksmith-right-gait-observations.json` records six manually selected toe-side sole-seam landmarks, across the two intended support phases. `measure-gait-contacts.py` fits one projected stride to both tracks and renders their overlay. The sampled stance fit is **1.176428 body heights**, with **2.363 pixels maximum residual**. Source, export settings, every frame and durations are bound to the observations. A changed pose/timing requires renewed review, and transparent points, repeated frames or inadequate support coverage are rejected. This is a sampled stance fit only: anatomical support identity through contact transitions, heel/toe roll and between-frame travel are still unverified. It is **not adopted as a verified runtime stride**. Runtime retains its estimated 1.2 ratio.

Elder rear frame 7 now lowers the complete cane toward the next plant. Ferrule y positions for frames 6, 7 and next 0 are **573 → 578 → 589**, replacing the old final-frame jump from 559 to 589. The projected recovery/replant transition is improved. First-half world-travel contact drift is still **133.696 pixels**, so neither the full cane cycle nor its gait is approved.

The independent Blacksmith `hammer-contact/actor` loop has a **fixed-view visual loop approval**. All eight layered poses and the last-to-first transition were reviewed, and the projected billet/anvil check remains within 0.233 pixels. The review binds source, settings, every frame, timing, rendering calibration, anvil prop and measurement inputs. Any changed dependency revokes the approval on export. This grants no hidden-geometry, other-view or walking approval. Task playback remains once-hold; productionReady stays false. The workstation review page now displays this recorded status instead of hard-coding every loop as pending.

All 64 Helga log-carry upper-body poses were visually reviewed. `helga-log-contact-review.json` binds that review to the exact renders. Visible carrying hands stay against the log on the anatomical right shoulder. The back-left grip is hidden and cannot be verified; directional log geometry and the carry gait remain unapproved.

A new Blacksmith back-right replacement still repeated the original trailing leg in its opposite half and was rejected. Remaining non-front gait correction, whole-stride verification, first-half cane plant travel, hidden/other tool grips, direction transitions and all other final loop approvals are still open. One scoped forge approval does not complete the requested library-wide motion polish.

## 2026-09-29: cooking grip, independent storage and forestry acceptance

Cook `chop-vegetables/actor` now uses eight authored free-hand corrections. His empty left hand is separated from the utensil in every pose and remains over the right side of the independent cutting block. The source sheet, exact edit prompt, sheet reference and single-pose guide are retained in authoring inputs. Foreground contours were updated for the extended hand. This closes the visible hand/utensil intersection; blade-to-block contact height and final cooking-loop acceptance remain pending.

Laborer `stack-crates/actor` adds eight actor/carried-crate frames and a fourth independent station, `storage-pallet`. Body height 370 and root [180,616] register actor and pallet. The pallet, two base crates and sack persist independently. On completed actor departure, a separate unchanged-pixel extraction of the released crate remains on the stack. Cancelling before release does not place a crate. An explicit new task starts a new visual staging cycle; this cosmetic state does not award inventory, storage repair or other economic output. This is a fixed-view composition, not a multi-angle station or approved crate-transfer loop.

The assembler now accepts explicit source-cell boundaries for sheets containing detached props. Nearest-component extraction previously assigned the upper part of the released crate to the actor in the row above. Cell boundaries retain the complete authored object without redrawing pixels. A regression test checks ownership and rejects overlapping cells. The station exporter binds the released-crate extraction to the exact final actor frame.

Ginger's independent forestry chopping loop now has a scoped fixed-view visual approval. All eight layered poses, notch contact, hand/handle continuity and final-to-first return were reviewed; browser checks exercise repeat playback and once-hold completion. The approval does not cover a falling tree, other viewing angles, walking, economic output, or overall production readiness. Forge and forestry are now the two approved actor-only loops. The main 153-sequence library remains without blanket loop or production approval.

Approval records now bind the actual atlas and complete registration as well as source, individual frames, timing and dependencies. Changed on-disk registration settings revoke approval even before re-export; deleting a review clears stale approval metadata. The existing forge record was extended only after confirming its previously bound artifacts were unchanged. PR builds now also run on pull requests, with per-ref concurrency so a PR cannot cancel the main build. A green structural build is not a visual release approval.

Further Elder rear-cycle and Blacksmith rear-quarter candidates were rejected: they repeated incorrect leg phases or failed to preserve a credible rigid-cane plant/recovery sequence. Existing gait assets and measurements were retained. Generated attempts are recorded in the local motion28 work folder and progress notes. Non-front gait corrections, verified whole-stride calibration, complete cane travel, remaining directional tool/log contacts, further station families, and remaining final motion approvals are still open. PR #9 remains Draft.

Validation for this checkpoint: 181 Node tests, 24 Python tests, type checking, Pages build, four-station layer/hold/repeat/handoff review and six-job gameplay all pass. The storage work anchor is (8,8), moved clear of the building roof; targeted active/completed gameplay screenshots verify placement and the retained crate. The keyboard movement smoke screenshot was reviewed. Existing recoverable React #418 hydration console output remains. Successful structural checks do not change the remaining visual acceptance status.

### Motion29: rear-quarter leg alternation and continuous-time stance evidence

Blacksmith `walk/back-right` now selects new authored near-right lead/contact, right-support, and far-left airborne recovery poses in frames 4–6. A subsequent authored arm edit reduces the near arm's repeated forward extension in those frames. The first half and final return pose retain the original authored legs. Original source, intermediate full-body inputs, edit references and pose selection remain in `assembly.json`/`authoring-inputs`. All eight exports share body registration. This corrects the repeated leading-leg error in the second half but does **not** approve full forward-passing travel, opposite-arm swing or the loop.

Cook actor contact frame 4 now has an authored raised, nearly horizontal knife rather than a blade extending below the cutting block's front edge. The complete actor pose is replaced without limb warping. Updated atlas, foreground contour and independent-station preview show the improvement; precise blade-to-food/table height and transitions still require acceptance. No new Cook loop approval is recorded.

`measure-held-stance.py` adds the missing continuous-time diagnostic to the existing six-landmark Blacksmith right stance fit. During a held sprite frame, the world root continues moving. The sampled intended support holds therefore accumulate up to **107.952px** projected travel at runtime ratio 1.2, or **105.831px** using the sampled 1.176428 fit. This is modeled within-frame travel in exported-image units, not a newly observed material-point tracking result. Correspondence remains unreviewed. A small residual at frame boundaries cannot certify planted-foot stability through the whole stride. The new source/timing-bound report explicitly leaves whole-stride and loop approval false.

Full completion remains blocked by unaccepted visual/runtime contact work: other non-front gait corrections, full counter-swing and passing poses, held-frame and transition contact calibration, cane plant/recovery under world travel, remaining tool/log/direction reviews, additional station families and final library loop approvals. No production-readiness flags changed.


### Motion30: held-pose registration, Ginger rear-quarter poses and consultant station

Walking NPCs now keep the rendered whole-pose root fixed while an atlas frame is held, although physical collision movement continues. The next authored pose advances the visible root at its displacement-driven boundary. Parent rotation, parent scale and terrain height are accounted for; idle and teleport release stale registration. This is stepped sprite movement, not continuous skeletal interpolation. It removes modeled within-hold root drift but does not certify anatomical support correspondence, frame transitions, direction changes or whole-stride calibration. The source-bound held-stance report preserves the earlier uncorrected baseline and states this distinction. Runtime stride ratio remains the estimated 1.2.

Ginger rear-quarter frames 4–6 now use authored opposite-half lead/support/recovery poses rather than repeating the first-half leg phase. Whole-body source selection, references and registration are retained. Full passing travel, arm counter-swing and loop acceptance remain open.

Added Borrin actor-only desk-writing poses and a persistent independent ledger desk with open ledger, ink and books. Source-bound seated-body calibration and foreground contours retain hands/quill over the desk while leaving ledger pages visible. His seated consultant animation pauses with dialogue, holds completion, resets the next day and releases when he leaves the desk. This cosmetic action does not assign him a production job or award resources. Independent stations now cover cooking, forging, forestry, storage and consultation.

Helga rear-left carry review accepts visible fingertip contact and natural helmet/log occlusion across the eight bound poses. It explicitly does not infer the hidden palm, certify directional geometry or grant gait/loop approval.

A new full-sheet Elder cane attempt was rejected for repeating insufficient plant-depth travel. A single forward-plant candidate and annotated target guides were prepared, but remain unintegrated and unapproved; existing production cane poses and failed world-travel diagnostic remain authoritative. Complete cane plant/recovery is still unfinished.

Validation: 185 Node tests and 25 Python tests pass; type checking and Pages build pass. Browser reviews pass for 153 sequences/1,224 frames, five independent station families and all six existing production job lifecycles. The gameplay screenshot was inspected. Existing recoverable React #418 hydration output remains. No new full-loop approval or production-ready flag is granted.

Final live runtime probe passed: 32 samples include 12 physically moving same-frame intervals with an unchanged visible root. Turning, collision freeze, arrival cleanup, task cancellation/day completion, Borrin once-hold writing and independent desk persistence pass. Evidence is saved in docs/held-pose-runtime-review.json; this is not whole-stride or transition approval. Borrin active/empty-desk screenshots inspected.


### Motion31: Elder plant/recovery, rear-left support, masonry and boundary contact review

Elder rear walking now adopts five authored whole-body inputs: forward plant0, body approach1/2, low-arm forward recovery6 and lowering7. Original release/trailing poses3–5 remain. Reject high-arm recovery and retain exact initial/intermediate inputs rather than synthesizing limbs. Cane ferrule positions are496,564,582,591,587,589,480,484px. The final recovery lowers484→496 across the return. Plant hypothesis is now explicit0–2;3–5 are release/trailing and6–7 airborne recovery. For the same0–2 comparison, drift improves from96.783px before this change to20.729px at ratio1.2. The earlier133.696px figure covered0–3 and is not an equivalent comparison. Lateral plant motion still fails acceptance. A cane-only timing candidate reduces boundary drift to10px but is not adopted: it cannot establish simultaneous foot contacts or rigid-cane ground correspondence.

Laborer rear-left now uses new opposite-half support/recovery poses5/6. New contact4 repeated incorrect forward placement, so it was rejected and original4/7 retained. Remaining lead-contact/reach/arm phases and whole-stride acceptance stay open. Assembly binds every selected whole-pose input.

Contact diagnostics now measure every boundary within the explicitly hypothesized support windows, in addition to within-held-frame stability. The Elder's boot-silhouette windows still show134.783px left/124.231px right boundary drift. These proxies are not corresponding material points, but their failure prevents a whole-stride claim. New tests show that zero within-frame root drift cannot hide a boundary slide, reject skipped transitions and preserve approval=false even for a numerically perfect contact path.

Added eight Stoneworker mallet/chisel actor poses and an independent squat masonry bench for limestone assignments. The initial tall bench obscured the character and missed tool height; it was replaced by an authored low bench, preserving source/provenance. Station and actor share520px registration. Mine props now use the mine scale; camp props retain camp scale. Work-only specialists preserve static walking fallback instead of requesting absent walking atlases. Arrival, dialogue pause, once-hold completion, cancellation/day reset retain task ownership; animations do not award resources.

Eight manually reviewed steel-chisel endpoint observations fall inside the visible limestone face, including its front bevel. The fixed-view masonry dressing loop has a scoped visual approval bound to exact source, frames, atlas, timing, calibration, prop and contact evidence. The tip repositions across the face; this is not certification of a fixed hole, physical force, hidden grip anatomy, other directions or walking. Forge, forestry and masonry are now the three scoped actor-loop approvals. All productionReady flags remain false; the153 main sequences still have no blanket approval.

Borrin's layered close-up revealed that loose foreground masks drew his vest/pants over ledger pages. Tight per-pose hand/feather/quill outlines now leave the open pages visible. This was a compositing-mask defect, not leftover ledger pixels in the actor source. Exact nib-to-paper height and writing-loop acceptance remain pending; no Borrin loop approval was granted.

Main library remains153 sequences/1,224 frames, with six separate independent actor variants. Remaining full-motion acceptance: other non-front lead/pass/recovery phases, corresponding whole-stride sole contacts, joint foot/cane travel constraints, remaining directional tool/log geometry/contact, further station families and outstanding loop reviews. Estimated runtime stride1.2 remains unchanged.

Validation complete for this checkpoint:187 Node/30 Python tests pass; type checking, Pages build and whitespace checks pass. Main153-sequence and six-station browser reviews pass. Seven production action mappings pass including masonry; isolated masonry arrival, once-hold, cancellation, empty-bench persistence and day resolution pass. Layered/active/empty screenshots inspected. Final keyboard smoke preserves the existing recoverable React418 warning only. Laborer original125ms timing is retained. Full requested motion acceptance remains unfinished; PR9 stays Draft.
