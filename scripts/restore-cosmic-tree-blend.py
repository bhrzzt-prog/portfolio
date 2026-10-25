#!/usr/bin/env python3
"""Restore the real editable Blender 5.x scene from the verified encoded source in this branch.

The source is gzip-compressed and BASE64 encoded purely to permit reliable transfer
from the 3D Jutsu connector through a text-only GitHub API. It is NOT a generated
image, proxy mesh, or fabricated .blend. SHA256 verification is mandatory.
"""
from pathlib import Path
import base64
import gzip
import hashlib
import sys

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/blender-source/COSMIC_TREE_R7.blend.gz.base64"
OUTPUT = ROOT / "artifacts/source_blender/COSMIC_TREE_R7_ORIGINAL.blend"
GZIP_SHA256 = "ae791e871377351d4684ecd0f0691ea240dc376e679b1200171707ed6c61d217"
BLEND_SHA256 = "27f8ccae3d41b333643af91515ec747a047817ed6ff0deb9612d5a968563a85a"
BLEND_SIZE = 7523898
GZIP_SIZE = 1619315

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def main() -> int:
    if not SOURCE.is_file():
        raise SystemExit(f"Missing encoded Blender source: {SOURCE}")
    payload = base64.b64decode(SOURCE.read_text(encoding="ascii").strip(), validate=True)
    if len(payload) != GZIP_SIZE or sha256(payload) != GZIP_SHA256:
        raise SystemExit("ERROR: encoded archive failed integrity verification; refusing to create .blend")
    blend = gzip.decompress(payload)
    if len(blend) != BLEND_SIZE or sha256(blend) != BLEND_SHA256 or not blend.startswith(b"BLENDER"):
        raise SystemExit("ERROR: restored Blender data failed original hash/header/size verification")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(blend)
    if sha256(OUTPUT.read_bytes()) != BLEND_SHA256:
        raise SystemExit("ERROR: on-disk .blend checksum failed")
    print(f"VERIFIED original .blend: {OUTPUT} ({BLEND_SIZE:,} bytes)")
    print(f"SHA-256: {BLEND_SHA256}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
