"""Source-only reference and independent authored arm/cane guide, never selected pixels."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,hashlib
p=Path('work/expanded-cycles/motion48/elder-right');f=p/'candidate-contact'
ref=Image.new('RGBA',(2560,1280),(0,0,0,0));guide=Image.new('RGB',(2560,1400),'#263136');draw=ImageDraw.Draw(guide)
tips=[532,461,362,335]
for i in range(8):
 im=Image.open(f/f'{i:02}.png').convert('RGBA');x,y=i%4*640,i//4*700
 ref.paste(im,(x,i//4*640));guide.paste(im,(x,y),im)
 if i<4:
  wrist=(x+tips[i],y+324);shoulder=(x+277,y+226)
  elbow=(x+[415,366,309,292][i],y+[292,305,315,318][i])
  draw.line([shoulder,elbow,wrist],fill='#63dfbe',width=24)
  for point in (shoulder,elbow,wrist):draw.ellipse((point[0]-14,point[1]-14,point[0]+14,point[1]+14),fill='#63dfbe')
  draw.line([(x+tips[i],y+347),(x+tips[i],y+614)],fill='#ffffff',width=18)
  draw.ellipse((x+tips[i]-14,y+310,x+tips[i]+14,y+337),fill='#63dfbe')
  draw.text((x+30,y+655),f'{i}: SAME near arm bends; planted tip X={tips[i]}, floorY=614',fill='white')
 elif i in (4,5):
  # The far-arm chain is behind the tool arm, on its other side of the body.
  # Diagnostic guide owns no material or renderer approval.
  chain=[(x+245,y+224),(x+327,y+316),(x+430,y+360)]
  draw.line(chain,fill='#75b8fa',width=22)
  for px,py in chain:draw.ellipse((px-12,py-12,px+12,py+12),fill='#75b8fa')
  draw.text((x+30,y+655),f'{i}: EMPTY far arm FORWARD below tool arm',fill='white')
 else:draw.text((x+30,y+655),f'{i}: preserve whole pose and lifted cane lowering',fill='white')
ref.save(p/'contact-exported-reference48.png');guide.save(p/'shared-root-arm-guide48.png')
request={'method':'Second bounded source-contact arm-chain correction after depth-ordered authored rig. If rejected, require a different authoring method rather than further rerolls.',
'prompt':'''Precise object edit, complete 8-pose sprite strip. Image1 is the full RIGHT-facing Elder walk to correct. Image2 is an independent diagnostic full arm-chain drawing guide, not art to copy into the finished image. Preserve all EIGHT existing full-body LEG/BOOT/COAT/HEAD poses from image1 exactly, the one body scale, same fixed right-side camera and transparent alpha,4 columns2 rows. No floor, shadow, labels, colored guides or halo. Correct only the specified full arm/cane chains. Natural 3D joints, same physical cane, same satchel-side nearest hand holds it throughout8; never switch hands. Clean red/yellow outline fringe without making holes.
TOP ROW0/1/2/3: Follow the white rigid cane and aqua complete arm chains in image2 precisely. The cane tip remains planted on ONE horizontal ground, but slides BACK relative to his torso as the torso advances. The hand must retract and elbow BEND as shown, instead of remaining stretched toward the front boot. The four cane-tip cell X positions must be0=532,1=461,2=362,3=335 with floorY614 on the640px reference cells. All4 shafts straight vertical, same267px brass-collar-to-tip length, collar atY347, hand/knobY324. The arm shoulder stays the same nearest foreground satchel-side shoulder. Wrist ends at each designated caneX. The first arm stretches forward; second bends; third bends substantially with wrist in front of chest; fourth folds with wrist directly under/in front of chest. Do not move the boots/legs to compensate for a wrong cane. The entire cane tip and lower shaft must be visible and distinct from boots in all4.
BOTTOM FIRST/SECOND(global4/5): the EMPTY far arm moves FORWARD beneath/behind the nearest cane-holding forearm, with open empty hand near cell430,360. Follow the blue far-arm chain in guide. Do not leave the free hand dangling BEHIND the satchel as it currently does. Foreground satchel-side arm keeps the cane and must not be swapped with far arm. Keep bottom-row cane lift/recovery/lowering and all4 complete foot poses unchanged. Bottom6/7 unmodified except natural clean alpha.
Keep the exact very OLD bald face, heavy stocky DWARF anatomy, long white2-braided beard/brass rings, embroidered olive coat, leather satchel and strapped heavy boots, fully rendered semi-realistic painted materials. ONE same carved wooden cane, one brass collar, one knob, one rounded tip. Distinct8poses,uncropped whole bodies, transparent background. Output art contains zero blue/aqua guide chains, zero white guide rods, zero text.''',
'references':[{'file':str((p/name).resolve()),'sha256':hashlib.sha256((p/name).read_bytes()).hexdigest()}for name in('contact-exported-reference48.png','shared-root-arm-guide48.png')]}
(p/'request-shared-root48.json').write_text(json.dumps(request,indent=2)+'\n')
