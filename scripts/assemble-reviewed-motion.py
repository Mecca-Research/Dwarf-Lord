"""Assemble selected authored poses into an eight-frame source sheet.
No pose synthesis or limb edits. Inputs and selections live in assembly.json.
Requires Pillow, NumPy, SciPy. Run with a motion sequence directory argument.
"""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd


def extract(path, count):
    pixels=np.array(Image.open(path).convert('RGBA'));solid=pixels[:,:,3]>128
    labels,_=nd.label(solid);sizes=np.bincount(labels.ravel());main=np.argsort(sizes[1:])[-count:]+1
    if len(main)!=count or min(sizes[main])<1000:raise ValueError('Missing full-body input pose')
    _,nearest=nd.distance_transform_edt(~np.isin(labels,main),return_indices=True);owner=labels[tuple(nearest)]
    centers=[(int(k),*reversed(nd.center_of_mass(solid,labels,int(k)))) for k in main];centers.sort(key=lambda c:c[2])
    ordered=sorted(centers[:4],key=lambda c:c[1])+sorted(centers[4:],key=lambda c:c[1]) if count==8 else centers
    result=[]
    for k,_,_ in ordered:
        yy,xx=np.where(solid&(owner==k));x0,y0,x1,y1=int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)
        crop=pixels[y0:y1,x0:x1].copy();crop[:,:,3][owner[y0:y1,x0:x1]!=k]=0;crop[:,:,:3][crop[:,:,3]==0]=0
        head_x=np.where(crop[:max(1,int((y1-y0)*.2)),:,3]>128)[1]
        result.append((Image.fromarray(crop),(x0,y0,x1,y1),float(np.median(head_x))))
    height=float(np.median([c.height for c,_,_ in result]))
    floors=[float(np.median([b[3] for _,b,_ in result[i:i+4]])) for i in range(0,count,4)]
    return result,height,floors


def main():
    parser=argparse.ArgumentParser();parser.add_argument('folder',type=Path);args=parser.parse_args();folder=args.folder
    assembly=json.loads((folder/'assembly.json').read_text());inputs={}
    for source in assembly['inputs']:
        if source['poseCount'] not in (1,8):raise ValueError('Inputs must contain one or eight poses')
        path=folder/source['file']
        if hashlib.sha256(path.read_bytes()).hexdigest()!=source['sha256']:raise ValueError('Assembly input changed')
        inputs[source['id']]=extract(path,source['poseCount'])
    if len(assembly['poses'])!=8 or len({(p['input'],p['pose']) for p in assembly['poses']})!=8:raise ValueError('Exactly eight distinct authored poses required')
    sheet=Image.new('RGBA',(2560,1280));marks=[]
    for i,selection in enumerate(assembly['poses']):
        poses,height,floors=inputs[selection['input']];source_index=selection['pose']
        if not isinstance(source_index,int) or not 0<=source_index<len(poses):raise ValueError('Invalid source pose index')
        crop,box,head=poses[source_index]
        source_config=next(s for s in assembly['inputs'] if s['id']==selection['input'])
        # Raised tools must not become the actor's horizontal registration point.
        if 'rootXs' in source_config:
            if len(source_config['rootXs'])!=source_config['poseCount']:raise ValueError('One root x required per source pose')
            head=source_config['rootXs'][source_index]-box[0]
        scale=assembly.get('normalizedHeight',500)/height;crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.LANCZOS)
        x=i%4*640+320-round(head*scale);ground=floors[source_index//4]
        y=i//4*640+600-round((ground-box[1])*scale)
        if x<i%4*640 or x+crop.width>(i%4+1)*640 or y<i//4*640 or y+crop.height>(i//4+1)*640:raise ValueError('Authored pose exceeds its source cell')
        sheet.alpha_composite(crop,(x,y));marks.append({'root':[i%4*640+320,i//4*640+600],'bodyHeight':500})
    sheet.save(folder/'source-sheet.png')
    settings={'version':1,'assemblySha256':hashlib.sha256((folder/'assembly.json').read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256((folder/'source-sheet.png').read_bytes()).hexdigest(),'targetBodyHeight':assembly.get('targetBodyHeight',520),'targetAnchor':assembly.get('targetAnchor',[320,616]),'landmarks':marks,'landmarksVerified':False,'durationsMs':assembly.get('durationsMs',[140,140,105,115]*2),'note':'Selected authored full-body poses assembled without limb editing or synthetic in-betweens. Source cell roots preserve the original row floor and calibrated body size.'}
    (folder/'motion-polish.json').write_text(json.dumps(settings,indent=2)+'\n')

if __name__=='__main__':main()
