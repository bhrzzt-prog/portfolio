#!/usr/bin/env node
// Source-readiness assertions ONLY. Passing does not imply Blender/WebGL fidelity or authorization to deploy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/codex/COSMIC_TREE_MEDIA_MAP.json'),'utf8'));
const integrity = JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/codex/COSMIC_TREE_ASSET_INTEGRITY.json'),'utf8'));
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const readVerified = (filename, expected) => {
 const absolute = path.resolve(repoRoot, filename);
 const relative = path.relative(repoRoot, absolute);
 if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
  pass(false, 'Asset must stay inside repository: ' + filename);
  return null;
 }
 if (!fs.existsSync(absolute)) {
  pass(false, 'Asset present: ' + filename);
  return null;
 }
 const bytes = fs.readFileSync(absolute);
 pass(bytes.length === expected.bytes && sha256(bytes) === expected.sha256, 'Original bytes preserved: ' + filename);
 return bytes;
};
let errors = 0;
const pass = (condition, name) => {
 console.log((condition ? 'PASS ' : 'FAIL ') + name);
 if (!condition) errors++;
};
pass(cfg.release === 'BLOCKED_REQUIRES_OWNER_APPROVAL', 'Production release gate remains closed');
pass(cfg.lockedReference.publish === false && cfg.lockedReference.containsSyntheticPortfolioArt, 'Reference-only synthetic images are forbidden');
pass(cfg.slotAssignments.length === 6, 'Exactly six media slots');
pass(new Set(cfg.slotAssignments.map(x => x.id)).size===6, 'Six unique slot identifiers');
pass(cfg.slotAssignments.every(x => x.curated === false), 'Staging photos are not misrepresented as owner-curated final selection');
pass(integrity.photos.length === 6 && new Set(integrity.photos.map(x=>x.id)).size === 6, 'Integrity records cover exactly six distinct slots');
for(const asset of cfg.slotAssignments) {
 const record = integrity.photos.find(x=>x.id === asset.id);
 pass(record?.file === asset.stagingFile, 'Slot matches recorded source: ' + asset.id);
 if (record?.file === asset.stagingFile) readVerified(asset.stagingFile, record);
}
pass(cfg.blender.photorealFidelityApproved === false,'Photoreal visual acceptance remains explicitly pending');
pass(typeof cfg.blender.liveWebGLTestPassed === 'boolean','Actual WebGL QA status is recorded separately from visual acceptance');
pass(cfg.navigation.primary.join(',')==='Photography,Film,About,Contact','Single canonical navigation definition');
const banned = ['cosmic_tree_of_visual_stories.png','R8_LOCKED_IMAGE_PROJECTED_3D_DEV_ONLY.glb'];
pass(banned.every(x=>cfg.forbiddenProductionAssets.includes(x)), 'Forbidden concept assets are flagged');
pass(cfg.navigation.cvExistingInRepo === true && integrity.cv.file === cfg.navigation.cvFilename, 'CV source is recorded');
const cv = readVerified(cfg.navigation.cvFilename, integrity.cv);
if (cv) pass(cv.subarray(0,5).toString() === '%PDF-' && cv.subarray(-1024).includes(Buffer.from('%%EOF')), 'CV is a PDF with an end marker');
if(process.env.LOCKED_REFERENCE_PATH){
 try {
  const original=fs.readFileSync(process.env.LOCKED_REFERENCE_PATH);
  pass(sha256(original) === cfg.lockedReference.sha256,'Locked reference integrity');
 } catch { pass(false, 'Locked reference file is readable'); }
} else if (process.argv.includes('--require-reference')) {
 pass(false, 'Locked reference required: set LOCKED_REFERENCE_PATH to the owner original file');
} else console.log('PENDING Reference hash: set LOCKED_REFERENCE_PATH to the owner original file; use --require-reference to make this a required input');
console.log('SOURCE-ONLY verdict: '+(errors?'FAIL':'PASS')+'; actual 3D visual acceptance and deployment approval remain separate hard gates.');
process.exitCode=errors?1:0;
