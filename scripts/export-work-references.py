"""Export six static workstation scenes per character; run from the repository root."""
from pathlib import Path
import hashlib
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd

ROOT = Path('public/sprites')
SPECS = json.loads(Path('docs/character-work-reference-specs.json').read_text())
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 19)


library = []
for spec in SPECS['characters']:
    name = spec['name']
    folder = ROOT / name / 'work-references'
    source = folder / 'source-sheet.png'
    im = Image.open(source).convert('RGBA')
    pixels = np.array(im)
    solid = pixels[:, :, 3] > 128
    if pixels[:, :, 3].min() != 0:
        raise ValueError(f'{name}: source lacks transparent background')
    components, _ = nd.label(solid)
    sizes = np.bincount(components.ravel())
    candidates = [int(i) for i in np.argsort(sizes[1:])[::-1][:6]+1]
    if len(candidates) != 6 or min(sizes[candidates]) < 1000:
        raise ValueError(f'{name}: cannot identify six complete scenes')
    major = np.isin(components, candidates)
    _, nearest = nd.distance_transform_edt(~major, return_indices=True)
    ownership = components[tuple(nearest)]
    centers = []
    for cid in candidates:
        yy, xx = np.where(components == cid)
        centers.append((cid, float(xx.mean()), float(yy.mean())))
    centers.sort(key=lambda c: c[2])
    ordered = []
    for row in range(3):
        ordered.extend(sorted(centers[row*2:row*2+2], key=lambda c: c[1]))
    print('Exporting', name)
    frames = []
    review = Image.new('RGB', (1280, 3*680), (48, 55, 54))
    draw = ImageDraw.Draw(review)
    for i, (cid, _, _) in enumerate(ordered):
        row, col = divmod(i, 2)
        own_solid = solid & (ownership == cid)
        yy, xx = np.where(own_solid)
        x0, y0 = max(0, int(xx.min())-3), max(0, int(yy.min())-3)
        x1, y1 = min(im.width, int(xx.max())+4), min(im.height, int(yy.max())+4)
        isolated = pixels[y0:y1, x0:x1].copy()
        isolated[:, :, 3][ownership[y0:y1, x0:x1] != cid] = 0
        isolated[:, :, :3][isolated[:, :, 3] == 0] = 0
        crop = Image.fromarray(isolated)
        factor = min(592/crop.width, 592/crop.height)
        crop = crop.resize((round(crop.width*factor), round(crop.height*factor)), Image.LANCZOS)
        output = Image.new('RGBA', (640, 640))
        output.alpha_composite(crop, ((640-crop.width)//2, 616-crop.height))
        title = spec['titles'][i]
        action = title.lower().replace(' ', '-')
        filename = f'{i:02d}-{action}.png'
        output.save(folder / filename)
        frame = {
            'id': action, 'title': title, 'file': filename,
            'description': spec['scenes'][i],
            'sourceBounds': [x0, y0, x1, y1], 'sourceComponent': cid,
            'groundAnchor': [320, 616], 'staticReference': True,
        }
        frames.append(frame)
        review.paste(output, (col*640, row*680), output)
        draw.text((col*640+22, row*680+645), title, font=FONT, fill='white')
    profile_path = folder.parent / 'profile.json'
    profile = json.loads(profile_path.read_text())
    manifest = {
        'character': name, 'canonical': '../'+profile['master'],
        'source': 'source-sheet.png', 'sourceSize': list(im.size),
        'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'frameSize': [640, 640], 'status': 'static-work-reference',
        'playback': False, 'frames': frames,
        'note': 'Character and work props are composed together. These six scenes are independent static references, not an animation loop.'
    }
    previous = json.loads((folder / 'manifest.json').read_text()) if (folder / 'manifest.json').exists() else {}
    if previous.get('supplementalReferences'): manifest['supplementalReferences'] = previous['supplementalReferences']
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    review.save(folder / 'review.jpg', quality=92)
    profile['workReferences'] = {
        'manifest': 'work-references/manifest.json', 'count': 6,
        'status': 'static-reference', 'animationVariationsComplete': profile.get('workAnimations', {}).get('actionCount', 0) == 6,
        'nextPass': ('Polish keyframe transitions, workstation registration, contact timing and directional coverage before gameplay integration.' if profile.get('workAnimations') else 'Select one scene, lock identity, camera and workstation, then author action-specific motion variations.')
    }
    if manifest.get('supplementalReferences'): profile['workReferences']['supplementalCount'] = len(manifest['supplementalReferences'])
    profile_path.write_text(json.dumps(profile, indent=2)+'\n')
    library.append({'name': name, 'manifest': f'{name}/work-references/manifest.json'})
(ROOT / 'work-reference-library.json').write_text(json.dumps(library, indent=2)+'\n')
print(f'Exported {len(library)*6} static work references for {len(library)} characters')
