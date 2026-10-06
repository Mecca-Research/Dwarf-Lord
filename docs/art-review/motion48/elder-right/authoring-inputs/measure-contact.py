"""Read actual candidate pixels, never promote authoring targets to observations."""
import json,sys
from pathlib import Path
sys.path.insert(0,'scripts')
from gait_calibration import digest
from whole_stride import stride_binding,measure,propose_calibration,annotate
from cane_stride import measure as measure_cane,observation_digest
from PIL import Image
p=Path('work/expanded-cycles/motion48/elder-right');f=p/'candidate-contact'
m=json.loads((f/'manifest.json').read_text())
# Manually inspected lower rubber heel/toe corners, actual 640px exports.
transitions=[('left','heel',[385,610],[314,610]),('left','toe',[432,610],[333,610]),
 ('left','toe',[333,610],[306,610]),('left','toe',[306,610],[258,606]),
 ('right','heel',[363,610],[298,610]),('right','toe',[421,610],[304,610]),
 ('right','toe',[304,610],[273,610]),('right','toe',[273,610],[252,610])]
obs={'version':1,'folder':str(f),'binding':stride_binding(f,m),'runtimeSha256':digest('src/game/world/npc-motion.ts'),
 'cameraElevationRadians':.6,'strideBodyRatio':1.2,
 'transitions':[{'from':i,'to':(i+1)%8,'foot':foot,'landmark':kind,'fromPoint':a,'toPoint':b,
 'correspondenceReviewed':False}for i,(foot,kind,a,b)in enumerate(transitions)],
 'review':'Provisional literal source-material corners; native opposing legs improved but far-arm phases, cumulative cane/sole agreement and full anatomy/recovery remain unapproved. No guide coordinates used.'}
def save(name,obj): (p/name).write_text(json.dumps(obj,indent=2)+'\n')
save('contact-sole-observations48.json',obs)
foot=measure(obs,m);save('contact-sole-measurement48.json',foot);save('contact-calibration-proposal48.json',propose_calibration(foot));annotate(obs,p/'contact-native-contact-review48.jpg')
cane={'version':1,'binding':foot['binding'],'runtimeSha256':foot['runtimeSha256'],'footObservationsSha256':observation_digest(obs),
 'cane':{'tipPoints':[[532,614],[490,614],[447,614],[400,615],[541,542],[537,552],[547,554],[531,590]],
 'collarPoints':[[519,351],[479,351],[439,351],[400,351],[486,340],[483,342],[489,350],[482,367]],
 'plantFrames':[0,1,2,3],'recoveryFrames':[4,5,6,7],
 'tipMaterialReviewed':False,'sameArmAndGripReviewed':True,'rigidShaftReviewed':False,'liftRecoveryReplantReviewed':False},
 'review':'Actual unselected source tip/collar pixels; diagnostic only. Collars and recovery not yet certified as rigid 3D correspondences. Far free arm still points backward in poses4/5.'}
for name in ('tipPoints','collarPoints'):
 for i,xy in enumerate(cane['cane'][name]):
  rgba=Image.open(f/f'{i:02}.png').convert('RGBA').getpixel(tuple(xy))
  assert rgba[3]>=128,(name,i,xy,rgba)
save('contact-cane-observations48.json',cane)
joint=measure_cane(obs,cane,m);save('contact-coordinated-measurement48.json',joint)
print(json.dumps({'soleMax':foot['maxContactJumpPx'],'candidate':propose_calibration(foot),'jointRootDisagreementPx':joint['maxRequiredRootDisagreementPx'],'canePlantDriftPx':joint['canePlant']['maxBoundaryContactDriftPx'],'selected':False},indent=2))
