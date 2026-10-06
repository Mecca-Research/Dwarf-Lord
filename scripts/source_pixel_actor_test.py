"""Check actual selected stencil pixels, rather than trusting review booleans."""
import hashlib
import json
import unittest
from pathlib import Path
import numpy as np
from PIL import Image, ImageChops, ImageDraw

ROOT=Path(__file__).resolve().parents[1]

class SourcePixelActorTest(unittest.TestCase):
    def test_original_actor_pixels_survive_one_bounded_whole_pose_registration(self):
        for character,action in [('Cook','knead-dough'),('Cook','stir-cauldron'),('Cook','mix-ingredients'),('Blacksmith','anvil-ready'),('Blacksmith','hammer-raised'),('Blacksmith','file-tool-edge')]:
            with self.subTest(character=character,action=action):
                folder=ROOT/f'public/sprites/{character}/motion/{action}/actor'
                generation=json.loads((folder/'generation.json').read_text())
                settings=json.loads((folder/'motion-polish.json').read_text())
                manifest=json.loads((folder/'manifest.json').read_text())
                self.assertEqual(generation['method'],'source-pixel-foreground-stencils')
                self.assertEqual(manifest['sourceFrameOrder'],list(range(8)))
                self.assertEqual(len(set(mark['bodyHeight']for mark in settings['landmarks'])),1)
                self.assertEqual(settings['landmarks'][0]['bodyHeight'],settings['targetBodyHeight'])
                offsets=settings.get('offsetsPx',[[0,0]]*8)
                source_sheet=Image.open(folder/'source-sheet.png').convert('RGBA')
                for i,input in enumerate(generation['originalFrames']):
                    source=ROOT/input['file']
                    self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),input['sha256'])
                    original=Image.open(source).convert('RGBA')
                    mask=Image.new('L',original.size);pen=ImageDraw.Draw(mask)
                    for polygon in generation['actorPolygons'][i]:
                        pen.polygon([tuple(point)for point in polygon],fill=255)
                    for polygon in generation.get('excludedPolygons',[[]for _ in range(8)])[i]:
                        pen.polygon([tuple(point)for point in polygon],fill=0)
                    extracted=original.copy();extracted.putalpha(ImageChops.multiply(original.getchannel('A'),mask))
                    expected=np.asarray(extracted)
                    actual=np.asarray(source_sheet.crop((i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640)))
                    self.assertTrue(np.array_equal(expected[:,:,3],actual[:,:,3]))
                    visible=expected[:,:,3]>=128
                    self.assertTrue(np.array_equal(expected[visible],actual[visible]))
                    dx,dy=offsets[i]
                    self.assertTrue(all(isinstance(v,int)and abs(v)<=12 for v in [dx,dy]))
                    exported=np.asarray(Image.open(folder/manifest['frames'][i]['file']).convert('RGBA'))
                    yy,xx=np.where(exported[:,:,3]>=128)
                    self.assertGreater(len(xx),10000)
                    self.assertTrue(np.array_equal(exported[yy,xx],np.asarray(original)[yy-dy,xx-dx]))
                    self.assertTrue((expected[yy-dy,xx-dx,3]>=128).all())

if __name__=='__main__':unittest.main()
