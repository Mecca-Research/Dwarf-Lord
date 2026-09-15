# Ginger

**Role:** Distinct seated camp worker; primary assignment Brokk.

**Age:** Middle-aged.

**Identity:** Curly copper hair, broad freckled ruddy face, crooked short nose, wide fan-shaped ginger beard without braids; honey-brown waistcoat, cream sleeves, forest-green trousers.

**Consistency:** Not bald. Keep curly hair and compact fan beard; do not recolor the Silver face.

Canonical image: `idle.png`. Machine-readable contract: `profile.json`. All future renders must use both, with consistent semi-realistic detail, camera and genuine transparency.

## Angle and stance library

Eight standing angles and four role-specific key poses are exported in `animation/`. See `animation/manifest.json` for names, source bounds and the common foot anchor. `animation/review.jpg` shows the final exports. Compare all future frames with this profile and canonical master. These are animation source poses; a complete directional gait loop requires contact, passing and recovery frames with verified timing.

## Static work references

Six additional character-and-workstation compositions are in `work-references/`. Review `work-references/review.jpg` and `work-references/manifest.json`. Actions: Saw timber, Build timber crate, Stack firewood, Haul firewood, Sharpen hatchet, Carry supplies. These are static references; animation variations are the next pass.

## Work animation variations

Six occupational actions now have four authored keyframes each (24 transparent frames), with source sheets, atlases, animated PNG previews and manifests in `work-animations/`. Review them using `/work-animation-review.html`. These are motion variations awaiting transition, registration and gait polish before gameplay integration.
