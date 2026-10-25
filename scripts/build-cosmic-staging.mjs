// Explicit allowlist: the reference, encoded archives, source .blend and R8 never enter this output.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'artifacts/staging');
const integrity=JSON.parse(await fs.readFile(path.join(root,'docs/codex/COSMIC_TREE_ASSET_INTEGRITY.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const record of [...integrity.photos,integrity.cv]){const bytes=await fs.readFile(path.join(root,record.file));if(hash(bytes)!==record.sha256)throw new Error('Changed original asset: '+record.file)}
const model=path.join(root,'assets/runtime/COSMIC_TREE_R9.glb');
const bytes=await fs.readFile(model);if(bytes.toString('ascii',0,4)!=='glTF')throw new Error('Missing real glTF export');
const modelReceipt=JSON.parse(await fs.readFile(path.join(root,'docs/codex/R9_RUNTIME_ASSETS.json'),'utf8'));
if(hash(bytes)!==modelReceipt.model.sha256)throw new Error('Runtime model differs from verified Blender export');
const json=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
if(json.images?.length)throw new Error('Tree model must not contain baked portfolio images');
if(!json.nodes.some(n=>n.name==='R9_TREE_twisted_trunk_roots_primary_limbs'))throw new Error('R9 refined tree not found');
// Only this known generated output folder is replaced.
if(path.relative(root,out)!==path.join('artifacts','staging'))throw new Error('Unsafe staging output path');
await fs.rm(out,{recursive:true,force:true});
await fs.mkdir(path.join(out,'media'),{recursive:true});await fs.mkdir(path.join(out,'models'),{recursive:true});
await fs.cp(path.join(root,'src/cosmic'),out,{recursive:true});
await fs.copyFile(model,path.join(out,'models/cosmic-tree-r9.glb'));
const allFiles=await fs.readdir(root);
for(const name of allFiles.filter(n=>/\.(jpg|mp4|pdf)$/i.test(n)))await fs.copyFile(path.join(root,name),path.join(out,'media',name));
// Retain every existing portfolio page, photo and local film at a working route.
await fs.mkdir(path.join(out,'original'),{recursive:true});
await fs.copyFile(path.join(root,'index.html'),path.join(out,'original/index.html'));
for(const name of allFiles.filter(n=>/\.(jpg|mp4|pdf)$/i.test(n)))await fs.copyFile(path.join(root,name),path.join(out,'original',name));
await fs.cp(path.join(root,'rebuild'),path.join(out,'original/rebuild'),{recursive:true});
await fs.mkdir(path.join(out,'vendor/three'),{recursive:true});
for(const name of ['three.module.js','three.core.js'])await fs.copyFile(path.join(root,'node_modules/three/build',name),path.join(out,'vendor/three',name));
// Copy only recursively imported modules, not the entire examples library.
const copied=new Set();
async function addon(relative){
 relative=path.posix.normalize(relative);if(copied.has(relative))return;copied.add(relative);
 const source=path.join(root,'node_modules/three/examples/jsm',relative),destination=path.join(out,'vendor/addons',relative);
 const text=await fs.readFile(source,'utf8');await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,text);
 for(const match of text.matchAll(/(?:from\s*|import\s*)['"]([^'"]+)['"]/g)){if(match[1].startsWith('.'))await addon(path.posix.join(path.posix.dirname(relative),match[1]));}
}
for(const name of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/UnrealBloomPass.js','postprocessing/OutputPass.js','objects/Reflector.js','environments/RoomEnvironment.js'])await addon(name);
await fs.copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(out,'vendor/THREE-LICENSE.txt'));
await fs.copyFile(path.join(root,'scripts/serve-cosmic-staging.mjs'),path.join(out,'preview-server.mjs'));
await fs.writeFile(path.join(out,'start-preview.mjs'),"process.env.COSMIC_STATIC_ROOT='.'; await import('./preview-server.mjs');\n");
await fs.writeFile(path.join(out,'START.cmd'),'@echo off\r\ncd /d "%~dp0"\r\necho Open http://127.0.0.1:4173/ after the Local message appears.\r\nnode start-preview.mjs\r\npause\r\n');
await fs.writeFile(path.join(out,'README.txt'),'LOCAL STAGING ONLY — NOT DEPLOYED\n\nWith Node.js installed, run START.cmd, then open http://127.0.0.1:4173/.\nThe interactive site uses actual Blender geometry and the original owner photographs.\nqa.html records the actual WebGL canvas. No reference image is included.\nClose the server console to stop the local preview.\nVisual fidelity and final image curation still require owner review.\n');
await fs.writeFile(path.join(out,'build-receipt.json'),JSON.stringify({modelSha256:hash(bytes),modelBytes:bytes.length,referenceIncluded:false,bakedImageCount:json.images?.length||0,photoSlots:integrity.photos.map(p=>({id:p.id,file:p.file,sha256:p.sha256})),ownerApproved:false},null,2));
console.log(`Built isolated staging: ${out}`);console.log(`R9 model ${bytes.length} bytes, no embedded images; ${copied.size} addon modules. Original site unchanged.`);
