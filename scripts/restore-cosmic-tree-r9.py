"""Recover the current editable Blender refinement without external services."""
from pathlib import Path
import gzip
import hashlib
import json

root=Path(__file__).resolve().parents[1]
receipt=json.loads((root/'docs/codex/R9_RUNTIME_ASSETS.json').read_text())
record=receipt['compressedBlend']
compressed=(root/record['file']).read_bytes()
assert len(compressed)==record['bytes'] and hashlib.sha256(compressed).hexdigest()==record['sha256'], 'Changed Blender archive'
blend=gzip.decompress(compressed)
original=receipt['sourceBlend']
assert blend.startswith(b'BLENDER') and len(blend)==original['bytes'] and hashlib.sha256(blend).hexdigest()==original['sha256'], 'Changed Blender source'
output=root/original['file']
output.parent.mkdir(parents=True,exist_ok=True)
output.write_bytes(blend)
print(f'Verified editable Blender revision {receipt["revision"]}: {output}')
