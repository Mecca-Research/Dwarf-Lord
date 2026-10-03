"""Source-bound simultaneous support evidence; never adopts a stride or timing."""
import json
import math
from pathlib import Path
from gait_calibration import binding, digest
from contact_playback import joint_constraints


def measure(snapshot):
    folder = Path(snapshot['config']['folder'])
    manifest = json.loads((folder / 'manifest.json').read_text())
    if snapshot['binding'] != binding(folder, manifest) or snapshot['manifestSha256'] != digest(folder / 'manifest.json'):
        raise ValueError('Stale joint support inputs: frames, registration or timing changed')
    if snapshot['runtimeSha256'] != digest('src/game/world/npc-motion.ts'):
        raise ValueError('Stale joint support runtime')
    frames = snapshot['config']['caneSupportFrames']
    tracks = [{'name': name, 'points': [s['contacts'][name] for s in snapshot['samples']], 'supportFrames': window}
              for name, window in [('cane', frames), ('leftBoot', [0,1,2,3]), ('rightBoot', [4,5,6,7])]]
    result = joint_constraints(snapshot['binding']['durationsMs'], tracks,
                               [0, -math.sin(snapshot['config']['cameraElevationRadians'])],
                               manifest['registration']['targetBodyHeight'] * snapshot['config']['strideBodyRatio'])
    result.update(binding=snapshot['binding'], runtimeSha256=snapshot['runtimeSha256'],
                  inputMeasurementSha256=digest('docs/elder-back-contact-measurement.json'),
                  landmarks='Existing silhouette proxies, not corresponding material sole landmarks', productionReady=False)
    return result


if __name__ == '__main__':
    report = measure(json.loads(Path('docs/elder-back-contact-measurement.json').read_text()))
    Path('docs/elder-back-joint-contact-measurement.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'maxRequiredRootDisagreementPx': report['maxRequiredRootDisagreementPx'], 'approved': False}))
