"""Two observed boot regions and a distinct fixed rack region; no art mutation."""
from pathlib import Path
import json,hashlib,cv2,numpy as np
from PIL import Image,ImageDraw
b=Path('work/expanded-cycles/motion45');f=Path('public/sprites/Ginger/motion/stack-firewood/reference');ims=[Image.open(f/f'{i:02}.png').convert('RGBA')for i in range(8)]
gray=[]
for im in ims:
 a=np.array(im).astype(np.float32)/255;gray.append(cv2.cvtColor(a[:,:,:3]*a[:,:,3:4],cv2.COLOR_RGB2GRAY))
regions=[('near-boot-visible-toe-and-rim',[90,565,172,608]),('far-boot-visible-toe-and-rim',[282,525,348,565]),('station-front-base-grain',[380,535,608,611])]
rows=[];sheet=Image.new('RGB',(2560,1360),'#273335');d=ImageDraw.Draw(sheet)
for k,(name,box)in enumerate(regions):
 x0,y0,x1,y1=box;ref=gray[0][y0:y1,x0:x1];out=[]
 for i,g in enumerate(gray):
  try:
   c,w=cv2.findTransformECC(ref,g[y0:y1,x0:x1],np.eye(2,3,dtype=np.float32),cv2.MOTION_TRANSLATION,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),None,5);t=w[:,2];out.append({'frame':i,'correlation':float(c),'translation':t.tolist(),'driftPx':float(np.linalg.norm(t))})
  except cv2.error as e:out.append({'frame':i,'correlation':None,'error':str(e)});continue
  x,y=i%4*640,i//4*680
  if k==0:sheet.paste(ims[i],(x,y),ims[i]);d.text((x+10,y+650),str(i),fill='white')
  tx,ty=t;d.rectangle([x+x0+tx,y+y0+ty,x+x1+tx,y+y1+ty],outline=['cyan','yellow','orange'][k],width=2)
 if all(r['correlation'] is not None for r in out):
  changes=[float(np.linalg.norm(np.array(out[i]['translation'])-out[i-1]['translation']))for i in range(1,8)]
  summary={'minimumCorrelation':min(r['correlation']for r in out),'maximumTravelPx':max(r['driftPx']for r in out),'maximumAdjacentChangePx':max(changes),'bounds':{'minimumCorrelation':.94,'maximumTravelPx':6,'maximumAdjacentChangePx':6}}
 else:summary={'valid':False}
 rows.append({'name':name,'region':box,'results':out,'summary':summary});print(name,summary)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
(b/'ginger-visible-supports.json').write_text(json.dumps({'sourceSha256':sha(f/'source-sheet.png'),'settingsSha256':json.loads((f/'manifest.json').read_text())['registration']['settingsSha256'],'frameSha256':[sha(f/f'{i:02}.png')for i in range(8)],'regions':rows,'approval':False,'scope':'Actual visible stationary toe/rim materials at a finite local rack reference, not hidden heel, gait, world travel, independent furniture or gameplay.'},indent=2)+'\n');sheet.save(b/'ginger-visible-supports.jpg',quality=95)
