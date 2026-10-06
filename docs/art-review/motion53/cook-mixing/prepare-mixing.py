"""Private literal source-pixel actor and uniformly registered independent table."""
import hashlib
import importlib.util
import json
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

root = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(root / 'scripts'))
from workstation_export import normalized

work = Path(__file__).parent
actor = work / 'actor-candidate'
prop = work / 'mixing-block-candidate'
actor.mkdir(exist_ok=True)
prop.mkdir(exist_ok=True)
original = root / 'public/sprites/Cook/motion/mix-ingredients/reference'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
save = lambda p, j: p.write_text(json.dumps(j, indent=2) + '\n')

# Trace visible material only. The original far leg is hidden by the table;
# it is neither selected nor reconstructed. Bowl and spoon belong to Cook.
upper = [[108,18],[450,18],[452,239],[439,252],[425,269],[422,288],
         [409,299],[404,310],[393,318],[374,323],[331,325],[289,325],
         [253,323],[224,320],[202,317],[192,308],[192,286],[193,277],
         [190,261],[183,254],[167,249],[167,228],[142,222],[120,205],[110,182]]
bowl = [[259,244],[294,241],[340,241],[373,245],[394,252],[407,266],
        [413,280],[408,303],[401,322],[389,336],[373,344],[350,348],
        [310,350],[277,345],[258,337],[245,325],[238,310],[234,293],
        [234,271],[240,257]]
boot = [[293,468],[316,465],[339,464],[360,463],[363,478],[371,487],
        [385,492],[398,506],[405,521],[405,534],[396,541],[383,548],
        [367,549],[347,544],[326,537],[307,526],[297,518],[292,507]]
leg = [[292,459],[310,456],[330,453],[352,449],[371,446],[372,464],
       [363,478],[349,489],[321,493],[296,482],[292,469]]
selected = [upper, bowl, leg, boot]
sheet = Image.new('RGBA', (2560,1280))
frames = []
for i in range(8):
    source = original / f'{i:02}.png'
    im = Image.open(source).convert('RGBA')
    mask = Image.new('L', im.size)
    pen = ImageDraw.Draw(mask)
    for poly in selected:
        pen.polygon([tuple(p) for p in poly], fill=255)
    cut = im.copy()
    cut.putalpha(ImageChops.multiply(im.getchannel('A'), mask))
    sheet.alpha_composite(cut, (i%4*640,i//4*640))
    frames.append({'file':str(source.relative_to(root)), 'sha256':sha(source)})
sheet.save(actor / 'source-sheet.png')
save(actor / 'generation.json', {
    'method':'source-pixel-foreground-stencils',
    'prompt':'Select original Cook body, visible near boot, hands, spoon and held mixing bowl at their original coordinates. No hidden far leg, local anatomy edits, new pixels, interpolation or mirror.',
    'originalFrames':frames, 'actorPolygons':[selected for _ in range(8)],
    'candidate':True,
})
save(actor / 'motion-polish.json', {
    'version':1, 'sourceSha256':sha(actor / 'source-sheet.png'),
    'targetBodyHeight':521, 'targetAnchor':[320,616],
    'offsetsPx':[[0,0] for _ in range(8)],
    'landmarks':[{'root':[i%4*640+320,i//4*640+616], 'bodyHeight':521} for i in range(8)],
    'sourceCells':[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640] for i in range(8)],
    'durationsMs':[125 for _ in range(8)],
    'review':'One shared pose0 visible crown25-to-near-boot-rim545 inclusive521px body basis. Original coordinates retained. Native contact, independent table fit, foreground and actual gameplay remain pending. Far sole is unobserved.',
})
entry = next(e for e in json.loads((root / 'docs/expanded-animation-plan.json').read_text())['entries']
             if e['character']=='Cook' and e['action']=='mix-ingredients')
entry.update(destination=str(actor.relative_to(root)), direction='actor', station='mixing-block')
save(work / 'entry-candidate53.json', entry)
spec = importlib.util.spec_from_file_location('export', root / 'scripts/export-character-motion.py')
ex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ex)
ex.export(entry)

raw = Path('/mnt/c/Users/Tariq/.codex/generated_images/01a07177-1a07-7d81-99be-76028c15c836/exec-1398a213-ecfd-4513-ab62-4e322198eacb.png')
shutil.copy2(raw, prop / 'source.png')
source = Image.open(prop / 'source.png').convert('RGBA')
placement = {'crop':'alpha >=128 bounds', 'width':472, 'x':86, 'y':251,
             'canvas':[640,640], 'alphaThreshold':128}
station = normalized(source, placement)
station.save(prop / 'sprite.png')
save(prop / 'generation.json', {
    'sourceSha256':sha(prop / 'source.png'), 'spriteSha256':sha(prop / 'sprite.png'),
    'reference':str((original / '00.png').relative_to(root)),
    'referenceSha256':sha(original / '00.png'),
    'request':'request53.json',
    'placement':placement, 'targetBodyHeight':521, 'targetAnchor':[320,616],
    'candidate':True, 'productionReady':False,
    'placementReview':'One uniform alpha-solid-bounds normalization. Actor/prop root retained; native surface, boot occlusion and gameplay are not yet approved.',
})
# Only original bowl/hand material reappears in front of the fixed table.
foreground = [[[ [x,y] for x,y in bowl ]] for _ in range(8)]
save(work / 'layer-config53.json', {
    'actorBodyHeight':521, 'actorAnchor':[320,616],
    'stationBodyHeight':521, 'stationAnchor':[320,616],
    'station':'mixing-block', 'foregroundPolygons':foreground, 'approved':False,
})
review = Image.new('RGB', (2560,1360), '#30383c')
draw = ImageDraw.Draw(review)
for i in range(8):
    im = Image.open(actor / f'{i:02}.png').convert('RGBA')
    mask = Image.new('L', (640,640))
    ImageDraw.Draw(mask).polygon([tuple(p) for p in bowl], fill=255)
    front = im.copy()
    front.putalpha(ImageChops.multiply(front.getchannel('A'),mask))
    layer = im.copy()
    layer.alpha_composite(station)
    layer.alpha_composite(front)
    layer.save(work / f'layer-{i}.png')
    x,y = i%4*640,i//4*680
    review.paste(layer,(x,y),layer)
    draw.text((x+20,y+646),f'{i}: candidate only; independent physical table',fill='white')
review.save(work / 'mixing-layered-native53.jpg',quality=99)
print('Private literal Cook source stencils and uniformly normalized mixing block exported; no approval or gameplay mapping.')
