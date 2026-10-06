"""Screen-space billet-to-anvil contact diagnostic; not a 3D or loop approval.
The orange billet mask and working-face polygon are manually reviewed selectors.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def measure(config):
    actor = Path(config['actor'])
    prop = Path(config['prop'])
    if digest(actor / 'source-sheet.png') != config['sourceSha256'] or digest(prop) != config['propSha256']:
        raise ValueError('Contact selectors need review after actor or prop changes')
    polygon = np.asarray(config['workingFacePolygon'], dtype=float)
    samples = []
    for i in range(8):
        path = actor / f'{i:02}.png'
        image = np.asarray(Image.open(path).convert('RGBA')).astype(int)
        x0, y0, x1, y1 = config['billetRegion']
        pixels = image[y0:y1, x0:x1]
        mask = (pixels[:, :, 0] > 220) & (pixels[:, :, 1] > 70) & (pixels[:, :, 1] < 180) & (pixels[:, :, 2] < 100) & (pixels[:, :, 3] > 128)
        y, x = np.where(mask)
        if len(x) < 20:
            raise ValueError('Billet selector lost its landmark')
        lowest = int(y.max())
        point = np.array([np.median(x[y >= lowest - 1]) + x0, lowest + y0])
        edges = np.roll(polygon, -1, axis=0) - polygon
        relative = point - polygon
        crosses = edges[:, 0] * relative[:, 1] - edges[:, 1] * relative[:, 0]
        inside = bool(np.all(crosses >= 0) or np.all(crosses <= 0))
        t = np.clip(np.sum(relative * edges, axis=1) / np.sum(edges * edges, axis=1), 0, 1)
        distance = float(np.min(np.linalg.norm(point - (polygon + t[:, None] * edges), axis=1)))
        samples.append({'frame': i, 'frameSha256': digest(path), 'billetBottom': point.tolist(), 'outsideWorkingFacePx': 0 if inside else round(distance, 3)})
    return {'config': config, 'samples': samples, 'maxOutsideWorkingFacePx': max(s['outsideWorkingFacePx'] for s in samples),
            'approval': False, 'scope': 'Visible hot billet bottom against manually traced projected anvil top; does not prove 3D load, hammer force, grip continuity or loop quality.'}


if __name__ == '__main__':
    config = json.loads(Path('docs/forge-contact-regions.json').read_text())
    result = measure(config)
    Path('docs/forge-contact-measurement.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'maxOutsideWorkingFacePx': result['maxOutsideWorkingFacePx'], 'approval': False}))
