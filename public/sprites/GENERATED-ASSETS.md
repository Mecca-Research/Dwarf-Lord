# Character asset library

## Current standard — 14 September 2026

Use each character folder's `profile.json`, `README.md`, canonical image and derived `portrait.png`. The authoritative visual and narrative requirements are in [Character standards](../../docs/CHARACTER-STANDARDS.md). All runtime paths use these folders; no character identity is selected from an obsolete generic pose filename.

| Folder | Canonical image | Identity / use |
| --- | --- | --- |
| Lord | stand-lord.png | Player; 60 additional direction and animation frames |
| Borrin | idle.png | Second oldest; senior manager, consultant and ledger keeper |
| Elder | idle.png | Oldest; separate conversation and evolving rumors |
| Quartermaster | stand.png | Blond forked beard, olive waistcoat |
| Red Miner | stand.png | Auburn beard, helmet, rust-red tunic |
| Stoneworker | stand.png | Dark beard with grey streaks, slate tunic |
| Laborer | stand.png | Broad bald dwarf, brown beard and vest |
| Blacksmith | stand.png | Dark skin, black beard and smith apron |
| Cook | idle.png | Round face, moustache, cream apron |
| Female Miner | stand.png | Dark hair, metal helmet, stocky woman without beard |
| Helga | stand.png | Copper braids, metal helmet, stocky woman without beard |
| Ginger | idle.png | Curly copper hair, freckles, compact fan beard |
| Silver | idle.png | Cropped grey hair, short square beard, muscular sleeveless worker |
| Veteran | idle.png | Grey beard, nasal helmet, brigandine |
| Human Laborer | stand.png | Preserved human-looking stand-labor; reserved for future human labor |

`camp-workers-atlas.png` is now a 1024 × 800 RGBA compilation of the current Ginger (left) and Silver (right), with 512 × 800 cells. Runtime uses their individual files. Do not apply the old atlas dimensions to this version.

Barrel, crate, leanto and tent remain unchanged. The approved individual dwarf renders also retain their original pixels, except for their new paths; portraits are derived crops. The incorrect male stand-helga and old sit-borrin are replaced. Rejected sit-beard, sit-helm, stand-helm and walk-0 through walk-3 are removed. The distinct **lord-walk** set remains and is repaired. The five obsolete JPEG portraits are removed after all runtime references move to matching canonical crops in the character folders.

## Generation and repair provenance

The September 8 approved NPC artwork was generated with the built-in OpenAI image tool; its original prompts remain in `docs/dwarf-sprite-prompts.md`. In that historical pass Elder artwork represented Borrin. That assignment is superseded by the separate identities above. Cook's painted checkerboard was removed locally with user authorization.

The September 14 pass generated Borrin, Ginger and Silver with the built-in image tool, using the approved detailed dwarf artwork as reference and the identities recorded in their profiles. Borrin's generated checkerboard required local matte extraction. Ginger and Silver retained generated alpha. New source images were inspected before integration.

Six same-direction Lord repair references were generated from the damaged standing/front/side artwork, instructing preservation of auburn hair, braid cuffs, coat and facial identity while reconstructing opaque nose, cheeks and hands. Local OpenCV feature registration aligned those corrected heads and hand patches with the intact clothing in the original frames. The body and leg animation remain original. Rear views retain their original heads. Remaining enclosed alpha defects were inpainted; transparent-edge RGB was decontaminated. Legacy step numbers do not always correspond to idle direction numbers, so their matching references were selected by image features and visually checked. `docs/lord-repair-results.json` records all 61 processed files.

Local processing used Pillow, NumPy, SciPy and OpenCV under the user's existing authorization. No API-key fallback or paid external generation service was used. Reference sources and intermediate images remain in the local `work/identity` scratch directory; final assets, profiles, repair measurements and review images are committed.

The NPC library contains 13 designs used across the existing named population. Some residents share an established design; these are not 18 separately rendered identities. NPC images remain single-pose artwork. This pass does not implement full directional NPC animation or human recruitment.
