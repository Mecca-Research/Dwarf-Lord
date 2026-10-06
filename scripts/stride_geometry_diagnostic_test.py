import copy
import math
import unittest

from stride_geometry_diagnostic import diagnose


def report(deltas, reviewed=False):
    return {
        'folder':'synthetic-math-fixture-only', 'binding':{}, 'runtimeSha256':'fixture',
        'cameraElevationRadians':.6, 'projectedTravelAxis':[-math.sqrt(.5),-math.sqrt(.5)*math.sin(.6)],
        'transitions':[{'from':i, 'to':(i+1)%8, 'fromPoint':list(delta),
                        'toPoint':[0,0], 'correspondenceReviewed':reviewed}
                       for i, delta in enumerate(deltas)],
    }


class GeometryDiagnosticTest(unittest.TestCase):
    def test_closed_bound_survives_arbitrary_registration_and_retiming(self):
        # The normal error cannot be hidden by even unlimited pose corrections
        # or positive forward travel of different amounts at every boundary.
        deltas = [[-55,-20] for _ in range(8)]
        baseline = diagnose(report(deltas))['closedCycle']['minimumPossibleMaxResidualPx']
        offsets = [[100*i-17*i*i, -300*i+45*i*i] for i in range(8)]
        axis = report(deltas)['projectedTravelAxis']
        changed = [[deltas[i][j]+offsets[i][j]-offsets[(i+1)%8][j]+axis[j]*(i+1)*33
                    for j in range(2)] for i in range(8)]
        result = diagnose(report(changed))
        self.assertAlmostEqual(baseline, result['closedCycle']['minimumPossibleMaxResidualPx'], places=10)
        self.assertTrue(result['closedCycle']['requiresSourceOrMaterialCorrection'])

    def test_rear_left_depth_failure_exceeds_even_independent_extreme_offsets(self):
        # The selected Laborer6->7 UNREVIEWED point hypothesis is(-68,+11).
        # The extreme legal offsets can remove only32.699px normal error.
        deltas = [[-55,-31] for _ in range(8)]; deltas[6] = [-68,11]
        boundary = diagnose(report(deltas))['boundaries'][6]
        self.assertAlmostEqual(boundary['minimumBoundaryResidualPx'],10.313719,places=5)
        self.assertTrue(boundary['requiresSourceOrMaterialCorrection'])
        self.assertFalse(boundary['correspondenceReviewed'])

    def test_closed_failure_can_exist_without_individual_bounded_failure(self):
        result = diagnose(report([[-55,-20] for _ in range(8)]))
        self.assertFalse(any(b['requiresSourceOrMaterialCorrection'] for b in result['boundaries']))
        self.assertTrue(result['closedCycle']['requiresSourceOrMaterialCorrection'])
        self.assertTrue(result['numericallyExcludedByNecessaryBounds'])

    def test_zero_bound_never_grants_acceptance_even_for_reviewed_points(self):
        axis = report([[0,0]]*8)['projectedTravelAxis']
        result = diagnose(report([[a*70 for a in axis] for _ in range(8)],reviewed=True))
        self.assertLess(result['closedCycle']['minimumPossibleMaxResidualPx'],1e-10)
        self.assertFalse(result['numericallyExcludedByNecessaryBounds'])
        self.assertTrue(result['materialCorrespondenceReviewed'])
        self.assertFalse(result['wholeStrideApproved'])
        self.assertFalse(result['loopApproved'])

    def test_a_low_unreviewed_bound_keeps_hypotheses_unreviewed(self):
        result = diagnose(report([[0,0]]*8))
        self.assertFalse(result['materialCorrespondenceReviewed'])
        self.assertTrue(all(not b['correspondenceReviewed'] for b in result['boundaries']))
        self.assertFalse(result['loopApproved'])

    def test_return_and_order_are_mandatory(self):
        value = report([[0,0]]*8)
        for invalid in [value['transitions'][:-1], list(reversed(value['transitions']))]:
            changed = copy.deepcopy(value);changed['transitions']=invalid
            with self.assertRaises(ValueError):diagnose(changed)
        value['transitions'][7]['to']=1
        with self.assertRaises(ValueError):diagnose(value)

    def test_nonfinite_or_zero_geometry_is_rejected(self):
        value = report([[0,0]]*8)
        for axis in [[0,0],[math.nan,1],[1,math.inf],[1]]:
            changed=copy.deepcopy(value);changed['projectedTravelAxis']=axis
            with self.assertRaises(ValueError):diagnose(changed)
        value['transitions'][2]['toPoint']=[math.inf,0]
        with self.assertRaises(ValueError):diagnose(value)


if __name__ == '__main__':unittest.main()
