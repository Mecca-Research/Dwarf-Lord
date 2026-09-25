"""Fit projected stride to reviewed, corresponding sole landmarks.

The fit covers sampled flat-foot stance poses, not heel roll, in-between
frames, hand contacts or loop quality. Changing any frame/timing/registration
invalidates the observations. A good fit alone never approves a loop.
"""
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def binding(folder, manifest):
    return {'sourceSha256': digest(folder / 'source-sheet.png'),
            'settingsSha256': manifest['registration']['settingsSha256'],
            'frameSha256': [digest(folder / f['file']) for f in manifest['frames']],
            'durationsMs': [f['durationMs'] for f in manifest['frames']]}


def measure(folder, manifest, observations):
    current = binding(folder, manifest)
    if observations['binding'] != current or current['sourceSha256'] != manifest['sourceSha256']:
        raise ValueError('Stale gait observations: review changed frames, registration or timing')
    directions = ['front', 'front-right', 'right', 'back-right', 'back', 'back-left', 'left', 'front-left']
    angle = directions.index(manifest['direction']) * math.pi / 4
    elevation = observations['cameraElevationRadians']
    if not 0 < elevation < math.pi / 2:
        raise ValueError('Invalid camera elevation')
    axis = np.array([math.sin(angle), math.cos(angle) * math.sin(elevation)])
    durations = current['durationsMs']
    times = np.concatenate(([0], np.cumsum(durations[:-1]))) / sum(durations)
    tracks = observations['tracks']
    if {t['foot'] for t in tracks} != {'left', 'right'} or len(tracks) != 2:
        raise ValueError('Both anatomical support feet must be measured separately')
    numerator = denominator = 0.0
    prepared = []
    for track in tracks:
        samples = track['samples']
        indices = [s['frame'] for s in samples]
        if len(indices) < 3 or indices != sorted(set(indices)) or min(indices) < 0 or max(indices) >= 8:
            raise ValueError('Each support track needs three ordered distinct frames')
        t = times[indices]
        points = np.array([s['point'] for s in samples], dtype=float)
        if points.shape != (len(indices), 2) or not np.isfinite(points).all() or (points < 0).any() or (points >= 640).any():
            raise ValueError('Invalid sole coordinates')
        for index, point in zip(indices, points):
            with Image.open(folder / manifest['frames'][index]['file']) as image:
                if image.convert('RGBA').getpixel(tuple(int(v) for v in point))[3] < 128:
                    raise ValueError('Sole landmark falls outside opaque sprite pixels')
        if np.ptp(t) < .15:
            raise ValueError('Support samples cover too little of the stride')
        dt = t - t.mean()
        dp = points - points.mean(axis=0)
        numerator -= float(np.sum(dt * (dp @ axis)))
        denominator += float(np.sum(dt * dt) * (axis @ axis))
        prepared.append((track, t, points))
    stride = numerator / denominator
    height = manifest['registration']['targetBodyHeight']
    ratio = stride / height
    measurements = []
    for track, t, points in prepared:
        planted = points + t[:, None] * stride * axis
        drift = np.linalg.norm(planted - planted.mean(axis=0), axis=1)
        measurements.append({'foot': track['foot'], 'frames': [s['frame'] for s in track['samples']],
                             'maxResidualPx': round(float(drift.max()), 3)})
    max_residual = max(t['maxResidualPx'] for t in measurements)
    passed = .2 <= ratio <= 2 and max_residual <= 6
    return {'version': 1, 'binding': current, 'strideBodyRatio': round(ratio, 6),
            'projectedTravelAxis': axis.round(6).tolist(), 'tracks': measurements,
            'maxResidualPx': max_residual, 'measurementPassed': passed,
            'correspondenceReviewed': observations.get('correspondenceReviewed') is True,
            'strideApproved': False,
            'loopApproved': False,
            'scope': 'Sampled flat-sole stance keyframes only; no inter-frame, heel-roll, cane or loop approval'}
