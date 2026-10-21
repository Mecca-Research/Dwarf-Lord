"""Uniformly normalize independently authored persistent mixture; no local edits."""
import hashlib
import json
import shutil
import sys
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'scripts'))
from workstation_export import normalized,verified_bytes
work=Path(__file__).parent
prop=root/'public/sprites/workstations/mixing-block'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
raw=Path('/mnt/c/Users/Tariq/.codex/generated_images/01a07177-1a07-7d81-99be-76028c15c836/exec-f1801060-8303-4e10-b956-b0a730a4bfc7.png')
assert not (prop/'completion-source.png').exists(),'Do not replay completed-bowl installation'
shutil.copy2(raw,prop/'completion-source.png')
placement={'crop':'alpha >=128 bounds','width':178,'x':235,'y':247,'canvas':[640,640],'alphaThreshold':128}
layer=normalized(Image.open(prop/'completion-source.png').convert('RGBA'),placement)
layer.save(prop/'completed-mixture.png')
shutil.copy2(work/'bowl-correction-request53.json',prop/'completion-request53.json')
p=prop/'generation.json'
generation=json.loads(p.read_text())
generation['completionLayer']={'file':'completed-mixture.png','sha256':sha(prop/'completed-mixture.png'),
    'source':'completion-source.png','sourceSha256':sha(prop/'completion-source.png'),
    'request':'completion-request53.json','placement':placement,
    'scope':'Separately authored bowl fills only its previously occluded rim. One uniform source normalization. Finite cosmetic completion leaves mixture at this table; no ingredient transfer, reward, baking or force claim.'}
p.write_text(json.dumps(generation,indent=2)+'\n')
for name,data in verified_bytes(prop,generation).items():assert data==(prop/name).read_bytes()
finished=Image.open(prop/'sprite.png').convert('RGBA');finished.alpha_composite(layer)
finished.save(work/'mixing-completed53.png')
print({'completionBounds':layer.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox(),'sourceAndOutputsReproduce':True})
