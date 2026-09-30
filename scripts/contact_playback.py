"""Evaluate authored contact windows through held poses and their boundaries.

Zero motion inside a held frame does not establish contact across frame changes.
Coordinates must be reviewed corresponding landmarks before approving a stride.
"""
import math
import numpy as np


def evaluate(durations, points, support_frames, travel_axis, stride_px):
    if len(durations) != 8 or any(not isinstance(d, (int, float)) or not math.isfinite(d) or d <= 0 for d in durations):
        raise ValueError('Eight positive finite durations required')
    coordinates = np.asarray(points, dtype=float)
    axis = np.asarray(travel_axis, dtype=float)
    if coordinates.shape != (8, 2) or axis.shape != (2,) or not np.isfinite(coordinates).all() or not np.isfinite(axis).all():
        raise ValueError('Eight finite contact coordinates and projected axis required')
    if not math.isfinite(stride_px) or stride_px <= 0:
        raise ValueError('Positive finite stride required')
    if len(support_frames) < 2 or len(set(support_frames)) != len(support_frames) or any(not isinstance(i, int) or not 0 <= i <= 7 for i in support_frames):
        raise ValueError('Ordered contact window required')
    if any(b != (a + 1) % 8 for a, b in zip(support_frames, support_frames[1:])):
        raise ValueError('A contact window cannot skip unreviewed transitions')
    times = np.concatenate(([0], np.cumsum(durations[:-1]))) / sum(durations)
    # Exact-boundary whole-pose registration: the physical root is sampled at
    # each boundary and the rendered root holds until the next authored pose.
    projected = coordinates + times[:, None] * stride_px * axis
    # A support may span 7 -> 0. The next cycle advances by a full stride;
    # comparing its frame zero at time zero would hide the return transition.
    cycle = 0
    window = []
    for j, i in enumerate(support_frames):
        if j and i < support_frames[j - 1]:
            cycle += 1
        window.append(projected[i] + cycle * stride_px * axis)
    window = np.asarray(window)
    reference = window[0]
    residual = np.linalg.norm(window - reference, axis=1)
    transitions = [
        {'from': a, 'to': b, 'contactJumpPx': round(float(np.linalg.norm(window[j + 1] - window[j])), 3)}
        for j, (a, b) in enumerate(zip(support_frames, support_frames[1:]))
    ]
    return {
        'supportFrames': support_frames,
        'projectedContacts': np.round(window, 3).tolist(),
        'heldPoseWithinFrameDriftPx': 0,
        'baselineContinuousRootWithinFrameDriftPx': [round(float(np.linalg.norm(stride_px * axis * durations[i] / sum(durations))), 3) for i in support_frames],
        'transitions': transitions,
        'maxBoundaryContactDriftPx': round(float(residual.max()), 3),
        'materialCorrespondenceReviewed': False,
        'contactApproved': False,
    }


def joint_constraints(durations, tracks, travel_axis, stride_px):
    """Compare simultaneous support constraints before choosing any root correction.

    Root compensation cannot keep two planted points fixed if their required
    translations disagree. This tests every shared support boundary, including
    the next-cycle return, without independently fitting feet and cane.
    """
    if len(tracks) < 2 or len({t['name'] for t in tracks}) != len(tracks):
        raise ValueError('Distinct contact tracks required')
    reports = []
    constraints = {}
    for track in tracks:
        frames = track['supportFrames']
        report = evaluate(durations, track['points'], frames, travel_axis, stride_px)
        reports.append({'name': track['name'], **report})
        points = np.asarray(track['points'], dtype=float)
        for a, b in zip(frames, frames[1:]):
            constraints.setdefault((a, b), []).append((track['name'], points[a] - points[b]))
    conflicts = []
    for (a, b), values in constraints.items():
        for i, (name, required) in enumerate(values):
            for other, other_required in values[i + 1:]:
                conflicts.append({'from': a, 'to': b, 'contacts': [name, other],
                                  'requiredRootDisagreementPx': round(float(np.linalg.norm(required - other_required)), 3)})
    return {'tracks': reports, 'simultaneousBoundaries': conflicts,
            'maxRequiredRootDisagreementPx': max((r['requiredRootDisagreementPx'] for r in conflicts), default=None),
            'jointContactApproved': False,
            'scope': 'Shared root constraint diagnostic; no material correspondence, ground-height, rigid-cane or full-stride approval'}
