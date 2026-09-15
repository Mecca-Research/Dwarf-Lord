"""Export authored four-keyframe sheets with one shared scale per action.
Requires Pillow, NumPy and SciPy. Run from repository root. Missing sources stay pending.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd

ROOT = Path('public/sprites')
PLAN = Path('docs/work-animation-plan.json')
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)


def export(entry):
    folder = Path(entry['destination'])
    source = folder / 'source-sheet.png'
    if not source.exists():
        return None
    im = Image.open(source).convert('RGBA')
    pixels = np.array(im)
    if pixels[:, :, 3].min() != 0:
        raise ValueError(f'{source}: no transparency')
    # Component ownership isolates irregularly spaced rows without severing limbs.
    solid = pixels[:, :, 3] > 128
    labels, _ = nd.label(solid)
    sizes = np.bincount(labels.ravel())
    main = np.argsort(sizes[1:])[-4:]+1
    if len(main) != 4 or min(sizes[main]) < 1000:
        raise ValueError(f'{source}: four principal figures required')
    _, nearest = nd.distance_transform_edt(~np.isin(labels, main), return_indices=True)
    owner = labels[tuple(nearest)]
    centers = [(int(k), *reversed(nd.center_of_mass(solid, labels, int(k)))) for k in main]
    centers.sort(key=lambda c: c[2])
    ordered = sorted(centers[:2], key=lambda c:c[1])+sorted(centers[2:], key=lambda c:c[1])
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
    left=max(a for _,_,a in crops)
    right=max(c.width-a for c,_,a in crops)
    height=max(c.height for c,_,_ in crops)
    scale=min(296/max(left,right),592/height)
    outputs=[]; frames=[]
    review=Image.new('RGB',(1280,1400),(48,55,54)); draw=ImageDraw.Draw(review)
    for i,(crop,box,ax) in enumerate(crops):
        crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.LANCZOS)
        output=Image.new('RGBA',(640,640))
        position=(round(320-ax*scale),616-crop.height)
        output.alpha_composite(crop,position)
        filename=f'{i:02d}.png'; output.save(folder/filename)
        outputs.append(output)
        frames.append({'id':f'key-{i:02d}','file':filename,'description':entry['beats'][i],
                       'durationMs':250,'sourceBounds':list(box),'sourceAnchor':[ax,box[3]-box[1]],
                       'groundAnchor':[320,616],'placement':list(position)})
        x,y=(i%2)*640,(i//2)*700
        review.paste(output,(x,y),output)
        words=entry['beats'][i].split(); lines=['']
        for word in words:
            if len(lines[-1])+len(word)>64:lines.append('')
            lines[-1]+=word+' '
        draw.text((x+16,y+645),f'{i+1}. '+lines[0],font=FONT,fill='white')
        if len(lines)>1:draw.text((x+16,y+665),lines[1],font=FONT,fill='white')
    review.save(folder/'review.jpg',quality=90)
    # APNG keeps alpha and the same exact four authored images; no synthetic motion.
    outputs[0].save(folder/'preview.png',save_all=True,append_images=outputs[1:],duration=250,loop=0,disposal=0,blend=0)
    atlas=Image.new('RGBA',(2560,640))
    for i,output in enumerate(outputs):atlas.alpha_composite(output,(i*640,0))
    atlas.save(folder/'atlas.png')
    manifest={'version':1,'character':entry['character'],'action':entry['action'],'title':entry['title'],
              'reference':'../../work-references/'+Path(entry['reference']).name,'source':'source-sheet.png',
              'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceSize':list(im.size),
              'frameSize':[640,640],'sharedScale':scale,'frameCount':4,'frames':frames,
              'atlas':{'file':'atlas.png','columns':4,'rows':1},'preview':'preview.png',
              'status':'authored-keyframe-variations','productionReady':False,
              'playback':{'mode':'repeat-preview','order':[0,1,2,3],'fps':4},
              'note':'Four authored keyframes for this action. Repeat is a review aid, not certification of a seamless production loop. Station/body redraw drift and contact timing need production polish.'}
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (folder/'prompt.txt').write_text(entry['prompt']+'\n')
    return {'id':entry['action'],'title':entry['title'],'manifest':entry['action']+'/manifest.json','frameCount':4}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--character');args=parser.parse_args()
    plan=json.loads(PLAN.read_text());by_character={};count=0
    for entry in plan['entries']:
        if not args.character or args.character==entry['character']:
            result=export(entry)
            if result:entry['status']='exported';count+=1
        manifest=Path(entry['destination'])/'manifest.json'
        by_character.setdefault(entry['character'],[])
        if manifest.exists():by_character[entry['character']].append({'id':entry['action'],'title':entry['title'],'manifest':entry['action']+'/manifest.json','frameCount':4})
    library=[]
    for name,actions in by_character.items():
        if not actions:continue
        folder=ROOT/name/'work-animations'
        (folder/'manifest.json').write_text(json.dumps({'character':name,'expectedActions':6,'actions':actions},indent=2)+'\n')
        library.append({'name':name,'manifest':f'{name}/work-animations/manifest.json','actionCount':len(actions),'frameCount':len(actions)*4})
        profile_path=ROOT/name/'profile.json'
        profile=json.loads(profile_path.read_text())
        profile['workAnimations']={'manifest':'work-animations/manifest.json','actionCount':len(actions),'frameCount':len(actions)*4,'status':'authored-keyframe-variations','productionReady':False}
        profile['workReferences']['animationVariationsComplete']=len(actions)==6
        profile['workReferences']['nextPass']='Polish keyframe transitions, workstation registration, contact timing and directional coverage before gameplay integration.'
        profile_path.write_text(json.dumps(profile,indent=2)+'\n')
    (ROOT/'work-animation-library.json').write_text(json.dumps(library,indent=2)+'\n')
    PLAN.write_text(json.dumps(plan,indent=2)+'\n')
    print(f'Exported {count} actions; library has {sum(len(a) for a in by_character.values())}/84 actions')

if __name__=='__main__':main()
