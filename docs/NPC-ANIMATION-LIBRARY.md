# Character angles and stance library

This pass expands all 13 dwarf NPC designs and the preserved Human Laborer into 12 exported poses each: **168 frames**, with original sheets, canonical references, per-character manifests and review sheets. Lord's existing animation set is preserved.

Open `character-animation-review.html` on the game's host to compare a canonical master with its poses. Select a character, choose a pose, or play the eight-view turnaround. Arrow keys select poses; Space toggles playback. The page deliberately calls the movement images stance references: these are not complete walk cycles.

## Frame contract

- Canvas: 384 × 640 RGBA; shared ground anchor: (192, 620).
- Eight standing views, in order: front, front-right, right profile, back-right, back, back-left, left profile, front-left. Directions describe image orientation, not a world-space compass heading.
- Four extra poses: seated rest, two stride/contact references and a role-specific working stance. Borrin instead has seated writing, standing consultation, a step with ledger and an explaining gesture. Elder has seated listening, seated speaking, standing supported and a step with his stick.
- Every manifest identifies canonical master, source sheet, export filenames, source bounds and any separately regenerated correction. Helga's front-left and Human Laborer's front-right were regenerated after the sheet repeated the wrong facing direction.
- Source sheets are 1024 × 1536 pixels. Export canvases normalize alignment; enlarging a frame does not add source detail. Retain the canonical full-resolution master for identity and future closer-view rendering.
- Character profiles retain their original identity invariants and now reference their animation manifests. The original approved masters and dialogue portraits remain unchanged.

## Production and checks

Built-in image generation used each character's canonical master as the reference. Exact prompts are recorded in `npc-animation-prompts.json`. No mirrored views were substituted for missing angles. Local Pillow/NumPy/SciPy processing isolates the twelve character silhouettes, removes neighboring figures from overlapping crop bounds, preserves alpha, and aligns frames on a common baseline. `python3 scripts/export-npc-animation.py` reproduces the exports from committed sources; it requires Pillow, NumPy and SciPy.

Review the labeled per-character `animation/review.jpg` sheets for identity, facing direction, costume continuity and complete hands/tools. Browser checks load all 168 images, inspect transparency, exercise character selection, frame navigation and turnaround playback, and record screenshots. Automated size/manifest tests guard paths, direction order and narrative stance names; visual inspection remains necessary for anatomy and likeness.

## Next animation step

These assets establish angle and stance references for animation authoring. The live game's existing NPC renderer is unchanged. To animate walking at production quality, expand each chosen direction into contact → down → passing → up poses for both legs, keep head and costume stable, fix planted-foot motion, establish cadence against travel speed, and inspect a looping preview at actual game scale. Do not play unrelated work and resting stances as a gait loop. Use camera-relative heading conversion when integrating these image-relative directions. Seated Elder dialogue and Borrin ledger gestures need separate short loops rather than worker animations.
