"""Diagnostic pose targets only. Never use these as measured contact points."""
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw

p = Path('work/expanded-cycles/motion48/elder-right')
canvas = Image.new('RGB', (2560, 1280), '#f2f3f2')
draw = ImageDraw.Draw(canvas)
near = '#bd4844'
far = '#3f769f'
cane = '#467249'
poses = [
    {'near': [[310,425],[270,500],[250,570]], 'far': [[330,425],[365,495],[390,572]], 'nearFoot': [[220,585],[280,600]], 'farFoot': [[380,600],[440,580]], 'cane': [[460,350],[460,600]], 'freeHand': [235,350]},
    {'near': [[310,425],[250,490],[255,540]], 'far': [[330,425],[340,495],[350,572]], 'nearFoot': [[230,550],[290,560]], 'farFoot': [[340,600],[400,600]], 'cane': [[420,350],[420,600]], 'freeHand': [250,360]},
    {'near': [[310,425],[390,480],[370,540]], 'far': [[330,425],[315,495],[310,570]], 'nearFoot': [[350,565],[420,575]], 'farFoot': [[300,600],[360,600]], 'cane': [[380,350],[380,600]], 'freeHand': [300,365]},
    {'near': [[310,425],[390,495],[410,555]], 'far': [[330,425],[300,490],[285,550]], 'nearFoot': [[395,582],[450,575]], 'farFoot': [[260,580],[320,600]], 'cane': [[340,350],[340,600]], 'freeHand': [360,335]},
    {'near': [[310,425],[365,495],[390,572]], 'far': [[330,425],[270,500],[250,570]], 'nearFoot': [[380,600],[440,580]], 'farFoot': [[220,585],[280,600]], 'cane': [[410,315],[360,560]], 'freeHand': [405,345]},
    {'near': [[310,425],[340,495],[350,572]], 'far': [[330,425],[250,490],[255,540]], 'nearFoot': [[340,600],[400,600]], 'farFoot': [[230,550],[290,560]], 'cane': [[440,300],[430,550]], 'freeHand': [360,345]},
    {'near': [[310,425],[315,495],[310,570]], 'far': [[330,425],[390,480],[370,540]], 'nearFoot': [[300,600],[360,600]], 'farFoot': [[350,565],[420,575]], 'cane': [[470,315],[470,565]], 'freeHand': [300,365]},
    {'near': [[310,425],[300,490],[285,550]], 'far': [[330,425],[390,495],[410,555]], 'nearFoot': [[260,580],[320,600]], 'farFoot': [[395,582],[450,575]], 'cane': [[490,340],[500,590]], 'freeHand': [235,350]},
]
for i, pose in enumerate(poses):
    x, y = i % 4 * 640, i // 4 * 640
    def pts(points): return [(a+x,b+y) for a,b in points]
    draw.rectangle((x,y,x+639,y+639),outline='#aab4b4',width=2)
    draw.line(pts([[110,600],[540,600]]),fill='#c7ceca',width=2)
    draw.text((x+18,y+16),f'{i}: near RIGHT red, far LEFT blue; cane green',fill='#25333a')
    draw.text((x+18,y+37),'POSE TARGETS ONLY - NOT MATERIAL OBSERVATIONS',fill='#25333a')
    draw.ellipse((x+265,y+115,x+365,y+215),outline='#333b42',width=6)
    draw.line(pts([[315,215],[320,300],[320,425]]),fill='#333b42',width=8)
    draw.line(pts([[275,280],[355,280]]),fill='#333b42',width=6)
    # Far leg is drawn first. The near leg must own foreground overlap.
    for key, color in [('far',far),('near',near)]:
        draw.line(pts(pose[key]),fill=color,width=16)
        draw.line(pts(pose[key+'Foot']),fill=color,width=15)
        for point in pose[key]:
            a,b=pts([point])[0];draw.ellipse((a-9,b-9,a+9,b+9),fill=color)
    draw.line(pts([[355,280],[335,325],pose['freeHand']]),fill=far,width=13)
    grip, tip=pose['cane']
    draw.line(pts([[275,280],[355,315],grip]),fill=near,width=13)
    draw.line(pts([grip,tip]),fill=cane,width=12)
    a,b=pts([tip])[0];draw.ellipse((a-8,b-8,a+8,b+8),fill=cane)
    draw.text((x+18,y+616), 'Cane PLANTED' if i<4 else 'Cane LIFT / RECOVER / REPLANT',fill='#25333a')
