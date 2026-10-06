"""Literal source-material extraction. Private candidate, no anatomy editing."""
import hashlib, importlib.util, json, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
root=Path(__file__).resolve().parents[4];sys.path.insert(0,str(root/'scripts'))
work=Path(__file__).parent;folder=work/'actor-candidate';folder.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
save=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
original=root/'public/sprites/Blacksmith/motion/anvil-ready/reference'
# Visible body only; lower far leg is occluded by the original anvil.
body=[[65,18],[500,18],[500,288],[455,315],[426,317],[418,301],
 [400,304],[374,308],[357,315],[330,324],[317,328],[275,338],[244,350],
 [235,356],[233,391],[224,428],[224,451],[224,474],[240,495],
 [242,528],[239,551],[235,570],[228,580],[208,586],[175,586],
 [150,580],[141,564],[143,541],[150,508],[151,474],[144,457],
 [130,433],[116,412],[99,368],[77,336]]
# Each contour follows the visible pincer jaws and billet, with the open jaw
# space cut out. Nothing is translated, recolored, extended or invented.
tools=[
 [[392,290],[408,293],[407,307],[394,320],[365,342],[351,349],[326,357],[314,353],[314,337],[345,327],[368,309]],
 [[392,290],[408,293],[407,307],[394,320],[361,343],[348,352],[323,361],[312,356],[309,344],[311,337],[345,327],[368,309]],
 [[392,290],[408,293],[407,307],[394,320],[363,343],[351,351],[325,359],[313,355],[312,339],[345,327],[368,309]],
 [[392,290],[408,293],[407,307],[394,320],[362,343],[351,352],[325,360],[313,355],[311,341],[313,337],[345,327],[368,309]],
 [[392,282],[408,284],[408,299],[393,313],[365,336],[351,343],[324,353],[314,347],[312,335],[314,329],[345,319],[368,301]],
 [[392,289],[408,290],[408,307],[392,321],[357,346],[343,353],[316,361],[304,356],[302,341],[304,335],[338,327],[367,309]],
 [[392,289],[408,290],[408,307],[392,321],[362,344],[350,352],[324,361],[314,356],[312,341],[314,335],[344,327],[367,309]],
 [[392,283],[408,285],[408,300],[394,314],[366,339],[351,346],[325,355],[314,349],[313,335],[316,330],[346,322],[368,303]],
]
holes=[
 [[357,328],[380,313],[390,307],[387,314],[362,333]],
 [[355,329],[380,313],[389,307],[387,314],[360,334]],
 [[356,329],[380,313],[389,307],[387,314],[361,334]],
 [[356,329],[380,313],[389,307],[387,314],[361,334]],
 [[356,321],[380,305],[391,298],[388,306],[362,326]],
 [[350,330],[379,314],[389,308],[387,316],[356,337]],
 [[356,330],[379,314],[389,308],[387,316],[361,337]],
 [[357,324],[380,307],[391,300],[388,308],[363,330]],
]
# The lower hammer head in 0/1 crosses the original anvil front. Keep its
# original silhouette independently, rather than retaining steel behind it.
hammers=[
 [[109,391],[155,367],[170,378],[190,383],[190,399],[167,413],[138,432],[120,421]],
 [[150,313],[182,295],[207,309],[210,336],[191,353],[181,351],[165,366],[154,360]],
 [],[],[],[],[],[]]
