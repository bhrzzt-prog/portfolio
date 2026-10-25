#!/usr/bin/env python3
"""Recover immutable art-direction reference on the Codex execution branch.

This is a REFERENCE ONLY. It contains AI concept photography, must NEVER
be copied to public/, netlify output, CSS, OG images or deployed GLB textures.
"""
from pathlib import Path
import base64
import binascii
import hashlib

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/reference/TREE_OF_LIFE_LOCKED_REFERENCE.png.base64"
OUTPUT = ROOT / "artifacts/reference-only/TREE_OF_LIFE_LOCKED_REFERENCE.png"
EXPECTED_BYTES = 2545950
EXPECTED_SHA256 = "a1397aa9fb03a0ac06d48291d0fad08bb7983560eaec2cba5b6ce95f6e56c2d2"

def main():
    data = base64.b64decode(SOURCE.read_text(encoding="ascii").strip(), validate=True)
    if len(data) != EXPECTED_BYTES or hashlib.sha256(data).hexdigest() != EXPECTED_SHA256:
        raise RuntimeError("ERROR: Locked reference changed or corrupted: abort")
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise RuntimeError("ERROR: Not a genuine PNG")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(data)
    if hashlib.sha256(OUTPUT.read_bytes()).hexdigest() != EXPECTED_SHA256:
        raise RuntimeError("ERROR: On-disk reference mismatch")
    print(f"VERIFIED reference ONLY: {OUTPUT} ({len(data):,} bytes)")
    print("SHA-256:", EXPECTED_SHA256)
    print("DO NOT DEPLOY: concept image contains synthetic work in frames")

if __name__ == "__main__":
    main()
