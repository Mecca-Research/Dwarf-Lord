"""Depth-ordered diagnostic mannequin; it is never selected sprite artwork."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

p=Path('work/expanded-cycles/motion48/elder-right')
poses=json.loads((p/'coupled-pose-guide48.json').read_text())['poses']
canvas=Image.new('RGB',(2560,1280),'#eff1f2')
draw=ImageDraw.Draw(canvas)
near='#b74d43';far='#3c74a3';cane='#456f46'
for i,pose in enumerate(poses):
    x,y=i%4*640,i//4*640
    def pts(points):return [(a+x,b+y) for a,b in points]
    def boot(points,color):
        (hx,hy),(tx,ty)=points
        # A schematic foot silhouette with an upper ankle and literal lower rim.
        shape=[[hx,hy],[tx,ty],[tx-6,ty-22],[hx+6,hy-34]]
        draw.polygon(pts(shape),fill=color,outline='#263840')
        draw.line(pts(points),fill='#253037',width=6)
        draw.text((x+hx+7,y+hy-28),'R' if color==near else 'L',fill='white')
    draw.rectangle((x,y,x+639,y+639),outline='#aab4b4',width=2)
    draw.text((x+14,y+12),f'PHASE {i} / NEAR RIGHT RED / FAR LEFT BLUE',fill='#27363e')
    draw.text((x+14,y+31),'DIAGNOSTIC TARGETS ONLY, NOT MEASURED MATERIAL',fill='#27363e')
    draw.line(pts([[100,600],[550,600]]),fill='#bac8c0',width=2)
    # Far arm/leg are below the body. Near arm/leg own every overlap.
    draw.line(pts([[320,275],[310,320],pose['freeHand']]),fill=far,width=35)
    draw.ellipse((x+pose['freeHand'][0]-15,y+pose['freeHand'][1]-15,x+pose['freeHand'][0]+15,y+pose['freeHand'][1]+15),fill=far)
    draw.line(pts(pose['far']),fill=far,width=45)
    boot(pose['farFoot'],far)
    draw.rounded_rectangle((x+260,y+225,x+365,y+430),radius=32,fill='#727b7b',outline='#29383c',width=3)
    draw.ellipse((x+270,y+118,x+367,y+218),fill='#c1c9c8',outline='#29383c',width=3)
    draw.polygon(pts([[355,151],[390,172],[357,180]]),fill='#c1c9c8',outline='#29383c')
    draw.line(pts(pose['near']),fill=near,width=43)
    boot(pose['nearFoot'],near)
    # Visible pouch identifies the near shoulder/arm side consistently.
    draw.rounded_rectangle((x+255,y+347,x+300,y+410),radius=6,fill='#594734',outline='#292b29',width=3)
    grip,tip=pose['cane']
    draw.line(pts([grip,tip]),fill=cane,width=16)
    draw.line(pts([[305,268],[340,320],grip]),fill=near,width=34)
    gx,gy=pts([grip])[0]
    draw.ellipse((gx-18,gy-18,gx+18,gy+18),fill=near,outline='#29383c',width=2)
    draw.text((x+12,y+615),'CANE PLANTED' if i<4 else 'CANE AIRBORNE RECOVERY',fill='#27363e')
canvas.save(p/'filled-pose-guide48.png')
prompt='''Use case: asset-generation. Create a NEW8-pose transparent4-column2-row sprite sheet of the canonical Elder dwarf from image2, performing the EXACT eight leg/arm/cane poses in image1. Image1 is a depth-ordered solid pose mannequin: near/right RED limb is ON TOP OF the far/left BLUE limb, gray is torso/head, green is the ONE cane. Follow its geometry, depth order and empty-arm versus cane-arm ownership; do not render any guide color, R/L letter, ground line or label. Image2 supplies the exact face, beard, costume, material and semirealistic rendered quality only, not a repeated standing pose. Do not copy its two-handed resting grip. ONE cane only, gripped by the SAME NEAR satchel-side arm in all8, the other FAR arm empty and gently opposing its leg. Continuous nearest shoulder-elbow-wrist-knob chain drawn in the foreground across the coat, visible tool collar/shaft/tip always complete. Do not ever hand the cane to the other arm. The visible leather hip satchel stays on this same near side.
The two passing poses2/6 have OPPOSITE planted legs and opposite bent knees. Top2 near RIGHT knee/boot RAISED FORWARD in FRONT OF the far LEFT leg, whose boot is flat UNDER the hips. Bottom6 near RIGHT boot flat UNDER hips; far LEFT knee/boot RAISED FORWARD. Both lifted feet pass in front, never kick behind. Top0/1/2/3 far LEFT foot supports from leading heel landing, flat weight, under-body support to toe-off; near RIGHT progresses trailing toe, rear airborne recovery, front airborne passing, front reach. Bottom4/5/6/7 near RIGHT foot supplies the same four support stages, while far LEFT recovers. Follow the explicit drawn whole leg chains and boot lower rims in the guide. Near leg stays visibly foreground where legs cross, including top2. Broad but short stocky dwarf proportions and same physical body/boot scale; camera always true right-facing side at isometric elevation. No pose/camera turn or one-sided duplicate leg.
The SAME cane follows the guide: tip planted in top0/1/2/3 at a common ground plane, moving from ahead to under the hips relative to the torso while the far LEFT foot supports. Articulate the SAME near arm/elbow to retain that knob/collar grip as the torso passes the planted cane. Bottom4 lift the cane tip clearly above the floor while near RIGHT heel takes support. Bottom5 recover the lifted cane forward. Bottom6 lift continues ahead. Bottom7 lower it ahead, its tip just above the floor, ready to replant with top0. Actual cane tip positions must follow the green guide rather than remaining vertically ahead of the body in every pose. Maintain rigid shaft length, one knob/brass collar and one rounded tip. Full cane and both lower soles visible and uncropped.
Render high-quality detailed semi-realistic fantasy Elder: oldest dwarf, bald wrinkled head, long WHITE double-braided beard with brass rings, olive-green long embroidered coat with brown leather shoulder/piping trim, brown leather satchel, brown cuffed trousers, brown strapped boots. Preserve identity and outfit across renders, natural elbow/knee anatomy, no added parts. All8 distinct complete full-body poses authored together, shared scale and floor height, wide transparent gutters/margins. Real transparent alpha. No environment, cast shadow, colored markers, text, rig shapes, floor or background. No missing cane, no grip switch, no double-handed rests.'''.replace('\n+','\n')
refs=[(p/'filled-pose-guide48.png').resolve(),Path('public/sprites/Elder/animation/02-right.png').resolve()]
(p/'request-filled48.json').write_text(json.dumps({'prompt':prompt,'references':[{'file':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in refs]},indent=2)+'\n')
print('Depth-ordered solid guide and canonical-only reference prepared; no failed walk strip is reused.')
