#!/usr/bin/env node
// Source-readiness assertions ONLY. Passing does not imply Blender/WebGL fidelity or authorization to deploy.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(repoRoot,'docs/codex/COSMIC_TREE_MEDIA_MAP.json'),'utf8'));
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
for(const asset of cfg.slotAssignments) {
 pass(fs.existsSync(path.join(repoRoot,asset.stagingFile)), 'Verified owner photo present: ' + asset.stagingFile);
}
pass(cfg.blender.photorealFidelityApproved === false && cfg.blender.liveWebGLTestPassed === false,'3D review remains explicitly pending');
pass(cfg.navigation.primary.join(',')==='Photography,Film,About,Contact','Single canonical navigation definition');
const banned = ['cosmic_tree_of_visual_stories.png','R8_LOCKED_IMAGE_PROJECTED_3D_DEV_ONLY.glb'];
pass(banned.every(x=>cfg.forbiddenProductionAssets.includes(x)), 'Forbidden concept assets are flagged');
const cvFile = path.join(repoRoot, cfg.navigation.cvFilename);
console.log((fs.existsSync(cvFile)?'READY ':'PENDING ' )+'Verified original CV binary in repo: '+cfg.navigation.cvFilename);
if(process.env.LOCKED_REFERENCE_PATH){
 const original=fs.readFileSync(process.env.LOCKED_REFERENCE_PATH);
 pass(crypto.createHash('sha256').update(original).digest('hex') === cfg.lockedReference.sha256,'Locked reference integrity');
} else console.log('PENDING Reference hash: set LOCKED_REFERENCE_PATH to the owner original file');
console.log('SOURCE-ONLY verdict: '+(errors?'FAIL':'PASS')+'; actual 3D visual acceptance and deployment approval remain separate hard gates.');
process.exitCode=errors?1:0;
