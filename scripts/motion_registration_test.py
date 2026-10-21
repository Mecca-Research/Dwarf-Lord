"""Registration regressions: python3 -m unittest discover -s scripts -p '*_test.py'."""
import unittest
from PIL import Image
from motion_registration import register, playback_settings, settings_hash

class RegistrationTests(unittest.TestCase):
    def crops(self, order=range(8)):
        return [(Image.new('RGBA',(100,200),(100,70,40,255)),[i%4*150,i//4*250,i%4*150+100,i//4*250+200],50) for i in order]

    def test_source_landmarks_follow_reordered_poses(self):
        order=[0,5,6,3,4,1,2,7]
        marks=[{'root':[i%4*150+50,i//4*250+200], 'bodyHeight':200} for i in range(8)]
        scale,anchors,positions,_=register(self.crops(order),{'kind':'walk'}, {'landmarks':marks},order)
        self.assertEqual(scale,2.6)
        self.assertEqual(anchors,[[50,200]]*8)
        self.assertEqual(positions,[[190,96]]*8)

    def test_lifted_boot_is_not_snapped_to_ground(self):
        crops=self.crops();crops[2]=(Image.new('RGBA',(100,190),(1,1,1,255)),[300,0,400,190],50)
        _,anchors,_,_=register(crops,{'kind':'walk'}, {},list(range(8)))
        self.assertEqual(anchors[2][1],200)
        self.assertNotEqual(anchors[2][1],crops[2][0].height)

    def test_body_scale_does_not_follow_tool_width(self):
        settings={'bodyHeight':200,'targetBodyHeight':300,'sourceRowGround':[200,450]}
        a=register(self.crops(),{'kind':'directional'},settings,list(range(8)))
        crops=self.crops();crops[0]=(Image.new('RGBA',(180,200),(1,1,1,255)),[0,0,180,200],90)
        b=register(crops,{'kind':'directional'},settings,list(range(8)))
        self.assertEqual(a[0],b[0])

    def test_out_of_canvas_fails_instead_of_changing_direction_scale(self):
        with self.assertRaisesRegex(ValueError,'clips'):
            register(self.crops(),{'kind':'walk','destination':'test'}, {'landmarks':[{'root':[0,0],'bodyHeight':10}]*8},list(range(8)))

    def test_station_corrections_are_source_order_and_bounded(self):
        order=list(reversed(range(8)))
        settings={'offsetsPx':[[i,0] for i in range(8)]}
        _,_,positions,_=register(self.crops(order),{'kind':'work'},settings,order)
        self.assertEqual(positions[0][0]-positions[-1][0],7)
        with self.assertRaisesRegex(ValueError,'bounded'):
            register(self.crops(),{'kind':'work'},{'offsetsPx':[[30,0]]*8},list(range(8)))

    def test_state_changing_work_holds_completion(self):
        p=playback_settings({'kind':'new-work'}, {})
        self.assertEqual(p['mode'],'once-hold');self.assertEqual(p['endBehavior'],'hold-last')
        self.assertFalse(p['loopApproved'])

    def test_authored_timing_is_preserved_and_validated(self):
        durations=[140,140,105,115]*2
        p=playback_settings({'kind':'walk'},{'durationsMs':durations})
        self.assertEqual(p['durationMs'],1000)
        self.assertEqual(p['durationsMs'],durations)
        with self.assertRaises(ValueError):playback_settings({'kind':'walk'},{'durationsMs':[0]*8})
        self.assertNotEqual(settings_hash({}),settings_hash({'durationsMs':durations}))

if __name__=='__main__':unittest.main()
