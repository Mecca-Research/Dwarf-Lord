# A new schematic geometry guide, not an edit to an asset or a measured review.
# No source character pixels are read or copied by this script.
import math,json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
out=Path('work/expanded-cycles/motion40/authoring');root=np.array([320.,575.]);F=np.array([-.70710678,-.39926252]);L=np.array([-.70710678,.39926252]);up=np.array([0.,-.82533561]);stride=572.;step=stride/8;legspread=55.;bootlength=121.;bootwidth=68.
canvas=Image.new('RGB',(2560,1400),'#202b31');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
records=[]
for i in range(8):
 off=np.array([i%4*640,i//4*700]);xy=lambda p:tuple((np.array(p)+off).round().astype(int));local=Image.new('RGB',(640,640),'#202b31');d=ImageDraw.Draw(local)
 def line(a,b,fill,w):d.line([tuple(a),tuple(b)],fill,width=w)
 def ball(p,r,color):d.ellipse((p[0]-r,p[1]-r,p[0]+r,p[1]+r),fill=color)
 # Flat-ground axes and a projected stationary body base.
 for k in [-2,-1,0,1,2]:
  a=root+L*k*60;line(a+F*-230,a+F*300,'#38484c',1)
  a=root+F*k*70;line(a+L*-180,a+L*180,'#38484c',1)
 def foot(side,phase):
  lateral=L*(legspread if side=='left' else -legspread);base=root+lateral
  # Grounded half-stride: exact same heel0->1 and toe1->2->3->4.
  # Recovery is a fresh posed foot, not synthesized art.
  color='#d29b57' if side=='left' else '#8bb5d0'
  heel=base+F*(stride/4-phase*step)
  elevation=0.;tilt=0.
  if phase==0:tilt=.20
  elif phase==3:tilt=-.55
  elif phase==4:tilt=-.95
  elif phase==5:
   heel=base+F*(-stride/4+step);elevation=100.;tilt=-.65
  elif phase==6:
   heel=base+F*0;elevation=92.;tilt=-.25
  elif phase==7:
   heel=base+F*(stride/4-step);elevation=62.;tilt=.16
  # Preserve the toe during toe-off, raising the heel around that toe pivot.
  v=F*bootlength*math.cos(tilt)+up*(bootlength*math.sin(tilt))
  if phase in [3,4]:
   flatToe=heel+F*bootlength;heel=flatToe-v
  heel=heel+up*elevation;toe=heel+v
  a,b,c,e=heel+L*bootwidth/2,heel-L*bootwidth/2,toe-L*bootwidth/2,toe+L*bootwidth/2
  top=-up*45
  d.polygon([tuple(a),tuple(b),tuple(c),tuple(e)],fill='#14191d',outline=color,width=2)
  d.polygon([tuple(a),tuple(e),tuple(e-top),tuple(a-top)],fill=color)
  d.polygon([tuple(e-top),tuple(c-top),tuple(b-top),tuple(a-top)],fill=tuple(min(255,int(v*1.16))for v in tuple(int(color[k:k+2],16)for k in [1,3,5])))
  ankle=heel+F*28-up*43;hip=np.array([320.,390.])+lateral*.8
  knee=(hip+ankle)/2+F*(30 if phase in [5,6] else -10)
  line(hip,knee,color,48);line(knee,ankle,color,42);ball(knee,22,color)
  # Toe and heel marks identify material geometry, not observed sprite points.
  for point,name in [(heel,'H'),(toe,'T')]:ball(point,4,'#fff8de');d.text(tuple(point+np.array([6.,-10.])),name,font=font,fill='#fff8de')
  return {'side':side,'phase':phase,'heelTarget':heel.round(2).tolist(),'toeTarget':toe.round(2).tolist(),'hipTarget':hip.round(2).tolist(),'anatomicalColor':color}
 # Far right first, near left second; keep the camera fixed rather than mirror.
 right=foot('right',i);left=foot('left',(i+4)%8)
 d.polygon([(245,198),(380,180),(416,385),(275,418)],fill='#71777a',outline='#bbc3c3')
 ball((320,137),54,'#b8b8b3');d.polygon([(264,124),(251,145),(268,160)],fill='#b8b8b3')
 # Counter-swing shown by shoulder/elbow/wrist positions.
 swing=math.cos(i*math.pi/4)
 for near,color,shoulder in [(False,'#8bb5d0',np.array([390.,215.])),(True,'#d29b57',np.array([265.,228.]))]:
  sign=1 if near else -1;elbow=shoulder+np.array([(-45 if near else 30),106])+F*(sign*swing*25)
  wrist=shoulder+np.array([(-50 if near else 45),188])+F*(sign*swing*60)
  line(shoulder,elbow,color,35);line(elbow,wrist,color,30);ball(wrist,17,color)
 ball(root,4,'#df7070');d.text((10,12),f'{i} — '+['right heel contact','right flat / left recovery','left passing / right support','left reach / right toe off','left heel contact','left flat / right recovery','right passing / left support','right reach / left toe off'][i],font=font,fill='#d9e7e8')
 d.text((10,610),'POSE TARGET ONLY — not measured or selected',font=font,fill='#d9e7e8')
 canvas.paste(local,tuple(off.astype(int)));records.append({'frame':i,'right':right,'left':left})
canvas.save(out/'laborer-rig-guide40.png')
(out/'laborer-rig-guide40.json').write_text(json.dumps({'type':'new projected schematic authoring target','selectedAsset':False,'measuredLandmarks':False,'scope':'A pose/ground-plane guide only. New authored character images must be measured independently; these targets never become material observations.','cameraElevationRadians':.6,'bodyRootTarget':[320,575],'strideTargetPx':stride,'frames':records},indent=2)+'\n')
