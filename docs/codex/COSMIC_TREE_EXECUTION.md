# CODEX — BEHROOZ TAJIK / COSMIC TREE OF LIFE — R9 EXECUTION

STATUS: **CODEX IMPLEMENTATION STARTER ONLY — NO PRODUCTION RELEASE**.
Use the existing repository and this draft PR branch. Do NOT merge, publish, overwrite the live Netlify site, change DNS or spend paid credits without owner approval.

## Ground-truth verified sources
- Existing website: this repository, static root index.html (not React/Next). Existing main index.html source SHA 6872ccfb760a3d7f35fb66c8a0a3b23e7e3b619a.
- IMMUTABLE visual target: cosmic_tree_of_visual_stories.png, 1672x941, SHA256 a1397aa9fb03a0ac06d48291d0fad08bb7983560eaec2cba5b6ce95f6e56c2d2. User's original SENS Library /LUNA_SENS_CREATIVE/BEHROOZ_TAJIK_R7_LOCKED_REFERENCE.png. Reference concept image contains **fake gallery photos** and must NEVER be served in production, including CSS fallback, thumbnail, OG image or baked GLB.
- True editable Blender source: https://higgsfield.ai/3d-jutsu/42d9d5d3-1eba-4b84-a4db-beb9b030a66a , revision 7 last verified. Includes tree branches/roots, planet, galaxy, light structures, six independent panel slots, keyed 144-frame motion. **Visually inspected — photoreal fidelity NOT PASSED**, cannot label as finished or exact match.
- R8 developed projected-image GLB/MP4 in original SENS Library is **DEVELOPMENT ONLY**: synthetic gallery media is baked in. NEVER use as website asset, including for WebGL fallback.
- Figma existing file: https://www.figma.com/design/vpucXrPbmWyVKTP7lPH6jS . Figma Starter MCP quota blocked edits; no updated R8 Figma designs exist. R8 SVG is a locally importable design guide only.
- HyperFrames is deterministic HTML + GSAP rendered motion tool, not genuine 3D modelling and not the interactive 3D site engine. Prior worker could not run the HyperFrames CLI; no FFmpeg/OpenCV render counts as HyperFrames verification.

## Fixed design requirements
- Wordmark BEHROOZ TAJIK only once, left of header. SENS is affiliation only.
- One header navigation: Photography, Film, About, Contact. No duplicate route buttons, giant hero wordmark, Selected Work, The Archive or generic filler.
- Header social/CV: personal Instagram https://www.instagram.com/behroooztajik/ ; SENS Instagram https://www.instagram.com/sensstudio__/ ; Telegram https://t.me/bhrzt ; LinkedIn https://www.linkedin.com/in/behrooz-tajik-987ab395 ; verified corrected 2026 Behrooz_Tajik_CV_CURRENT.pdf (now included at repository root; original 80,034-byte owner PDF, SHA256 recorded in COSMIC_TREE_ASSET_INTEGRITY.json).
- Locked visual hierarchy: massive old tree with glowing golden veins center-right; dark planetary rings and deep nebula on left; six floating independently rotatable original-work photo/film planes; luminous root network, subtle reflected obsidian foreground; dark warm luxury editorial, true atmospheric depth and physically credible bark/crown detail. Composition aligned to locked 1672×941 original, not a rough lookalike.
- Six panel texture slots must remain separate, independently addressable and accessible. Use only **real verified Behrooz work**; provisional staging assignment in COSMIC_TREE_MEDIA_MAP.json is a *proposal*, not owner-curated final selection. Preserve source aspect ratio. No fabricated portfolio images.
- Motion: actual 3D spatial camera translation/rotation, independent subtle panel drift, truly three-dimensional tree and scene parallax, controllable vein emission/light; avoid a still-image zoom being presented as true 3D. Site must remain interactive (pointer, touch, click, keyboard).
- Site engine: choose lean Three.js vanilla module in current static repo unless strong evidence warrants a framework migration. Code-split GLB loading, keep HTML initially readable before 3D initialized, use capped DPR, lazy loading, minimize materials/draw calls.
- Fallback: real clean **no fake media** still, neutral original-photo slots, graceful no WebGL and prefers-reduced-motion. NEVER use unmodified locked reference PNG or the image-projection GLB.
- Target viewports desktop 1440x900 and 1920x1080; tablet 768; phones 390x844 and 320x700. No horizontal overflow or clipped header; real tappable links and visible focus.

## Codex execution sequence — carry out code
1. Inspect root index.html and assets, preserve working pages/links/film entries; take baseline actual 1440/390 screenshots. DO NOT overwrite main or replace site with toy scaffold.
2. Run node scripts/verify-cosmic-tree-inputs.mjs. It verifies all six recorded photo hashes and the original CV binary. Before visual reconstruction, set LOCKED_REFERENCE_PATH to the owner original and run node scripts/verify-cosmic-tree-inputs.mjs --require-reference. A source-only pass without that flag does not establish reference access. No invented asset paths or video URLs.
3. **Fidelity gate**: source Blender revision 7 is NOT done. Obtain photoreal editable output consistent with visual lock; show side-by-side true Blender rendered frames vs reference (open, middle, settle, loop seam) for owner review. Improve tree form, fine twig and foliage count, bark roughness, golden veins, nebula, planetary rings, volumetric light and ground until owner approves. Do not substitute the synthetic image-projection GLB.
4. When real Blender source/GLB is actually approved, integrate GLTF model into a dedicated Three.js hero canvas with 6 distinct real-photo texture slots. Keep the rest of the site in existing clean editorial structure, preserve functional Portfolio/Film routes, About and Contact.
5. Optional independent HyperFrames motion study: if using HyperFrames, execute npx hyperframes lint / validate / inspect / render, attach logs and actual MP4. This is for creative timing review only, NOT 3D-engine proof.
6. Test on a **real GPU browser**, create screenshots 1440, 390, 320 and a playable screen recording of actual WebGL motion; verify console, image loads, navigation, CV, accessible keyboard, no-WebGL and reduced-motion fallbacks, motion seam and performance.
7. Attach evidence to THIS draft PR; leave it DRAFT and unmerged for owner's visual approval. Never deploy Netlify before owner explicitly requests it.

## Block release unless
- All six slots use genuine original Behrooz assets, not any synthetic/ref artist work.
- Production bundle, fallback, meta preview, OG image, CSS and all GLB textures contain NONE of the prohibited R7/R8 image-based concept assets.
- Genuine detailed editable Blender tree and live animated browser scene are validated visually against locked reference by owner.
- One non-duplicated accessible header plus both Instagram, Telegram, LinkedIn and real CV link work.
- Mobile viewports and no-WebGL/reduced-motion fallback tested; motion meets quality expectations.
- Owner grants explicit final approval. An automated green test alone is not approval.

## Honest status
**Codex work is now scoped and can start in an isolated branch.** Photoreal fidelity, real media swap, Figma visuals, browser motion, and production release are NOT complete. Report precisely which gates remain blocked and give tested receipts, not unverified claims.
