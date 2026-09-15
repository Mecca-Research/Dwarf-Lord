# Character work reference library

This pass adds 84 static work compositions: six scenes for each of 14 non-player characters. It expands the existing canonical designs with tools, furniture and occupational poses. Animation variations and live-game work playback are reserved for the next pass requested by the user.

## Available scenes

| Character | Six static scenes |
| --- | --- |
| Blacksmith | Anvil ready; Hammer raised; Hammer contact; Inspect tool; File tool edge; Repair pickaxe handle |
| Borrin | Desk writing; Review open ledger; Turn ledger page; Explain at desk; Count coins; Stamp paperwork |
| Cook | Chop vegetables; Peel potatoes; Knead dough; Stir cauldron; Mix ingredients; Serve stew |
| Elder | Eat stew; Eat bread; Laugh seated; Laugh and gesture; Inspect pickaxe in lap; Examine pickaxe crack |
| Quartermaster | Record inventory; Explain allocations; Examine tool; Count supplies; Repair satchel; Check weights |
| Stoneworker | Chisel ready; Chisel contact; Measure stone; Dress stone; Lay masonry; Carry stone |
| Veteran | Stand watch; Guard ready; Patrol; Inspect hammer; Sharpen utility knife; Repair shield strap |
| Female Miner | Pickaxe ready; Pickaxe contact; Shovel ore; Examine sample; Push ore barrow; Repair pickaxe |
| Red Miner | Pickaxe raised; Pickaxe contact; Load ore cart; Sort iron ore; Carry ore buckets; Check timber support |
| Helga | Pickaxe ready; Pickaxe contact; Inspect mineral; Shovel stone; Carry mine timber; Bind tool handle |
| Human Laborer | Saw timber; Nail planks; Push supply barrow; Carry timber; Shovel soil; Repair harness |
| Laborer | Lift crate; Carry sack; Push stone barrow; Pull supply sled; Build crate; Sweep wood chips |
| Silver | Dress stone; Lift stone; Carry ore tub; Push stone cart; Inspect shovel handle; Fit tool head |
| Ginger | Saw timber; Build timber crate; Stack firewood; Haul firewood; Sharpen hatchet; Carry supplies |

## Review and files

Open `character-animation-review.html` through the development server or Pages preview. The default Work references mode provides canonical comparison, six scene selectors and previous/next controls. Playback is disabled for these compositions. The Angle and stance mode retains the existing 168 references and turnaround preview.

Each `public/sprites/<Character>/work-references/` directory contains the generated transparent source sheet, six numbered 640 × 640 RGBA exports, a manifest and a labeled review sheet. `public/sprites/work-reference-library.json` indexes the roster. Character profiles link to their manifests. Exact generation requests and canonical inputs are retained in `docs/character-work-reference-specs.json`; source SHA-256 values are in individual manifests.

Borrin's exported `animation/08-seated-ledger.png` now uses the new desk-writing composition, with a visibly open ledger. Its manifest records the source override. His canonical identity image and historical source sheet remain intact for provenance.

## Export and validation

Run `python3 scripts/export-work-references.py` with Pillow, NumPy, SciPy and DejaVu Sans installed. The exporter identifies the six principal scene components, assigns detached props to the nearest scene and isolates each composition before cropping. This avoids cutting through interlocking furniture and feet in irregular source layouts. Each composition is independently fitted to a 640 × 640 canvas with a bottom ground anchor; character scale and workstation coordinates are not registered across scenes.

Validation: typecheck, all 155 Node tests and Pages build pass. Browser checks load all 84 work references and all 168 existing angle/stance references, exercise selectors/navigation, verify static-mode playback prevention and mobile overflow, and report no page errors. The bundled web-game client also exercised navigation; its screenshot and state were inspected. Alpha bounds checks confirm all 84 exports have transparent margins. Evidence is in `docs/work-reference-review/`.

## Next pass: animation variations

Choose a single approved static composition for each action and direction. Lock the face, body proportions, costume, camera, lighting, canvas scale, ground contact and station coordinates before generating motion variations. Keep the workstation fixed and preserve which hand holds each tool. Blacksmith ready, raised and contact scenes establish the intended swing poses, but are not yet an aligned animation cycle.

Separate reusable stations from character motion when needed; these references intentionally include complete furniture and tools. Produce anticipation, action/contact, recovery and repeatable rest frames for each selected action. Check hand contact, tool trajectories, foot sliding, occlusion, facial consistency and loop transitions in an animation preview before connecting them to gameplay. Do not play the six different occupational scenes as one work loop.
