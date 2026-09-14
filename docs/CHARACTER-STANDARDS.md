# Character and asset standard — 14 September 2026

The user's approved barrel, crate, tents, detailed dwarf sprites and former camp atlas establish the semi-realistic, high-detail standard. New renders must match material detail, anatomy, camera and lighting. Transparency is verified, never inferred from a painted checkerboard preview.

The authoritative characters now have their own folders under `public/sprites/`, with a canonical image, portrait and profile. Lord contains all 60 animation images plus the standing master. Veteran and Human Laborer have additional folders so approved art is preserved.

Borrin is the second oldest dwarf, a senior manager retained from the previous owner. He is the consultant, ledger keeper and operational tutorial character. Elder is older, separate, primarily conversational, and supplies qualified rumors that can evolve with progress. He does not supply labor, receive worker payroll, or join expeditions. Existing saves acquire Elder once without replacing their workers or treasury. Borrin sits in the open yard at (10, 10), clear of the building that hid his former seat from the default camera; legacy saves update this fixed consultant position.

Ginger has curly copper hair and a compact fan beard; Silver has cropped hair, a short square beard, a broad worker face and sleeveless apron. Borrin has a neat forked beard, spectacles, waistcoat and ledger. Elder has a flowing white beard, bald crown, wool coat and walking stick. Grey beard color is never enough to define identity.

The obsolete sit-beard, sit-helm, stand-helm and walk-0 through walk-3 files are removed. The incorrect male stand-helga and old sit-borrin are removed in favor of the canonical female Helga and new Borrin assets. Original stand-labor is preserved unchanged as Human Laborer/stand.png; recruitment/import mechanics remain future work. Approved barrel/crate/leanto/tent are preserved unchanged.

Lord repairs use generated same-direction repair references and feature registration to transfer corrected head details into the original animation frames. Original body/leg motion is retained; remaining small enclosed mask defects are locally repaired. Direction-specific identity patches are reused across gait/idle/step/stepR/walk sets, rather than creating a new face for every frame. Inspect contact sheets and movement in-game before accepting a new set.

All future asset work must: (1) read the profile, (2) reference its master, (3) lock face/hair/costume/silhouette, (4) create required poses, (5) verify alpha including interior skin and true limb gaps, (6) inspect every direction at full size and game scale, (7) check texture paths and save compatibility, and (8) preserve generation/edit provenance. NPC designs remain single-pose until their animation work is implemented; this pass does not claim full NPC animation.
