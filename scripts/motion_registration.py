"""Deterministic sprite registration, with explicit landmarks taking precedence.

Coordinates in motion-polish.json refer to the untrimmed SOURCE sheet and source
pose order. They survive extraction and playback reordering. A single scale is
used for every frame; no frame stretching, mirroring, or synthesized poses.
"""
import hashlib
import json
import numpy as np

VERSION = 2
WALK_HEIGHT = 520

def polish_settings(folder):
    path = folder / 'motion-polish.json'
    return json.loads(path.read_text()) if path.exists() else {}

def settings_hash(settings):
    return hashlib.sha256(json.dumps(settings, sort_keys=True).encode()).hexdigest()

def playback_settings(entry, settings):
    # Completion changes the world or prop state: never silently teleport it back.
    one_shot = entry['kind'] != 'walk'
    durations = settings.get('durationsMs', [125] * 8)
    if len(durations) != 8 or any(not isinstance(d, int) or not 40 <= d <= 2000 for d in durations):
        raise ValueError('durationsMs requires eight integer durations between 40 and 2000 ms')
    mode = settings.get('playbackMode', 'once-hold' if one_shot else 'loop-candidate')
    if mode not in ('once-hold', 'loop-candidate'):
        raise ValueError('unsupported playbackMode')
    return {'mode': mode, 'order': list(range(8)), 'fps': 8,
            'durationMs': sum(durations), 'durationsMs': durations,
            'loopApproved': False, 'endBehavior': 'hold-last' if mode == 'once-hold' else 'review-seam',
            'rootMotion': 'external' if entry['kind'] == 'walk' else 'stationary-or-task-driven'}

def register(crops, entry, settings, frame_order):
    # crop tuples contain RGBA image, absolute source bounds, legacy x anchor.
    landmarks = settings.get('landmarks')
    if landmarks is not None and len(landmarks) != 8:
        raise ValueError('landmarks requires eight source-order records')
    if landmarks:
        heights = [p['bodyHeight'] for p in landmarks]
        if any(not np.isfinite(h) or h <= 0 for h in heights):
            raise ValueError('bodyHeight must be positive and finite')
        anchors = []
        for (_, box, _), source_index in zip(crops, frame_order):
            point = landmarks[source_index]['root']
            if len(point) != 2 or not all(np.isfinite(v) for v in point):
                raise ValueError('root requires finite source coordinates')
            anchors.append([point[0]-box[0], point[1]-box[1]])
        scale = settings.get('targetBodyHeight', WALK_HEIGHT) / float(np.median(heights))
        method = 'source-landmarks'
    elif 'bodyHeight' in settings:
        body_height = settings['bodyHeight']
        if not np.isfinite(body_height) or body_height <= 0:
            raise ValueError('bodyHeight must be positive and finite')
        scale = settings['targetBodyHeight'] / body_height
        anchors = []
        floors = settings['sourceRowGround']
        for (crop, box, _), source_index in zip(crops, frame_order):
            ground = floors[source_index//4]
            a = np.array(crop)[:, :, 3] > 128
            near, far = settings.get('rootBand',[0,.25])
            lo, hi = max(0, round(ground-body_height*far-box[1])), min(crop.height, round(ground-body_height*near-box[1]))
            xs = np.where(a[lo:hi])[1]
            if not len(xs):
                raise ValueError('calibrated lower body band is empty')
            anchors.append([float(np.median(xs)), ground-box[1]])
        method = 'body-height-and-row-ground-calibration'
    elif entry['kind'] == 'walk':
        # All walking sheets are full body. Use median body height, not the tallest
        # pose or horizontal reach of the cane, ledger or swinging arms.
        scale = WALK_HEIGHT / float(np.median([c.height for c, _, _ in crops]))
        anchors = []
        row_floors = {row: float(np.median([box[3] for (_, box, _), source_index in zip(crops, frame_order) if source_index//4 == row])) for row in (0,1)}
        for (crop, box, _), source_index in zip(crops, frame_order):
            a = np.array(crop)[:, :, 3] > 128
            # Median torso pixels reject thin cane/extended-hand outliers. This is
            # an estimated root, not an assertion of a verified anatomical joint.
            ys, xs = np.where(a[int(crop.height*.35):int(crop.height*.6)])
            x = float(np.median(xs)) if len(xs) else crop.width/2
            # Preserve authored boot elevation; do not snap a lifted toe to the
            # ground merely because it is the lowest pixel in that frame.
            anchors.append([x, row_floors[source_index//4]-box[1]])
        method = 'torso-median-estimate'
    else:
        left = max(a for _, _, a in crops)
        right = max(c.width-a for c, _, a in crops)
        height = max(c.height for c, _, _ in crops)
        scale = min(296/max(left, right), 592/height)
        anchors = [[a, c.height] for c, _, a in crops]
        method = 'lower-silhouette-estimate'
    # Refuse clipping rather than silently changing scale for just one direction.
    target = settings.get('targetAnchor', [320, 616])
    placements = []
    offsets = settings.get('offsetsPx', [[0,0] for _ in range(8)])
    if len(offsets)!=8 or any(len(p)!=2 or any(not np.isfinite(v) or abs(v)>12 for v in p) for p in offsets):
        raise ValueError('offsetsPx requires eight bounded source-order translations')
    for i, ((crop, _, _), (ax, ay)) in enumerate(zip(crops, anchors)):
        dx,dy=offsets[frame_order[i]]
        ax-=dx/scale;ay-=dy/scale
        anchors[i]=[ax,ay]
        pos = [round(target[0]-ax*scale), round(target[1]-ay*scale)]
        size = [round(crop.width*scale), round(crop.height*scale)]
        if min(pos) < 0 or pos[0]+size[0] > 640 or pos[1]+size[1] > 640:
            raise ValueError(f"{entry['destination']}: registration clips a frame; calibrate landmarks/canvas")
        placements.append(pos)
    return scale, anchors, placements, {
        'method': method, 'targetAnchor': target,
        'targetBodyHeight': settings.get('targetBodyHeight', WALK_HEIGHT) if landmarks or 'bodyHeight' in settings or entry['kind']=='walk' else None,
        'scaleScope': 'directional-body-height' if landmarks or 'bodyHeight' in settings or entry['kind']=='walk' else 'sequence',
        'landmarksVerified': settings.get('landmarksVerified', False),
        'settingsSha256': settings_hash(settings), 'exportVersion': VERSION,
        'stationRegistration': settings.get('stationRegistration'),
    }
