"""Inspect visible material; numerical contact never grants task approval."""
import json
import sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root / 'scripts'))
from gait_calibration import binding, digest
from station_contact import measure
work = Path(__file__).parent
folder = work / 'actor-candidate'
manifest = json.loads((folder / 'manifest.json').read_text())
frames = [np.asarray(Image.open(folder / f'{i:02}.png').convert('RGBA'), dtype=np.float32)/255 for i in range(8)]
box = [294,482,406,550]
x0,y0,x1,y1 = box
gray = [cv2.cvtColor(a[:,:,:3]*a[:,:,3:4], cv2.COLOR_RGB2GRAY)[y0:y1,x0:x1] for a in frames]
results = []
for i,g in enumerate(gray):
    warp = np.eye(2,3,dtype=np.float32)
    c,warp = cv2.findTransformECC(gray[0],g,warp,cv2.MOTION_TRANSLATION,
        (cv2.TERM_CRITERIA_COUNT|cv2.TERM_CRITERIA_EPS,300,1e-7),None,5)
    travel = float(np.linalg.norm(warp[:,2]))
    results.append({'frame':i,'correlation':c,'translationPx':warp[:,2].tolist(),
                    'driftPx':travel,'passed':c>=.94 and travel<=6})
adjacent = [float(np.linalg.norm(np.subtract(results[i]['translationPx'],results[i-1]['translationPx']))) for i in range(1,8)]
boots = {'sourceSha256':digest(folder / 'source-sheet.png'),'binding':binding(folder,manifest),
    'bounds':{'minCorrelation':.94,'maxDriftPx':6,'maxAdjacentPx':6},
    'regions':[{'name':'near-visible-boot','box':box,'results':results,'adjacentDriftPx':adjacent,
                'passed':all(r['passed'] for r in results) and max(adjacent)<=6}],
    'approval':False,
    'scope':'Visible stationary near-boot cap/lower rim only. Far leg and anatomical hidden soles, traveling gait, family scale and seamless loop excluded.'}
boots['measurementPassed'] = boots['regions'][0]['passed']
(work / 'stationary-boots53.json').write_text(json.dumps(boots,indent=2)+'\n')

# One manually traced actual opaque lower wooden bowl point in each frame.
# The central mixing bowl belongs to the actor, not the persistent table.
points = [[318,346],[319,346],[319,346],[318,346],[319,346],[318,346],[318,347],[318,346]]
face = [[88,333],[403,264],[558,330],[221,396]]
config = {'actor':str(folder.relative_to(root)),'binding':binding(folder,manifest),
    'dependencies':[{'file':str((work / 'mixing-block-candidate/sprite.png').relative_to(root)),
                     'sha256':digest(work / 'mixing-block-candidate/sprite.png')},
                    {'file':str((work / 'mixing-block-candidate/generation.json').relative_to(root)),
                     'sha256':digest(work / 'mixing-block-candidate/generation.json')}],
    'workingFacePolygon':face,'points':points,
    'scope':'Actual opaque lower wooden bowl edge on the uniformly normalized independent tabletop. Spoon and opposite hand visibly remain with the same bowl. Hidden spoon tip, underside, force, contents transfer, unseen far leg and repeat are excluded.'}
contact = measure(config)
(work / 'bowl-surface-contact53.json').write_text(json.dumps(contact,indent=2)+'\n')
samples = []
for i in range(8):
    original = root / 'public/sprites/Cook/motion/mix-ingredients/reference' / f'{i:02}.png'
    src = np.asarray(Image.open(original).convert('RGBA'))
    dst = np.asarray(Image.open(folder / f'{i:02}.png').convert('RGBA'))
    visible = dst[:,:,3]>=128
    assert np.array_equal(dst[visible],src[visible]),f'Edited original pixels: {i}'
    samples.append({'frame':i,'originalSha256':digest(original),
                    'exportedSha256':digest(folder / f'{i:02}.png'),
                    'visiblePixels':int(visible.sum()),'registrationOffsetPx':[0,0],
                    'sameOpaqueOriginalPixels':True})
(work / 'source-pixel-identity53.json').write_text(json.dumps({
    'samples':samples,'originalFrameOrder':manifest['sourceFrameOrder'],'geometryEdited':False,
    'registrationScope':'One shared521/[320,616] body basis; all original source coordinates and opaque material unchanged.',
    'scope':'Literal foreground extraction only. Original fixed furniture is excluded; the far leg remains hidden and is not reconstructed.'},indent=2)+'\n')
overlay = Image.new('RGB',(2560,1360),'#263136')
draw = ImageDraw.Draw(overlay)
for i in range(8):
    im = Image.open(work / f'layer-{i}.png').convert('RGBA')
    pen = ImageDraw.Draw(im)
    pen.line([tuple(p) for p in face]+[tuple(face[0])],fill='#88ffcc',width=2)
    x,y = points[i]
    pen.ellipse((x-4,y-4,x+4,y+4),outline='#ff99dd',width=2)
    pen.rectangle(tuple(box),outline='#ffce74',width=2)
    x,y = i%4*640,i//4*680
    overlay.paste(im,(x,y),im)
    draw.text((x+20,y+646),f'{i}: visible material only; approval pending',fill='white')
overlay.save(work / 'native-material-contact53.jpg',quality=99)
print({'bootsPassed':boots['measurementPassed'],'minCorrelation':min(r['correlation'] for r in results),
       'maxBootTravelPx':max(r['driftPx'] for r in results),'maxAdjacentPx':max(adjacent),
       'maxBowlOutsideTablePx':contact['maxOutsideWorkingFacePx'],'originalPixelsExact':len(samples)})