canvas.save(p/'coupled-pose-guide48.png')
record={'scope':'Diagnostic authoring guide only; all contacts must be reobserved from actual generated native source pixels.', 'poseSize':[640,640], 'nearLeg':'right', 'farLeg':'left', 'canePlantFrames':[0,1,2,3], 'caneRecoveryFrames':[4,5,6,7], 'poses':poses}
(p/'coupled-pose-guide48.json').write_text(json.dumps(record,indent=2)+'\n')
prompt='''Use case: asset-generation. Create one complete transparent4-column2-row eight-pose sprite sheet for the ELDER dwarf walking to SCREEN RIGHT while using his ONE wooden cane. Image1 is the exact character/costume/semirealistic rendered style identity; image2 is his canonical cane and grip; image3 is the explicit coupled leg and cane pose guide, used for geometry ONLY. Do not copy the guide colors or labels into the art. Preserve the bald elderly head, long WHITE double beard with brass rings, deep sage/olive embroidered long coat, brown leather shoulder trim and left hip pouch, brown cuffed trousers, strapped brown boots, stocky short dwarf proportions, carved wooden straight cane with its ONE brass collar below the knob. Same detailed rendered quality, face and outfit in all eight poses. True consistent RIGHT-facing side/three-quarter camera at isometric elevation, full body and full cane uncropped, common physical scale and shared floor in each row, generous gutters. No floor, ground shadow, scenery, captions or graphic marks. Real transparent alpha.
Follow the guide's EIGHT DISTINCT full-body poses and BOTH opposing legs. The RED guide leg is the NEAR anatomical RIGHT leg; BLUE is FAR LEFT. Draw the near leg in front where they overlap. Top0: far left leading heel lands with toe raised, near right trailing toe pushes behind. Top1: far left weight down flat ahead, near right boot recovering airborne BEHIND. Top2: far left support directly UNDER hips, near right knee lifted passing FORWARD with boot airborne in FRONT, never backward kick. Top3: far left heel raised with supporting TOE under hips, near right foot reaches forward AIRBORNE. Bottom4: near right leading heel lands with toe raised, far left toe trails behind. Bottom5: near right flat support ahead, far left boot recovering airborne behind. Bottom6: near right support under hips, far left raised knee and boot passing FORWARD in front. Bottom7: near right supporting toe under hip with heel raised, far left reaches forward airborne ready for the next top0 heel plant. The two passing poses2/6 MUST have opposite legs planted. Heavy soles stay the same size and form; leave both visible lower sole rims and heel corners inspectable. No leg or foot swapping.
The cane has a COMPLETE planted/support/lift/recovery/replant cycle, coordinated with those feet. It is always the SAME rigid wooden cane gripped in the SAME near hand around the SAME knob/brass collar. Only one cane and one tool hand; the other hand swings gently opposite its leg. Top0/1/2/3: cane tip touches the shared ground, progressing from ahead of the body toward under the hip as the torso passes it. Its relative positions and tip path must FOLLOW THE GREEN GUIDE while the far left foot supplies support. The four planted tip positions move smoothly left across those cells; do not keep a vertical cane fixed ahead of the torso in every pose. Allow the elbow/shoulder to articulate so its planted end can stay put as the body advances. Bottom4: lift the cane tip clearly OFF the ground and tilt slightly backward. Bottom5: cane remains raised and begins forward recovery. Bottom6: recover the whole cane FORWARD, clearly airborne. Bottom7: lower the cane to just above the floor well AHEAD of the body, ready to replant with top0. The cane never teleports, changes length, switches hands, disappears, merges into a boot or remains planted while its hand moves it. Full shaft, knob, collar and rounded lower tip visible in all eight cells. All eight real full-body poses authored together, no duplicate stance or mirrored pose. Preserve face/costume/camera/body scale. This is an elderly small steady stride, not a wide lunging march.'''
refs=[Path('public/sprites/Elder/animation/02-right.png').resolve(),Path('public/sprites/Elder/animation/10-stand-stick.png').resolve(),(p/'coupled-pose-guide48.png').resolve()]
request={'prompt':prompt,'references':[{'file':str(f),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in refs]}
(p/'request48.json').write_text(json.dumps(request,indent=2)+'\n')
print('Eight coupled authoring targets prepared. No selected Elder asset changed; guide never supplies observed material.')
