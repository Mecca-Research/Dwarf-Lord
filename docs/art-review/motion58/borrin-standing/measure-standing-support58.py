"""Fresh actual visible stationary boot material and literal source identity."""
import hashlib,json,sys
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageChops,ImageDraw
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
from gait_calibration import binding
w=root/'work/expanded-cycles/motion58/borrin-standing'
folder=Path(sys.argv[1]) if len(sys.argv)>1 else w/'actor-candidate'
write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
m=json.loads((folder/'manifest.json').read_text());g=json.loads((folder/'generation.json').read_text())
settings=json.loads((folder/'motion-polish.json').read_text());sheet=Image.open(folder/'source-sheet.png').convert('RGBA');samples=[]
for i,item in enumerate(g['originalFrames']):
 original=root/item['file'];assert sha(original)==item['sha256']
 image=Image.open(original).convert('RGBA');mask=Image.new('L',image.size);d=ImageDraw.Draw(mask)
 for poly in g['actorPolygons'][i]:d.polygon([tuple(p)for p in poly],fill=255)
 for poly in g['excludedPolygons'][i]:d.polygon([tuple(p)for p in poly],fill=0)
 expected=image.copy();expected.putalpha(ImageChops.multiply(image.getchannel('A'),mask))
 actual=sheet.crop((i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640));a=np.array(actual);e=np.array(expected)
 assert np.array_equal(a[:,:,3],e[:,:,3]);visible=e[:,:,3]>=128;assert np.array_equal(a[visible],e[visible])
 native=np.array(Image.open(folder/f'{i:02}.png').convert('RGBA'));yy,xx=np.where(native[:,:,3]>=128)
 assert np.array_equal(native[yy,xx],np.array(image)[yy,xx]);assert(e[yy,xx,3]>=128).all()
 samples.append({'frame':i,'original':item,'exportedSha256':sha(folder/f'{i:02}.png'),
                 'sameOpaqueOriginalPixels':True,'visiblePixels':len(xx),'selectedOpaquePixels':len(xx),'stencilAlphaExact':True})
write(w/'source-pixel-identity58.json',{'binding':binding(folder,m),'originalFrameOrder':list(range(8)),
 'geometryEdited':False,'sameCommonBodyBasis':len({mark['bodyHeight']for mark in settings['landmarks']})==1,
 'wholePoseOffsetsPx':settings.get('offsetsPx',[[0,0]]*8),'samples':samples,
 'scope':'Every selected solid body/held-ledger/gesture/boot pixel is exact original0-7. Source-only contours exclude painted furniture; no hidden body reconstruction, local warp, mirror, per-pose scale, duplicate or synthetic frame.'})
a=[np.asarray(Image.open(folder/f'{i:02}.png').convert('RGBA'),dtype=np.float32)/255 for i in range(8)]
regions=[]
for name,box in [('near-visible-boot-cap-rim',[194,549,263,614]),('far-visible-boot-cap-rim',[313,550,432,608])]:
 x0,y0,x1,y1=box;gray=[cv2.cvtColor(im[:,:,:3]*im[:,:,3:4],cv2.COLOR_RGB2GRAY)[y0:y1,x0:x1]for im in a];rows=[]
 for i,current in enumerate(gray):
  c,warp=cv2.findTransformECC(gray[0],current,np.eye(2,3,dtype=np.float32),cv2.MOTION_TRANSLATION,(cv2.TERM_CRITERIA_COUNT|cv2.TERM_CRITERIA_EPS,300,1e-7),None,5)
  drift=float(np.linalg.norm(warp[:,2]));rows.append({'frame':i,'correlation':c,'translationPx':warp[:,2].tolist(),'driftPx':drift,'passed':c>=.94 and drift<=6})
 adjacent=[float(np.linalg.norm(np.subtract(rows[i]['translationPx'],rows[i-1]['translationPx'])))for i in range(1,8)]
 regions.append({'name':name,'box':box,'results':rows,'adjacentDriftPx':adjacent,'passed':all(r['passed']for r in rows)and max(adjacent)<=6})
write(w/'stationary-boots58.json',{'binding':binding(folder,m),'bounds':{'minCorrelation':.94,'maxDriftPx':6,'maxAdjacentPx':6},
 'regions':regions,'measurementPassed':all(r['passed']for r in regions),'approval':False,
 'scope':'Actual stationary visible boot cap/rim material only. No hidden underside, moving gait, force or seamless-repeat approval.'})
print(json.dumps([{'region':r['name'],'pass':r['passed'],'minCorrelation':min(v['correlation']for v in r['results']),
 'maxTravelPx':max(v['driftPx']for v in r['results']),'maxAdjacentPx':max(r['adjacentDriftPx'])}for r in regions]))
