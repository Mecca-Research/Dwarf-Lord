"""Record structural checks and known visual issues without certifying animation quality.
Run after export-character-motion.py. Requires Pillow and NumPy.
"""
import hashlib
import json
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path('public/sprites')
PLAN = Path('docs/expanded-animation-plan.json')


def known_issues(entry):
    character, action, direction = (entry[k] for k in ('character', 'action', 'direction'))
    issues = []
    if entry['kind'] == 'walk':
        issues.append('Verify alternating lead feet, passing poses and planted-foot stability; phase captions describe intended poses.')
    if character == 'Female Miner' and action == 'walk' and direction == 'front':
        issues.append('Opposite contact poses corrected and source poses reordered; refine arm counter-swing and foot-contact stability.')
    if character == 'Elder' and action == 'walk' and direction == 'back':
        issues.append('Stick handedness corrected to the right hand; refine grip height and stick contact timing between rows.')
    if character == 'Female Miner' and action == 'shovel-ore':
        issues.append('Loose ore removed; inspect empty-blade continuity and the work contact phase.')
    if character == 'Helga' and action == 'carry-mine-timber':
        if direction == 'left':
            issues.append('Facing and shoulder placement corrected; lead-foot alternation and shoulder grip still need refinement.')
        else:
            issues.append('Shoulder-carry replacement saved. Verify anatomical shoulder, grip, log perspective and gait across directions before template approval.')
    if any(word in action for word in ('barrow', 'sled', 'carry', 'haul')):
        issues.append('Review foot contacts and prop grip through the full cycle; pose differences alone do not establish a valid gait.')
    return issues


def main():
    plan = json.loads(PLAN.read_text())
    results = []
    for entry in plan['entries']:
        folder = Path(entry['destination'])
        source, manifest = folder/'source-sheet.png', folder/'manifest.json'
        record = {k: entry[k] for k in ('character', 'action', 'direction', 'kind', 'destination')}
        record['issues'] = known_issues(entry)
        if not source.exists() or not (folder/'generation.json').exists():
            record['status'] = 'missing-source'
        elif not manifest.exists():
            record['status'] = 'awaiting-export'
        else:
            m = json.loads(manifest.read_text())
            alpha = np.array(Image.open(source).convert('RGBA'))[:, :, 3]
            edges = {'top': alpha[:2], 'bottom': alpha[-2:], 'left': alpha[:, :2], 'right': alpha[:, -2:]}
            touched = [name for name, pixels in edges.items() if np.count_nonzero(pixels > 128) > 3]
            if touched:
                record['issues'].append('Opaque pixels touch source edges ('+', '.join(touched)+'); inspect and repair cropped tools or props.')
            if hashlib.sha256(source.read_bytes()).hexdigest() != m['sourceSha256']:
                record['issues'].append('Export is stale after source replacement; rerun exporter.')
            record['status'] = 'needs-visual-review'
            record['frameCount'] = m['frameCount']
            record['sourceSha256'] = m['sourceSha256']
            m['review'] = {'status': record['status'], 'issues': record['issues'],
                           'poseCaptions': 'intended-poses-not-verified',
                           'requiredChecks': ['character identity', 'frame order and loop seam', 'foot and hand contacts', 'prop continuity', 'direction and scale continuity']}
            m['productionReady'] = False
            manifest.write_text(json.dumps(m, indent=2)+'\n')
        results.append(record)
    counts = Counter(r['status'] for r in results)
    report = {'version': 1, 'plannedSequences': len(results), 'counts': dict(counts),
              'productionReady': False, 'sequences': results}
    (ROOT/'motion-quality.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'counts': dict(counts), 'frames': sum(r.get('frameCount', 0) for r in results)}))


if __name__ == '__main__':
    main()
