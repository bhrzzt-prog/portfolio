export const photographs = [
  {id:'photo-far-left',file:'fashion_menswear_reflection.jpg',title:'Menswear Editorial',category:'fashion',label:'Fashion',width:1229,height:1536},
  {id:'photo-landscape-large',file:'fashion_black_editorial.jpg',title:'Black Editorial',category:'fashion',label:'Fashion',width:1152,height:1536},
  {id:'photo-portrait-center',file:'fashion_portrait.jpg',title:'Editorial Portrait',category:'fashion',label:'Fashion',width:1152,height:1536},
  {id:'photo-landscape-small',file:'sport_boxing.jpg',title:'Boxing Session',category:'sport',label:'Sports',width:1440,height:1800},
  {id:'photo-fold-right',file:'food_purple_drink.jpg',title:'Café Beverage',category:'food',label:'Commercial',width:1320,height:1762},
  {id:'photo-portrait-right',file:'portrait_menswear.jpg',title:'Menswear Portrait',category:'portrait',label:'Portrait',width:1024,height:1536},
  {file:'sport_rowing.jpg',title:'Rowing Training',category:'sport',label:'Sports'},
  {file:'food_red_drink.jpg',title:'Café in Red',category:'food',label:'Commercial'},
  {file:'portrait_creative_light.jpg',title:'Creative Light',category:'portrait',label:'Portrait'}
];
const films=[{file:'edsheeran.mp4',poster:'concert_edsheeran.jpg',title:'Ed Sheeran',label:'Live performance'},{file:'westlife.mp4',poster:'concert_westlife.jpg',title:'Westlife',label:'Live performance'},{file:'calumscott.mp4',poster:'concert_calumscott.jpg',title:'Calum Scott',label:'Live performance'}];
const dialog=document.querySelector('#media-dialog'),media=dialog.querySelector('.dialog-media');
let activePhoto=-1,lastTrigger,motionBeforeDialog=false;
function showMedia(item,index,trigger){
  activePhoto=index;
  if(!dialog.open){lastTrigger=trigger;motionBeforeDialog=sceneApi?.isMoving()||false;sceneApi?.setMoving(false);dialog.showModal();document.body.style.overflow='hidden'}
  media.querySelector('video')?.pause();media.replaceChildren();
  const el=document.createElement(item.poster?'video':'img');
  el.src=`media/${item.file}`;
  if(item.poster){el.controls=true;el.playsInline=true;el.preload='metadata';el.poster=`media/${item.poster}`;el.setAttribute('aria-label',item.title)}else{el.alt=item.title}
  media.append(el);document.querySelector('#media-title').textContent=item.title;document.querySelector('#media-kind').textContent=item.label;
  document.querySelector('.dialog-navigation').hidden=!!item.poster;
}
function openPhoto(index,trigger){showMedia(photographs[index],index,trigger)}
function changePhoto(delta){if(activePhoto>=0)openPhoto((activePhoto+delta+photographs.length)%photographs.length,lastTrigger)}
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{media.querySelector('video')?.pause();media.replaceChildren();document.body.style.overflow='';if(motionBeforeDialog&&!preference.matches)sceneApi?.setMoving(true);lastTrigger?.focus()});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();changePhoto(1)}if(e.key==='ArrowLeft'){e.preventDefault();changePhoto(-1)}});
document.querySelector('#previous-photo').addEventListener('click',()=>changePhoto(-1));document.querySelector('#next-photo').addEventListener('click',()=>changePhoto(1));
photographs.forEach((p,i)=>{
  const b=document.createElement('button');b.className='photo-card';b.dataset.category=p.category;b.innerHTML=`<span class="image-wrap"><img src="media/${p.file}" alt="${p.title}" loading="lazy" width="600" height="750"></span><span class="photo-caption"><strong>${p.title}</strong><span>${p.label} ↗</span></span>`;b.setAttribute('aria-label',`View ${p.title}`);b.addEventListener('click',()=>openPhoto(i,b));document.querySelector('#photo-grid').append(b);
  if(i<6){const f=document.createElement('button');f.className='floating-photo';f.dataset.slot=p.id;f.setAttribute('aria-label',`View ${p.title}`);f.innerHTML=`<img src="media/${p.file}" alt="" width="${p.width}" height="${p.height}">`;f.addEventListener('click',()=>openPhoto(i,f));document.querySelector('#floating-gallery').append(f)}
});
films.forEach(f=>{const b=document.createElement('button');b.className='film-card';b.setAttribute('aria-label',`Play ${f.title} film`);b.innerHTML=`<div class="film-poster"><img src="media/${f.poster}" alt="" loading="lazy" width="600" height="750"><span class="play-icon" aria-hidden="true">▷</span></div><h3>${f.title}</h3><p>${f.label}</p>`;b.addEventListener('click',()=>showMedia(f,-1,b));document.querySelector('#film-grid').append(b)});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelectorAll('.photo-card').forEach(x=>x.hidden=b.dataset.filter!=='all'&&b.dataset.filter!==x.dataset.category)}));
const menu=document.querySelector('.menu-toggle');
function closeMenu(){document.body.classList.remove('menu-open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=document.body.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open))});
document.querySelectorAll('#header-links a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('menu-open')){closeMenu();menu.focus()}});
const hero=document.querySelector('.hero'),toggle=document.querySelector('#motion-toggle'),status=document.querySelector('#scene-status');
const preference=matchMedia('(prefers-reduced-motion: reduce)');let sceneApi;
const forcedReduced=new URLSearchParams(location.search).has('reduced-motion');
if(forcedReduced)document.documentElement.classList.add('reduced-motion');
function fallBack(message){hero.classList.remove('scene-ready');toggle.disabled=true;toggle.innerHTML='Still gallery';status.textContent=message;window.__cosmic={state:'fallback',reason:message}}
// Dynamic import keeps the readable portfolio independent of WebGL and model loading.
if(new URLSearchParams(location.search).has('no-webgl'))fallBack('Still gallery mode. All photographs and films remain available.');
else import('./scene.js').then(async({createCosmicScene})=>{
  sceneApi=await createCosmicScene({container:document.querySelector('#scene'),hero,photos:photographs.slice(0,6),reduced:preference.matches||forcedReduced,onFailure:fallBack});
  hero.classList.add('scene-ready');status.textContent='Interactive 3D gallery loaded. Use the photograph buttons to view the original work.';
  const sync=()=>{const moving=sceneApi.isMoving();toggle.setAttribute('aria-pressed',String(moving));toggle.innerHTML=moving?'Pause motion <span aria-hidden="true">Ⅱ</span>':'Motion paused <span aria-hidden="true">▷</span>'};sync();
  toggle.addEventListener('click',()=>{sceneApi.setMoving(!sceneApi.isMoving());sync()});
  preference.addEventListener('change',e=>{sceneApi.setReduced(e.matches);sync()});
}).catch(error=>{console.error('Cosmic scene unavailable:',error);fallBack('The 3D scene could not load. All original photographs and films remain available.')});
