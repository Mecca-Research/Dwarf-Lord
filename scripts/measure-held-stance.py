"""Measure travel while each discrete stance sprite is held by runtime.
A keyframe-only least-squares fit cannot measure this part of a whole stride.
This diagnostic does not assert that unreviewed landmarks are corresponding.
"""
import json
from pathlib import Path
from gait_calibration import binding, measure
import numpy as np

observations=json.loads(Path('docs/blacksmith-right-gait-observations.json').read_text())
folder=Path(observations['folder']);manifest=json.loads((folder/'manifest.json').read_text())
fit=measure(folder,manifest,observations)
axis=np.array(fit['projectedTravelAxis']);height=manifest['registration']['targetBodyHeight']
durations=[f['durationMs'] for f in manifest['frames']];cycle=sum(durations)
reports=[]
for name,ratio in [('runtime-estimate',1.2),('sampled-keyframe-fit',fit['strideBodyRatio'])]:
    tracks=[]
    for track in observations['tracks']:
        holds=[]
        for sample in track['samples']:
            index=sample['frame'];travel=height*ratio*durations[index]/cycle*axis
            holds.append({'frame':index,'durationMs':durations[index],
                          'projectedTravelPx':travel.round(3).tolist(),
                          'withinHoldDriftPx':round(float(np.linalg.norm(travel)),3)})
        tracks.append({'foot':track['foot'],'holds':holds})
    reports.append({'calibration':name,'strideBodyRatio':ratio,'tracks':tracks,
                    'maxWithinHoldDriftPx':max(h['withinHoldDriftPx'] for t in tracks for h in t['holds'])})
report={'version':1,'binding':binding(folder,manifest),'playbackModel':'Discrete atlas frame held while world root moves continuously; no per-foot compensation.',
        'measurements':reports,'correspondenceReviewed':observations.get('correspondenceReviewed') is True,
        'wholeStrideApproved':False,'loopApproved':False,
        'scope':'Projected root travel during sampled intended flat-sole support frames; does not certify anatomical identity, heel-roll, unsampled contacts, terrain or cane.',
        'remaining':'A whole-stride approval requires contact tracking through held-frame intervals and frame transitions, not only the six keyframe samples.'}
Path('docs/blacksmith-right-held-stance-measurement.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps([{k:r[k] for k in ('calibration','maxWithinHoldDriftPx')} for r in reports]))
