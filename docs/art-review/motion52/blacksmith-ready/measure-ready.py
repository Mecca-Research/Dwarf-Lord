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
for name,box in [('near-visible-boot',[153,514,233,582])]:
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
(work/'stationary-boots52.json').write_text(json.dumps(row,indent=2)+'\n')

# Actual lower orange billet edge, traced separately in every original frame.
offsets=json.loads((folder/'motion-polish.json').read_text())['offsetsPx']
rawpoints=[[329,350],[325,352],[327,352],[326,352],[327,346],[316,352],[327,352],[326,348]]
points=[[x+offsets[i][0],y+offsets[i][1]]for i,(x,y)in enumerate(rawpoints)]
# Original empty anvil's opaque top perimeter, transformed uniformly from its
# physical 520/[320,616] basis into the actor's 509/[280,592] basis.
rawface=[[246,361],[425,340],[475,367],[261,384]]
scale=509/520
face=[[(x-320)*scale+280,(y-616)*scale+592]for x,y in rawface]
config={'actor':str(folder.relative_to(root)),'binding':binding(folder,manifest),
    'dependencies':[{'file':str((work/'registered-prop52.png').relative_to(root)),
                     'sha256':digest(work/'registered-prop52.png')},
                    {'file':'public/sprites/workstations/anvil/sprite.png',
                     'sha256':digest(root/'public/sprites/workstations/anvil/sprite.png')},
                    {'file':'public/sprites/workstations/anvil/generation.json',
                     'sha256':digest(root/'public/sprites/workstations/anvil/generation.json')}],
    'workingFacePolygon':face,'points':points,
    'scope':'Manually inspected opaque orange billet lower edge on the independent projected anvil face. Both pincer jaws visibly surround the same held billet. No hidden jaw underside, hidden far boot, impact force, completed forging or seamless repeat is certified.'}
result=measure(config)
(work/'billet-surface-contact52.json').write_text(json.dumps(result,indent=2)+'\n')
identity=[]
for i in range(8):
    original=root/'public/sprites/Blacksmith/motion/anvil-ready/reference'/f'{i:02}.png'
    src=np.asarray(Image.open(original).convert('RGBA'));dst=(frames[i]*255).round().astype(np.uint8)
    visible=dst[:,:,3]>=128
    yy,xx=np.where(visible);dx,dy=offsets[i]
    assert np.array_equal(dst[visible],src[yy-dy,xx-dx]),f'Changed original opaque pixels{i}'
    identity.append({'frame':i,'originalSha256':digest(original),'exportedSha256':digest(folder/f'{i:02}.png'),
                     'visiblePixels':int(visible.sum()),'registrationOffsetPx':offsets[i],'sameOpaqueOriginalPixels':True})
(work/'source-pixel-identity52.json').write_text(json.dumps({'samples':identity,'geometryEdited':False,'registrationScope':'Integer whole-pose translations only, each component bounded by12px; original opaque material retained without interpolation.',
    'originalFrameOrder':manifest['sourceFrameOrder'],
    'scope':'Exact original opaque source material at 640 coordinates after the recorded whole-pose translation. The separately owned anvil occludes the unobserved far leg.'},indent=2)+'\n')
overlay=Image.new('RGB',(2560,1360),'#263136');draw=ImageDraw.Draw(overlay)
for i in range(8):
    im=Image.open(work/f'layer-{i}.png').convert('RGBA');pen=ImageDraw.Draw(im)
    pen.line([tuple(q)for q in config['workingFacePolygon']]+[tuple(config['workingFacePolygon'][0])],fill='#88ffcc',width=2)
    x,y=points[i];pen.ellipse((x-4,y-4,x+4,y+4),outline='#ff99dd',width=2)
    pen.rectangle(tuple(row['regions'][0]['box']),outline='#ffce74',width=2)
    x,y=i%4*640,i//4*680;overlay.paste(im,(x,y),im);draw.text((x+20,y+646),f'{i}: measured visible material, hidden anatomy unobserved',fill='white')
overlay.save(work/'native-material-contact52.jpg',quality=99)
print({'bootsPassed':row['measurementPassed'],
    'regions':[(r['name'],min(v['correlation']for v in r['results']),max(v['driftPx']for v in r['results']),max(r['adjacentDriftPx']))for r in row['regions']],
    'maxBilletOutsideAnvilFacePx':result['maxOutsideWorkingFacePx'],'sourceIdentityExact':len(identity)})
