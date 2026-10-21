"""Regression checks for actual paper ownership, visible stamp and boot evidence."""
import hashlib,json,unittest
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
load=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

class PaperworkStationTests(unittest.TestCase):
    def test_receipt_is_only_a_uniformly_authored_addition_to_the_desk(self):
        prop=ROOT/'public/sprites/workstations/ledger-desk'
        g=load(prop/'generation.json');c=g['composition46']
        raw=prop/c['source'];self.assertEqual(sha(raw),c['sourceSha256'])
        crop=Image.open(raw).convert('RGBA').crop(c['sourceBounds'])
        crop=crop.resize((c['widthPx'],round(crop.height*c['uniformScale'])),Image.LANCZOS)
        paper=Image.new('RGBA',(640,640));paper.alpha_composite(crop,tuple(c['placement']))
        self.assertTrue(np.array_equal(np.array(paper),np.array(Image.open(prop/'receipt.png').convert('RGBA'))))
        base=Image.open(prop/c['baseSprite']).convert('RGBA');composite=base.copy();composite.alpha_composite(paper)
        current=Image.open(prop/'sprite.png').convert('RGBA')
        self.assertTrue(np.array_equal(np.array(composite),np.array(current)))
        mask=np.array(paper)[:,:,3]==0
        self.assertTrue(np.array_equal(np.array(base)[mask],np.array(current)[mask]))

    def test_actual_press_material_is_visible_over_the_independent_paper(self):
        actor=ROOT/'public/sprites/Borrin/motion/stamp-paperwork/actor'
        record=load(ROOT/'docs/art-review/motion46/Borrin-receipt-contact.json')
        cal=load(ROOT/'public/sprites/Borrin/motion/render-calibration.json')['actions']['stamp-paperwork/actor']
        self.assertEqual(record['binding']['sourceSha256'],sha(actor/'source-sheet.png'))
        self.assertEqual(record['pressFrames'],[4,5]);self.assertTrue(record['measurementPassed'])
        paper=Image.open(ROOT/'public/sprites/workstations/ledger-desk/receipt.png').convert('RGBA')
        for sample in record['samples']:
            i=sample['frame'];point=tuple(sample['point']);image=Image.open(actor/f'{i:02}.png').convert('RGBA');pixel=image.getpixel(point)
            self.assertEqual(list(pixel),sample['sourceRgba']);self.assertGreater(pixel[0],150);self.assertGreater(pixel[1],90)
            self.assertGreaterEqual(paper.getpixel(point)[3],128)
            mask=Image.new('L',(640,640));pen=ImageDraw.Draw(mask)
            for poly in cal['foregroundPolygons'][i]:pen.polygon([tuple(p)for p in poly],fill=255)
            self.assertEqual(mask.getpixel(point),255,'stamp must not disappear behind the fixed desk')
        shift=np.linalg.norm(np.subtract(record['samples'][0]['point'],record['samples'][1]['point']))
        self.assertAlmostEqual(float(shift),record['pressMaterialTravelPx']);self.assertLessEqual(shift,6)

    def test_both_native_boot_regions_reproduce_the_original_contact_bounds(self):
        actor=ROOT/'public/sprites/Borrin/motion/stamp-paperwork/actor'
        record=load(ROOT/'docs/art-review/motion46/Borrin-stationary-boot-contacts.json')[0]
        self.assertEqual(record['bounds'],{'minimumCorrelation':.94,'maxMaterialTravelPx':6,'maxAdjacentChangePx':6})
        self.assertEqual(record['frameSha256'],[sha(actor/f'{i:02}.png')for i in range(8)])
        frames=[np.array(Image.open(actor/f'{i:02}.png').convert('RGBA'),np.float32)/255 for i in range(8)]
        gray=[cv2.cvtColor(a[:,:,:3]*a[:,:,3:4],cv2.COLOR_RGB2GRAY)for a in frames]
        for region in record['regions']:
            x0,y0,x1,y1=region['box'];ref=gray[0][y0:y1,x0:x1];positions=[]
            for i,g in enumerate(gray):
                corr,warp=cv2.findTransformECC(ref,g[y0:y1,x0:x1],np.eye(2,3,dtype=np.float32),cv2.MOTION_TRANSLATION,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),None,5)
                self.assertGreaterEqual(corr,.94);self.assertLessEqual(np.linalg.norm(warp[:,2]),6)
                self.assertAlmostEqual(corr,region['results'][i]['correlation'],places=5);positions.append(warp[:,2])
            self.assertTrue(all(np.linalg.norm(positions[i]-positions[i-1])<=6 for i in range(1,8)))

if __name__=='__main__':unittest.main()
