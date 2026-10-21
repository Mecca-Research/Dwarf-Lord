"""Authoring constraints only; no simulated or inferred material contact proof."""
from PIL import Image,ImageDraw
from pathlib import Path
import math
w=Path('work/expanded-cycles/motion57/laborer-back-left')
base=Image.open('public/sprites/Laborer/motion/walk/back-left/04.png').convert('RGBA')
base.crop((130,60,480,440)).save(w/'identity-upper57.png')
sheet=Image.new('RGB',(2560,1280),'#263238');d=ImageDraw.Draw(sheet)
right=[(268,464),(302,483.198),(336,502.396),(370,521.594),(404,540.792),(340,499),(296,430),(235,454)]
left=[(348,580.792),(330,540),(282,448),(220,493),(212,504),(246,523.198),(280,542.396),(314,561.594)]
# Ground projection for a rear-left yaw, elevation0.6; foot prisms show real yaw/depth.
f=(-math.sqrt(.5),-math.sqrt(.5)*math.sin(.6));n=(-math.sqrt(.5),math.sqrt(.5)*math.sin(.6))
for i in range(8):
 ox=i%4*640;oy=i//4*640
 def pt(p):return (round(ox+p[0]),round(oy+p[1]))
 def line(points,color,width=5):d.line([pt(p)for p in points],fill=color,width=width)
 d.rectangle((ox+2,oy+2,ox+638,oy+638),outline='#617177',width=2)
 d.text((ox+16,oy+14),f'{i}  REAR-LEFT: CONSTRAINT GUIDE, NOT CONTACT EVIDENCE',fill='white')
 # Body rig is fixed; pose foot depth comes from projection, not silhouette fitting.
 d.ellipse((ox+277,oy+90,ox+351,oy+164),outline='#b4c5ca',width=3)
 d.polygon([pt(p)for p in [(278,169),(354,169),(380,308),(320,359),(268,320)]],outline='#b4c5ca')
 line([(294,341),(339,326)],'#b4c5ca')
 for side,coords,color in [('R',right[i],'#7cd4ef'),('L',left[i],'#ddbb69')]:
  x,y=coords
  support=(side=='R'and i<=4)or(side=='L'and (i==0 or i>=4))
  # Recovery poses already have raised boot coordinates; all supporting boxes share the physical plane.
  corners=[(x+f[0]*a+n[0]*b,y+f[1]*a+n[1]*b)for a,b in [(-25,-18),(50,-18),(50,18),(-25,18)]]
  top=[(a,b-23)for a,b in corners]
  d.polygon([pt(p)for p in corners],outline=color)
  d.polygon([pt(p)for p in top],outline=color)
  for a,b in zip(corners,top):line([a,b],color,2)
  hip=(339,326)if side=='R'else(294,341)
  ankle=(x-f[0]*5,y-f[1]*5-23)
  knee=((hip[0]+ankle[0])/2-10,(hip[1]+ankle[1])/2-8)
  line([hip,knee,ankle],color,8)
  d.text(pt((x+38,y+8)),side+(' SUPPORT'if support else' AIR'),fill=color)
 # Counterarms oppose the leading thigh, crossing neutral in2/6.
 phase=[1,.8,0,-.65,-1,-.8,0,.65][i]
 nearhand=(270-55*phase,330-17*phase);farhand=(367+45*phase,302+13*phase)
 line([(276,182),(244,251),nearhand],'#ddbb69',8)
 line([(352,181),(380,243),farhand],'#7cd4ef',8)
 d.text((ox+16,oy+610),'Same hip root, camera, body size, floor projection throughout',fill='white')
sheet.save(w/'full-stride-constraint57.png')
print('Saved upper-body identity crop and one complete constraint strip; guide positions are not measured material.')
