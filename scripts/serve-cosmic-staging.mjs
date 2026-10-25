import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),process.env.COSMIC_STATIC_ROOT||'../artifacts/staging');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.pdf':'application/pdf','.mp4':'video/mp4','.json':'application/json'};
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 const file=path.resolve(root,'.'+(name.endsWith('/')?name+'index.html':name));
 const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403).end();return}
 fs.stat(file,(error,stat)=>{
  if(error||!stat.isFile()){res.writeHead(404).end('Not found');return}
  const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
  const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
  let start=0,end=stat.size-1,code=200;
  if(range){start=Number(range[1]);end=range[2]?Math.min(Number(range[2]),end):end;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();return}code=206;headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`}
  headers['Content-Length']=end-start+1;res.writeHead(code,headers);if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start,end}).pipe(res);
 });
});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/'));
