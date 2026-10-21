"""Provisional visible sole-region hypotheses; never certify anatomical ownership."""
import json,math,sys
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw
sys.path.insert(0,str(Path(__file__).resolve().parents[3]/'scripts'))
from whole_stride import stride_binding
from motion_loop_approval import digest
folder=Path(__file__).resolve().parent/'candidate-bare'
manifest=json.loads((folder/'manifest.json').read_text())
axis=np.array([math.sqrt(.5),-math.sqrt(.5)*math.sin(.6)])
normal=np.array([-axis[1],axis[0]])/np.linalg.norm(axis)
point=[390,599]
samples=[]
for name,end in [('image-left lower distal sole curve',[280,614]),('image-right distal fore-sole region',[362,500])]:
 delta=np.array(point)-np.array(end)
 colors=[]
 for frame,p in [(3,point),(4,end)]:
  im=Image.open(folder/f'{frame:02}.png').convert('RGBA');rgba=im.getpixel(tuple(p));assert rgba[3]>=128;colors.append(list(rgba))
 perpendicular=abs(float(delta@normal))
 # Existing exporter allows +/-12 on each component of each entire pose.
 # Even the most favorable opposite corrections span only this amount.
 max_correction=24*float(np.abs(normal).sum())
 samples.append({'hypothesis':name,'from':3,'to':4,'fromPoint':point,'toPoint':end,'sourceRgba':colors,'requiredRootDeltaPx':delta.tolist(),'perpendicularMismatchPx':perpendicular,'maximumAllowedWholePosePerpendicularCorrectionPx':max_correction,'minimumRemainingPerpendicularPx':max(0,perpendicular-max_correction),'withinOriginal6pxBound':perpendicular-max_correction<=6})
result={'version':1,'binding':stride_binding(folder,manifest),'runtimeSha256':digest(Path('src/game/world/npc-motion.ts')),'cameraElevationRadians':.6,'originalBounds':{'perComponentWholePoseOffsetPx':12,'soleBoundaryResidualPx':6},'projectedRootAxis':axis.tolist(),'hypotheses':samples,'manualAnatomicalCorrespondenceReviewed':False,'wholeStrideApproved':False,'loopApproved':False,'selected':False,'scope':'Visible opaque lower fore-sole samples in3 and possible boot identities in4. These are provisional correspondence hypotheses, not verified left/right anatomical tracks or a complete eight-boundary calibration. Both inspected hypotheses exceed original6px bounds even after maximal component-bounded whole-pose registration; retiming along the root axis cannot remove perpendicular error. No source limb edits, relaxed bounds or acceptance.'}
assert not any(r['withinOriginal6pxBound']for r in samples)
out=folder.parent/'boundary3-4-provisional49.json';out.write_text(json.dumps(result,indent=2)+'\n')
sheet=Image.new('RGBA',(1280,640),(35,45,50,255));pen=ImageDraw.Draw(sheet)
for j,frame in enumerate([3,4]):sheet.alpha_composite(Image.open(folder/f'{frame:02}.png').convert('RGBA'),(j*640,0))
for p,color,shift in [(point,(255,180,50,255),0),([280,614],(70,220,250,255),640),([362,500],(200,140,255,255),640)]:
 x,y=p;pen.ellipse((shift+x-5,y-5,shift+x+5,y+5),outline=color,width=2);pen.text((shift+x+8,y-12),str(p),fill=color)
pen.text((8,8),'Provisional pose3 to4 sole regions; anatomy not certified; NO approval',fill='white')
sheet.convert('RGB').save(folder.parent/'boundary3-4-provisional49.jpg')
print([(r['hypothesis'],round(r['perpendicularMismatchPx'],3),round(r['minimumRemainingPerpendicularPx'],3))for r in samples])
