"""Private necessary numerical preflight; no art edits or correspondence approval."""
import json,math,numpy as np
from pathlib import Path
from scipy.optimize import linprog
w=Path('work/expanded-cycles/motion57/laborer-back-left');obs=json.loads((w/'sole-hypotheses757.json').read_text())
axis=np.array([-math.sqrt(.5),-math.sqrt(.5)*math.sin(.6)])
# 16 component offsets,8 positive travel steps, one error bound. Minimum40ms,
#1000ms total,520 physical basis, unchanged12px offsets. No thresholds enlarged.
def solve(transitions):
 deltas=np.array([np.array(t['fromPoint'])-np.array(t['toPoint'])for t in transitions]);a=[];b=[]
 for i in range(8):
  for j in range(2):
   row=np.zeros(25);row[16+i]=axis[j];row[2*i+j]=-1;row[2*((i+1)%8)+j]=1;row[24]=-1
   a.append(row);b.append(deltas[i,j]);row=-row;row[24]=-1;a.append(row);b.append(-deltas[i,j])
  row=np.zeros(25);row[16:24]=.04;row[16+i]-=1;a.append(row);b.append(0)
 for sign,maxsum in [(1,1040),(-1,-104)]:
  row=np.zeros(25);row[16:24]=sign;a.append(row);b.append(maxsum)
 cost=np.zeros(25);cost[24]=1
 sol=linprog(cost,A_ub=np.array(a),b_ub=np.array(b),bounds=[(-12,12)]*16+[(0,None)]*8+[(0,None)],method='highs')
 if not sol.success:return {'feasible':False,'reason':sol.message,'adoptedByRuntime':False}
 offsets=sol.x[:16].reshape(8,2);steps=sol.x[16:24];s=steps.sum();durations=np.floor(steps/s*1000).astype(int)
 for i in np.argsort(-(steps/s*1000-durations))[:1000-int(durations.sum())]:durations[i]+=1
 rounded=np.rint(offsets).astype(int);corrected=deltas+rounded-np.roll(rounded,-1,axis=0);errors=durations[:,None]/1000*s*axis-corrected
 return {'feasible':True,'continuousErrorComponentPx':float(sol.x[24]),'continuousOffsets':offsets.tolist(),'proposedIntegerOffsets':rounded.tolist(),'proposedDurationsMs':durations.tolist(),'proposedStrideRatio':float(s/520),'roundedMaxContactJumpPx':float(np.linalg.norm(errors,axis=1).max()),'minimumHoldMs':int(durations.min()),'adoptedByRuntime':False,'materialCorrespondenceReviewed':False,'wholeStrideApproved':False,'loopApproved':False}
actual=solve(obs['transitions']);target=json.loads(json.dumps(obs['transitions']))
# Only an authoring target, not observed source material. One whole3 correction
#could repair the depth and leave the other7 intact; arms/phase still separate.
target[2]['toPoint']=[300,549];target[3]['fromPoint']=[300,549]
proposal=solve(target)
(w/'bounded-preflight757.json').write_text(json.dumps({'sourceBoundObservedHypotheses':actual,'unobservedWholePose3AuthoringTarget':proposal,'target':[300,549],
 'scope':'Strictly private numerical constraints at12px/6px/40ms bounds; no source changed, generated pose assumed, material correspondence, native anatomy, arm or final loop approval.'},indent=2)+'\n')
print(json.dumps({'currentRounded':actual,'authoringTargetRounded':proposal}))
