"""Register reviewed fixed-prop regions; never warp or synthesize image content.

Run without --apply to inspect candidates. Requires Pillow, NumPy and OpenCV.
Offsets are stored in source order; measurements use current exported pixels.
"""
import argparse
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    jobs = json.loads(Path('docs/motion-station-regions.json').read_text())['regions']
    for job in jobs:
        folder = Path('public/sprites') / job['character'] / 'motion' / job['action'] / 'reference'
        manifest = json.loads((folder / 'manifest.json').read_text())
        path = folder / 'motion-polish.json'
        settings = json.loads(path.read_text()) if path.exists() else {}
        if settings.get('stationRegistration'):
            continue  # Idempotent: do not measure an already corrected export twice.
        source_hash = hashlib.sha256((folder / 'source-sheet.png').read_bytes()).hexdigest()
        if manifest['sourceSha256'] != source_hash or settings.get('sourceSha256', source_hash) != source_hash:
            raise ValueError(f'{folder}: stale source or export')
        order = manifest.get('sourceFrameOrder', list(range(8)))
        x0, y0, x1, y1 = job['region']

        def gray(frame):
            rgba = np.array(Image.open(folder / frame).convert('RGBA')).astype(np.float32) / 255
            return cv2.cvtColor(rgba[:, :, :3] * rgba[:, :, 3:4], cv2.COLOR_RGB2GRAY)[y0:y1, x0:x1]

        reference = gray(manifest['frames'][0]['file'])
        offsets = settings.get('offsetsPx', [[0, 0] for _ in range(8)])
        results = [None] * 8
        for index, frame in enumerate(manifest['frames']):
            try:
                score, warp = cv2.findTransformECC(reference, gray(frame['file']), np.eye(2, 3, dtype=np.float32),
                    cv2.MOTION_TRANSLATION, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 100, 1e-6), None, 5)
                shift = [-float(v) for v in warp[:, 2]]
            except cv2.error:
                score, shift = 0, [0, 0]
            source_index = order[index]
            offset = [round(old + delta) for old, delta in zip(offsets[source_index], shift)]
            accepted = score >= job.get('minimumCorrelation', .94) and max(map(abs, offset)) <= 12
            results[source_index] = {'correlation': round(score, 5), 'measuredCorrectionPx': shift, 'accepted': bool(accepted)}
            offsets[source_index] = offset
        accepted = all(r['accepted'] for r in results)
        print(job['character'], job['action'], 'ACCEPT' if accepted else 'REVIEW',
              'min correlation', round(min(r['correlation'] for r in results), 4), 'offsets', offsets)
        if args.apply and accepted:
            settings.update(version=1, sourceSha256=source_hash, offsetsPx=offsets,
                stationRegistration={'method': 'bounded-translation-ECC', 'referenceSourcePose': order[0],
                    'outputRegion': job['region'], 'minimumCorrelation': job.get('minimumCorrelation', .94), 'maxCorrectionPx': 12, 'results': results},
                note='Fixed prop translation only. Does not approve painted geometry, anatomy, tool grip or loop transitions.')
            path.write_text(json.dumps(settings, indent=2) + '\n')


if __name__ == '__main__':
    main()
