"""Export authored eight-frame sheets with shared sequence scale and calibrated directional body height.
Requires Pillow, NumPy and SciPy. Run from repository root. Missing sources stay pending.
"""
import argparse
import os
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd
from motion_registration import VERSION, polish_settings, settings_hash, playback_settings, register

ROOT = Path('public/sprites')
PLAN = Path('docs/expanded-animation-plan.json')
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)


def export(entry):
    folder = Path(entry['destination'])
    source = folder / 'source-sheet.png'
    if not source.exists() or not (folder/'generation.json').exists():
        return None
    im = Image.open(source).convert('RGBA')
    pixels = np.array(im)
    if pixels[:, :, 3].min() != 0:
        raise ValueError(f'{source}: no transparency')
    # Component ownership isolates irregularly spaced rows without severing limbs.
    solid = pixels[:, :, 3] > 128
    labels, _ = nd.label(solid)
    sizes = np.bincount(labels.ravel())
    main = np.argsort(sizes[1:])[-8:]+1
    if len(main) != 8 or min(sizes[main]) < 1000:
        raise ValueError(f'{source}: eight principal figures required')
    _, nearest = nd.distance_transform_edt(~np.isin(labels, main), return_indices=True)
    owner = labels[tuple(nearest)]
    centers = [(int(k), *reversed(nd.center_of_mass(solid, labels, int(k)))) for k in main]
    centers.sort(key=lambda c: c[2])
    ordered = sorted(centers[:4], key=lambda c:c[1])+sorted(centers[4:], key=lambda c:c[1])
    generation=json.loads((folder/'generation.json').read_text())
    frame_order=generation.get('frameOrder',list(range(8)))
    if sorted(frame_order)!=list(range(8)):
        raise ValueError(f'{source}: frameOrder must use each of the eight source poses once')
    ordered=[ordered[i] for i in frame_order]
    crops = []
    # Register ground plus lower-body/station center, never moving hands or raised tools.
    for k, _, _ in ordered:
        mask = solid & (owner == k)
        yy, xx = np.where(mask)
        box = (int(xx.min()), int(yy.min()), int(xx.max()+1), int(yy.max()+1))
        x0,y0,x1,y1=box
        crop = pixels[y0:y1,x0:x1].copy()
        crop[:,:,3][owner[y0:y1,x0:x1] != k] = 0
        crop[:,:,:3][crop[:,:,3] == 0] = 0
        lower = mask[y0+int((y1-y0)*.7):y1,x0:x1]
        lower_x = np.where(lower)[1]
        anchor_x = float((lower_x.min()+lower_x.max()+1)/2)
        crops.append((Image.fromarray(crop),box,anchor_x))
    settings=polish_settings(folder)
    if settings.get('sourceSha256') and settings['sourceSha256']!=hashlib.sha256(source.read_bytes()).hexdigest():
        raise ValueError(f'{source}: source changed; recalibrate motion-polish.json')
    if settings.get('assemblySha256') and settings['assemblySha256']!=hashlib.sha256((folder/'assembly.json').read_bytes()).hexdigest():
        raise ValueError(f'{folder}: selections changed; rerun assemble-reviewed-motion.py')
    playback=playback_settings(entry,settings)
    scale,anchors,placements,registration=register(crops,entry,settings,frame_order)
    outputs=[]; frames=[]
    review=Image.new('RGB',(2560,1400),(48,55,54)); draw=ImageDraw.Draw(review)
    for i,(crop,box,ax) in enumerate(crops):
        crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.LANCZOS)
        output=Image.new('RGBA',(640,640))
        position=tuple(placements[i])
        output.alpha_composite(crop,position)
        filename=f'{i:02d}.png'; output.save(folder/filename)
        outputs.append(output)
        frames.append({'id':f'key-{i:02d}','file':filename,'description':entry['beats'][i],
                       'durationMs':playback['durationsMs'][i],'sourceBounds':list(box),'sourceAnchor':anchors[i],
                       'groundAnchor':registration['targetAnchor'],'placement':list(position)})
        x,y=(i%4)*640,(i//4)*700
        review.paste(output,(x,y),output)
        words=entry['beats'][i].split(); lines=['']
        for word in words:
            if len(lines[-1])+len(word)>64:lines.append('')
            lines[-1]+=word+' '
        draw.text((x+16,y+645),f'{i+1}. '+lines[0],font=FONT,fill='white')
        if len(lines)>1:draw.text((x+16,y+665),lines[1],font=FONT,fill='white')
    review.save(folder/'review.jpg',quality=90)
    # APNG keeps alpha and the same exact eight authored images; no synthetic motion.
    outputs[0].save(folder/'preview.png',save_all=True,append_images=outputs[1:],duration=playback['durationsMs'],loop=1 if playback['mode']=='once-hold' else 0,disposal=0,blend=0)
    atlas=Image.new('RGBA',(5120,640))
    for i,output in enumerate(outputs):atlas.alpha_composite(output,(i*640,0))
    atlas.save(folder/'atlas.png')
    manifest={'version':2,'character':entry['character'],'action':entry['action'],'title':entry['title'],'direction':entry['direction'],'kind':entry['kind'],
              'reference':os.path.relpath(entry['reference'],folder),'source':'source-sheet.png',
              'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceSize':list(im.size),
              'frameSize':[640,640],'sharedScale':scale,'frameCount':8,'frames':frames,'sourceFrameOrder':frame_order,
              'atlas':{'file':'atlas.png','columns':8,'rows':1},'preview':'preview.png',
              'status':'authored-keyframe-variations','productionReady':False,
              'playback':playback,'registration':registration,
              'note':'Eight authored frames for this action. Repeat is a review aid, not certification of a seamless production loop. Station/body redraw drift and contact timing need production polish.'}
    (folder/'prompt.txt').write_text(json.loads((folder/'generation.json').read_text())['prompt']+'\n')
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    return {'id':entry['action'],'title':entry['title'],'direction':entry['direction'],'kind':entry['kind'],'manifest':entry['action']+'/manifest.json','frameCount':8}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--character');parser.add_argument('--action');parser.add_argument('--direction');parser.add_argument('--force',action='store_true');args=parser.parse_args()
    plan=json.loads(PLAN.read_text());by_character={};count=0
    for entry in plan['entries']:
        folder=Path(entry['destination']); manifest=folder/'manifest.json'
        source=folder/'source-sheet.png'
        stale=manifest.exists() and (not (folder/'prompt.txt').exists() or (source.exists() and json.loads(manifest.read_text()).get('sourceSha256')!=hashlib.sha256(source.read_bytes()).hexdigest()))
        if manifest.exists() and (folder/'generation.json').exists():
            stale=stale or json.loads(manifest.read_text()).get('sourceFrameOrder',list(range(8)))!=json.loads((folder/'generation.json').read_text()).get('frameOrder',list(range(8)))
        if manifest.exists():
            registration=json.loads(manifest.read_text()).get('registration',{})
            stale=stale or registration.get('exportVersion')!=VERSION or registration.get('settingsSha256')!=settings_hash(polish_settings(folder))
        selected=(not args.character or args.character==entry['character']) and (not args.action or args.action==entry['action']) and (not args.direction or args.direction==entry['direction'])
        if selected and (args.force or stale or not manifest.exists()):
            result=export(entry)
            if result:entry['status']='exported';count+=1
        if manifest.exists():
            m=json.loads(manifest.read_text());entry['status']='exported'
            by_character.setdefault(entry['character'],[]).append({'id':entry['action']+'-'+entry['direction'],'title':entry['title']+' · '+entry['direction'],'manifest':entry['action']+'/'+entry['direction']+'/manifest.json','frameCount':m['frameCount'],'direction':entry['direction'],'kind':entry['kind']})
    library=[]
    for name,actions in by_character.items():
        folder=ROOT/name/'motion'
        (folder/'manifest.json').write_text(json.dumps({'character':name,'actions':actions},indent=2)+'\n')
        library.append({'name':name,'manifest':f'{name}/motion/manifest.json','actionCount':len(actions),'frameCount':sum(a['frameCount'] for a in actions)})
        p=ROOT/name/'profile.json';profile=json.loads(p.read_text());profile['expandedMotion']={'manifest':'motion/manifest.json','availableCycles':len(actions),'plannedCycles':sum(e['character']==name for e in plan['entries']),'frameCount':sum(a['frameCount'] for a in actions),'productionReady':False};p.write_text(json.dumps(profile,indent=2)+'\n')
        # Expose the initial authored pose of each new task in the static reference gallery.
        # Reference existing frame files rather than storing duplicate images.
        reference_path=ROOT/name/'work-references/manifest.json'
        references=json.loads(reference_path.read_text())
        extra=[r for r in references.get('supplementalReferences',[]) if r.get('origin')!='expanded-motion']
        for entry in plan['entries']:
            frame=Path(entry['destination'])/'00.png'
            if entry['character']==name and entry['kind']=='new-work' and frame.exists():
                extra.append({'id':entry['action'],'title':entry['title'],'description':'Initial authored pose for '+entry['title']+'. Animation candidate requires visual review.',
                              'file':os.path.relpath(frame,reference_path.parent),'staticReference':True,'origin':'expanded-motion','productionReady':False})
        if extra:
            references['supplementalReferences']=extra
            reference_path.write_text(json.dumps(references,indent=2)+'\n')
            profile.setdefault('workReferences',{})['supplementalCount']=len(extra)
            p.write_text(json.dumps(profile,indent=2)+'\n')
    (ROOT/'motion-library.json').write_text(json.dumps(library,indent=2)+'\n');PLAN.write_text(json.dumps(plan,indent=2)+'\n')
    print(f'Exported {count} cycles; {sum(len(a) for a in by_character.values())}/{len(plan["entries"])} available')

if __name__=='__main__':main()
