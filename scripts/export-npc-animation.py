from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
from scipy import ndimage as nd
root=Path('public/sprites');library=[]
labels=['front','front-right','right','back-right','back','back-left','left','front-left','rest','stride-a','stride-b','work']
for src in root.glob('*/animation/source-sheet.png'):

 for old in src.parent.glob('[0-9][0-9]-*.png'):old.unlink()
 name=src.parent.parent.name;frame_labels=list(labels)
 if name=='Borrin':frame_labels[8:]=['seated-ledger','consult-ledger','step-ledger','explain']
 if name=='Elder':frame_labels[8:]=['seated-listen','seated-speak','stand-stick','step-stick']
 im=Image.open(src).convert('RGBA');a=np.array(im);mask=a[:,:,3]>128
 components,count=nd.label(mask);sizes=np.bincount(components.ravel());ids=[int(i) for i in np.flatnonzero(sizes>500) if i]
 pieces=[]
 for i in ids:
  ys,xs=np.where(components==i);pieces.append((i,xs.mean(),ys.mean(),(xs.min(),ys.min(),xs.max()+1,ys.max()+1)))
 # Identify the twelve main figures by area, then order visually by row and column.
 pieces=sorted(pieces,key=lambda p:sizes[p[0]],reverse=True)[:12]
 if len(pieces)!=12:raise RuntimeError((name,len(pieces)))
 major=np.isin(components,[p[0] for p in pieces]);_,nearest=nd.distance_transform_edt(~major,return_indices=True);owner=components[tuple(nearest)]
 pieces=sorted(pieces,key=lambda p:p[2]);ordered=[]
 for row in range(3):ordered+=sorted(pieces[row*4:row*4+4],key=lambda p:p[1])
 max_width=max(p[3][2]-p[3][0]+6 for p in ordered);standing=max(p[3][3]-p[3][1]+6 for p in ordered[:8])
 for fixed_idx,fixed_file in ([(7,'source-front-left.png')] if name=='Helga' else [(1,'source-front-right.png')] if name=='Human Laborer' else []):
  fix=np.array(Image.open(src.parent/fixed_file).convert('RGBA'));yy,xx=np.where(fix[:,:,3]>128);box=ordered[fixed_idx][3];max_width=max(max_width,(box[3]-box[1]+6)*(xx.max()-xx.min()+1)/(yy.max()-yy.min()+1))
 common_scale=min(350/max_width,590/standing)
 frames=[];out=Image.new('RGB',(4*256,3*430),(48,55,54));draw=ImageDraw.Draw(out)
 for idx,(cid,cx,cy,box) in enumerate(ordered):
  # Include nearby detached detail within the component bounding box; do not threshold away hair edges.
  x0,y0,x1,y1=map(int,box);pad=3;x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(im.width,x1+pad);y1=min(im.height,y1+pad)
  isolated=a[y0:y1,x0:x1].copy();isolated[:,:,3][owner[y0:y1,x0:x1]!=cid]=0
  crop=Image.fromarray(isolated);override=None
  if (name=='Helga' and idx==7) or (name=='Human Laborer' and idx==1):
   override='source-front-left.png' if name=='Helga' else 'source-front-right.png'
   replacement=Image.open(src.parent/override).convert('RGBA');ra=np.array(replacement);ys,xs=np.where(ra[:,:,3]>128);replacement=replacement.crop((int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)))
   # Match the normalised standing height while preserving the replacement's body proportions.
   replacement=replacement.resize((round((y1-y0)*replacement.width/replacement.height),y1-y0),Image.LANCZOS);crop=replacement
  target=Image.new('RGBA',(384,640));scale=common_scale
  if name=='Borrin' and idx==8:
   override='../work-references/00-desk-writing.png'
   replacement=Image.open(src.parent/override).convert('RGBA');ra=np.array(replacement);ys,xs=np.where(ra[:,:,3]>128)
   x0,y0,x1,y1=int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)
   crop=replacement.crop((x0,y0,x1,y1));scale=min(350/crop.width,590/crop.height)
  # Retain authored seated/standing height difference instead of stretching every stance to full height.
  # All poses use the same pixels-per-character-unit scale.
  crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.LANCZOS);target.alpha_composite(crop,((384-crop.width)//2,620-crop.height))
  filename=f'{idx:02d}-{frame_labels[idx]}.png';target.save(src.parent/filename)
  frames.append({'id':frame_labels[idx],'file':filename,'sourceBounds':[x0,y0,x1,y1],'anchor':[192,620],'sourceOverride':override})
  if name=='Borrin' and idx==8:frames[-1].update({'title':'Seated writing at desk','description':'Writing in a visibly open ledger at the administrative desk. Replaces the closed-cover legacy writing pose.'})
  thumb=target.copy();thumb.thumbnail((250,400));out.paste(thumb,((idx%4)*256,(idx//4)*430),thumb);draw.text(((idx%4)*256+8,(idx//4)*430+405),frame_labels[idx],fill='white')
 manifest={'character':name,'canonical':'../'+json.loads((src.parent.parent/'profile.json').read_text())['master'],'source':'source-sheet.png','frameSize':[384,640],'scaleFromSource':common_scale,'frames':frames,'status':'animation-source','note':'Direction and stance references. Contact poses are not a completed eight-direction gait cycle.'}
 (src.parent/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');out.save(src.parent/'review.jpg');library.append({'name':name,'manifest':f'{name}/animation/manifest.json'})
Path('public/sprites/animation-library.json').write_text(json.dumps(library,indent=2)+'\n')
print('Exported',len(library),'characters')
