
(() => {
  'use strict';
  const page = document.getElementById('page');
  const orb = document.getElementById('orbButton');
  const zone = document.getElementById('orbitalZone');
  const stage = document.querySelector('.center-stage');
  const back = document.getElementById('sphereBack');
  const copy = document.getElementById('sphereCopy');
  const stats = document.getElementById('statsGrid');
  const hint = document.getElementById('closeSphere');
  const companySlot = document.getElementById('companySlot');
  const statsSlot = document.getElementById('statsSlot');
  const links = document.getElementById('linksPanel');
  const orbitField = document.getElementById('orbitField');
  const items = [...document.querySelectorAll('.orbit-item')];
  const storeButtons = new Map(
    [...links.querySelectorAll('.link-btn')].map(button => [button.dataset.brand, button])
  );
  // DOM references and trusted, static platform mapping. No API or URL input.
  const desktop = matchMedia('(min-width:1024px) and (min-height:700px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const fine = matchMedia('(hover:hover) and (pointer:fine)');
  const compact = matchMedia('(max-width:640px), (max-height:820px)');
  let open = false, angle = -Math.PI / 2, last = 0, raf = 0, layoutRaf = 0;
  let paused = false, radiusX = 0, radiusY = 0, lastDraw = 0;

  // Accessibility and open/closed state.
  function visibility(){
    links.inert = !open;
    links.setAttribute('aria-hidden', String(!open));
    back.inert = !open;
    back.setAttribute('aria-hidden', String(!open));
    companySlot.inert = !open;
    companySlot.setAttribute('aria-hidden', String(!open));
    statsSlot.inert = !open;
    statsSlot.setAttribute('aria-hidden', String(!open));
    orbitField.inert = open;
    orbitField.setAttribute('aria-hidden', String(open));
    orb.setAttribute('aria-expanded', String(open));
    orb.setAttribute('aria-label', open ? 'Voltar à esfera SellNeeds' : 'Explorar a SellNeeds e suas lojas');
  }
  function setOpen(next){
    if(!next && (companySlot.contains(document.activeElement) || back.contains(document.activeElement) || links.contains(document.activeElement))) orb.focus({preventScroll:true});
    // Move keyboard focus before hiding the orbital control with inert/ARIA.
    if(next && orbitField.contains(document.activeElement)) orb.focus({preventScroll:true});
    open = next;
    page.classList.toggle('is-back',open);
    visibility();
    scheduleLayout();
    restart();
  }
  // Responsive DOM placement and cached orbital geometry.
  function layout(){
    layoutRaf = 0;
    const focused = document.activeElement;
    page.classList.toggle('desktop-mode',desktop.matches);
    page.classList.remove('copy-external');
    const external = !desktop.matches;
    page.classList.toggle('cards-external',external);
    if(desktop.matches){
      if(links.previousElementSibling !== companySlot) companySlot.after(links);
      if(copy.parentElement !== companySlot) companySlot.append(copy);
      if(stats.parentElement !== copy) copy.insertBefore(stats,hint);
    } else {
      if(links.nextElementSibling !== companySlot) companySlot.before(links);
      if(copy.parentElement !== back) back.append(copy);
      if(external){if(stats.parentElement !== statsSlot) statsSlot.append(stats);}
      else if(stats.parentElement !== copy) copy.insertBefore(stats,hint);
      // No shrinking type to force content into a circle. Zoom and unusually
      // large font metrics get a normal-flow content panel instead.
      if(open){
        const size = orb.offsetWidth;
        if(copy.offsetHeight > size * .72 || copy.scrollWidth > copy.clientWidth + 1){
          page.classList.add('copy-external');
          companySlot.append(copy);
        }
      }
    }
    visibility();
    if(focused && focused !== document.body && focused.isConnected && !focused.closest('[inert]')) focused.focus({preventScroll:true});
    const node = items[0].offsetWidth;
    const size = orb.offsetWidth;
    // Bounds come from this column, never from the whole desktop viewport.
    radiusX = Math.max(0,Math.min(size * .64, (zone.clientWidth - node * 1.2) / 2 - 12));
    radiusY = Math.min(size * .535, (zone.clientHeight - node * 1.2) / 2 - 12);
    zone.style.setProperty('--orbit-width',radiusX * 2 + 'px');
    zone.style.setProperty('--orbit-height',radiusY * 2 + 'px');
    draw();
  }
  function scheduleLayout(){if(!layoutRaf) layoutRaf = requestAnimationFrame(layout);}
  // Animation frames write transforms only; no layout measurements here.
  function draw(){
    items.forEach((item,index)=>{
      const a = angle + index * Math.PI * 2 / items.length;
      const depth = (Math.sin(a) + 1) / 2;
      item.style.transform = `translate(${Math.cos(a)*radiusX}px,${Math.sin(a)*radiusY}px) scale(${.84+depth*.22})`;
      item.style.opacity = String(.55+depth*.45);
      item.style.zIndex = String(10+Math.round(depth*20));
    });
  }
  function animate(now){
    raf = 0;
    if(reduced.matches || document.hidden || open) return;
    const dt = last ? Math.min(now-last,40) : 0;
    last = now;
    if(!paused) angle += dt * .00014;
    if(fine.matches || now-lastDraw >= 1000/30){draw();lastDraw=now;}
    raf = requestAnimationFrame(animate);
  }
  function restart(){
    cancelAnimationFrame(raf);raf=0;last=0;
    if(!reduced.matches && !document.hidden && !open) raf=requestAnimationFrame(animate);
    else draw();
  }
  // Native controls, pointer and keyboard interaction.
  orb.addEventListener('click',()=>setOpen(!open));
  hint.addEventListener('click',()=>setOpen(false));
  back.addEventListener('click',event=>{if(event.target !== hint && !hint.contains(event.target)) setOpen(false);});
  orb.addEventListener('pointerdown',()=>orb.classList.add('is-pressing'));
  ['pointerup','pointercancel','pointerleave'].forEach(type=>orb.addEventListener(type,()=>orb.classList.remove('is-pressing')));
  items.forEach(item=>{
    ['pointerenter','focus'].forEach(type=>item.addEventListener(type,()=>paused=true));
    ['pointerleave','blur'].forEach(type=>item.addEventListener(type,()=>paused=false));
    item.addEventListener('click',()=>{
      setOpen(true);
      requestAnimationFrame(()=>{
        const target=storeButtons.get(item.dataset.brand);
        if(!target) return;
        target.focus({preventScroll:true});
        target.scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'});
      });
    });
  });
  function resetTilt(){stage.style.setProperty('--tilt-x','0deg');stage.style.setProperty('--tilt-y','0deg');}
  zone.addEventListener('pointermove',event=>{
    if(!fine.matches || reduced.matches || event.pointerType==='touch') return;
    const rect=zone.getBoundingClientRect();
    const strength=desktop.matches?12:6;
    stage.style.setProperty('--tilt-y',((event.clientX-rect.left)/rect.width-.5)*strength+'deg');
    stage.style.setProperty('--tilt-x',-((event.clientY-rect.top)/rect.height-.5)*strength*.7+'deg');
  });
  zone.addEventListener('pointerleave',resetTilt);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && open) setOpen(false);});
  document.addEventListener('visibilitychange',restart);
  [desktop,compact,fine,reduced].forEach(query=>query.addEventListener('change',()=>{resetTilt();scheduleLayout();restart();}));
  window.addEventListener('resize',scheduleLayout,{passive:true});
  // Coalesce size changes into one layout task.
  const observer=new ResizeObserver(scheduleLayout);
  observer.observe(orb);observer.observe(zone);
  if(document.fonts) document.fonts.ready.then(scheduleLayout);
  visibility();layout();
  requestAnimationFrame(()=>requestAnimationFrame(restart));
})();

