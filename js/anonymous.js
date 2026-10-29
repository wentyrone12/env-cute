/* W-Envelope Cute: shareable anonymous paper pages, visitor envelope composition, inbox delivery.
   Public designs in Firebase RTDB; Google Auth required only to send. */
(() => {
  'use strict';
  const themes = [
    {id:'blush',label:'Blush garden',a:'#fff0f6',b:'#f8dbea',mark:'🌸'},
    {id:'lavender',label:'Lilac dream',a:'#f6eeff',b:'#e3d8fc',mark:'🦋'},
    {id:'peach',label:'Peach honey',a:'#fff1df',b:'#ffdcd5',mark:'🍑'},
    {id:'mint',label:'Mint meadow',a:'#e6fff3',b:'#d4edf7',mark:'🌿'},
    {id:'sky',label:'Blue clouds',a:'#eaf8ff',b:'#d9e7ff',mark:'☁️'},
    {id:'night',label:'Starlight',a:'#433b6c',b:'#9b77a9',mark:'✨'},
    {id:'rose',label:'Rose milk',a:'#fce1e4',b:'#f5b6ce',mark:'🎀'},
    {id:'sunset',label:'Sunset kiss',a:'#ffecd7',b:'#f9bdc9',mark:'🌅',world:'sun'},
    {id:'aurora',label:'Aurora valley',a:'#092e43',b:'#66b49a',mark:'🌌',world:'aurora'},
    {id:'sakura',label:'Sakura canopy',a:'#e8aac1',b:'#8e688e',mark:'🌸',world:'petal'},
    {id:'moonlake',label:'Moonlit lake',a:'#142746',b:'#8299c5',mark:'🌙',world:'water'},
    {id:'amethyst',label:'Amethyst cave',a:'#2b1754',b:'#9460b0',mark:'💎',world:'crystal'},
    {id:'candy',label:'Candy clouds',a:'#ffaad3',b:'#ffdfad',mark:'🍬',world:'cloud'},
    {id:'cloudcastle',label:'Cloud castle',a:'#b7dffc',b:'#fcf5ed',mark:'🏰',world:'cloud'},
    {id:'oceanpearl',label:'Pearl ocean',a:'#13647e',b:'#a7dfdc',mark:'🐚',world:'water'},
    {id:'emerald',label:'Emerald forest',a:'#12472d',b:'#91ae78',mark:'🌲',world:'forest'},
    {id:'golden',label:'Golden palace',a:'#6d492a',b:'#e2bb6b',mark:'👑',world:'luxury'},
    {id:'cherry',label:'Cherry blossom path',a:'#bb6b80',b:'#f8d6be',mark:'🌷',world:'petal'},
    {id:'ice',label:'Crystal winter',a:'#91cce1',b:'#dff3ff',mark:'❄️',world:'crystal'},
    {id:'stardust',label:'Cosmic stardust',a:'#171641',b:'#b16ac5',mark:'🌟',world:'space'},
    {id:'rainbow',label:'Rainbow mist',a:'#ae8cdf',b:'#ffdcd7',mark:'🌈',world:'cloud'},
    {id:'rosequartz',label:'Rose quartz',a:'#9f5b7d',b:'#f9d2de',mark:'🩷',world:'crystal'},
    {id:'cottage',label:'Fairy cottage',a:'#365b3b',b:'#e6bc8b',mark:'🍄',world:'forest'},
    {id:'neon',label:'Neon garden',a:'#241447',b:'#a54ad9',mark:'🪄',world:'space'},
    {id:'coralreef',label:'Coral reef',a:'#1b7f99',b:'#ff9e8c',mark:'🪸',world:'water'},
    {id:'marble',label:'Pearl marble',a:'#d6c4cc',b:'#f6eee8',mark:'🕊️',world:'luxury'},
    {id:'lavacream',label:'Molten sunset',a:'#713b5c',b:'#ffad6a',mark:'🌋',world:'sun'},
    {id:'waterfall',label:'Hidden waterfall',a:'#165a5c',b:'#b0e0d6',mark:'💧',world:'water'},
    {id:'celestial',label:'Celestial sky',a:'#24264d',b:'#789dda',mark:'🔮',world:'space'},
    {id:'peony',label:'Peony dream',a:'#b55e8d',b:'#ffcad4',mark:'💐',world:'petal'},
    {id:'rainforest',label:'Rainforest canopy',a:'#19492e',b:'#a3c685',mark:'🌿',world:'forest'},
    {id:'honey',label:'Honey sunrise',a:'#b46b47',b:'#ffe8aa',mark:'🍯',world:'sun'},
    {id:'fireflies',label:'Firefly woods',a:'#173c38',b:'#86a985',mark:'✨',world:'forest'},
    {id:'silk',label:'Royal silk',a:'#5a356f',b:'#c5a0cc',mark:'🎀',world:'luxury'},
    {id:'glacier',label:'Glacier glow',a:'#43889d',b:'#e8faf6',mark:'🧊',world:'crystal'},
    {id:'dreamscape',label:'Dreamscape dawn',a:'#a470b9',b:'#fce7bb',mark:'🦄',world:'cloud'},
    {id:'pinkmoon',label:'Pink moon',a:'#433256',b:'#f7aac7',mark:'🌕',world:'space'},
    {id:'butterfly',label:'Butterfly meadow',a:'#80bd9d',b:'#e9caea',mark:'🦋',world:'petal'},
    {id:'opal',label:'Opal shimmer',a:'#7697b4',b:'#f4e2e9',mark:'💠',world:'crystal'},
    {id:'dusk',label:'Dusky panorama',a:'#4a4b7d',b:'#e8a3a8',mark:'🌄',world:'sun'}
  ];
  const $a=id=>document.getElementById(id);
  const defaults = () => ({heading:'Send me an anonymous message', subtitle:'Tell me something sweet, funny, or a secret you never got to say…', signature:'with love ♡', signatureAlign:'center', theme:'blush', paper:'#fffaf7', accent:'#bd6995', sticker:'💌', font:'dancing', typewriter:false, typeSpeed:'classic', photos:[], photo:''});
  const askPremium = () => typeof isPremium === 'function' && isPremium();
  const photoMax = () => askPremium() ? 5 : 1;
  const TYPE_SPEED={gentle:115,classic:72,quick:38};
  const animations=new WeakMap();
  const validPhoto=src=>typeof src==='string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src) && src.length<=170000;
  const getPhotos=item=>Array.isArray(item.photos)&&item.photos.length ? item.photos.filter(validPhoto).slice(0,5) : (validPhoto(item.photo)?[item.photo]:[]);
  const validCode = s => /^[a-z2-9]{12}$/.test(s);
  const genCode=()=> { const chars='abcdefghjkmnpqrstuvwxyz23456789', arr=crypto.getRandomValues(new Uint8Array(12)); return Array.from(arr,x=>chars[x%chars.length]).join(''); };
  let draft=defaults(), code='', activePublic=null, composing=false, draftEnvelope=null, saving=false, loading=0;
  let sending=false, pendingMessage='', activeLightbox=false;
  let pointers={}, unsubscribe=()=>{}, subscribedUid='';
  let studioUid='', dirty=false, restoreRequest=0, sheetOpen=false, sheetDismissed=false;
  const smallScreen=()=>window.matchMedia('(max-width:820px)').matches;
  const cacheKey=uid=>'wenv:ask-draft:v18:'+uid;
  function storeDraft(){
    if(!currentUser || !$a('askOwner') || $a('askOwner').hidden)return;
    try{localStorage.setItem(cacheKey(currentUser.uid),JSON.stringify({code,design:draft,dirty,at:Date.now()}));}
    catch(err){console.warn('Local draft backup unavailable',err);}
  }
  function restoreDraft(uid){
    try{
      const raw=JSON.parse(localStorage.getItem(cacheKey(uid))||'null');
      if(raw?.design && typeof raw.design==='object'){
        code=validCode(raw.code)?raw.code:'';draft=safeStyle(raw.design);dirty=raw.dirty===true;
        return true;
      }
    }catch(err){console.warn('Could not read saved editor draft',err);}
    return false;
  }
  function setSheet(open, dismissed=false){
    sheetOpen=!!open;sheetDismissed=!!dismissed;
    const card=$a('askToolCard'),reopen=$a('askSheetReopen');
    card.classList.toggle('is-collapsed',!sheetOpen);
    card.setAttribute('aria-hidden',String(!sheetOpen && smallScreen()));
    reopen.hidden=sheetOpen || !smallScreen() || $a('askOwner').hidden || document.body.classList.contains('ask-guest-mode');
    if(!smallScreen()){reopen.hidden=true;card.classList.remove('is-collapsed');card.setAttribute('aria-hidden','false');}
    card.style.removeProperty('--ask-sheet-drag');
    if(sheetOpen)card.scrollTop=0;
  }
  function stageTool(name){
    const same=document.querySelector('[data-ask-tool="'+name+'"]')?.classList.contains('on');
    tool(name);
    if(!smallScreen())return;
    if(sheetOpen){$a('askToolCard').scrollTop=0;return;}
    // Swiping/closing keeps the panel down while selecting other tools.
    // The Open editor pill (or tapping the currently selected tab) reopens it.
    if(!sheetDismissed || same)setSheet(true,false);
  }
  async function refreshStudioFromCloud(uid){
    const seq=++restoreRequest;
    if(!uid || !window.WENV_DB?.getAnonymousPage || dirty)return;
    try{
      let target=code;
      if(!target){
        const refs=Object.keys(pointers).filter(validCode);
        if(!refs.length && window.WENV_DB?.getAnonymousPointers){
          const cloud=await window.WENV_DB.getAnonymousPointers(uid);
          if(currentUser?.uid!==uid || seq!==restoreRequest || dirty)return;
          pointers={...cloud,...pointers};
        }
        target=Object.keys(pointers).filter(validCode).sort((a,b)=>(pointers[b]||0)-(pointers[a]||0))[0]||'';
      }
      if(!target)return;
      const page=await window.WENV_DB.getAnonymousPage(target);
      if(currentUser?.uid!==uid || seq!==restoreRequest || dirty || !page || page.ownerUid!==uid)return;
      code=target;draft=safeStyle(page.design);dirty=false;storeDraft();
      if(!$a('askOwner').hidden)fillForm();
    }catch(err){console.warn('Unable to restore published anonymous page',err);}
  }
  const getLink = c => location.origin + location.pathname + '#ask=' + encodeURIComponent(c);
  const cleanText=(value,max)=>String(value||'').trim().slice(0,max);
  const safeStyle=(item={})=>{
    const x={...defaults(), ...item}, photos=getPhotos(x);
    return {heading:cleanText(x.heading,75)||defaults().heading,subtitle:cleanText(x.subtitle,220),signature:cleanText(x.signature,55),signatureAlign:['left','center','right'].includes(x.signatureAlign)?x.signatureAlign:'center',theme:themes.some(t=>t.id===x.theme)?x.theme:'blush',paper:hexOk(x.paper)?x.paper:'#fffaf7',accent:hexOk(x.accent)?x.accent:'#bd6995',sticker:['💌','🎀','🌸','🧸','🦋','✨'].includes(x.sticker)?x.sticker:'💌',font:['dancing','caveat','pacifico','classic'].includes(x.font)?x.font:'dancing',typewriter:x.typewriter===true,typeSpeed:TYPE_SPEED[x.typeSpeed]?x.typeSpeed:'classic',photos,photo:photos[0]||''};
  };
  function show(which){
    document.body.classList.toggle('ask-guest-mode',which==='guest');
    $a('askOwner').hidden=which!=='owner';$a('askGuest').hidden=which!=='guest';$a('askToolbar').hidden=which!=='owner';
    $a('askSheetReopen').hidden=which!=='owner'||sheetOpen||!smallScreen();
    $a('askToolCard').setAttribute('aria-hidden',String(which!=='owner'||(!sheetOpen&&smallScreen())));
  }
  function sceneBackground(th){
    const world=th.world||'cloud';
    const layers={
      cloud:'radial-gradient(ellipse 44% 24% at 25% 75%,#ffffffe6 10%,transparent 75%),radial-gradient(ellipse 55% 30% at 85% 34%,#ffffffb0 10%,transparent 75%),',
      water:'radial-gradient(ellipse at 68% 74%,#ffffff91 0%,transparent 40%),repeating-linear-gradient(176deg,#ffffff18 0 3px,transparent 7px 26px),',
      space:'radial-gradient(circle at 26% 27%,#fffdf9 0 2px,transparent 4px),radial-gradient(circle at 78% 58%,#fffef7 0 2px,transparent 4px),radial-gradient(ellipse at 78% 10%,#e8bff7aa,transparent 55%),',
      forest:'radial-gradient(ellipse at 20% 112%,#062a2444 0 38%,transparent 70%),radial-gradient(ellipse at 82% 120%,#0a342a80 0 33%,transparent 70%),radial-gradient(ellipse at 25% -25%,#fffddf88,transparent 62%),',
      crystal:'conic-gradient(from 132deg at 65% 27%,transparent 0deg,#ffffff8a 38deg,transparent 67deg,#ffffff44 115deg,transparent 175deg),',
      luxury:'repeating-linear-gradient(125deg,transparent 0 22px,#ffffff26 23px 26px,transparent 27px 53px),radial-gradient(ellipse at 75% 12%,#fffbd59f,transparent 45%),',
      petal:'radial-gradient(ellipse 38% 25% at 16% 24%,#fffdff8f,transparent),radial-gradient(ellipse 38% 25% at 89% 84%,#ffdcf293,transparent),',
      aurora:'linear-gradient(118deg,transparent 23%,#9fffe266 37%,transparent 46%,#eaa3fd65 63%,transparent 75%),',
      sun:'radial-gradient(circle at 78% 18%,#fffbc5cc,transparent 28%),linear-gradient(0deg,#ae528040,transparent 54%),'
    };
    return (layers[world]||layers.cloud)+'radial-gradient(ellipse at 19% 14%,#ffffff88,transparent 42%),linear-gradient(142deg,'+th.a+','+th.b+')';
  }
  function animateHeading(el,value,s,guest){
    const timer=animations.get(el);if(timer)clearInterval(timer);
    if(!s.typewriter || !guest || matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=value;return;}
    el.textContent='';let index=0;const chars=Array.from(value);
    const id=setInterval(()=>{el.textContent+=chars[index++]||'';if(index>=chars.length){clearInterval(id);animations.delete(el);}},TYPE_SPEED[s.typeSpeed]||72);
    animations.set(el,id);
  }
  function renderGallery(id,s){
    const target=$a(id);if(!target)return;
    const pictures=getPhotos(s),existing=Array.from(target.querySelectorAll('img'));
    target.hidden=!pictures.length;target.classList.toggle('has-many',pictures.length>1);
    if(existing.length===pictures.length&&existing.every((img,i)=>img.getAttribute('src')===pictures[i]))return;
    target.replaceChildren(...pictures.map((src,i)=>{
      const button=document.createElement('button');button.type='button';button.className='ask-gallery-item';button.title='Enlarge picture '+(i+1);button.setAttribute('aria-label','Enlarge picture '+(i+1));
      const img=document.createElement('img');img.src=src;img.alt='Anonymous page photo '+(i+1);img.loading='lazy';
      button.append(img);return button;
    }));
  }
  function renderPhotoManager(){
    const target=$a('askPhotoThumbnails'),pictures=getPhotos(draft),max=photoMax();
    $a('askPhotoCounter').textContent=`${pictures.length}/${max} pictures · ${askPremium()?'Premium gallery up to 5 photos':'Upgrade to Premium for up to 5'}`;
    target.replaceChildren(...pictures.map((src,i)=>{
      const wrapper=document.createElement('div');wrapper.className='ask-photo-thumb';
      const img=document.createElement('img');img.src=src;img.alt='Uploaded photo '+(i+1);
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Remove photo '+(i+1);
      remove.addEventListener('click',()=>{draft.photos.splice(i,1);draft.photo=draft.photos[0]||'';draw(true);});
      wrapper.append(img,remove);return wrapper;
    }));
    const input=$a('askPhotoInput');input.disabled=pictures.length>=max;
    $a('askRemovePhoto').disabled=pictures.length===0;
  }
  function paint(stage,parts,design){
    const s=safeStyle(design),th=themes.find(t=>t.id===s.theme)||themes[0];
    stage.style.setProperty('--ask-a',th.a);stage.style.setProperty('--ask-b',th.b);
    stage.style.backgroundImage=sceneBackground(th);
    const paper=$a(parts.paper);paper.style.setProperty('--ask-sheet',s.paper);paper.style.setProperty('--ask-ink',s.accent);
    animateHeading($a(parts.heading),s.heading,s,parts.paper==='askPublicPaper');
    $a(parts.subtitle).textContent=s.subtitle;
    const sign=$a(parts.signature);sign.textContent=s.signature;sign.dataset.font=s.font;sign.dataset.align=s.signatureAlign;
    $a(parts.sticker).textContent=s.sticker;
    const img=$a(parts.image);img.hidden=true;img.removeAttribute('src');
    renderGallery(parts.paper==='askPaper'?'askPaperGallery':'askPublicGallery',s);
  }
  function draw(changed=false){draft=safeStyle(draft);paint($a('askStage'),{paper:'askPaper',heading:'askPaperHeading',subtitle:'askPaperSubtitle',signature:'askPaperSignature',sticker:'askSticker',image:'askPaperImage'},draft);updateThemeChecks();renderPhotoManager();if(changed){dirty=true;storeDraft();}}
  function fillForm(){
    $a('askHeading').value=draft.heading;$a('askSubtitle').value=draft.subtitle;$a('askSignature').value=draft.signature;
    $a('askPaperColor').value=draft.paper;$a('askAccentColor').value=draft.accent;$a('askStickerInput').value=draft.sticker;
    $a('askSignatureFont').value=draft.font;$a('askSignatureAlign').value=draft.signatureAlign;
    $a('askTypewriter').checked=draft.typewriter;$a('askTypeSpeed').value=draft.typeSpeed;
    $a('askTypewriter').disabled=!askPremium();$a('askTypeSpeed').disabled=!askPremium();
    draw();
  }
  function tool(name){
    document.querySelectorAll('[data-ask-panel]').forEach(x=>x.hidden=x.dataset.askPanel!==name);
    document.querySelectorAll('[data-ask-tool]').forEach(x=>{const active=x.dataset.askTool===name;x.classList.toggle('on',active);x.setAttribute('aria-pressed',String(active));});
    $a('askToolHeading').textContent=({text:'Customize your words',theme:'Pick a dreamy background',photo:'Your favorite picture',signature:'Sign your little note'})[name]||'Edit your paper';
  }
  const setHashClean=()=>{if(location.hash.startsWith('#ask='))history.replaceState(null,'',location.pathname+location.search);};
  function openStudio(){
    if(!currentUser){go('home');return;}
    if(studioUid!==currentUser.uid){
      studioUid=currentUser.uid;code='';draft=defaults();dirty=false;
      restoreDraft(studioUid);
    }
    setHashClean();show('owner');fillForm();tool('text');
    $a('askThemeGrid').querySelectorAll('[data-ask-theme]').forEach((btn,i)=>btn.classList.toggle('ask-theme-locked',i>=4&&!askPremium()));
    setSheet(false,false);go('ask');
    if(subscribedUid!==currentUser.uid)userChanged(currentUser);
    refreshStudioFromCloud(currentUser.uid);
  }
  function savedPagesHTML(){
    const ids=Object.keys(pointers).filter(validCode).sort((a,b)=>(pointers[b]||0)-(pointers[a]||0));
    if(code && !ids.includes(code))ids.unshift(code);
    return `<div class="ask-saved-head"><strong>My published pages</strong><small>Choose a page to edit or share</small></div><div class="ask-saved-cards">${ids.length?ids.map(id=>`<div class="ask-saved-item"><span><img class="wenv-inline-mark" src="assets/w-envelope-icon.png" alt=""> <strong>${id===code?'Current page':'Anonymous page'}</strong><small>${esc(id)}</small></span><div><button type="button" data-ask-edit="${esc(id)}" class="btn sec">Edit</button><button type="button" data-ask-share="${esc(id)}" class="btn pri">Share</button></div></div>`).join(''):'<p class="ask-no-saved">Save your first page to get a shareable link ♡</p>'}</div>`;
  }
  function renderSaved(){const node=$a('askModalSaved');if(node)node.innerHTML=savedPagesHTML();}
  function userChanged(user){
    if(!user){unsubscribe();unsubscribe=()=>{};subscribedUid='';studioUid='';code='';draft=defaults();dirty=false;restoreRequest++;pointers={};renderSaved();return;}
    if(subscribedUid===user.uid)return;
    unsubscribe();subscribedUid=user.uid;pointers={};renderSaved();
    if(!window.WENV_DB?.subscribeAnonymousPointers)return;
    unsubscribe=window.WENV_DB.subscribeAnonymousPointers(user.uid,data=>{if(currentUser?.uid!==user.uid)return;pointers=data||{};renderSaved();if(!$a('askOwner').hidden && !dirty && !code)refreshStudioFromCloud(user.uid);},err=>console.warn('Anonymous page list:',err));
  }
  async function editPage(c){
    if(!currentUser || !validCode(c))return;
    try{
      const page=await window.WENV_DB.getAnonymousPage(c);
      if(!page || page.ownerUid!==currentUser.uid)throw new Error('This page does not belong to your account.');
      code=c;draft=safeStyle(page.design);dirty=false;studioUid=currentUser.uid;openStudio();storeDraft();closeModal();toast('Editing your published page ♡');
    }catch(err){console.error(err);toast('Unable to open that page. Check your cloud connection.');}
  }
  function popupShare(c){
    const link=getLink(c);
    modal(`<div class="ask-share-modal"><div class="ask-modal-brand"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><h2>${dirty?'Share your anonymous page':'Your anonymous link is ready!'}</h2><p>Your page is cloud-saved. Edit it anytime, then press Save & Share again to update this same link.</p><div class="ask-link-row"><input id="askShareLink" readonly aria-label="Public anonymous link" value="${esc(link)}"><button class="btn pri" id="askCopyLink" type="button">Copy</button></div><div class="ask-modal-actions"><button type="button" class="btn sec" id="askNativeShare">↗ Share link</button><button type="button" class="btn sec" id="askPreviewLink">Preview</button></div><p class="ask-share-warning">Anyone with this link can see your page and send an envelope after Google sign-in.</p><div class="ask-modal-saved" id="askModalSaved">${savedPagesHTML()}</div><button class="btn sec wide" type="button" id="askShareOpenInbox">View anonymous messages</button></div>`);
    $a('askCopyLink').onclick=()=>copyLink(link);
    $a('askShareOpenInbox').onclick=()=>{closeModal();go('dash');$a('askOpenMessages').click();};
    $a('askNativeShare').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'Send me an anonymous envelope',url:link});}catch(err){if(err?.name!=='AbortError')copyLink(link);}}else copyLink(link);};
    $a('askPreviewLink').onclick=()=>window.open(link,'_blank','noopener,noreferrer');
    $a('askModalSaved').addEventListener('click',e=>{
      const edit=e.target.closest('[data-ask-edit]');if(edit){if(dirty){toast('Save your changes before switching pages ♡');return;}editPage(edit.dataset.askEdit);return;}
      const share=e.target.closest('[data-ask-share]');if(share)popupShare(share.dataset.askShare);
    });
  }
  async function copyLink(link){try{await navigator.clipboard.writeText(link);toast('Link copied! ♡');}catch{const input=$a('askShareLink');input.focus();input.select();toast('Select and copy the link above ♡');}}
  async function saveShare(){
    if(saving || !currentUser)return toast('Sign in to create a public page.');
    if(!window.WENV_DB?.claimAnonymousPage)return toast('Firebase is still loading.');
    draft.heading=$a('askHeading').value;draft.subtitle=$a('askSubtitle').value;draft.signature=$a('askSignature').value;draft.paper=$a('askPaperColor').value;draft.accent=$a('askAccentColor').value;draft.sticker=$a('askStickerInput').value;draft.font=$a('askSignatureFont').value;draft.signatureAlign=$a('askSignatureAlign').value;draft.typewriter=$a('askTypewriter').checked;draft.typeSpeed=$a('askTypeSpeed').value;
    draft=safeStyle(draft);draw();
    if(!askPremium() && (draft.photos.length>1||draft.typewriter||themes.findIndex(t=>t.id===draft.theme)>=4)){
      return modal('<div class="big">🔒</div><h2>Premium design selected</h2><p>To save on Free, choose one of the first four backgrounds, use a single picture, and switch off typewriter. Or upgrade to Premium to publish the complete design.</p><button class="btn pri wide" onclick="closeModal();go(\'settings\');setSettingsPage(\'subscription\')">View Premium</button>');
    }
    saving=true;
    const b=$a('askSaveShare');b.disabled=true;b.innerHTML='<span class="ask-button-spinner"></span> Saving…';
    try{
      let chosen=code, saved=false;
      let ownerUsername='';
      try{
        const profile=await window.WENV_DB.getMyProfile(currentUser.uid);
        if(/^[a-z0-9_]{3,20}$/.test(profile?.username||''))ownerUsername=profile.username;
      }catch(err){console.warn('Owner username unavailable',err);}
      for(let tries=0;tries<5&&!saved;tries++){
        chosen=chosen || genCode();
        saved=await window.WENV_DB.claimAnonymousPage(chosen,draft,currentUser.uid,ownerUsername);
        if(!saved)chosen='';
      }
      if(!saved)throw new Error('Could not generate a unique page link.');
      code=chosen;await window.WENV_DB.saveAnonymousPointer(currentUser.uid,code);
      dirty=false;storeDraft();pointers[code]=Date.now();renderSaved();popupShare(code);burst($a('askPaper'),14);
    }catch(err){console.error('Save public page failed:',err);modal(`<div class="big">🥺</div><h2>Could not save your page</h2><p>${esc(err?.message||'Check Firebase connection and rules.')}</p><p>Deploy the included database.rules.json rules in Firebase first. Your design is still on this page.</p><button class="btn pri wide" onclick="closeModal()">Back to design</button>`);}
    finally{saving=false;b.disabled=false;b.innerHTML='<span>↗</span> Save & Share';}
  }
  async function openPublic(c){
    if(!validCode(c))return showPublicError('That page link is not valid.');
    activePublic=null;closeGuestComposer();show('guest');go('ask');$a('askGuestMessage').value='';updateMessageCount();$a('askPublicUsername').textContent='Loading…';$a('askGuestUsername').disabled=true;$a('askPublicHeading').textContent='Opening your secret page…';$a('askStartEnvelope').disabled=true;$a('askGuestLaunch').disabled=true;
    const seq=++loading;
    try{
      if(!window.WENV_DB?.getAnonymousPage)throw new Error('Firebase is not ready. Please reload.');
      const raw=await window.WENV_DB.getAnonymousPage(c);
      if(seq!==loading||location.hash!=='#ask='+c)return;
      if(!raw?.ownerUid || !raw?.design)throw new Error('This page does not exist or is unavailable.');
      activePublic={code:c,ownerUid:raw.ownerUid,ownerUsername:/^[a-z0-9_]{3,20}$/.test(raw.ownerUsername||'')?raw.ownerUsername:'',design:safeStyle(raw.design)};
      $a('askPublicUsername').textContent=activePublic.ownerUsername?'@'+activePublic.ownerUsername:'Anonymous friend';
      $a('askGuestUsername').disabled=!activePublic.ownerUsername;
      paint($a('askPublicStage'),{paper:'askPublicPaper',heading:'askPublicHeading',subtitle:'askPublicSubtitle',signature:'askPublicSignature',sticker:'askPublicSticker',image:'askPublicImage'},activePublic.design);
      $a('askStartEnvelope').disabled=false;$a('askGuestLaunch').disabled=false;
    }catch(err){if(seq!==loading)return;console.warn(err);showPublicError(err.message||'Could not load the page');}
  }
  function showPublicError(message){show('guest');go('ask');$a('askPublicUsername').textContent='Unavailable';$a('askGuestUsername').disabled=true;$a('askPublicHeading').textContent='Oops, page unavailable ♡';$a('askPublicSubtitle').textContent=message;$a('askStartEnvelope').disabled=true;$a('askGuestLaunch').disabled=true;}
  let routedHash='';
  function checkHash(){
    if(!location.hash.startsWith('#ask='))return false;
    let c='';try{c=decodeURIComponent(location.hash.slice(5));}catch{showPublicError('The link contains invalid characters.');return true;}
    if(!validCode(c)){showPublicError('The link format looks incorrect.');return true;}
    if(activePublic?.code===c && $a('askGuest').hidden===false){go('ask');return true;}
    if(routedHash!==c || !$a('askGuest').hidden){routedHash=c;openPublic(c);}else{show('guest');go('ask');}
    return true;
  }
  function openGuestComposer(){
    if(!activePublic)return;
    $a('askGuestForm').hidden=false;$a('askComposerShade').hidden=false;
    document.body.classList.add('ask-guest-composing');
    $a('askGuestMessage').focus({preventScroll:true});
  }
  function closeGuestComposer(){
    $a('askGuestForm').hidden=true;$a('askComposerShade').hidden=true;
    document.body.classList.remove('ask-guest-composing');
  }
  // Direct anonymous textarea flow: always present Google + nickname dialogs,
  // even if there was a signed-in Google account before opening this link.
  function cancelCompose(){
    composing=false;draftEnvelope=null;document.body.classList.remove('ask-composing');
    $a('anonComposeBack').hidden=true;$a('anonSendDock').hidden=true;
  }
  function updateMessageCount(){
    const el=$a('askGuestMessage'),count=$a('askMessageCount');
    count.textContent=el.value.length+' / 600';
    count.classList.toggle('near-limit',el.value.length>540);
  }
  function startCompose(){
    if(sending)return;
    if(!activePublic)return toast('This page has not finished loading.');
    if(currentUser?.uid===activePublic.ownerUid)return toast('You cannot send a message to your own anonymous page.');
    const text=cleanText($a('askGuestMessage').value,600);
    if(text.length<2){toast('Type at least 2 characters for your message ♡');$a('askGuestMessage').focus();return;}
    pendingMessage=text;
    signInModal();
  }
  function signInModal(){
    if(!pendingMessage || !activePublic)return;
    closeGuestComposer();
    modal(`<div class="ask-send-modal ask-auth-step"><div class="ask-modal-brand"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><span class="ask-dialog-step">STEP 1 OF 2</span><h2>Continue with Google</h2><p>Sign in to send your note safely — even if you already have an account. Only the anonymous nickname you choose next will appear on the envelope.</p><button class="google-button" id="askGoogleLogin" type="button"><span class="google-mark">G</span><span>Continue with Google</span></button><p class="ask-modal-status" id="askLoginStatus" role="status" aria-live="polite"></p><button class="btn sec wide" type="button" id="askCancelLogin">Cancel</button></div>`);
    $a('askCancelLogin').onclick=()=>closeModal();
    $a('askGoogleLogin').onclick=async()=>{
      const button=$a('askGoogleLogin'),status=$a('askLoginStatus');
      if(!window.WENV_AUTH?.signIn){status.textContent='Google sign-in is not ready. Please reload the page.';return;}
      if(location.protocol==='file:'){status.textContent='Use Firebase Hosting or localhost for Google sign-in.';return;}
      button.disabled=true;status.textContent='Opening Google account selection…';
      const targetCode=activePublic?.code;
      try{
        const credential=await window.WENV_AUTH.signIn();
        const signedUid=credential?.user?.uid;
        if(!signedUid)throw new Error('No Google account was selected.');
        if(currentUser?.uid!==signedUid){
          await new Promise((resolve,reject)=>{
            const onReady=e=>{if(e.detail?.uid===signedUid){clearTimeout(timer);document.removeEventListener('wenv-user-ready',onReady);resolve();}};
            document.addEventListener('wenv-user-ready',onReady);
            const timer=setTimeout(()=>{document.removeEventListener('wenv-user-ready',onReady);reject(new Error('Please retry after sign-in finishes.'));},6500);
            if(currentUser?.uid===signedUid){clearTimeout(timer);document.removeEventListener('wenv-user-ready',onReady);resolve();}
          });
        }
        if(targetCode!==activePublic?.code)return;
        if(signedUid===activePublic?.ownerUid){status.textContent='You cannot send to your own anonymous page.';return;}
        nicknameModal();
      }catch(err){
        console.error('Anonymous Google sign-in failed:',err);
        if(status.isConnected)status.textContent=err?.code==='auth/popup-closed-by-user'?'Sign-in cancelled. Try again.':err?.code==='auth/unauthorized-domain'?'Add this domain in Firebase Authentication → Authorized domains.':(err?.message||'Could not sign in. Please retry.');
      }finally{if(button.isConnected)button.disabled=false;}
    };
  }
  function nicknameModal(){
    modal(`<div class="ask-send-modal ask-nick-step"><div class="ask-modal-brand"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><span class="ask-dialog-step">STEP 2 OF 2</span><h2>Choose your anonymous name</h2><p>Choose a nickname, then how privately to send. Google sign-in alone never permits revealing your email.</p><label for="askNick">Anonymous username<input id="askNick" maxlength="40" minlength="2" placeholder="e.g. secret_admirer" autocomplete="off" value=""></label><p id="askSendStatus" class="ask-modal-status" role="status" aria-live="polite"></p><button class="btn pri wide" id="askConfirmSend" type="button">Send privately</button><div class="ask-consent-choice"><strong>Optional: reveal my Gmail after payment</strong><p>If you choose this, the page owner can pay ₱10 and, after admin approval, see the Google email you signed in with. This is not anonymous to that recipient after approval.</p><button class="btn sec wide" id="askAllowRevealSend" type="button">I agree — send & allow email reveal</button></div><button class="btn sec wide" id="askGoBack" type="button">Back</button></div>`);
    $a('askConfirmSend').onclick=()=>deliver(false);
    $a('askAllowRevealSend').onclick=()=>deliver(true);
    $a('askNick').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();deliver(false);}});
    $a('askGoBack').onclick=signInModal;
    $a('askNick').focus({preventScroll:true});
  }
  function beginSend(){startCompose();}
  function shortEnvelope(text,alias){
    const nowIso=new Date().toISOString();
    return clean({
      id:uid(),title:'A little anonymous secret',from:alias,
      coverText:'For you, with a little mystery ♡',envelopeColor:'#e7a3c6',createdAt:nowIso,
      paperMagic:{typewriter:true,pageTurn:true,bouquetIntro:false},
      signature:{text:'with a little mystery ♡',style:0,align:'right'},
      pages:[{text,color:'#fff6fa',photos:[],effect:'hearts',photoStyle:'classic',photoLayout:'single'}]
    });
  }
  async function deliver(allowEmailReveal=false){
    if(sending || !activePublic || !currentUser || !pendingMessage)return;
    const alias=cleanText($a('askNick')?.value,40);
    if(alias.length<2){$a('askSendStatus').textContent='Enter at least 2 characters for your anonymous nickname.';return;}
    if(currentUser.uid===activePublic.ownerUid){$a('askSendStatus').textContent='You cannot message your own page.';return;}
    // Consent is an explicit sender action, not inferred from Google authentication.
    if(allowEmailReveal && (!currentUser.email || !currentUser.emailVerified)){
      $a('askSendStatus').textContent='A verified Google email is required if you choose identity reveal. You can still send privately.';return;
    }
    sending=true;
    modal('<div class="ask-send-loading" role="status" aria-live="polite"><div class="ask-loader"><img src="assets/w-envelope-icon.png" alt=""></div><h2>Sending your little secret…</h2><p>Your message is on its way.</p></div>');
    let consentSaved=false,consentOwner='',consentMessageId='';
    try{
      const targetCode=activePublic.code;
      const live=await window.WENV_DB.getAnonymousPage(targetCode);
      if(!live || live.ownerUid!==activePublic.ownerUid)throw new Error('This page is no longer available.');
      const envelope=shortEnvelope(pendingMessage,alias);
      if(!envelope)throw new Error('Unable to prepare your message.');
      const messageId=window.WENV_DB.newAnonymousMessageId(live.ownerUid);
      // Consent is stored in a separate, restricted Firebase location before the
      // message. Owner cannot read it until an admin-approved payment exists.
      if(allowEmailReveal){
        await window.WENV_DB.saveAnonymousConsent(live.ownerUid,messageId,targetCode,currentUser.email);
        consentSaved=true;consentOwner=live.ownerUid;consentMessageId=messageId;
      }
      await window.WENV_DB.sendAnonymousEnvelope(live.ownerUid,{
        title:envelope.title,from:alias,senderMode:'anonymous',anonymous:true,
        anonymousPageCode:targetCode,recipientUid:live.ownerUid,
        identityOptIn:allowEmailReveal,receivedAt:new Date().toISOString(),envelope
      },messageId);
      consentSaved=false;
      pendingMessage='';closeGuestComposer();$a('askGuestMessage').value='';updateMessageCount();
      closeModal();history.replaceState(null,'',location.pathname+location.search);
      document.body.classList.remove('guest-receiving');
      $a('askWelcome').hidden=false;
      $a('askWelcomeContinue').focus({preventScroll:true});
    }catch(err){
      if(consentSaved){try{await window.WENV_DB.revokeAnonymousConsent(consentOwner,consentMessageId);}catch(cleanupErr){console.warn('Consent cleanup failed:',cleanupErr);}}
      console.error('Anonymous message failed:',err);
      modal(`<div class="ask-send-modal"><div class="ask-modal-brand"><img src="assets/w-envelope-icon.png" alt="W-Envelope Cute"></div><h2>Message not delivered</h2><p>${esc(err?.message||'Please check your connection.')}</p><p>Your message is still in the editor, so you can try again.</p><button class="btn pri wide" type="button" id="askRetry">Try again</button><button class="btn sec wide" type="button" id="askSendClose">Cancel</button></div>`);
      $a('askRetry').onclick=nicknameModal;$a('askSendClose').onclick=closeModal;
    }finally{sending=false;}
  }
  function closeLightbox(){
    const box=$a('askPhotoLightbox');box.hidden=true;activeLightbox=false;
    $a('askPhotoLightboxImage').removeAttribute('src');
  }
  function openLightbox(img){
    if(img.hidden || !img.src)return;
    $a('askPhotoLightboxImage').src=img.src;
    $a('askPhotoLightbox').hidden=false;activeLightbox=true;
    $a('askPhotoLightboxClose').focus({preventScroll:true});
  }
  function dragSheet(){
    const card=$a('askToolCard'),handle=$a('askSheetHandle'),reopen=$a('askSheetReopen');
    let active=null,ignoreClick=false;
    function reset(){card.classList.remove('is-dragging');card.style.removeProperty('--ask-sheet-drag');reopen.style.removeProperty('--ask-reopen-drag');}
    function attach(element,opening){
      element.addEventListener('pointerdown',e=>{
        if(!smallScreen() || e.button!==0 || e.target.closest('button') && e.target!==reopen)return;
        active={id:e.pointerId,opening,startY:e.clientY,lastY:e.clientY,started:performance.now(),moved:false};
        element.setPointerCapture?.(e.pointerId);
        card.classList.add('is-dragging');
      });
      element.addEventListener('pointermove',e=>{
        if(!active || e.pointerId!==active.id)return;
        const delta=e.clientY-active.startY;
        if(Math.abs(delta)>7)active.moved=true;
        if(!active.moved)return;
        if(active.opening){reopen.style.setProperty('--ask-reopen-drag',Math.min(10,Math.max(-135,delta))+'px');}
        else{card.style.setProperty('--ask-sheet-drag',Math.min(220,Math.max(-85,delta))+'px');}
      });
      const finish=(e)=>{
        if(!active || e.pointerId!==active.id)return;
        const state=active;active=null;
        const dy=e.clientY-state.startY,elapsed=Math.max(performance.now()-state.started,70);
        const moved=state.moved;
        reset();
        if(moved){ignoreClick=true;setTimeout(()=>{ignoreClick=false;},250);}
        if(state.opening){if(dy< -34 || (moved && dy< -15 && -dy/elapsed>.30))setSheet(true,false);}
        else if(dy>65 || (moved && dy>25 && dy/elapsed>.45))setSheet(false,true);
        else setSheet(true,false);
      };
      element.addEventListener('pointerup',finish);
      element.addEventListener('pointercancel',()=>{active=null;reset();});
    }
    attach(handle,false);attach(reopen,true);
    reopen.addEventListener('click',e=>{if(ignoreClick){e.preventDefault();e.stopImmediatePropagation();}},true);
  }
  function premiumNotice(message){
    modal(`<div class="big">🔒</div><h2>Premium design</h2><p>${message}</p><div class="row"><button class="btn sec" onclick="closeModal()">Not now</button><button class="btn pri" onclick="closeModal();go('settings');setSettingsPage('subscription')">✦ View Premium</button></div>`);
  }
  async function compressAskPhoto(file){
    const raw=await compressPhoto(file);
    if(raw.length<=85000)return raw;
    return await new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>{
        const cvs=document.createElement('canvas');let scale=Math.min(1,360/Math.max(image.width,image.height));
        for(let attempt=0;attempt<7;attempt++){
          cvs.width=Math.max(80,Math.round(image.width*scale));cvs.height=Math.max(80,Math.round(image.height*scale));
          cvs.getContext('2d').drawImage(image,0,0,cvs.width,cvs.height);
          const out=cvs.toDataURL('image/jpeg',Math.max(.35,.68-attempt*.05));
          if(out.length<=85000){resolve(out);return;}scale*=.78;
        }
        reject(new Error('Unable to fit photo inside the cloud gallery limit.'));
      };image.onerror=()=>reject(new Error('Invalid image'));image.src=raw;
    });
  }
  function init(){
    $a('openAnonymousStudio').onclick=()=>openStudio();
    $a('askBackToMailbox').onclick=()=>{go('dash');};
    const themesNode=$a('askThemeGrid');
    themesNode.innerHTML=themes.map((t,i)=>`<button type="button" data-ask-theme="${t.id}" class="${i>=4&&!askPremium()?'ask-theme-locked':''}" style="--as-a:${t.a};--as-b:${t.b}" aria-label="${esc(t.label)}${i>=4?' Premium':''}"><span>${t.mark}</span><small>${t.label}${i>=4?' ✦':' · Free'}</small></button>`).join('');
    themesNode.onclick=e=>{const btn=e.target.closest('[data-ask-theme]');if(!btn)return;const i=themes.findIndex(t=>t.id===btn.dataset.askTheme);if(i>=4&&!askPremium())return premiumNotice('Unlock the complete 3D-inspired background collection with Premium.');draft.theme=btn.dataset.askTheme;draw(true);updateThemeChecks();};
    $a('askHeading').addEventListener('input',e=>{draft.heading=e.target.value;draw(true);});
    $a('askSubtitle').addEventListener('input',e=>{draft.subtitle=e.target.value;draw(true);});
    $a('askSignature').addEventListener('input',e=>{draft.signature=e.target.value;draw(true);});
    $a('askPaperColor').addEventListener('input',e=>{draft.paper=e.target.value;draw(true);});
    $a('askAccentColor').addEventListener('input',e=>{draft.accent=e.target.value;draw(true);});
    $a('askStickerInput').addEventListener('change',e=>{draft.sticker=e.target.value;draw(true);});
    $a('askSignatureFont').addEventListener('change',e=>{draft.font=e.target.value;draw(true);});
    $a('askSignatureAlign').addEventListener('change',e=>{draft.signatureAlign=e.target.value;draw(true);});
    $a('askTypewriter').addEventListener('change',e=>{if(!askPremium()){e.target.checked=false;return premiumNotice('Animated typewriter headings are Premium.');}draft.typewriter=e.target.checked;draw(true);});
    $a('askTypeSpeed').addEventListener('change',e=>{if(!askPremium())return premiumNotice('Typewriter effects are Premium.');draft.typeSpeed=e.target.value;draw(true);});
    $a('askPhotoInput').addEventListener('change',async e=>{
      const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
      if(draft.photos.length+files.length>photoMax())return premiumNotice(askPremium()?'Your page can contain up to 5 photos.':'Free allows 1 photo. Premium lets you upload up to 5 pictures.');
      if(files.some(file=>!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>7*1024*1024))return toast('Use JPG, PNG or WebP pictures under 7 MB each.');
      const input=$a('askPhotoInput');input.disabled=true;
      try{
        const pictures=[];for(const file of files)pictures.push(await compressAskPhoto(file));
        draft.photos.push(...pictures);draft.photo=draft.photos[0]||'';draw(true);toast(pictures.length+' picture(s) added ♡');
      }catch(err){console.warn(err);toast('Could not prepare all pictures. Try smaller files.');}
      finally{renderPhotoManager();}
    });
    $a('askRemovePhoto').onclick=()=>{draft.photos=[];draft.photo='';draw(true);toast('Pictures removed');};
    for(const targetId of ['askPaperGallery','askPublicGallery']){
      $a(targetId).addEventListener('click',e=>{
        const img=e.target.closest('button.ask-gallery-item')?.querySelector('img');if(img)openLightbox(img);
      });
    }
    document.querySelectorAll('[data-ask-tool]').forEach(b=>b.onclick=()=>stageTool(b.dataset.askTool));
    $a('askSheetClose').onclick=()=>setSheet(false,true);
    $a('askSheetReopen').onclick=()=>{if(!$a('askOwner').hidden)setSheet(true,false);};
    // Drag the top grip down to dismiss; swipe the collapsed grip up to reopen.
    dragSheet();
    window.matchMedia('(max-width:820px)').addEventListener('change',()=>setSheet(sheetOpen,sheetDismissed));
    $a('askSaveShare').onclick=saveShare;
    $a('askGuestLaunch').onclick=openGuestComposer;
    $a('askCloseComposer').onclick=closeGuestComposer;
    $a('askComposerShade').onclick=closeGuestComposer;
    $a('askGuestForm').addEventListener('submit',e=>{e.preventDefault();startCompose();});
    $a('askGuestMessage').addEventListener('input',updateMessageCount);
    $a('askGuestUsername').onclick=async()=>{
      if(!activePublic?.ownerUsername)return;
      const username='@'+activePublic.ownerUsername;
      try{await navigator.clipboard.writeText(username);toast(username+' copied ♡');}
      catch{toast('Username: '+username);}
    };
    for(const id of ['askPaperImage','askPublicImage']){
      const img=$a(id);
      img.addEventListener('click',()=>openLightbox(img));
      img.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openLightbox(img);}});
    }
    $a('askPhotoLightboxClose').onclick=closeLightbox;
    $a('askPhotoLightbox').addEventListener('click',e=>{if(e.target.id==='askPhotoLightbox')closeLightbox();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(activeLightbox)closeLightbox();else if(!$a('askGuestForm').hidden)closeGuestComposer();}});
    $a('askWelcomeContinue').onclick=()=>{
      $a('askWelcome').hidden=true;
      show('none');document.body.classList.remove('guest-receiving','ask-guest-mode');
      history.replaceState(null,'',location.pathname+location.search);
      go('home');
    };
    updateMessageCount();
    $a('anonComposeBack').onclick=()=>{cancelCompose();closeModal();go('ask');};
    $a('anonSendDockButton').onclick=beginSend;
    fillForm();tool('text');setSheet(false,false);updateThemeChecks();
    addEventListener('hashchange',()=>{if(location.hash.startsWith('#ask=')){cancelCompose();checkHash();} });
  }
  function updateThemeChecks(){document.querySelectorAll('[data-ask-theme]').forEach(b=>b.classList.toggle('on',b.dataset.askTheme===draft.theme));}
  function refreshPremium(){
    $a('askTypewriter').disabled=!askPremium();$a('askTypeSpeed').disabled=!askPremium();
    $a('askThemeGrid').querySelectorAll('[data-ask-theme]').forEach((btn,i)=>btn.classList.toggle('ask-theme-locked',i>=4&&!askPremium()));
    renderPhotoManager();
  }
  window.WENV_ANON={get composing(){return composing;},isGuestFlow:()=>!!activePublic && location.hash.startsWith('#ask='),openStudio,checkHash,userChanged,beginSend,cancelCompose,refreshPremium};
  init();
})();
