# Human Laborer

**Role:** Preserved human worker asset for future imported labor.

**Age:** Human adult.

**Identity:** Use the preserved original stand-labor appearance and its taller human proportions.

**Consistency:** Human, not dwarf. Asset/profile only: imported-worker recruitment is a future mechanic, not silently added here.

Canonical image: `stand.png`. Machine-readable contract: `profile.json`. All future renders must use both, with consistent semi-realistic detail, camera and genuine transparency.

## Angle and stance library

Eight standing angles and four role-specific key poses are exported in `animation/`. See `animation/manifest.json` for names, source bounds and the common foot anchor. `animation/review.jpg` shows the final exports. Compare all future frames with this profile and canonical master. These are animation source poses; a complete directional gait loop requires contact, passing and recovery frames with verified timing.

## Static work references

Six additional character-and-workstation compositions are in `work-references/`. Review `work-references/review.jpg` and `work-references/manifest.json`. Actions: Saw timber, Nail planks, Push supply barrow, Carry timber, Shovel soil, Repair harness. These are static references; animation variations are the next pass.

## Work animation variations

Six occupational actions now have four authored keyframes each (24 transparent frames), with source sheets, atlases, animated PNG previews and manifests in `work-animations/`. Review them using `/work-animation-review.html`. These are motion variations awaiting transition, registration and gait polish before gameplay integration.
