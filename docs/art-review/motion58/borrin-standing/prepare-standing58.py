"""Private literal body/held-ledger separation; no source redraw or approval."""
import hashlib, importlib.util, json, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import numpy as np
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
w=root/'work/expanded-cycles/motion58/borrin-standing';folder=w/'actor-candidate';folder.mkdir(parents=True,exist_ok=True)
original=root/'public/sprites/Borrin/motion/explain-closed-ledger/reference'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
# Native visible body contour only. The inner-leg notch excludes the source desk.
body=[[140,60],[445,60],[445,180],[399,210],[385,300],[384,329],
 [393,369],[395,394],[393,430],[398,470],[391,491],[393,520],[390,544],
 [405,554],[420,559],[434,569],[439,593],[435,610],[409,616],[361,610],
 [327,603],[316,599],[310,579],[310,549],[310,525],[305,495],[295,484],
 [283,498],[279,522],[276,546],[272,562],[267,584],[264,615],[236,620],
 [189,619],[188,599],[194,571],[197,546],[200,525],[197,504],[198,491],
 [207,460],[211,427],[218,414],[212,403],[211,395],[213,385],[214,376],
 [216,366],[220,350],[217,339],[205,335],
 [193,330],[176,315],[165,298],[158,270],[167,245],[177,221],[192,200],
 [220,187],[241,166]]
arms=[
 [[378,187],[446,180],[444,280],[438,298],[432,310],[431,334],[427,354],[429,368],[425,384],[417,394],[404,402],[393,402],[386,387],[383,375],[388,357],[387,335],[388,310],[385,297]],
 [[373,173],[455,170],[516,170],[522,235],[479,260],[456,286],[435,310],[412,321],[380,305]],
 [[373,173],[457,176],[567,168],[576,232],[511,257],[469,278],[418,304],[381,306]],
 [[373,173],[445,159],[487,155],[491,226],[471,260],[457,288],[435,312],[412,320],[380,305]],
 [[373,160],[435,160],[488,140],[567,146],[578,191],[529,215],[485,229],[451,251],[414,278],[381,285]],
 [[369,163],[444,170],[454,210],[461,250],[461,283],[452,301],[433,312],[410,321],[378,306]],
 [[373,168],[442,181],[481,203],[490,252],[470,281],[452,309],[426,322],[391,308]],
 [[378,183],[445,183],[442,285],[438,299],[431,311],[430,334],[427,354],[429,366],[425,382],[416,394],[404,399],[392,397],[386,386],[383,377],[388,358],[388,334],[388,310],[383,296]],
]
void=[[296,450],[302,459],[307,470],[308,480],[304,490],[284,490],[281,478],[286,467],[291,456]]
sheet=Image.new('RGBA',(2560,1280));sources=[];polygons=[];excluded=[]
for i in range(8):
 image=Image.open(original/f'{i:02}.png').convert('RGBA')
 mask=Image.new('L',image.size);pen=ImageDraw.Draw(mask)
 for poly in [body,arms[i]]:pen.polygon([tuple(p)for p in poly],fill=255)
 pen.polygon([tuple(p)for p in void],fill=0)
 actor=image.copy();actor.putalpha(ImageChops.multiply(image.getchannel('A'),mask))
 # Whole native source figures, no alpha-composite color change or local warps.
 sheet.paste(actor,(i%4*640,i//4*640));sources.append({'file':str((original/f'{i:02}.png').relative_to(root)),'sha256':sha(original/f'{i:02}.png')});polygons.append([body,arms[i]]);excluded.append([void])
sheet.save(folder/'source-sheet.png')
write(folder/'generation.json',{'method':'source-pixel-foreground-stencils','prompt':'Literal standing Borrin body, spectacles, cravat, keys, closed ledger and free gesture hand from original eight poses. Remove original painted furniture ownership; no local pixels transformed, redraw, reconstruction, duplicate or synthetic pose. Private unapproved trial.',
 'originalFrames':sources,'actorPolygons':polygons,'excludedPolygons':excluded,'candidate':True})
source=Image.open(original/'00.png').convert('RGBA');crown=[300,81];sole=[220,614]
for p in [crown,sole]:assert source.getpixel(tuple(p))[3]>=128
body_basis=sole[1]-crown[1]+1;assert body_basis==534
write(w/'source-body-basis58.json',{'source':str((original/'00.png').relative_to(root)),'sha256':sha(original/'00.png'),
 'crown':{'point':crown,'RGBA':list(source.getpixel(tuple(crown)))},'visibleBootRim':{'point':sole,'RGBA':list(source.getpixel(tuple(sole)))},
 'commonBodyBasisPx':body_basis,'root':[320,616],
 'scope':'One observed visible standing crown-to-near-boot-rim basis. Shared source canvas ground datum; no hidden sole/world force or gait correspondence inferred.'})
settings={'version':1,'sourceSha256':sha(folder/'source-sheet.png'),'targetBodyHeight':body_basis,'targetAnchor':[320,616],
 'landmarks':[{'root':[i%4*640+320,i//4*640+616],'bodyHeight':body_basis}for i in range(8)],
 'sourceCells':[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640]for i in range(8)],
 'durationsMs':[125]*8,'playbackMode':'once-hold','review':'Private literal standing source body/common534/[320,616] registration. Visible boot/material/prop and finite task lifecycle approval pending.'}
write(folder/'motion-polish.json',settings)
entry=next(e for e in json.loads((root/'docs/expanded-animation-plan.json').read_text())['entries']if e['character']=='Borrin'and e['action']=='explain-closed-ledger')
entry={**entry,'destination':str(folder.relative_to(root)),'direction':'actor','station':'ledger-desk'};write(w/'entry-candidate58.json',entry)
spec=importlib.util.spec_from_file_location('export',root/'scripts/export-character-motion.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);module.export(entry)
review=Image.new('RGB',(2560,1360),'#303d40');d=ImageDraw.Draw(review)
for i in range(8):
 im=Image.open(folder/f'{i:02}.png').convert('RGBA');x=i%4*640;y=i//4*680;review.paste(im,(x,y),im);d.text((x+15,y+646),f'{i}: PRIVATE body/closed-ledger gesture; original source only, unapproved',fill='white')
review.save(w/'isolated-native58.jpg',quality=98)
write(w/'layer-config58.json',{'actorBodyHeight':body_basis,'actorAnchor':[320,616], 'station':'ledger-desk','stationBodyHeight':650,'stationAnchor':[320,616],
 'foregroundPolygons':polygons,'approved':False,
 'scope':'Standing consultant in front of the unchanged independent administrative desk. Actor owns one closed book; desk owns its existing open book/paper/ink/stacks. Full original body contour supplies foreground, no duplicate furniture.'})
print('Private eight literal standing figures extracted;534/[320,616], no source redraw or approvals.')
