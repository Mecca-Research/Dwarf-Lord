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
    if len(support_frames) < 2 or support_frames != sorted(set(support_frames)) or min(support_frames) < 0 or max(support_frames) > 7:
        raise ValueError('Ordered contact window required')
    if any(b != a + 1 for a, b in zip(support_frames, support_frames[1:])):
        raise ValueError('A contact window cannot skip unreviewed transitions')
    times = np.concatenate(([0], np.cumsum(durations[:-1]))) / sum(durations)
    # Exact-boundary whole-pose registration: the physical root is sampled at
    # each boundary and the rendered root holds until the next authored pose.
    projected = coordinates + times[:, None] * stride_px * axis
    window = projected[support_frames]
    reference = window[0]
    residual = np.linalg.norm(window - reference, axis=1)
    transitions = [
        {'from': a, 'to': b, 'contactJumpPx': round(float(np.linalg.norm(projected[b] - projected[a])), 3)}
        for a, b in zip(support_frames, support_frames[1:])
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
