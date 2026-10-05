"""Whole exported source pixels and foreground stencils, no limb reconstruction."""
import json,hashlib,importlib.util,sys,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
sys.path.insert(0,'scripts')
p=Path('work/expanded-cycles/motion48/cook-dough');f=p/'actor-candidate';assert not f.exists();f.mkdir()
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
def save(f,j):f.write_text(json.dumps(j,indent=2)+'\n')
original=Path('public/sprites/Cook/motion/knead-dough/reference')
body=[[84,15],[440,15],[440,246],[427,246],[424,280],[425,310],[421,324],[408,332],[378,339],[341,340],[309,336],[282,330],[269,313],[246,306],[218,310],[201,310],[186,329],[180,357],[177,445],[140,451],[84,448]]
feet=[[[86,424],[177,424],[184,510],[172,593],[82,599]],[[350,486],[363,486],[378,494],[386,506],[380,517],[365,525],[349,526]]]
foreground=[[128,198],[189,196],[250,227],[322,249],[422,242],[435,270],[431,311],[419,326],[408,334],[381,341],[340,344],[303,341],[280,334],[265,312],[218,305],[172,292],[144,259]]
source=Image.new('RGBA',(2560,1280));masks=[];originals=[]
for i in range(8):
 im=Image.open(original/f'{i:02}.png').convert('RGBA');mask=Image.new('L',im.size);pen=ImageDraw.Draw(mask)
 for poly in [body]+feet:pen.polygon([tuple(q)for q in poly],fill=255)
 actor=im.copy();actor.putalpha(ImageChops.multiply(im.getchannel('A'),mask));source.alpha_composite(actor,(i%4*640,i//4*640));masks.append([body]+feet)
 originals.append({'file':str(original/f'{i:02}.png'),'sha256':sha(original/f'{i:02}.png')})
source.save(f/'source-sheet.png')
g={'prompt':'No new actor render. Source-only foreground extraction from reviewed kneading poses. Whole original material retained at original locations; geometry hidden by its independent fixed block remains unobserved. No limb movement, warp, paint, scale per pose or synthesized poses.',
 'method':'source-pixel-foreground-stencils','originalFrames':originals,'actorPolygons':masks,'candidate':True}
save(f/'generation.json',g)
save(f/'motion-polish.json',{'version':1,'sourceSha256':sha(f/'source-sheet.png'),'targetBodyHeight':562,'targetAnchor':[320,616],
 'landmarks':[{'root':[i%4*640+320,i//4*640+616],'bodyHeight':562}for i in range(8)],
 'sourceCells':[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640]for i in range(8)],'durationsMs':[125]*8,'review':'Exact source-pixel whole registered reference basis; visible head/sole physical body extent562. Hidden anatomy, composited contact and task rendering need review.'})
e=next(e for e in json.loads(Path('docs/expanded-animation-plan.json').read_text())['entries']if e['character']=='Cook'and e['action']=='knead-dough');e.update(destination=str(f),direction='actor',station='dough-block');save(p/'entry-candidate48.json',e)
s=importlib.util.spec_from_file_location('ex','scripts/export-character-motion.py');ex=importlib.util.module_from_spec(s);s.loader.exec_module(ex);ex.export(e)
raw=Image.open(p/'station-source48.png').convert('RGBA');bbox=raw.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox();crop=raw.crop(bbox);crop=crop.resize((400,round(crop.height*400/crop.width)),Image.LANCZOS)
prop=Image.new('RGBA',(640,640));prop.alpha_composite(crop,(180,250));prop.save(p/'station-candidate48.png')
save(p/'layer-config48.json',{'actorBodyHeight':562,'stationPlacement':{'alphaThreshold':128,'width':400,'x':180,'y':250,'canvas':[640,640]},'stationSourceSha256':sha(p/'station-source48.png'),'foregroundPolygons':[ [foreground] for i in range(8)],'approved':False})
sheet=Image.new('RGB',(2560,1360),'#263136');draw=ImageDraw.Draw(sheet)
for i in range(8):
 actor=Image.open(f/f'{i:02}.png').convert('RGBA');mask=Image.new('L',(640,640));ImageDraw.Draw(mask).polygon([tuple(q)for q in foreground],fill=255)
 front=actor.copy();front.putalpha(ImageChops.multiply(front.getchannel('A'),mask));layer=actor.copy();layer.alpha_composite(prop);layer.alpha_composite(front);layer.save(p/f'layer-{i}.png')
 x,y=i%4*640,i//4*680;sheet.paste(layer,(x,y),layer);draw.text((x+20,y+646),f'{i}: candidate native source layers; no approval',fill='white')
sheet.save(p/'layered-native48.jpg',quality=98)
print('Unselected source-pixel candidate prepared')
