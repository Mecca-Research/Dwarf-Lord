"""Check planted cane and soles against one source-bound walking root.

A separate cane fit cannot certify an Elder stride. All eight source poses,
the actual sole observations and the complete cane plant/recovery window must
agree. These measurements never supply visual or production approval.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

from contact_playback import evaluate


REVIEW_FIELDS = ('tipMaterialReviewed', 'sameArmAndGripReviewed',
                 'rigidShaftReviewed', 'liftRecoveryReplantReviewed')


def observation_digest(observations):
    return hashlib.sha256(json.dumps(observations, sort_keys=True,
                         separators=(',', ':')).encode()).hexdigest()


def measure(foot_observations, cane_observations, manifest=None):
    # Import locally: whole_stride's export guard calls this module only after
    # recalculating the sole review. Neither module trusts cached pass flags.
    from whole_stride import measure as measure_feet
    feet = measure_feet(foot_observations, manifest)
    folder = Path(foot_observations['folder'])
    if manifest is None:
        manifest = json.loads((folder / 'manifest.json').read_text())
    if (cane_observations.get('binding') != feet['binding'] or
            cane_observations.get('runtimeSha256') != feet['runtimeSha256'] or
            cane_observations.get('footObservationsSha256') != observation_digest(foot_observations)):
        raise ValueError('Stale coordinated cane observations: actual soles, source, timing or runtime changed')
    cane = cane_observations.get('cane')
    if not isinstance(cane, dict):
        raise ValueError('Complete observed cane record required')
    points = {}
    for name in ('tipPoints', 'collarPoints'):
        coordinates = np.asarray(cane.get(name, []), dtype=float)
        if coordinates.shape != (8, 2) or not np.isfinite(coordinates).all():
            raise ValueError('All eight observed cane tips and collars required')
        if (coordinates < 0).any() or (coordinates >= 640).any():
            raise ValueError('Cane material point outside sprite canvas')
        for i, point in enumerate(coordinates):
            with Image.open(folder / manifest['frames'][i]['file']) as image:
                if image.convert('RGBA').getpixel(tuple(int(v) for v in point))[3] < 128:
                    raise ValueError(f'Cane {name} outside opaque observed material in frame{i}')
        points[name] = coordinates
    planted = cane.get('plantFrames')
    recovered = cane.get('recoveryFrames')
    if (not isinstance(planted, list) or not isinstance(recovered, list) or
            len(planted) < 2 or len(recovered) < 2 or
            any(type(i) is not int or not 0 <= i <= 7 for i in planted + recovered) or
            len(planted + recovered) != 8 or len(set(planted + recovered)) != 8 or set(planted + recovered) != set(range(8)) or
            any(b != (a + 1) % 8 for a, b in zip(planted + recovered, (planted + recovered)[1:])) or
            planted[0] != (recovered[-1] + 1) % 8):
        raise ValueError('Complete ordered cane plant and recovery/replant coverage required')
    durations = feet['binding']['durationsMs']
    axis = np.asarray(feet['projectedTravelAxis'], dtype=float)
    stride = feet['strideBodyRatio'] * manifest['registration']['targetBodyHeight']
    tip_track = evaluate(durations, points['tipPoints'], planted, axis, stride)
    conflicts = []
    for a, b in zip(planted, planted[1:]):
        sole = feet['transitions'][a]
        cane_delta = points['tipPoints'][a] - points['tipPoints'][b]
        sole_delta = np.asarray(sole['fromPoint']) - np.asarray(sole['toPoint'])
        conflicts.append({'from': a, 'to': b, 'foot': sole['foot'], 'soleLandmark': sole['landmark'],
                          'caneRequiredRootTravelPx': np.round(cane_delta, 3).tolist(),
                          'soleRequiredRootTravelPx': np.round(sole_delta, 3).tolist(),
                          'requiredRootDisagreementPx': round(float(np.linalg.norm(cane_delta - sole_delta)), 3)})
    max_disagreement = max(c['requiredRootDisagreementPx'] for c in conflicts)
    times = np.concatenate(([0], np.cumsum(durations[:-1]))) / sum(durations)
    projected = points['tipPoints'] + times[:, None] * stride * axis
    replant = projected[planted[0]] - projected[recovered[-1]]
    if planted[0] < recovered[-1]:
        replant += stride * axis
    reviewed = all(cane.get(field) is True for field in REVIEW_FIELDS)
    passed = (feet['measurementPassed'] and reviewed and
              tip_track['maxBoundaryContactDriftPx'] <= 6 and max_disagreement <= 6)
    return {'version': 1, 'folder': str(folder), 'binding': feet['binding'],
            'runtimeSha256': feet['runtimeSha256'],
            'footObservationsSha256': observation_digest(foot_observations),
            'sharedStrideBodyRatio': feet['strideBodyRatio'],
            'soleMeasurementPassed': feet['measurementPassed'],
            'maxSoleBoundaryPx': feet['maxContactJumpPx'],
            'canePlant': tip_track, 'simultaneousBoundaries': conflicts,
            'maxRequiredRootDisagreementPx': max_disagreement,
            'projectedTipPath': np.round(projected, 3).tolist(),
            'replantApproachTravelPx': np.round(replant, 3).tolist(),
            'projectedCollarToTipLengthsPx': np.round(np.linalg.norm(points['tipPoints'] - points['collarPoints'], axis=1), 3).tolist(),
            'recoveryFrames': recovered, 'reviewFlags': {field: cane.get(field) is True for field in REVIEW_FIELDS},
            'materialAndRecoveryReviewed': reviewed, 'measurementPassed': passed,
            'jointContactApproved': False, 'wholeStrideApproved': False, 'loopApproved': False,
            'scope': 'One shared root/stride, all observed soles, planted cane tip and eight-pose source coverage. Projected rod length/recovery path does not alone prove3D rigidity or ground clearance. Native anatomy/grip/recovery and actual-renderer final approval remain separate.'}


def require_for_export(folder, foot_observations, manifest):
    path = folder / 'coordinated-support.json'
    if not path.is_file():
        raise ValueError('Elder travel calibration requires current coordinated cane plant/recovery evidence')
    report = measure(foot_observations, json.loads(path.read_text()), manifest)
    if not report['measurementPassed']:
        raise ValueError('Elder soles and cane do not pass the same source-bound stride')
    return {'record': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'plantFrames': report['canePlant']['supportFrames'],
            'recoveryFrames': report['recoveryFrames'],
            'scope': 'Coordinated source-material measurement only; no automatic cycle or production approval.'}
