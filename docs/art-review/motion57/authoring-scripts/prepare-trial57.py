"""Private full-strip preflight; common physical scale and canvas roots, no acceptance."""
import hashlib,importlib.util,json,sys,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path('.').resolve();w=root/'work/expanded-cycles/motion57';base=w/'laborer-back-left'
src=base/'full-stride57-attempt2.png';im=Image.open(src);assert im.size==(1774,887)
dst=w/'candidate2/Laborer/motion/walk/back-left';dst.mkdir(parents=True,exist_ok=True)
shutil.copy2(src,dst/'source-sheet.png')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
request=json.loads((base/'request57-2.json').read_text())
write(dst/'generation.json',{'prompt':request['prompt'],'frameOrder':list(range(8)),'candidate':True,
 'method':'Builtin guide-first complete8-pose strip. Private unapproved uniform registration; no contact fit or source mutation.',
 'rawSource':str(src.relative_to(root)),'rawSha256':sha(src),'commonOpaquePose0BodyBasisPx':427,
 'basis':'Actual opaque crown y10 to visible lowest pose0 boot y436 inclusive. One whole-strip factor520/427; not per-pose body scales.'})
settings={'version':1,'sourceSha256':sha(dst/'source-sheet.png'),'targetBodyHeight':520,'targetAnchor':[320,616],
 'landmarks':[{'root':[i%4*443.5+221.75,i//4*443.5+437],'bodyHeight':427}for i in range(8)],
 'sourceCells':[[round(i%4*443.5),round(i//4*443.5),round((i%4+1)*443.5),round((i//4+1)*443.5)]for i in range(8)],
 'landmarksVerified':False,'durationsMs':[125]*8,'note':'Common cell-center and common row-floor composition anchors only, not hidden anatomical/root/contact observations. Private unapproved full-strip geometry trial.'}
write(dst/'motion-polish.json',settings)
entry=next(e for e in json.loads((root/'docs/expanded-animation-plan.json').read_text())['entries']if e['character']=='Laborer'and e['action']=='walk'and e['direction']=='back-left')
entry={**entry,'destination':str(dst.relative_to(root))}
write(dst/'private-entry.json',entry)
sys.path.insert(0,str(root/'scripts'));spec=importlib.util.spec_from_file_location('export','scripts/export-character-motion.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.export(entry)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
grid=Image.new('RGB',(2560,720),'#29373d');d=ImageDraw.Draw(grid)
for i in range(8):
 image=Image.open(dst/f'{i:02}.png').convert('RGBA');ox=i%4*640;oy=i//4*360
 crop=image.crop((120,370,560,640));grid.paste(crop,(ox+30,oy+40),crop)
 for x in range(120,561,20):
  px=ox+30+x-120;d.line((px,oy+40,px,oy+310),fill='#517075');d.text((px,oy+315),str(x),font=font,fill='white')
 for y in range(380,641,20):
  py=oy+40+y-370;d.line((ox+30,py,ox+470,py),fill='#517075');d.text((ox+475,py-8),str(y),font=font,fill='white')
 d.text((ox+20,oy+8),f'{i}: actual exported pixels, grid only; UNAPPROVED',font=font,fill='white')
grid.save(base/'candidate2-boot-grid57.png')
print('Private2 exported all8 at one scale, no local transforms or approval; native boot grid saved.')
