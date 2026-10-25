# portfolio

## Cosmic Tree R9 local staging

The current production `index.html` and existing `rebuild/` pages are preserved.
The new interactive implementation lives in `src/cosmic/`, on the existing R9
draft branch. It has not been deployed or approved as a photoreal reference match.

```sh
npm ci --ignore-scripts
npm run build:cosmic
npm run preview:cosmic
```

Open http://127.0.0.1:4173/. The build contains a real Blender mesh, six separately
loaded owner photographs, an accessible photo/film gallery, current CV and links.
Use `?reduced-motion` and `?no-webgl` for bounded QA of the two fallback modes.
The operating-system reduced-motion preference is also supported. `qa.html`
records the actual WebGL canvas; it does not generate AI video.

The runtime GLB is included in `assets/runtime/`. To recover the current editable
Blender source, run `python scripts/restore-cosmic-tree-r9.py`. This verifies and
decompresses the source archive recorded in `docs/codex/R9_RUNTIME_ASSETS.json`.
The original R7 restoration scripts remain available.

Read `docs/codex/IMPLEMENTATION_R9.md` for actual validation and remaining visual
failures. Keep PR #2 draft. Do not merge or deploy without owner approval.
