# Helga

**Role:** Helga Ironvein; female miner.

**Age:** Adult.

**Identity:** Stocky woman; no beard or moustache; long thick copper-red braids; riveted steel helmet; teal tunic, leather apron and heavy boots.

**Consistency:** Female face and figure; no male fallback in standing/walking/working or portraits.

Canonical image: `stand.png`. Machine-readable contract: `profile.json`. All future renders must use both, with consistent semi-realistic detail, camera and genuine transparency.

## Angle and stance library

Eight standing angles and four role-specific key poses are exported in `animation/`. See `animation/manifest.json` for names, source bounds and the common foot anchor. `animation/review.jpg` shows the final exports. Compare all future frames with this profile and canonical master. These are animation source poses; a complete directional gait loop requires contact, passing and recovery frames with verified timing.

## Static work references

Six additional character-and-workstation compositions are in `work-references/`. Review `work-references/review.jpg` and `work-references/manifest.json`. Actions: Pickaxe ready, Pickaxe contact, Inspect mineral, Shovel stone, Carry mine timber, Bind tool handle. These are static references; animation variations are the next pass.

## Work animation variations

Six occupational actions now have four authored keyframes each (24 transparent frames), with source sheets, atlases, animated PNG previews and manifests in `work-animations/`. Review them using `/work-animation-review.html`. These are motion variations awaiting transition, registration and gait polish before gameplay integration.
