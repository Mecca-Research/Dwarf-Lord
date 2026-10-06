"""Original visible material only; no hidden cane, sole or submerged bowl claim."""
import json
import sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[4]
sys.path.insert(0,str(root/'scripts'))
from gait_calibration import binding,digest
from station_contact import measure
work=Path(__file__).resolve().parent
folder=work/'actor-candidate'
manifest=json.loads((folder/'manifest.json').read_text())
frames=[np.asarray(Image.open(folder/f'{i:02}.png').convert('RGBA'),dtype=np.float32)/255 for i in range(8)]
row={'sourceSha256':digest(folder/'source-sheet.png'),'binding':binding(folder,manifest),
     'bounds':{'minCorrelation':.94,'maxDriftPx':6,'maxAdjacentPx':6},
     'regions':[],'approval':False,
     'scope':'Visible near boot cap/lower rim only, original0-7 at stationary root. Far boot, anatomical hidden sole, traveling gait and loop are unobserved.'}
for name,box in [('near-visible-boot',[146,509,229,574])]:
    x0,y0,x1,y1=box
    gray=[cv2.cvtColor(a[:,:,:3]*a[:,:,3:4],cv2.COLOR_RGB2GRAY)[y0:y1,x0:x1]for a in frames]
    results=[]
    for i,g in enumerate(gray):
        warp=np.eye(2,3,dtype=np.float32)
        c,warp=cv2.findTransformECC(gray[0],g,warp,cv2.MOTION_TRANSLATION,
             (cv2.TERM_CRITERIA_COUNT|cv2.TERM_CRITERIA_EPS,300,1e-7),None,5)
        drift=float(np.linalg.norm(warp[:,2]))
        results.append({'frame':i,'correlation':c,'translationPx':warp[:,2].tolist(),
                        'driftPx':drift,'passed':c>=.94 and drift<=6})
    adjacent=[float(np.linalg.norm(np.subtract(results[i]['translationPx'],results[i-1]['translationPx'])))for i in range(1,8)]
    row['regions'].append({'name':name,'box':box,'results':results,'adjacentDriftPx':adjacent,
                           'passed':all(r['passed']for r in results)and max(adjacent)<=6})
row['measurementPassed']=all(r['passed']for r in row['regions'])
(work/'stationary-boots50.json').write_text(json.dumps(row,indent=2)+'\n')

points=[[313,339],[383,341],[439,341],[423,341],[416,340],[379,341],[332,341],[320,341]]
config={'actor':str(folder.relative_to(root)),'binding':binding(folder,manifest),
    'dependencies':[{'file':str((work/'station-candidate50.png').relative_to(root)),
                     'sha256':digest(work/'station-candidate50.png')}],
    'workingFacePolygon':[[258,336],[298,324],[371,322],[441,332],[481,344],
                          [465,357],[396,370],[304,359],[266,350]],
    'points':points,
    'scope':'Manually inspected opaque wooden shaft entering the projected stew face. The submerged spoon bowl is unobserved; no force, fluid simulation, carried food or rigid-tip stationary claim.'}
result=measure(config)
(work/'spoon-surface-contact50.json').write_text(json.dumps(result,indent=2)+'\n')
identity=[]
for i in range(8):
    original=root/'public/sprites/Cook/motion/stir-cauldron/reference'/f'{i:02}.png'
    src=np.asarray(Image.open(original).convert('RGBA'));dst=(frames[i]*255).round().astype(np.uint8)
    visible=dst[:,:,3]>=128
    assert np.array_equal(dst[visible],src[visible]),f'Changed original opaque pixels{i}'
    identity.append({'frame':i,'originalSha256':digest(original),'exportedSha256':digest(folder/f'{i:02}.png'),
                     'visiblePixels':int(visible.sum()),'sameOpaqueOriginalPixels':True})
(work/'source-pixel-identity50.json').write_text(json.dumps({'samples':identity,'geometryEdited':False,
    'originalFrameOrder':manifest['sourceFrameOrder'],
    'scope':'Exact original opaque source material at unchanged640 coordinates. The separately owned opaque stew face occludes the unobserved lower spoon.'},indent=2)+'\n')
overlay=Image.new('RGB',(2560,1360),'#263136');draw=ImageDraw.Draw(overlay)
for i in range(8):
    im=Image.open(work/f'layer-{i}.png').convert('RGBA');pen=ImageDraw.Draw(im)
    pen.line([tuple(q)for q in config['workingFacePolygon']]+[tuple(config['workingFacePolygon'][0])],fill='#88ffcc',width=2)
    x,y=points[i];pen.ellipse((x-4,y-4,x+4,y+4),outline='#ff99dd',width=2)
    pen.rectangle(tuple(row['regions'][0]['box']),outline='#ffce74',width=2)
    x,y=i%4*640,i//4*680;overlay.paste(im,(x,y),im);draw.text((x+20,y+646),f'{i}: measured visible material, hidden anatomy unobserved',fill='white')
overlay.save(work/'native-material-contact50.jpg',quality=99)
print({'bootsPassed':row['measurementPassed'],
    'regions':[(r['name'],min(v['correlation']for v in r['results']),max(v['driftPx']for v in r['results']),max(r['adjacentDriftPx']))for r in row['regions']],
    'maxSpoonOutsideStewFacePx':result['maxOutsideWorkingFacePx'],'sourceIdentityExact':len(identity)})
