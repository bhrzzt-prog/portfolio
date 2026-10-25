"""Keep only the refined scene in the web GLB; preserve the full editable .blend.

Lossless buffer repack. No decimation, image projection, or generated photographs.
"""
import copy
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
if len(sys.argv)!=2:raise SystemExit('Usage: python scripts/prepare-cosmic-model.py <verified Blender revision>')
revision=int(sys.argv[1])
source=ROOT/'artifacts/source_blender/COSMIC_TREE_R9_FULL.glb'
output=ROOT/'artifacts/source_blender/COSMIC_TREE_R9.glb'
data=source.read_bytes()
assert data[:4]==b'glTF' and struct.unpack_from('<I',data,4)[0]==2
json_size=struct.unpack_from('<I',data,12)[0]
doc=json.loads(data[20:20+json_size])
assert not doc.get('images'), 'Refusing image-textured source model'
binary_header=20+json_size
binary_size,binary_type=struct.unpack_from('<II',data,binary_header)
assert binary_type==0x004e4942
binary=data[binary_header+8:binary_header+8+binary_size]
keep=[n for n in doc['nodes'] if 'mesh' in n and (n.get('name','').startswith('R9_') or n.get('name') in ['SPACE_planet_left','SPACE_horizon_planet'])]
assert any(n.get('name')=='R9_TREE_twisted_trunk_roots_primary_limbs' for n in keep)
mesh_ids=sorted({n['mesh'] for n in keep})
meshes=[copy.deepcopy(doc['meshes'][i]) for i in mesh_ids]
material_ids=sorted({p['material'] for m in meshes for p in m['primitives'] if 'material' in p})
accessor_ids=set()
for mesh in meshes:
    for primitive in mesh['primitives']:
        accessor_ids.update(primitive['attributes'].values())
        if 'indices' in primitive:accessor_ids.add(primitive['indices'])
        assert not primitive.get('targets'), 'Unexpected morph targets'
accessor_ids=sorted(accessor_ids)
accessors=[copy.deepcopy(doc['accessors'][i]) for i in accessor_ids]
assert all('sparse' not in a for a in accessors)
view_ids=sorted({a['bufferView'] for a in accessors})
views=[]
packed=bytearray()
for old in view_ids:
    view=copy.deepcopy(doc['bufferViews'][old])
    assert view.get('buffer',0)==0
    while len(packed)%4:packed.append(0)
    offset=view.get('byteOffset',0)
    chunk=binary[offset:offset+view['byteLength']]
    assert len(chunk)==view['byteLength']
    view['byteOffset']=len(packed)
    packed.extend(chunk)
    views.append(view)
for a in accessors:a['bufferView']=view_ids.index(a['bufferView'])
for mesh in meshes:
    for p in mesh['primitives']:
        p['attributes']={k:accessor_ids.index(v) for k,v in p['attributes'].items()}
        if 'indices' in p:p['indices']=accessor_ids.index(p['indices'])
        if 'material' in p:p['material']=material_ids.index(p['material'])
nodes=[]
for node in keep:
    n=copy.deepcopy(node)
    assert not n.get('children'), 'Unexpected parented refined mesh'
    n['mesh']=mesh_ids.index(n['mesh'])
    nodes.append(n)
out={'asset':{'version':'2.0','generator':f'R9 lossless static web export from original Higgsfield Blender revision {revision}'},'scene':0,'scenes':[{'name':'Cosmic Tree R9 — original geometry, real media loaded separately','nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':meshes,'materials':[doc['materials'][i] for i in material_ids],'accessors':accessors,'bufferViews':views,'buffers':[{'byteLength':len(packed)}],'extras':{'sourceRevision':revision,'sourceSha256':hashlib.sha256(data).hexdigest(),'referenceImageUsed':False,'ownerApproved':False}}
extensions=sorted({key for mat in out['materials'] for key in mat.get('extensions',{})})
if extensions:out['extensionsUsed']=extensions
encoded=json.dumps(out,separators=(',',':')).encode()
while len(encoded)%4:encoded+=b' '
while len(packed)%4:packed.append(0)
result=struct.pack('<4sII',b'glTF',2,12+8+len(encoded)+8+len(packed))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(packed),0x004e4942)+packed
output.write_bytes(result)
print(json.dumps({'sourceBytes':len(data),'webBytes':len(result),'meshCount':len(meshes),'images':0,'sha256':hashlib.sha256(result).hexdigest()},indent=2))
