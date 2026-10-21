"""Exact whole-native-frame assembly for a private unapproved motion trial.
No local edits, per-pose scale, artificial in-between or opacity thresholds.
"""
import argparse,json,hashlib,shutil,sys
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import numpy as np
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
from motion_registration import settings_hash
parser=argparse.ArgumentParser();parser.add_argument('--number',type=int,required=True);parser.add_argument('--replacement',type=int,required=True);parser.add_argument('--fresh-pose',type=int);parser.add_argument('--previous',required=True);parser.add_argument('--fresh',required=True);args=parser.parse_args()
w=root/'work/expanded-cycles/motion57';dst=w/f'candidate{args.number}/Laborer/motion/walk/back-left';dst.mkdir(parents=True,exist_ok=True)
prior=root/args.previous;fresh=root/args.fresh
write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((prior/'manifest.json').read_text());sheet=Image.new('RGBA',(2560,1280));atlas=Image.new('RGBA',(5120,640));frames=[];images=[];inputs=[];proof=[]
for i in range(8):
 native_pose = (args.fresh_pose if args.fresh_pose is not None else i) if i==args.replacement else i
 p=(fresh if i==args.replacement else prior)/f'{native_pose:02}.png';image=Image.open(p).convert('RGBA');assert image.size==(640,640)
 shutil.copy2(p,dst/f'{i:02}.png');sheet.paste(image,(i%4*640,i//4*640));atlas.paste(image,(i*640,0));images.append(image)
 inputs.append({'pose':i,'file':str(p.relative_to(root)),'sha256':sha(p),'wholeNativeFrameOnly':True})
 assert np.array_equal(np.array(image),np.array(sheet.crop((i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640))))
 proof.append({'pose':i,'wholeSelectedNativeRGBAExact':True,'source':str(p.relative_to(root)),'sha256':sha(p)})
 frames.append({**old['frames'][i],'sourceBounds':[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640], 'sourceAnchor':[320,616],'groundAnchor':[320,616],'placement':[0,0]})
sheet.save(dst/'source-sheet.png');atlas.save(dst/'atlas.png');images[0].save(dst/'preview.png',save_all=True,append_images=images[1:],duration=[125]*8,loop=0,disposal=0,blend=0)
settings={'version':1,'sourceSha256':sha(dst/'source-sheet.png'),'targetBodyHeight':520,'targetAnchor':[320,616],
 'landmarks':[{'root':[i%4*640+320,i//4*640+616],'bodyHeight':520}for i in range(8)],'sourceCells':[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640]for i in range(8)],
 'landmarksVerified':False,'durationsMs':[125]*8,'note':'Private exact whole-native-cell assembly. Preserve all original alpha/material, including translucent fringe. Common raw419 basis from attempt3 before normalization. Composition anchors do not certify anatomical/root/sole correspondence.'}
write(dst/'motion-polish.json',settings)
request=json.loads((w/f'laborer-back-left/request57-{args.number}.json').read_text())
write(dst/'generation.json',{'prompt':request['prompt'],'candidate':True,'frameOrder':list(range(8)), 'method':'Literal whole normalized native-cell assembly; copy seven preceding frames exactly and one complete newly authored pose with the same retained whole-strip419 basis. No threshold recrop, local body/limb edit, per-pose fit, mirror or synthetic frame. Private unapproved.', 'inputs':inputs,'exportScript':str(Path(__file__).relative_to(root)),'exportScriptSha256':sha(Path(__file__))})
manifest={**old,'sourceSha256':sha(dst/'source-sheet.png'),'sourceSize':[2560,1280],'sharedScale':1,'frames':frames,'sourceFrameOrder':list(range(8)), 'registration':{**old['registration'],'targetAnchor':[320,616],'targetBodyHeight':520,'settingsSha256':settings_hash(settings),'landmarksVerified':False},
 'playback':{**old['playback'],'durationsMs':[125]*8,'durationMs':1000,'loopApproved':False,'taskApproved':False},'productionReady':False, 'note':'PRIVATE literal whole-native-frame trial. No sole/root/cycle/family approval.'}
manifest.pop('travelCalibration',None);manifest.pop('loopReview',None);manifest.pop('taskReview',None)
write(dst/'manifest.json',manifest)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16);review=Image.new('RGB',(2560,1400),'#2d373a');draw=ImageDraw.Draw(review)
for i,im in enumerate(images):
 x=i%4*640;y=i//4*700;review.paste(im,(x,y),im);draw.text((x+16,y+648),f'Pose{i}: unapproved whole-strip motion trial; material review pending',font=font,fill='white')
review.save(dst/'review.jpg',quality=95)
write(w/f'laborer-back-left/retained-native{args.number}57.json',{'candidate':True,'samples':proof,'scope':'Every frame is an exact selected normalized whole figure. No motion/contact or loop acceptance.'})
print('Literal trial',args.number,'retains7 native figures and alpha exactly; only new full pose',args.replacement,'selected. PRIVATE, unapproved.')
