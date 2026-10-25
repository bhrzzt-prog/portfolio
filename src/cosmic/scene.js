import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const noiseGLSL=`
float hash3(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm3(vec3 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise3(p);p=p*2.03+13.4;a*=.5;}return n;}
`;
function seeded(seed=91025){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296}}
function addBarkRelief(material){
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec3 vR9Position;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvR9Position=position;');
    shader.fragmentShader='varying vec3 vR9Position;\n'+noiseGLSL+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float barkGrain=fbm3(vR9Position*vec3(17.,.85,17.));
      diffuseColor.rgb*=mix(.52,1.35,barkGrain);
    `).replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float heightR9=fbm3(vR9Position*vec3(27.,1.1,27.));
      vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
      vec3 r1=cross(sy,normal), r2=cross(normal,sx);
      float detR9=dot(sx,r1);
      normal=normalize(abs(detR9)*normal-sign(detR9)*(.012*dFdx(heightR9)*r1+.012*dFdy(heightR9)*r2));
    `);
  };
  material.customProgramCacheKey=()=> 'r9-bark-relief-1';
}

export async function createCosmicScene({container,hero,photos,reduced,onFailure}){
  let moving=!reduced,visible=true,inView=true,raf=0,previous=0,phase=0,disposed=false;
  const mobile=()=>container.clientWidth<700;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1:1.25));
  renderer.info.autoReset=false;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
  container.append(renderer.domElement);
  const gl=renderer.getContext();
  const debugExt=gl.getExtension('WEBGL_debug_renderer_info');
  const gpu=debugExt?gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#05080b');
  const camera=new THREE.PerspectiveCamera(32,1,.1,180);
  let basePosition=new THREE.Vector3(),target=new THREE.Vector3();
  const pointer=new THREE.Vector2(),smoothPointer=new THREE.Vector2();
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04, .1,100);scene.environment=environment.texture;scene.environmentIntensity=.3;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0x8799ac,0x302618,1.0));
  const key=new THREE.DirectionalLight(0xfff2da,2.0);key.position.set(0,15,12);key.target.position.set(6,5,0);scene.add(key,key.target);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-17,right:17,top:18,bottom:-12,near:1,far:70});key.shadow.bias=-.0003;key.shadow.normalBias=.035;
  const rim=new THREE.DirectionalLight(0x98b8d0,2.0);rim.position.set(-8,13,-9);scene.add(rim);
  const warm=new THREE.PointLight(0xffbb68,150,25,2);warm.position.set(6,5,3);scene.add(warm);
  const canopyLight=new THREE.PointLight(0xffdda8,300,25,2);canopyLight.position.set(4,11,-2);scene.add(canopyLight);

  // A procedural sky is independent of the locked image. All hero geometry is 3D.
  const skyUniforms={resolution:{value:new THREE.Vector2(1,1)},time:{value:0},shift:{value:new THREE.Vector2()}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(90,16,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:skyUniforms,toneMapped:false,vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:noiseGLSL+`
    uniform vec2 resolution;uniform float time;uniform vec2 shift;
    void main(){
      vec2 uv=gl_FragCoord.xy/resolution;
      vec2 p=(uv-.5)*vec2(resolution.x/resolution.y,1.);
      p+=shift;
      float angle=-.45; p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
      vec3 q=vec3(p*4.2,time*.004);
      float warp=fbm3(q+3.1);
      float smoke=fbm3(q+vec3(warp*2.7,warp*.8,2.));
      float veins=pow(max(0.,1.-abs(fbm3(q*1.6+warp*4.)-.47)*7.),3.);
      float belt=exp(-pow((p.x+.12+warp*.22)*3.8,2.));
      float haze=smoothstep(.3,.82,smoke)*belt;
      vec3 col=vec3(.006,.010,.015)+vec3(.16,.20,.23)*haze+vec3(.13,.16,.18)*veins*belt*.38;
      float sun=exp(-length((uv-vec2(.65,.64))*vec2(2.1,2.8))*6.);
      col+=vec3(.25,.18,.095)*sun;
      col*=.65+.35*smoothstep(1.1,.15,length(uv-.5));
      col*=mix(.06,1.,smoothstep(.26,.54,uv.y));
      gl_FragColor=vec4(col,1.);
    }`}));
  sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
  const random=seeded(),starPositions=[],starColors=[];
  for(let i=0;i<1800;i++){
    starPositions.push((random()-.5)*100,random()*45-5,-15-random()*40);
    const warmth=random();starColors.push(.48+.48*warmth,.55+.23*warmth,.67-.20*warmth);
  }
  const starsGeometry=new THREE.BufferGeometry();starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));starsGeometry.setAttribute('color',new THREE.Float32BufferAttribute(starColors,3));
  const stars=new THREE.Points(starsGeometry,new THREE.PointsMaterial({size:.035,vertexColors:true,transparent:true,opacity:.65,sizeAttenuation:true,depthWrite:false}));scene.add(stars);

  const gltf=await new GLTFLoader().loadAsync('models/cosmic-tree-r9.glb');
  const source=gltf.scene;source.updateMatrixWorld(true);
  const merged=new Map(),materialByName=new Map(),planetMeshes=[];
  const hasRefinement=!!source.getObjectByName('R9_TREE_twisted_trunk_roots_primary_limbs');
  if(!hasRefinement)throw new Error('Expected refined R9 model, refusing prototype substitution');
  source.traverse(obj=>{
    if(!obj.isMesh)return;
    const name=obj.name;
    const keep=name.startsWith('R9_')||name==='SPACE_planet_left'||name==='SPACE_horizon_planet'||name.includes('orbital_ring');
    if(!keep||name.includes('R9_GROUND_black_reflective'))return;
    const original=Array.isArray(obj.material)?obj.material[0]:obj.material;
    if(!original)return;
    if(name==='SPACE_planet_left'||name==='SPACE_horizon_planet'){
      const mesh=new THREE.Mesh(obj.geometry.clone(),new THREE.MeshStandardMaterial({color:0x18222b,roughness:.98,metalness:.08}));
      obj.matrixWorld.decompose(mesh.position,mesh.quaternion,mesh.scale);
      mesh.name=name;planetMeshes.push(mesh);scene.add(mesh);return;
    }
    const materialName=original.name||name;
    if(!materialByName.has(materialName)){
      const mat=original.clone();mat.side=THREE.FrontSide;
      if(/BARK/.test(materialName)){mat.color.set('#282e32');mat.metalness=.08;mat.roughness=.76;addBarkRelief(mat)}
      if(/TWIG/.test(materialName)){mat.color.set('#464a40');mat.metalness=.28;mat.roughness=.6}
      if(/LEAF/.test(materialName)){mat.color.set('#4e5344');mat.side=THREE.DoubleSide;mat.emissiveIntensity=.018;mat.metalness=.2;mat.roughness=.74}
      if(/GOLD/.test(materialName)){mat.color.set('#f3deb0');mat.emissive.set('#ffe4b3');mat.emissiveIntensity=.85}
      if(/GLINT/.test(materialName)){mat.emissiveIntensity=1.8;mat.side=THREE.DoubleSide}
      if(/ROCK/.test(materialName)){mat.color.set('#161c22');mat.roughness=.57;mat.metalness=.18;addBarkRelief(mat)}
      if(/TERRAIN/.test(materialName)){mat.color.set('#06090e');mat.roughness=1;mat.metalness=0;mat.envMapIntensity=.1}
      materialByName.set(materialName,mat);
    }
    let geometry=obj.geometry.clone().applyMatrix4(obj.matrixWorld);
    // Merge compatible static geometry by material, retaining editable parts in Blender.
    for(const attr of Object.keys(geometry.attributes))if(!['position','normal'].includes(attr))geometry.deleteAttribute(attr);
    if(!geometry.index)geometry.setIndex(Array.from({length:geometry.attributes.position.count},(_,i)=>i));
    geometry.clearGroups();
    if(!merged.has(materialName))merged.set(materialName,[]);merged.get(materialName).push(geometry);
  });
  const modelGroup=new THREE.Group();modelGroup.name='R9_refined_original_Blender_geometry';scene.add(modelGroup);
  for(const [name,geometries] of merged){
    const geometry=mergeGeometries(geometries,false);if(!geometry)throw new Error('Incompatible geometry for '+name);
    geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,materialByName.get(name));mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;modelGroup.add(mesh);geometries.forEach(g=>g.dispose());
  }
  // The source has no image textures at all; owner photographs remain separate.
  source.traverse(o=>{if(o.isMesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose())}});

  let floor;
  function updateGround(){
  const reflective=!mobile();
  if(floor?.userData.reflective===reflective)return;
  if(floor){scene.remove(floor);floor.geometry.dispose();if(floor.dispose)floor.dispose();else floor.material.dispose()}
  if(reflective){
    floor=new Reflector(new THREE.PlaneGeometry(140,70),{clipBias:.003,textureWidth:768,textureHeight:512,color:0x303439});
    floor.material.uniforms.color.value.set('#303439');floor.rotation.x=-Math.PI/2;floor.position.set(0,-.17,31);scene.add(floor);
    // Light surface noise makes the obsidian reflection less perfectly polished.
    floor.material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );','gl_FragColor = vec4( blendOverlay( base.rgb, color ) * .24, 1.0 );')};
  }else{floor=new THREE.Mesh(new THREE.PlaneGeometry(140,70),new THREE.MeshStandardMaterial({color:0x0c1116,metalness:.75,roughness:.22}));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.17,31);scene.add(floor)}
  floor.userData.reflective=reflective;
  }
  updateGround();
  // Orbital ring has physical depth and moves with the scene camera.
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(4.2,.009,4,180),new THREE.MeshBasicMaterial({color:0x9a7a48,transparent:true,opacity:.48}));orbit.position.set(-12.4,10.5,-15);orbit.rotation.set(1.25,.3,.15);orbit.scale.set(1.65,1,1);scene.add(orbit);

  const textureLoader=new THREE.TextureLoader();
  const frameGroups=await Promise.all(photos.map(async(p,index)=>{
    const texture=await textureLoader.loadAsync(`media/${p.file}`);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    const geometry=new THREE.PlaneGeometry(1,1,22,10),pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i);pos.setZ(i,.065*Math.sin(x*Math.PI*1.4))}geometry.computeVertexNormals();
    const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,toneMapped:false}));
    mesh.name=p.id;const group=new THREE.Group();group.add(mesh);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,80),new THREE.LineBasicMaterial({color:0xbfa16c,transparent:true,opacity:.65}));group.add(outline);
    group.userData={index,photo:p,mesh,anchor:hero.querySelector(`[data-slot="${p.id}"]`),home:new THREE.Vector3(),baseRotation:new THREE.Euler()};scene.add(group);return group;
  }));
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(800,450),.24,.55,1.02);composer.addPass(bloom);composer.addPass(new OutputPass());
  const wideLayout=[[.184,.395,.065,8], [.323,.352,.154,5], [.470,.535,.092,10], [.555,.660,.059,6], [.817,.498,.081,7], [.888,.59,.071,11]];
  const phoneLayout=[[.11,.34,.13,8],[.30,.32,.25,5],[.39,.57,.17,10],[.58,.66,.12,6],[.77,.40,.15,7],[.84,.62,.16,11]];
  const ray=new THREE.Ray(),direction=new THREE.Vector3(),point=new THREE.Vector3();
  function resize(){
    const width=container.clientWidth,height=container.clientHeight;
    updateGround();
    camera.aspect=width/height;camera.fov=mobile()?40:32;
    basePosition.set(mobile()?4:0,mobile()?9:8.5,mobile()?34:37);target.set(mobile()?4:0,mobile()?5:4.5,0);
    camera.position.copy(basePosition);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    renderer.setSize(width,height);composer.setSize(width,height);
    const bufferSize=new THREE.Vector2();renderer.getDrawingBufferSize(bufferSize);skyUniforms.resolution.value.copy(bufferSize);
    const layout=mobile()?phoneLayout:wideLayout;
    frameGroups.forEach((group,i)=>{
      const [x,y,w,z]=layout[i];direction.set(x*2-1,1-y*2,.5).unproject(camera).sub(camera.position).normalize();ray.set(camera.position,direction);ray.at((z-camera.position.z)/direction.z,point);group.position.copy(point);
      const distance=camera.position.distanceTo(point),worldHeight=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
      group.scale.set(worldHeight*camera.aspect*w,worldHeight*camera.aspect*w*photos[i].height/photos[i].width,1);
      group.rotation.set([-.03,.01,-.04,.02,.03,-.02][i],[-.28,.16,.22,-.14,-.38,.22][i],[-.12,-.05,-.08,-.03,.1,-.06][i]);
      group.userData.home.copy(group.position);group.userData.baseRotation.copy(group.rotation);
    });
    planetMeshes.forEach(p=>{if(p.name==='SPACE_planet_left'){p.visible=!mobile()}else{p.visible=true}});orbit.visible=!mobile();
    renderFrame();
  }
  const corner=new THREE.Vector3(),scratch=new THREE.Vector3();
  function projectButtons(){
    camera.updateMatrixWorld();
    for(const group of frameGroups){
      const data=group.userData;group.updateMatrixWorld(true);let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
      for(const x of [-.5,.5])for(const y of [-.5,.5]){corner.set(x,y,0).applyMatrix4(group.matrixWorld).project(camera);const sx=(corner.x*.5+.5)*container.clientWidth,sy=(-corner.y*.5+.5)*container.clientHeight;minX=Math.min(minX,sx);maxX=Math.max(maxX,sx);minY=Math.min(minY,sy);maxY=Math.max(maxY,sy)}
      Object.assign(data.anchor.style,{left:`${minX}px`,top:`${minY}px`,width:`${Math.max(24,maxX-minX)}px`,height:`${Math.max(24,maxY-minY)}px`});
    }
  }
  let frames=0,accumulated=0,qualityAdjusted=false;
  function renderFrame(){
    if(disposed)return;
    camera.position.copy(basePosition);camera.position.x+=smoothPointer.x*.6+Math.sin(phase*.23)*.38;camera.position.y+=smoothPointer.y*.24+Math.cos(phase*.23)*.09;camera.position.z+=Math.sin(phase*.17)*.35;
    scratch.copy(target);scratch.x+=smoothPointer.x*.1;camera.lookAt(scratch);
    frameGroups.forEach((g,i)=>{g.position.copy(g.userData.home);g.rotation.copy(g.userData.baseRotation);g.position.y+=Math.sin(phase*.35+i*1.24)*.12;g.position.z+=Math.sin(phase*.24+i)*.1;g.rotation.y+=Math.sin(phase*.31+i)*.028});
    skyUniforms.time.value=phase;skyUniforms.shift.value.set(smoothPointer.x*.008,smoothPointer.y*.004);
    const emissive=materialByName.get('R9_GOLD_living_veins');if(emissive)emissive.emissiveIntensity=.85+Math.sin(phase*.7)*.05;
    renderer.info.reset();composer.render();projectButtons();
    renderer.domElement.dataset.r9Metrics=JSON.stringify({state:'ready',sourceRevision:gltf.userData?.sourceRevision||gltf.parser.json.extras?.sourceRevision,modelMeshCount:modelGroup.children.length,independentSlots:frameGroups.map(g=>g.userData.photo.id),moving,reduced,gpu,camera:camera.position.toArray(),reflection:floor.userData.reflective,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frames,fps:accumulated?Math.round(frames/accumulated):null});
  }
  function tick(now){
    raf=0;if(disposed||!visible||!inView)return;
    const rawDt=previous?(now-previous)/1000:0,dt=Math.min(rawDt,.05);previous=now;
    if(moving){phase+=dt;frames++;accumulated+=rawDt;smoothPointer.lerp(pointer,.035)}
    if(!qualityAdjusted&&accumulated>3&&frames/accumulated<32){qualityAdjusted=true;renderer.setPixelRatio(Math.min(renderer.getPixelRatio(),.85));composer.setPixelRatio(renderer.getPixelRatio());resize();frames=0;accumulated=0}
    renderFrame();if(moving)raf=requestAnimationFrame(tick);
  }
  function schedule(){if(!raf&&visible&&inView&&!disposed){previous=0;raf=requestAnimationFrame(tick)}}
  const onPointer=e=>{if(reduced||e.pointerType==='touch')return;const r=hero.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));if(moving)schedule()};
  const onLeave=()=>pointer.set(0,0);hero.addEventListener('pointermove',onPointer);hero.addEventListener('pointerleave',onLeave);
  const onVisibility=()=>{visible=!document.hidden;if(!visible){cancelAnimationFrame(raf);raf=0}else schedule()};document.addEventListener('visibilitychange',onVisibility);
  const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;if(inView)schedule();else{cancelAnimationFrame(raf);raf=0}},{threshold:.01});observer.observe(hero);
  const resizeObserver=new ResizeObserver(()=>{resize();schedule()});resizeObserver.observe(container);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;cancelAnimationFrame(raf);hero.querySelectorAll('.floating-photo').forEach(a=>a.removeAttribute('style'));onFailure('The 3D context was lost. The still gallery remains available.')});
  renderer.shadowMap.needsUpdate=true;resize();schedule();
  return {isMoving:()=>moving,setMoving(value){moving=!!value;previous=0;if(!moving){cancelAnimationFrame(raf);raf=0;renderFrame()}else schedule()},setReduced(value){reduced=value;moving=!value;if(value){pointer.set(0,0);smoothPointer.set(0,0);cancelAnimationFrame(raf);raf=0;renderFrame()}else schedule()},dispose(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();document.removeEventListener('visibilitychange',onVisibility);hero.removeEventListener('pointermove',onPointer);hero.removeEventListener('pointerleave',onLeave);scene.traverse(o=>{o.geometry?.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.map?.dispose();m.dispose()})}});composer.dispose();environment.dispose();renderer.dispose()}};
}
