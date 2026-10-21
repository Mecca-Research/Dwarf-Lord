"""Install inspected native layers; final finite task approval awaits live proof."""
import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[4];p=Path(__file__).resolve().parent
actor=root/'public/sprites/Cook/motion/stir-cauldron/actor'
station=root/'public/sprites/workstations/stew-cauldron'
assert not actor.exists()and not station.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text())
save=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
shutil.copytree(p/'actor-candidate',actor)
entry=load(p/'entry-candidate50.json');entry['destination']=str(actor.relative_to(root))
entry['notes']='Original registered body, spoon shaft and held towel; independent fixed cauldron owns rim/stew/stand. Hidden far boot and submerged spoon bowl unobserved. Finite once-hold cosmetic task.'
path=root/'docs/runtime-motion-additions.json';a=load(path);a['entries'].append(entry);save(path,a)
station.mkdir();shutil.copy2(p/'station-source50.png',station/'source.png');shutil.copy2(p/'station-candidate50.png',station/'sprite.png')
layer=load(p/'layer-config50.json');req=load(p/'station-request50.json')
save(station/'generation.json',{'sourceSha256':sha(station/'source.png'),'spriteSha256':sha(station/'sprite.png'),
    'prompt':req['prompt'],'reference':'../../Cook/motion/stir-cauldron/reference/00.png',
    'referenceSha256':req['referenceSha256'],'placement':layer['stationPlacement'],
    'targetBodyHeight':547,'targetAnchor':[320,616],'productionReady':False,
    'placementReview':'One uniform288px normalization at224/302. Three complete iron feet, two handles and stew remain fixed. Native all8 spoon shaft/towel hand layers inspected; actual gameplay approval pending.'})
path=root/'public/sprites/Cook/motion/render-calibration.json';c=load(path)
c['actions']['stir-cauldron/actor']={'sourceSha256':sha(actor/'source-sheet.png'),'targetBodyHeight':547,'targetAnchor':[320,616],
    'method':'exact-source-pixel-registered-body-and-foreground','foregroundPolygons':layer['foregroundPolygons'],
    'review':'Exact source coordinates; shared visible head/near-boot extent547. Spoon shaft and held towel over independent cauldron. Hidden far sole and submerged spoon bowl are unobserved; live verification pending.'}
save(path,c)
path=root/'public/workstation-library.json';lib=load(path)
lib.append({'character':'Cook','action':'stir-cauldron','actor':'sprites/Cook/motion/stir-cauldron/actor/manifest.json',
    'calibration':'sprites/Cook/motion/render-calibration.json','station':'sprites/workstations/stew-cauldron/generation.json'});save(path,lib)
print('Selected native cauldron layers with approval pending actual game playback.')
