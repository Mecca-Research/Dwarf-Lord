import json,sys,hashlib
from pathlib import Path
from PIL import Image
root=Path('.').resolve();sys.path.insert(0,str(root/'scripts'))
from whole_stride import stride_binding,measure,annotate,propose_calibration
from stride_geometry_diagnostic import diagnose
w=root/'work/expanded-cycles/motion57';folder=w/'candidate5/Laborer/motion/walk/back-left';manifest=json.loads((folder/'manifest.json').read_text());write=lambda p,j:p.write_text(json.dumps(j,indent=2)+'\n')
# Directly inspected opaque lower gray sole rims. Anatomical support-state and
# rigid material correspondence remain unapproved, especially the new3.
coords=[([302,532],[359,594]),([244,552],[278,557]),([278,557],[275,569]),([275,569],[331,553]),([227,526],[284,555]),([193,517],[229,557]),([229,557],[295,580]),([295,580],[292,598])]
transitions=[];pixel_reads=[]
for i,(a,b)in enumerate(coords):
 for p,f in [(a,i),(b,(i+1)%8)]:
  rgba=Image.open(folder/f'{f:02}.png').convert('RGBA').getpixel(tuple(p));assert rgba[3]>=128,(i,p,f,rgba)
  pixel_reads.append({'frame':f,'point':p,'RGBA':list(rgba),'role':'Actually visible opaque sole-rim hypothesis; not approved material correspondence.'})
 transitions.append({'from':i,'to':(i+1)%8,'fromPoint':a,'toPoint':b,'foot':'right'if i<4 else'left','landmark':'heel'if i%4==0 else'toe','correspondenceReviewed':False})
obs={'folder':str(folder.relative_to(root)),'binding':stride_binding(folder,manifest),'runtimeSha256':hashlib.sha256((root/'src/game/world/npc-motion.ts').read_bytes()).hexdigest(),'cameraElevationRadians':.6,'strideBodyRatio':1.2,'transitions':transitions,
 'scope':'Private literal whole-pose geometry preflight. All coordinates read real opaque native material; anatomical support/grip states and material correspondence remain unapproved. Guide targets are not observations.'}
write(w/'laborer-back-left/sole-hypotheses57.json',obs);write(w/'laborer-back-left/sole-pixel-reads57.json',pixel_reads)
m=measure(obs);d=diagnose(m);write(w/'laborer-back-left/sole-measurement57.json',m);write(w/'laborer-back-left/necessary-geometry57.json',d);write(w/'laborer-back-left/calibration-proposal57.json',propose_calibration(m));annotate(obs,w/'laborer-back-left/sole-observations57.jpg')
print(json.dumps({'maxRawContactJumpPx':m['maxContactJumpPx'],'fittedMaxJumpPx':m['fittedMaxContactJumpPx'],'fittedRatio':m['fittedStrideBodyRatio'],'closedLowerBoundPx':d['closedCycle']['minimumPossibleMaxResidualPx'],'blockedBoundaries':[b for b in d['boundaries']if b['requiresSourceOrMaterialCorrection']],'measurementPassed':m['measurementPassed']}))
