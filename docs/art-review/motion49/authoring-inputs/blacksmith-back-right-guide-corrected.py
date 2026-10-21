"""A physical two-link guide. Targets are never source-material observations."""
import json,math
from pathlib import Path
from PIL import Image,ImageDraw
out=Path('work/expanded-cycles/motion49');out.mkdir(exist_ok=True)
canvas=Image.new('RGBA',(2560,1280));pen=ImageDraw.Draw(canvas)
elevation=.54
forward=(math.sqrt(.5),-math.sqrt(.5)*math.sin(elevation))
left=(-math.sqrt(.5),-math.sqrt(.5)*math.sin(elevation))
def project(p,i):
 x,side,z=p
 return (320+(i%4)*640+forward[0]*x+left[0]*side,
         606+(i//4)*640+forward[1]*x+left[1]*side-math.cos(elevation)*z)
def disk(p,r,color,i):
 x,y=project(p,i);pen.ellipse((x-r,y-r,x+r,y+r),fill=color)
def capsule(a,b,width,color,i):
 aa=project(a,i);bb=project(b,i);pen.line((aa,bb),fill=color,width=width);disk(a,width/2,color,i);disk(b,width/2,color,i)
def knee(hip,ankle,length=150):
 dx=ankle[0]-hip[0];dz=ankle[2]-hip[2];distance=math.hypot(dx,dz)
 bend=math.sqrt(max(0,length*length-distance*distance/4))
 return ((hip[0]+ankle[0])/2-dz/distance*bend,hip[1],(hip[2]+ankle[2])/2+dx/distance*bend)
steps=[(90,0,'heel'),(60,0,'flat'),(30,0,'flat'),(0,0,'toe'),(-30,0,'toe'),(-60,30,'recovery'),(0,75,'passing'),(70,25,'reach')]
records=[]
for i in range(8):
 row={}
 for foot,side,phase,color in [('left',65,(i+4)%8,(76,160,220,255)),('right',-65,i,(205,146,52,255))]:
  x,z,kind=steps[phase];hip=(0,side,280);ankle=(x,side,z+22);k=knee(hip,ankle)
  capsule(hip,k,58,color,i);capsule(k,ankle,44,color,i)
  # One rigid sole footprint; pitch only about the planted heel/toe.
  heel=(x-37,side,z);toe=(x+40,side,z)
  if kind=='heel':toe=(toe[0],side,z+19)
  elif kind=='toe':heel=(heel[0],side,z+24)
  capsule(heel,toe,25,color,i);capsule(ankle,(x+20,side,z+20),31,color,i)
  row[foot]={'phase':kind,'hip':hip,'knee':k,'ankle':ankle,'heelTarget':project(heel,i),'toeTarget':project(toe,i)}
 # Arms counter the ipsilateral thigh: left advances with right heel strike.
 arm=math.cos(i*math.pi/4)*48
 for side,swing,color in [(105,arm,(76,160,220,255))]:
  shoulder=(0,side,448);elbow=(swing*.5,side,357);hand=(swing,side,295)
  capsule(shoulder,elbow,48,color,i);capsule(elbow,hand,39,color,i);disk(hand,20,color,i)
  row['rightArm'if side<0 else'leftArm']={'shoulder':shoulder,'elbow':elbow,'hand':hand}
 # Pelvis/torso and head: the same physical size/root/camera in every pose.
 capsule((0,0,244),(0,0,427),190,(130,137,142,255),i)
 capsule((0,0,425),(0,0,473),175,(154,160,161,255),i)
 disk((0,0,559),45,(174,179,179,255),i)
 capsule((0,0,478),(0,0,515),51,(165,172,173,255),i)
 # Arms counter the ipsilateral thigh: left advances with right heel strike.
 arm=math.cos(i*math.pi/4)*48
 for side,swing,color in [(-105,-arm,(205,146,52,255))]:
  shoulder=(0,side,448);elbow=(swing*.5,side,357);hand=(swing,side,295)
  capsule(shoulder,elbow,48,color,i);capsule(elbow,hand,39,color,i);disk(hand,20,color,i)
  row['rightArm'if side<0 else'leftArm']={'shoulder':shoulder,'elbow':elbow,'hand':hand}
 # Tiny ground tangent guide below rather than painting a desired contact.
 label=f'{i}: '+('RIGHT support'if i<4 else'LEFT support')+' / BLUE=LEFT GOLD=RIGHT'
 pen.text((i%4*640+30,i//4*640+620),label,fill=(240,240,240,255))
 records.append(row)
canvas.save(out/'back-right-physical-guide49-corrected.png')
(out/'back-right-physical-guide49-corrected.json').write_text(json.dumps({'version':1,'type':'diagnostic-physical-targets','direction':'back-right','cameraElevationRadians':elevation,'rootTravelPerBoundaryPhysical':30,'physicalStride':240,'frameDurationMs':125,'leftBlueRightGold':True,'nearAnatomicalSide':'right','farAnatomicalSide':'left','depthOrder':'far LEFT before body, near RIGHT after body','frames':records,'scope':'One physical two-link opposing-leg/counter-arm plan with shared body/camera and ground plane. Colored mannequin targets are not rendered material observations, calibration, redraw acceptance or game assets. Authored boots and hands require independent native and actual-renderer review.'},indent=2)+'\n')
