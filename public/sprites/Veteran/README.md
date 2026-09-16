# Veteran

**Role:** Helmeted veteran design; Durgan.

**Age:** Older adult; younger than Borrin.

**Identity:** Weathered pale face, iron-grey braided beard, steel nasal helmet, studded leather brigandine.

**Consistency:** Keep helmet, beard braids and armor; not Silver, Borrin or Elder.

Canonical image: `idle.png`. Machine-readable contract: `profile.json`. All future renders must use both, with consistent semi-realistic detail, camera and genuine transparency.

## Angle and stance library

Eight standing angles and four role-specific key poses are exported in `animation/`. See `animation/manifest.json` for names, source bounds and the common foot anchor. `animation/review.jpg` shows the final exports. Compare all future frames with this profile and canonical master. These are animation source poses; a complete directional gait loop requires contact, passing and recovery frames with verified timing.

## Static work references

Six additional character-and-workstation compositions are in `work-references/`. Review `work-references/review.jpg` and `work-references/manifest.json`. Actions: Stand watch, Guard ready, Patrol, Inspect hammer, Sharpen utility knife, Repair shield strap. These are static references; animation variations are the next pass.

## Work animation variations

Six occupational actions now have four authored keyframes each (24 transparent frames), with source sheets, atlases, animated PNG previews and manifests in `work-animations/`. Review them using `/work-animation-review.html`. These are motion variations awaiting transition, registration and gait polish before gameplay integration.