sheet=Image.new('RGBA',(2560,1280));polygons=[];frames=[]
for i in range(8):
 im=Image.open(original/f'{i:02}.png').convert('RGBA');mask=Image.new('L',im.size);pen=ImageDraw.Draw(mask)
 selected=[body,tools[i]]+([hammers[i]] if hammers[i] else [])
 for poly in selected:pen.polygon([tuple(p)for p in poly],fill=255)
 pen.polygon([tuple(p)for p in holes[i]],fill=0)
 actor=im.copy();actor.putalpha(ImageChops.multiply(im.getchannel('A'),mask))
 sheet.alpha_composite(actor,(i%4*640,i//4*640));polygons.append(selected)
 frames.append({'file':str((original/f'{i:02}.png').relative_to(root)),'sha256':sha(original/f'{i:02}.png')})
sheet.save(folder/'source-sheet.png')
save(folder/'generation.json',{'method':'source-pixel-foreground-stencils','prompt':'Select original opaque Blacksmith body, near boot, hands, hammer, tongs and hot billet at their unchanged source coordinates. The far leg remains unobserved; no hidden anatomy or material is reconstructed.',
 'originalFrames':frames,'actorPolygons':polygons,'excludedPolygons':[[p]for p in holes],'candidate':True})
save(folder/'motion-polish.json',{'version':1,'sourceSha256':sha(folder/'source-sheet.png'),
 'targetBodyHeight':509,'targetAnchor':[280,592],
 'offsetsPx':[[0,0],[12,-1],[10,0],[11,0],[12,0],[12,0],[10,0],[2,0]],
 'landmarks':[{'root':[i%4*640+280,i//4*640+592],'bodyHeight':509}for i in range(8)],
 'sourceCells':[[i%4*640,i//4*640,(i%4+1)*640,(i//4+1)*640]for i in range(8)],
 'durationsMs':[140,120,120,120,120,120,120,140],
 'review':'One shared visible crown-to-near-boot basis and retained original coordinates. Bounded whole-pose integer registration fixes visible near-boot drift, without moving any local limb. No per-pose scaling. Physical prop registration, native contact, gameplay and task approval are pending.'})
entry=next(e for e in json.loads((root/'docs/expanded-animation-plan.json').read_text())['entries']if e['character']=='Blacksmith'and e['action']=='anvil-ready')
entry.update(destination=str(folder.relative_to(root)),direction='actor',station='anvil')
save(work/'entry-candidate52.json',entry)
spec=importlib.util.spec_from_file_location('export',root/'scripts/export-character-motion.py');ex=importlib.util.module_from_spec(spec);spec.loader.exec_module(ex);ex.export(entry)
offsets=[[0,0],[12,-1],[10,0],[11,0],[12,0],[12,0],[10,0],[2,0]]
foreground=[[[[x+offsets[i][0],y+offsets[i][1]]for x,y in poly]for poly in ([tools[i]]+([hammers[i]]if hammers[i]else[]))]for i in range(8)]
save(work/'layer-config52.json',{'actorBodyHeight':509,'actorAnchor':[280,592],'station':'anvil',
 'stationBodyHeight':520,'stationAnchor':[320,616],'foregroundPolygons':foreground,'approved':False})
prop=Image.open(root/'public/sprites/workstations/anvil/sprite.png').convert('RGBA');s=509/520
# Inverse uniform physical map preserves each source basis and common world root.
prop=prop.transform((640,640),Image.AFFINE,(1/s,0,320-280/s,0,1/s,616-592/s),Image.BICUBIC)
prop.save(work/'registered-prop52.png')
review=Image.new('RGB',(2560,1360),'#30383c');d=ImageDraw.Draw(review)
for i in range(8):
 actor=Image.open(folder/f'{i:02}.png').convert('RGBA');mask=Image.new('L',(640,640));pen=ImageDraw.Draw(mask)
 for poly in foreground[i]:pen.polygon([tuple(p)for p in poly],fill=255)
 front=actor.copy();front.putalpha(ImageChops.multiply(front.getchannel('A'),mask))
 layer=actor.copy();layer.alpha_composite(prop);layer.alpha_composite(front);layer.save(work/f'layer-{i}.png')
 x,y=i%4*640,i//4*680;review.paste(layer,(x,y),layer);d.text((x+20,y+646),f'{i}: candidate, physical shared-root layers',fill='white')
review.save(work/'layered-native52.jpg',quality=99)
print('Private literal source stencils exported. No approvals or game selection.')
