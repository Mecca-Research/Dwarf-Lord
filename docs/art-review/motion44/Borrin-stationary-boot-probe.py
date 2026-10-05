"""Visible boot material only; stationary finite action, never a gait approval."""
import json,hashlib
from pathlib import Path
import cv2,numpy as np
from PIL import Image
root=Path('.').resolve();base=root/'work/expanded-cycles/motion44'
base.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rows=[]
for action in ['review-open-ledger','explain-at-desk']:
 folder=root/f'public/sprites/Borrin/motion/{action}/actor'
 frames=[np.asarray(Image.open(folder/f'{i:02}.png').convert('RGBA'),dtype=np.float32)/255 for i in range(8)]
 gray=[cv2.cvtColor(a[:,:,:3]*a[:,:,3:4],cv2.COLOR_RGB2GRAY)for a in frames]
 row={'action':action,'sourceSha256':sha(folder/'source-sheet.png'),'settingsSha256':json.loads((folder/'manifest.json').read_text())['registration']['settingsSha256'],
  'frameSha256':[sha(folder/f'{i:02}.png')for i in range(8)],'bounds':{'minimumCorrelation':.94,'maxMaterialTravelPx':6,'maxAdjacentChangePx':6},
  'regions':[],'scope':'Visible stationary seated boot-cap and sole-rim material at a fixed task root. Both8 holds, no hidden heel, standing/walking or continuous-loop certification.'}
 for name,box in [('near',[158,554,270,616]),('far',[342,562,436,620])]:
  x0,y0,x1,y1=box;ref=gray[0][y0:y1,x0:x1];res=[]
  for i,g in enumerate(gray):
   warp=np.eye(2,3,dtype=np.float32)
   try:c,warp=cv2.findTransformECC(ref,g[y0:y1,x0:x1],warp,cv2.MOTION_TRANSLATION,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),None,5)
   except cv2.error as e:res.append({'frame':i,'passed':False,'error':str(e)});continue
   tr=warp[:,2];drift=float(np.linalg.norm(tr));res.append({'frame':i,'correlation':c,'translation':tr.tolist(),'driftPx':drift,'passed':c>=.94 and drift<=6})
  adjacent=[{'from':i-1,'to':i,'changePx':float(np.linalg.norm(np.subtract(res[i]['translation'],res[i-1]['translation'])))}for i in range(1,8)if 'translation'in res[i]and'translation'in res[i-1]]
  row['regions'].append({'name':name,'box':box,'referenceFrame':0,'results':res,'adjacentChanges':adjacent,'passed':all(r['passed']for r in res)and len(adjacent)==7 and max(r['changePx']for r in adjacent)<=6})
 row['measurementPassed']=all(r['passed']for r in row['regions']);rows.append(row)
 print(action,[(r['name'],min(v.get('correlation',0)for v in r['results']),max(v.get('driftPx',999)for v in r['results']),max(v['changePx']for v in r['adjacentChanges']),r['passed'])for r in row['regions']])
(base/'borrin-boot-contacts.json').write_text(json.dumps(rows,indent=2)+'\n')
