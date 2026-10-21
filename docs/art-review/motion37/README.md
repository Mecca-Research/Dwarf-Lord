# Motion37 review evidence

This checkpoint closes the Blacksmith right-view walking loop and two Elder seated finite inspection tasks. It does **not** approve the complete motion library or PR9 for merge.

- `blacksmith-right-poses.jpg` and `blacksmith-live-{0,2,4,7}.jpg`: reviewed pose sheet and actual game renders. `blacksmith-right-rendered-stride.json` records three complete strides,24 material handoffs and152 held samples; maximum boundary1.900372 sprite pixels and held drift0.265143 pixels. Camera motion is compensated by projecting the prior world contact through the current actual camera. This proves the stated fixed-view flat-ground contacts, not terrain or turns.
- `elder-*-poses.jpg` and `elder-*-live-{0,4,7}.jpg`: native/exported and live inspection poses. `elder-live-frames.json` observes all48 seated activity poses with unchanged125ms timing, one completion, terminal holds and departure reset. The two inspection reviews are finite once-hold approvals; continuous replay remains unapproved. Crack inspection's painted table is not an independently rendered workstation.
- `laborer-back-left-contact-review.jpg`: current native whole-stride overlay. Gold/cyan marks are candidate material points, **not** accepted correspondence. Current maximum residual63.079px;14.679px required perpendicular registration exceeds12px. New near-left arm/contact/return geometry does not close the whole stride.
- `workstation-layer-results.json`, `Borrin-layered.jpg` and `Laborer-completed-station.jpg`: all seven fixed station layers, tool occlusion, once-hold and released-prop/reset checks. Laborer's crate remains on the pallet when the actor is hidden. It cannot regenerate through an implicit loop.
- `gallery-results.json`: all153 sequences and1,224 frames, controls, comparison/seam tools, direction switching, mobile layout, measured right-view default and separate finite-task/loop status.
- `npc-lifecycle-results.json`: real displacement, held roots, turning, collision freeze, arrival, work cancellation/day completion and Borrin desk lifecycle. Teleport boundaries are excluded from planted-root comparisons.
- `gameplay-{0,1}.jpg` and matching state files: headed gameplay movement captures, visually inspected; no reported browser errors.

Exact checkpoint code/art/evidence hashes and remaining counts are recorded in `../../motion37-runtime-review.json`. The root motion completion report and generated inventory remain the merge-gate authority:146 final cycle reviews,11 passing direction-family reviews and54 action activations are still required.
