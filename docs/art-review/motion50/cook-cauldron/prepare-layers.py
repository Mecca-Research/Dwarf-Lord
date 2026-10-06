"""Source-pixel actor stencils and one uniform independent prop placement."""
import hashlib
import importlib.util
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

root = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(root / 'scripts'))
work = Path(__file__).resolve().parent
original = root / 'public/sprites/Cook/motion/stir-cauldron/reference'
folder = work / 'actor-candidate'
folder.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
save = lambda p, j: p.write_text(json.dumps(j, indent=2) + '\n')

# These polygons select original opaque material only. They do not move pixels,
# change limb geometry or invent anatomy hidden by the cauldron.
upper = [[132,20],[501,20],[501,290],[482,303],[438,307],
         [418,309],[409,300],[400,302],[266,305],[247,317],
         [192,296],[169,259],[132,226]]
left = [[155,275],[246,293],[246,308],[238,326],[234,345],
        [219,347],[212,357],[214,391],[228,407],[240,439],
        [254,461],[238,476],[237,526],[233,551],[208,568],
        [180,575],[151,569],[136,553],[140,526],[156,493],
        [156,460],[148,453],[158,431],[153,397],[161,365],
        [167,338],[176,311]]
towel = [[435,285],[477,286],[494,298],[500,309],[509,334],
         [522,369],[525,385],[522,397],[515,408],[500,413],
         [493,398],[488,383],[486,366],[482,346],[478,334],
         [474,327],[469,322],[465,321],[460,324],[453,330],
         [446,332],[439,327],[435,322],[439,311]]
# Lower wooden shaft contours; the submerged spoon bowl is unobserved.
spoons = [
 [[283,290],[293,290],[306,320],[316,339],[318,345],[309,345],[305,337],[297,320]],
 [[337,290],[350,290],[376,320],[387,340],[389,345],[380,345],[374,338],[356,315]],
 [[390,290],[403,290],[430,325],[442,340],[445,345],[436,345],[428,338],[417,326]],
 [[393,290],[405,290],[425,323],[429,339],[431,345],[419,345],[412,338],[403,320]],
 [[393,279],[407,279],[414,308],[422,334],[422,344],[409,344],[406,336],[402,314]],
 [[337,288],[350,288],[374,324],[383,340],[385,345],[373,345],[367,337],[356,316]],
 [[293,287],[307,287],[329,325],[337,340],[339,345],[326,345],[318,337],[307,320]],
 [[285,288],[299,288],[316,321],[323,340],[325,345],[313,345],[307,337],[299,322]],
]
sheet = Image.new('RGBA',(2560,1280))
polygons=[]; original_frames=[]
for i in range(8):
    im=Image.open(original/f'{i:02}.png').convert('RGBA')
    selected=[upper,left,towel,spoons[i]]
    mask=Image.new('L',im.size); pen=ImageDraw.Draw(mask)
    for poly in selected: pen.polygon([tuple(q) for q in poly],fill=255)
    actor=im.copy();actor.putalpha(ImageChops.multiply(im.getchannel('A'),mask))
    sheet.alpha_composite(actor,(i%4*640,i//4*640))
    polygons.append(selected)
    original_frames.append({'file':str((original/f'{i:02}.png').relative_to(root)), 'sha256':sha(original/f'{i:02}.png')})
sheet.save(folder/'source-sheet.png')
save(folder/'generation.json',{'method':'source-pixel-foreground-stencils',
    'prompt':'No new actor render: retain selected original registered Cook body, visible near boot, hands, wooden spoon shaft and held towel. The cauldron and contents are independently owned. No hidden leg, spoon bowl or hand underside is reconstructed.',
    'originalFrames':original_frames,'actorPolygons':polygons,'candidate':True})
save(folder/'motion-polish.json',{'version':1,'sourceSha256':sha(folder/'source-sheet.png'),
    'targetBodyHeight':547,'targetAnchor':[320,616],
    'landmarks':[{'root':[i%4*640+320,i//4*640+616],'bodyHeight':547}for i in range(8)],
    'sourceCells':[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640]for i in range(8)],
    'durationsMs':[125]*8,'review':'Exact original exported coordinates; one shared visible head-to-boot basis. Hidden far leg and traveling sole are unobserved. Contact and actual task proof pending.'})
entry=next(e for e in json.loads((root/'docs/expanded-animation-plan.json').read_text())['entries']if e['character']=='Cook'and e['action']=='stir-cauldron')
entry.update(destination=str(folder.relative_to(root)),direction='actor',station='stew-cauldron')
save(work/'entry-candidate50.json',entry)
spec=importlib.util.spec_from_file_location('export',root/'scripts/export-character-motion.py')
ex=importlib.util.module_from_spec(spec);spec.loader.exec_module(ex);ex.export(entry)

raw=Image.open(work/'station-source50.png').convert('RGBA')
bbox=raw.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
crop=raw.crop(bbox);crop=crop.resize((288,round(crop.height*288/crop.width)),Image.LANCZOS)
prop=Image.new('RGBA',(640,640));prop.alpha_composite(crop,(224,302));prop.save(work/'station-candidate50.png')
foreground=[ [towel,spoons[i]] for i in range(8)]
save(work/'layer-config50.json',{'actorBodyHeight':547,
    'stationPlacement':{'alphaThreshold':128,'width':288,'x':224,'y':302,'canvas':[640,640]},
    'stationSourceSha256':sha(work/'station-source50.png'), 'foregroundPolygons':foreground,'approved':False})
review=Image.new('RGB',(2560,1360),'#263136');draw=ImageDraw.Draw(review)
for i in range(8):
    actor=Image.open(folder/f'{i:02}.png').convert('RGBA')
    mask=Image.new('L',(640,640));pen=ImageDraw.Draw(mask)
    for poly in foreground[i]:pen.polygon([tuple(q)for q in poly],fill=255)
    front=actor.copy();front.putalpha(ImageChops.multiply(front.getchannel('A'),mask))
    layer=actor.copy();layer.alpha_composite(prop);layer.alpha_composite(front);layer.save(work/f'layer-{i}.png')
    x,y=i%4*640,i//4*680;review.paste(layer,(x,y),layer)
    draw.text((x+20,y+646),f'{i}: unapproved native layers',fill='white')
review.save(work/'layered-native50.jpg',quality=99)
print('Private source-only actor and independent cauldron prepared.')
