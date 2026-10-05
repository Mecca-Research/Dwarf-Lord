"""Native stationary support material hypotheses; no approval or art edits."""
import json,hashlib
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
root=Path('.').resolve();b=root/'work/expanded-cycles/motion45';folder=root/'public/sprites/Laborer/motion/repair-boardwalk/reference/authoring-inputs'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
frames=[np.asarray(Image.open(folder/f'actor-{i:02}.png').convert('RGBA'),dtype=np.float32)/255 for i in range(8)]
gray=[cv2.cvtColor(a[:,:,:3]*a[:,:,3:4],cv2.COLOR_RGB2GRAY)for a in frames]
rois=[('posterior-boot-visible-cap',[218,353,250,383]),('front-boot-visible-rim',[451,378,470,396]),('front-knee-support-cloth',[292,370,317,391])]
rows=[];board=Image.new('RGB',(2560,1360),'#273335');d=ImageDraw.Draw(board)
for name,box in rois:
 x0,y0,x1,y1=box;ref=gray[0][y0:y1,x0:x1];results=[]
 for i,g in enumerate(gray):
  search=g[max(0,y0-50):min(640,y1+50),max(0,x0-80):min(640,x1+80)]
  scores=cv2.matchTemplate(search,ref,cv2.TM_CCOEFF_NORMED)
  _,initial_score,_,loc=cv2.minMaxLoc(scores)
  initial=np.array([max(0,x0-80)+loc[0]-x0,max(0,y0-50)+loc[1]-y0],dtype=np.float32)
  warp=np.eye(2,3,dtype=np.float32)
  dx,dy=map(int,initial); patch=g[y0+dy:y1+dy,x0+dx:x1+dx]
  try:
   c,warp=cv2.findTransformECC(ref,patch,warp,cv2.MOTION_TRANSLATION,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),None,5)
   tr=warp[:,2]+initial;results.append({'frame':i,'correlation':c,'translation':tr.tolist(),'driftPx':float(np.linalg.norm(tr))})
  except cv2.error as e:results.append({'frame':i,'correlation':None,'error':str(e)});continue
  image=Image.fromarray((frames[i]*255).astype(np.uint8));x,y=i%4*640,i//4*680
  if name==rois[0][0]:board.paste(image,(x,y),image);d.text((x+10,y+650),f'{i}: measured source material only; no approval',fill='white')
  color=['cyan','yellow','orange'][[a[0]for a in rois].index(name)];tx,ty=tr;d.rectangle([x+x0+tx,y+y0+ty,x+x1+tx,y+y1+ty],outline=color,width=2)
 rows.append({'name':name,'region':box,'results':results})
 print(name,[(r['frame'],round(r['correlation'] or 0,4),[round(x,2)for x in r.get('translation',[])])for r in results])
record={'sourceSha256':sha(folder/'actor-source-sheet.png'),'frameSha256':[sha(folder/f'actor-{i:02}.png')for i in range(8)],'settingsSha256':json.loads((folder/'actor-manifest.json').read_text())['registration']['settingsSha256'],'bounds':{'minimumCorrelation':.94,'maxMaterialTravelPx':6,'maxAdjacentChangePx':6},'regions':rows,'approval':False,'scope':'Provisional actual visible posterior boot cap, front boot rim and front knee cloth in isolated kneeling candidate. Native anatomy/occlusion and root review required. No hidden sole, travel, 3D contact force or final cycle approval.'}
(b/'support-material-measurement.json').write_text(json.dumps(record,indent=2)+'\n');board.save(b/'support-material-observations.jpg',quality=95)
