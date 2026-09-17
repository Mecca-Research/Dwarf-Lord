"""Measure fixed-prop translation against a baseline commit (Pillow, NumPy, OpenCV).
This measures raster registration only, never animation or anatomical correctness.
"""
import argparse
import io
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--before-ref', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    commit = subprocess.check_output(['git', 'rev-parse', '--verify', args.before_ref+'^{commit}'], text=True).strip()
    results = []
    for path in sorted(Path('public/sprites').glob('*/motion/*/reference/motion-polish.json')):
        settings = json.loads(path.read_text())
        station = settings.get('stationRegistration')
        if not station:
            continue
        folder = path.parent
        x0, y0, x1, y1 = station['outputRegion']

        def gray(im):
            rgba = np.array(im.convert('RGBA')).astype(np.float32)/255
            return cv2.cvtColor(rgba[:, :, :3]*rgba[:, :, 3:4], cv2.COLOR_RGB2GRAY)[y0:y1, x0:x1]

        reference = gray(Image.open(folder/'00.png'))
        baseline_manifest = json.loads(subprocess.check_output(['git', 'show', commit+':'+str(folder/'manifest.json')]))
        current_manifest = json.loads((folder/'manifest.json').read_text())
        comparable = baseline_manifest['sourceSha256'] == current_manifest['sourceSha256']
        data = {'baselineComparable': comparable, 'sourceSha256': current_manifest['sourceSha256'], 'settingsSha256': current_manifest['registration']['settingsSha256']}
        for version in ['before', 'after']:
            if version == 'before' and not comparable:
                data[version] = None
                continue
            shifts = []
            for i in range(1, 8):
                frame = folder/f'{i:02d}.png'
                im = Image.open(io.BytesIO(subprocess.check_output(['git', 'show', commit+':'+str(frame)]))) if version == 'before' else Image.open(frame)
                _, warp = cv2.findTransformECC(reference, gray(im), np.eye(2, 3, dtype=np.float32), cv2.MOTION_TRANSLATION,
                                               (cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT, 100, 1e-6), None, 5)
                shifts.append(float(np.linalg.norm(warp[:, 2])))
            data[version] = {'meanTranslationPx': round(float(np.mean(shifts)), 3), 'maxTranslationPx': round(max(shifts), 3)}
        results.append({'character': path.parts[2], 'action': path.parts[4], **data})
    report = {'method': 'Fixed station region translation against pose 0, measured with ECC. Before is omitted when the source art changed. This does not measure redraw, anatomy or hand-contact quality.',
              'baselineCommit': commit, 'sequences': results}
    Path(args.out).write_text(json.dumps(report, indent=2)+'\n')
    for result in results:
        print(result['character'], result['action'], result['before'], '->', result['after'])


if __name__ == '__main__':
    main()
