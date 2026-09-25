"""Measure silhouette contact landmarks in manually reviewed regions.
This diagnoses slipping; it neither edits art nor grants animation approval.
"""
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw


def tip(image, region):
    x0,y0,x1,y1=region
    alpha=np.asarray(image)[:,:,3]
    ys,xs=np.where(alpha[y0:y1,x0:x1]>128)
    if not len(xs): raise ValueError('Contact region contains no opaque landmark')
    bottom=int(ys.max())+y0
    xs=np.where(alpha[max(y0,bottom-2):bottom+1,x0:x1]>128)[1]+x0
    return [round(float(np.median(xs)),2),bottom]


def measure(config):
    folder=Path(config['folder']); manifest=json.loads((folder/'manifest.json').read_text())
    digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    if digest(folder/'source-sheet.png')!=config['sourceSha256']:raise ValueError('Contact regions need review after source changes')
    samples=[]; board=Image.new('RGB',(1280,720),(45,50,50));draw=ImageDraw.Draw(board)
    duration=sum(f['durationMs'] for f in manifest['frames']);time=0
    body_height=manifest['registration']['targetBodyHeight']
    total_travel=body_height*config['strideBodyRatio']*math.sin(config['cameraElevationRadians'])
    for i,frame in enumerate(manifest['frames']):
        path=folder/frame['file'];im=Image.open(path).convert('RGBA')
        contacts={name:tip(im,region) for name,region in config['regions'].items()}
        samples.append({'frame':i,'frameSha256':digest(path),'timeMs':time,'contacts':contacts,
                        'projectedRootY':round(-time/duration*total_travel,3)})
        tile=im.resize((320,320));x=i%4*320;y=i//4*360;board.paste(tile,(x,y),tile)
        for name,point in contacts.items():
            px=x+point[0]/2;py=y+point[1]/2
            draw.ellipse((px-3,py-3,px+3,py+3),fill='cyan' if name=='cane' else 'yellow')
        draw.text((x+4,y+326),f'{i}: cane {contacts["cane"]}',fill='white');time+=frame['durationMs']
    # Assume cane planted during the left-support first half, as a diagnostic only.
    first=samples[0];drifts=[]
    for sample in samples[:4]:
        local=np.subtract(sample['contacts']['cane'],first['contacts']['cane'])
        world=local+np.array([0,sample['projectedRootY']])
        drifts.append(round(float(np.linalg.norm(world)),3))
    foot_drift={}
    for name,start,end in [('leftBoot',0,4),('rightBoot',4,8)]:
        base=samples[start]
        foot_drift[name]=[
            round(float(np.linalg.norm(np.subtract(sample['contacts'][name],base['contacts'][name])+
                [0,sample['projectedRootY']-base['projectedRootY']])),3)
            for sample in samples[start:end]
        ]
    return {'version':1,'config':config,'manifestSha256':digest(folder/'manifest.json'),
            'samples':samples,'firstHalfCaneDriftPx':drifts,'maxFirstHalfCaneDriftPx':max(drifts),
            'hypotheticalSupportFootDriftPx':foot_drift,'units':'640-pixel atlas projection; boot silhouette proxies, not tracked material points',
            'approval':False,'conclusion':'Cane needs authored plant/lift/travel correction. No measured stride is adopted from this invalid contact sequence.'},board


if __name__=='__main__':
    config=json.loads(Path('docs/elder-back-contact-regions.json').read_text())
    result,board=measure(config)
    Path('docs/elder-back-contact-measurement.json').write_text(json.dumps(result,indent=2)+'\n')
    output=Path('work/expanded-cycles/elder-contact-measurement.png');output.parent.mkdir(parents=True,exist_ok=True);board.save(output)
    print(json.dumps({'maxFirstHalfCaneDriftPx':result['maxFirstHalfCaneDriftPx'],'overlay':str(output),'approval':False}))
