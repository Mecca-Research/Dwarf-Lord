"""Render the same actor/station/tool layering used by runtime and browser review.
No new motion pixels, in-betweens or limb transforms are synthesized.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

for entry in json.loads(Path('docs/runtime-motion-layers.json').read_text())['entries']:
    actor = Path(entry['destination'])
    station = Path('public/sprites/workstations') / entry['station']
    manifest = json.loads((actor / 'manifest.json').read_text())
    calibration = json.loads((actor.parent.parent / 'render-calibration.json').read_text())
    placement = calibration['actions'][entry['action'] + '/' + entry['direction']]
    if placement['sourceSha256'] != manifest['sourceSha256']:
        raise ValueError('Stale actor calibration')
    prop = Image.open(station / 'sprite.png').convert('RGBA')
    frames = []
    board = Image.new('RGB', (1280, 720), '#343c40')
    labels = ImageDraw.Draw(board)
    for i, frame in enumerate(manifest['frames']):
        image = Image.open(actor / frame['file']).convert('RGBA')
        mask = Image.new('L', image.size)
        pen = ImageDraw.Draw(mask)
        for polygon in placement['foregroundPolygons'][i]:
            pen.polygon([tuple(point) for point in polygon], fill=255)
        foreground = image.copy()
        foreground.putalpha(ImageChops.multiply(image.getchannel('A'), mask))
        image.alpha_composite(prop)
        image.alpha_composite(foreground)
        frames.append(image)
        tile = image.resize((320, 320), Image.LANCZOS)
        board.paste(tile, (i % 4 * 320, i // 4 * 360), tile)
        labels.text((i % 4 * 320 + 12, i // 4 * 360 + 326), f'{i + 1}: {frame["durationMs"]} ms', fill='white')
    frames[0].save(station / 'work-preview.png', save_all=True, append_images=frames[1:],
                   duration=[f['durationMs'] for f in manifest['frames']], loop=1, disposal=0, blend=0)
    board.save(station / 'work-review.jpg', quality=90)
    print(f'Rendered {entry["character"]} layered workstation preview')
