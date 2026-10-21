"""Source-bound necessary geometry checks before another gait timing fit.

These bounds diagnose the supplied material observations. They never approve
anatomical correspondence, a walking calibration, or an animation loop.
"""
import argparse
import json
import math
from pathlib import Path

from whole_stride import measure

COMPONENT_OFFSET_LIMIT = 12
CONTACT_LIMIT = 6


def diagnose(measured):
    transitions = measured['transitions']
    if (len(transitions) != 8
            or [t['from'] for t in transitions] != list(range(8))
            or any(t['to'] != (t['from']+1) % 8 for t in transitions)):
        raise ValueError('All eight ordered contact boundaries including return required')
    axis = measured['projectedTravelAxis']
    if len(axis) != 2 or not all(math.isfinite(v) for v in axis):
        raise ValueError('Finite projected travel axis required')
    length = math.hypot(*axis)
    if length == 0:
        raise ValueError('Nonzero projected travel axis required')
    normal = [-axis[1]/length, axis[0]/length]
    deltas = []
    for transition in transitions:
        points = [transition['fromPoint'], transition['toPoint']]
        if any(len(p) != 2 or not all(math.isfinite(v) for v in p) for p in points):
            raise ValueError('Finite two-dimensional material points required')
        deltas.append([points[0][j]-points[1][j] for j in range(2)])
    # At one boundary the two independent whole-pose component corrections can
    # differ by at most24px. Timing/root travel is parallel to axis and cannot
    # change the normal component. This is a conservative bound, not a fit.
    largest_relative_correction = 2*COMPONENT_OFFSET_LIMIT*sum(abs(v) for v in normal)
    boundaries = []
    for transition, delta in zip(transitions, deltas):
        perpendicular = abs(sum(a*b for a, b in zip(delta, normal)))
        lower_bound = max(0, perpendicular-largest_relative_correction)
        boundaries.append({
            'from':transition['from'], 'to':transition['to'],
            'correspondenceReviewed':transition.get('correspondenceReviewed') is True,
            'perpendicularMismatchPx':perpendicular,
            'largestBoundedRelativeCorrectionPx':largest_relative_correction,
            'minimumBoundaryResidualPx':lower_bound,
            'requiresSourceOrMaterialCorrection':lower_bound > CONTACT_LIMIT,
        })
    # Whole-pose offsets telescope to zero at7->0. Root travel has no normal
    # component. The triangle inequality therefore makes abs(net normal)/8 a
    # lower bound on the largest error even for unlimited pose translations.
    net_delta = [sum(d[j] for d in deltas) for j in range(2)]
    closure_bound = abs(sum(a*b for a, b in zip(net_delta, normal)))/8
    return {
        'version':1, 'folder':measured['folder'], 'binding':measured['binding'],
        'runtimeSha256':measured['runtimeSha256'],
        'cameraElevationRadians':measured['cameraElevationRadians'],
        'projectedTravelAxis':axis, 'normal':normal,
        'wholePoseComponentLimitPx':COMPONENT_OFFSET_LIMIT,
        'contactLimitPx':CONTACT_LIMIT, 'boundaries':boundaries,
        'closedCycle':{
            'netContactDeltaPx':net_delta,
            'minimumPossibleMaxResidualPx':closure_bound,
            'translationScope':'Even unlimited whole-pose translations cancel at the closed return.',
            'requiresSourceOrMaterialCorrection':closure_bound > CONTACT_LIMIT,
        },
        'materialCorrespondenceReviewed':all(t.get('correspondenceReviewed') is True for t in transitions),
        'numericallyExcludedByNecessaryBounds':closure_bound > CONTACT_LIMIT or any(
            b['requiresSourceOrMaterialCorrection'] for b in boundaries),
        'wholeStrideApproved':False, 'loopApproved':False,
        'scope':'Necessary geometry bounds on current source-bound material observations only. Unreviewed points remain hypotheses. Passing these bounds is insufficient for contact, anatomy, arm, held-frame, cane, renderer, cross-direction or loop acceptance.',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('observations', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    # Recompute source/settings/atlas/runtime binding and opacity checks rather
    # than trusting a cached measurement or any saved pass flag.
    measured = measure(json.loads(args.observations.read_text()))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(diagnose(measured), indent=2)+'\n')


if __name__ == '__main__':
    main()
