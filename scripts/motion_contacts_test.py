import importlib.util
import json
import unittest
from pathlib import Path
from PIL import Image

spec=importlib.util.spec_from_file_location('contacts',Path(__file__).with_name('measure-motion-contacts.py'))
contacts=importlib.util.module_from_spec(spec);spec.loader.exec_module(contacts)

class ContactMeasurementTest(unittest.TestCase):
    def test_regions_exclude_neighboring_pixels(self):
        image=Image.new('RGBA',(20,20))
        image.putpixel((4,12),(255,255,255,255))
        image.putpixel((15,19),(255,255,255,255))
        self.assertEqual(contacts.tip(image,[0,0,10,20]),[4,12])
        with self.assertRaises(ValueError):contacts.tip(image,[6,0,10,20])

    def test_report_reproduces_and_stale_source_rejected(self):
        config=json.loads(Path('docs/elder-back-contact-regions.json').read_text())
        result,_=contacts.measure(config)
        self.assertEqual(result,json.loads(Path('docs/elder-back-contact-measurement.json').read_text()))
        self.assertFalse(result['approval'])
        self.assertEqual(len(result['hypotheticalSupportFootDriftPx']['rightBoot']),4)
        config['sourceSha256']='stale'
        with self.assertRaises(ValueError):contacts.measure(config)

if __name__=='__main__':unittest.main()
