# R9 — implemented local staging, 25 October 2026

The previous handoff had no live Three.js implementation. This change adds a
working, isolated static build, without replacing the existing root site.

## Implemented

- Continued the existing Higgsfield Blender project from revision 7 through 12.
  The refinement adds twisted trunk growth, curved asymmetric limbs, individual
  creased leaves, independent gold vein geometry, an eroded root island, distant
  terrain and foreground shore geometry. The original prototype is preserved in
  an editable archive outside the active scene; it no longer pollutes the export.
- Real Blender stills at frames 1, 97 and 193 were rendered and inspected. The
  keyed camera returns to its initial position. Revision 12 only archives hidden
  prototype objects; it changes no visible geometry from the rendered revision 11.
- Vanilla Three.js renders the actual mesh, with camera translation/rotation,
  independently bowed and drifting photo planes, gold emission, procedural sky,
  static soft shadows, physical ground reflection and bloom. The supplied concept
  PNG is never used as a texture, backplate, thumbnail or fallback.
- Exactly six original owner images load independently and retain their aspect
  ratios. Their assignment remains provisional. Native dialog navigation works
  with keyboard, Escape and focus return. Photography filters and the three
  existing local concert films work. Existing portfolio pages are retained at
  `original/`; their pre-existing external media collection is preserved, not
  newly recertified as a complete 43-film local archive.
- Responsive single header, both Instagram profiles, Telegram, LinkedIn and the
  verified current CV. Motion can be paused. Background rendering stops offscreen,
  on document hiding and behind the media dialog. Standard reduced-motion is
  supported; forced reduced/no-WebGL QA routes keep the portfolio usable.
- Web packaging uses an explicit file allowlist and verifies original photo, CV
  and model bytes. The portable model has no embedded images. Unused prototype
  geometry is removed by a lossless binary repack, not by image projection.

## Evidence and validation

- Both recovered originals passed the documented SHA256 checks.
- Source checks, JavaScript syntax checks, the local static build, and current
  Blender archive restoration passed. Root `index.html` and `rebuild/` have no
  source changes relative to recovered HEAD `7abe9ffc68a9606343bd86207663613bdfcf7dbb`.
- Actual browser rendering used Intel UHD Graphics 620 via ANGLE / Direct3D11.
  The detailed version measured approximately 26–31 fps at 1440×900 after adaptive
  resolution. Earlier lighter look-development builds measured 39 fps; do not
  attribute that number to the final detailed mesh.
- Browser viewport checks: 1920×1080, 1440×900, 768×1024, 390×844, 320×700. No
  horizontal overflow. All six phone targets remained in bounds. Mobile menu and
  all five profile/CV destinations were checked.
- Photo modal, arrow keys, Escape/focus restoration, sports filter, local video
  loading and native controls were checked. Ed Sheeran video decoded at width
  1920 with readyState 4 and no media error.
- Forced reduced-motion: no animation frames advance, motion is paused, CSS
  transitions are disabled. Forced no-WebGL: no canvas is created and original
  photographs still open. These are explicit QA simulations; the OS preference
  was not changed, and a separate physical WebGL-incapable device was not used.
- `qa.html` uses canvas.captureStream + MediaRecorder to capture the real browser
  scene. Any MP4 is a format conversion of that recording, not a Blender MP4,
  generated video, HyperFrames render or substituted still-image zoom.

## Still failing / not approved

**Photoreal visual fidelity is not at the locked reference level.** Branch form,
canopy irregularity, bark richness, volumetric depth, ground detail and reflection
still need look development. The current stage is a real interactive implementation
for review, not an exact-match or production-ready deliverable. The supplied
reference contains fabricated photography, so its original image stays excluded.

Final photo curation and owner visual/motion acceptance remain open. Figma file
inspection was attempted and still returned the Starter MCP limit; no Figma edit
is claimed. No paid generation, merge, Netlify operation or deployment was run.
