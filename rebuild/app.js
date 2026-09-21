(() => {
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const body=document.body, topbar=$('.topbar');
  addEventListener('scroll',()=>topbar?.classList.toggle('scrolled',scrollY>24),{passive:true});

  const menu=$('.menu'), drawer=$('.mobile-drawer'), drawerClose=$('.drawer-close');
  const setDrawer=(open)=>{if(!drawer||!menu)return;drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));menu.setAttribute('aria-expanded',String(open));body.style.overflow=open?'hidden':'';};
  menu?.addEventListener('click',()=>setDrawer(true)); drawerClose?.addEventListener('click',()=>setDrawer(false)); $$('.mobile-drawer a').forEach(a=>a.addEventListener('click',()=>setDrawer(false)));

  const hero=$('.hero');
  if(hero && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const tree=$('.tree-bg'), energy=$('.energy-lines'), thumbs=$$('.hero-thumb');
    hero.addEventListener('pointermove',e=>{
      if(innerWidth<901)return;
      const r=hero.getBoundingClientRect(), nx=(e.clientX-r.left)/r.width-.5, ny=(e.clientY-r.top)/r.height-.5;
      if(tree) tree.style.translate=`${nx*-10}px ${ny*-7}px`;
      if(energy) energy.style.translate=`${nx*-5}px ${ny*-4}px`;
      thumbs.forEach((t,i)=>{const d=4+(i%4)*1.4;t.style.translate=`${nx*d}px ${ny*d}px`;});
    });
    hero.addEventListener('pointerleave',()=>{
      if(tree) tree.style.translate='0 0'; if(energy) energy.style.translate='0 0'; thumbs.forEach(t=>t.style.translate='0 0');
    });
    for(let i=0;i<26;i++){
      const p=document.createElement('i'); p.className='particle';
      p.style.left=(18+(i*37)%66)+'%'; p.style.top=(12+(i*53)%68)+'%';
      p.style.setProperty('--dur',(4.4+(i%7)*.55)+'s'); p.style.setProperty('--op',(.25+(i%5)*.1).toFixed(2));
      p.style.setProperty('--dx',((-12+(i*11)%25))+'px'); p.style.setProperty('--dy',((-22-(i*7)%34))+'px');
      hero.appendChild(p);
    }
  }

  const audio=$('#site-audio'), sound=$('.sound-toggle');
  let audioStarted=false, fadeFrame=0;
  const fadeTo=(target,dur=1000)=>{
    if(!audio)return; cancelAnimationFrame(fadeFrame); const start=audio.volume, t0=performance.now();
    const tick=(t)=>{const k=Math.min(1,(t-t0)/dur);audio.volume=start+(target-start)*k;if(k<1)fadeFrame=requestAnimationFrame(tick);};
    fadeFrame=requestAnimationFrame(tick);
  };
  const startAudio=async()=>{
    if(!audio||audioStarted)return;
    try{audio.volume=0;await audio.play();audioStarted=true;if(sound){sound.dataset.on='true';sound.textContent='SOUND ON';}fadeTo(.32,1600);}
    catch(_){}
  };
  audio?.addEventListener('error',()=>{if(sound)sound.hidden=true;});
  const firstGesture=()=>{startAudio();removeEventListener('pointerdown',firstGesture,true);removeEventListener('keydown',firstGesture,true);};
  addEventListener('pointerdown',firstGesture,true);addEventListener('keydown',firstGesture,true);
  sound?.addEventListener('click',async e=>{
    e.stopPropagation();
    if(!audioStarted){await startAudio();return;}
    if(audio.paused){try{await audio.play();fadeTo(.32,700);sound.dataset.on='true';sound.textContent='SOUND ON';}catch(_){}}
    else{fadeTo(0,450);setTimeout(()=>{audio.pause();sound.dataset.on='false';sound.textContent='SOUND OFF';},470);}
  });

  const modal=$('.project-modal'), mediaModal=$('.media-modal');
  const modalTitle=modal?.querySelector('[data-project-title]'), modalCount=modal?.querySelector('[data-project-count]'), modalGrid=modal?.querySelector('.project-media-grid');
  const mediaImg=mediaModal?.querySelector('img'), mediaVideo=mediaModal?.querySelector('video');
  const lock=()=>body.style.overflow='hidden', unlock=()=>{if(!drawer?.classList.contains('open'))body.style.overflow='';};

  const closeMedia=()=>{
    if(!mediaModal)return; mediaModal.classList.remove('open');
    if(mediaVideo){mediaVideo.pause();mediaVideo.removeAttribute('src');mediaVideo.load();mediaVideo.hidden=true;}
    if(mediaImg){mediaImg.removeAttribute('src');mediaImg.hidden=true;}
    if(!modal?.classList.contains('open'))unlock();
  };
  const openImage=(src,alt='Portfolio image')=>{
    if(!mediaModal||!mediaImg)return; if(mediaVideo){mediaVideo.pause();mediaVideo.hidden=true;}
    mediaImg.src=src;mediaImg.alt=alt;mediaImg.hidden=false;mediaModal.classList.add('open');lock();
  };
  const openVideo=(video,poster,title)=>{
    if(!mediaModal||!mediaVideo)return;if(mediaImg)mediaImg.hidden=true;
    mediaVideo.src=video;mediaVideo.poster=poster||'';mediaVideo.hidden=false;mediaVideo.setAttribute('aria-label',title||'Portfolio video');mediaModal.classList.add('open');lock();mediaVideo.load();
  };
  const closeProject=()=>{if(!modal)return;modal.classList.remove('open');if(modalGrid)modalGrid.innerHTML='';unlock();};

  const renderProject=(project)=>{
    if(!modal||!modalGrid)return;
    modalTitle.textContent=project.title;
    modalCount.textContent=`${project.media.length} ${project.kind==='video'?'VIDEOS':'PHOTOS'}`;
    modalGrid.innerHTML='';
    project.media.forEach((m,i)=>{
      const b=document.createElement('button');b.type='button';b.className=project.kind==='video'?'project-video':'project-photo';
      const frame=document.createElement('span');frame.className='media-frame';
      const img=document.createElement('img');img.loading='lazy';img.src=project.kind==='video'?m.poster:m.src;img.alt=`${project.title} ${String(i+1).padStart(2,'0')}`;frame.appendChild(img);
      if(project.kind==='video'){const play=document.createElement('span');play.className='play-badge';play.textContent='▶';frame.appendChild(play);}
      const label=document.createElement('span');label.textContent=project.kind==='video'?m.label:`Photo ${String(i+1).padStart(2,'0')}`;
      b.append(frame,label);
      b.addEventListener('click',()=>project.kind==='video'?openVideo(m.video,m.poster,m.label):openImage(m.src,img.alt));
      modalGrid.appendChild(b);
    });
    modal.classList.add('open');lock();
  };

  const grid=$('.project-grid[data-category]');
  if(grid && window.PORTFOLIO_DATA){
    const key=grid.dataset.category, data=window.PORTFOLIO_DATA[key];
    if(data){
      const title=$('[data-page-title]'), sub=$('[data-page-subtitle]'), total=$('[data-page-total]');
      if(title)title.textContent=data.title;if(sub)sub.textContent=data.subtitle;if(total)total.textContent=`${data.total} ${key==='film'?'FILMS':'PHOTOS'} · ${data.projects.length} PROJECTS`;
      grid.innerHTML='';
      data.projects.forEach((p,i)=>{
        const card=document.createElement('button');card.type='button';card.className='project-card';
        card.innerHTML=`<img loading="lazy" src="${p.cover}" alt="${p.title} cover"><span class="meta"><small>${String(i+1).padStart(2,'0')}</small><h3>${p.title}</h3><span class="count">${p.media.length} ${p.kind==='video'?'VIDEOS':'PHOTOS'}</span></span>`;
        card.addEventListener('click',()=>renderProject(p));grid.appendChild(card);
      });
    }
  }

  $$('.modal-close').forEach(b=>b.addEventListener('click',()=>b.closest('.project-modal')?closeProject():closeMedia()));
  mediaModal?.addEventListener('click',e=>{if(e.target===mediaModal)closeMedia();});
  modal?.addEventListener('click',e=>{if(e.target===modal)closeProject();});
  addEventListener('keydown',e=>{if(e.key==='Escape'){if(mediaModal?.classList.contains('open'))closeMedia();else if(modal?.classList.contains('open'))closeProject();else if(drawer?.classList.contains('open'))setDrawer(false);}});
})();