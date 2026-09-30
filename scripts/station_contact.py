"""Verify source-bound visible tool landmarks against a reviewed prop face.
This projected silhouette check does not establish 3D force or fixed-tip motion.
"""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from gait_calibration import binding, digest


def measure(config):
    folder = Path(config['actor'])
    manifest = json.loads((folder/'manifest.json').read_text())
    if config['binding'] != binding(folder, manifest):
        raise ValueError('Changed actor requires contact review')
    for item in config['dependencies']:
        if digest(item['file']) != item['sha256']:
            raise ValueError('Changed station or calibration requires contact review')
    polygon = np.asarray(config['workingFacePolygon'], dtype=float)
    if polygon.ndim != 2 or polygon.shape[1] != 2 or len(polygon) < 3 or not np.isfinite(polygon).all():
        raise ValueError('Finite projected working face required')
    if len(config['points']) != 8:
        raise ValueError('Every authored frame requires a reviewed tool landmark')
    samples = []
    for i, point in enumerate(config['points']):
        point = np.asarray(point, dtype=float)
        if point.shape != (2,) or not np.isfinite(point).all() or (point < 0).any() or (point >= 640).any():
            raise ValueError('Invalid landmark')
        with Image.open(folder/manifest['frames'][i]['file']) as image:
            if image.convert('RGBA').getpixel(tuple(int(x) for x in point))[3] < 128:
                raise ValueError('Tool landmark outside opaque art')
        edges = np.roll(polygon, -1, axis=0)-polygon
        if (np.sum(edges*edges, axis=1) == 0).any():
            raise ValueError('Repeated face vertex')
        relative = point-polygon
        cross = edges[:,0]*relative[:,1]-edges[:,1]*relative[:,0]
        inside = bool(np.all(cross >= 0) or np.all(cross <= 0))
        t = np.clip(np.sum(relative*edges, axis=1)/np.sum(edges*edges, axis=1),0,1)
        distance = 0 if inside else float(np.linalg.norm(point-(polygon+t[:,None]*edges),axis=1).min())
        samples.append({'frame':i,'point':point.tolist(),'outsideWorkingFacePx':round(distance,3)})
    return {'version':1,'config':config,'samples':samples,
            'maxOutsideWorkingFacePx':max(s['outsideWorkingFacePx'] for s in samples),
            'lastToFirstToolTravelPx':round(float(np.linalg.norm(np.subtract(config['points'][0],config['points'][-1]))),3),
            'scope':config['scope'],'approval':False}
