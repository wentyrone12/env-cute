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
    {id:'sunset',label:'Sunset kiss',a:'#ffecd7',b:'#f9bdc9',mark:'🌅'}
  ];
  const $a=id=>document.getElementById(id);
  const defaults = () => ({heading:'Send me an anonymous message', subtitle:'Tell me something sweet, funny, or a secret you never got to say…', signature:'with love ♡', theme:'blush', paper:'#fffaf7', accent:'#bd6995', sticker:'💌', font:'dancing', photo:''});
  const validCode = s => /^[a-z2-9]{12}$/.test(s);
  const genCode=()=> { const chars='abcdefghjkmnpqrstuvwxyz23456789', arr=crypto.getRandomValues(new Uint8Array(12)); return Array.from(arr,x=>chars[x%chars.length]).join(''); };
  let draft=defaults(), code='', activePublic=null, composing=false, draftEnvelope=null, saving=false, loading=0;
  let pointers={}, unsubscribe=()=>{}, subscribedUid='';
  const getLink = c => location.origin + location.pathname + '#ask=' + encodeURIComponent(c);
  const cleanText=(value,max)=>String(value||'').trim().slice(0,max);
  const safeStyle=(item={})=>{
    const x={...defaults(), ...item};
    return {heading:cleanText(x.heading,75)||defaults().heading,subtitle:cleanText(x.subtitle,220),signature:cleanText(x.signature,55),theme:themes.some(t=>t.id===x.theme)?x.theme:'blush',paper:hexOk(x.paper)?x.paper:'#fffaf7',accent:hexOk(x.accent)?x.accent:'#bd6995',sticker:['💌','🎀','🌸','🧸','🦋','✨'].includes(x.sticker)?x.sticker:'💌',font:['dancing','caveat','pacifico','classic'].includes(x.font)?x.font:'dancing',photo:typeof x.photo==='string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(x.photo) && x.photo.length<=170000 ?x.photo:''};
  };
  function show(which){ $a('askOwner').hidden=which!=='owner'; $a('askGuest').hidden=which!=='guest'; $a('askToolbar').hidden=which!=='owner'; }
  function paint(stage,parts,design){
    const s=safeStyle(design), th=themes.find(t=>t.id===s.theme)||themes[0];
    stage.style.setProperty('--ask-a',th.a); stage.style.setProperty('--ask-b',th.b);
    const paper=$a(parts.paper); paper.style.setProperty('--ask-sheet',s.paper); paper.style.setProperty('--ask-ink',s.accent);
    $a(parts.heading).textContent=s.heading; $a(parts.subtitle).textContent=s.subtitle; $a(parts.signature).textContent=s.signature; $a(parts.signature).dataset.font=s.font;
    $a(parts.sticker).textContent=s.sticker;
    const img=$a(parts.image); img.hidden=!s.photo; if(s.photo) img.src=s.photo; else img.removeAttribute('src');
  }
  function draw(){draft=safeStyle(draft);paint($a('askStage'),{paper:'askPaper',heading:'askPaperHeading',subtitle:'askPaperSubtitle',signature:'askPaperSignature',sticker:'askSticker',image:'askPaperImage'},draft);updateThemeChecks();}
  function fillForm(){ $a('askHeading').value=draft.heading; $a('askSubtitle').value=draft.subtitle; $a('askSignature').value=draft.signature; $a('askPaperColor').value=draft.paper; $a('askAccentColor').value=draft.accent; $a('askStickerInput').value=draft.sticker; $a('askSignatureFont').value=draft.font; draw(); }
  function tool(name){
    document.querySelectorAll('[data-ask-panel]').forEach(x=>x.hidden=x.dataset.askPanel!==name);
    document.querySelectorAll('[data-ask-tool]').forEach(x=>{const active=x.dataset.askTool===name;x.classList.toggle('on',active);x.setAttribute('aria-pressed',String(active));});
    $a('askToolHeading').textContent=({text:'Customize your words',theme:'Pick a dreamy background',photo:'Your favorite picture',signature:'Sign your little note'})[name]||'Edit your paper';
  }
  const setHashClean=()=>{if(location.hash.startsWith('#ask='))history.replaceState(null,'',location.pathname+location.search);};
  function openStudio(newPage=true){
    if(!currentUser){go('home');return;}
    if(newPage){ code=''; draft=defaults(); }
    setHashClean();show('owner');fillForm();tool('text');go('ask');renderSaved();
    if(subscribedUid!==currentUser.uid) userChanged(currentUser);
  }
  function renderSaved(){
    const node=$a('askSavedCards'); if(!node)return;
    const ids=Object.keys(pointers).filter(validCode).sort((a,b)=>(pointers[b]||0)-(pointers[a]||0));
    node.innerHTML=ids.length ? ids.map(id=>`<div class="ask-saved-item"><span>💌 <strong>${id===code?'Current page':'Anonymous page'}</strong><small>${esc(id)}</small></span><div><button type="button" data-ask-edit="${esc(id)}" class="btn sec">Edit</button><button type="button" data-ask-share="${esc(id)}" class="btn pri">Share</button></div></div>`).join(''):'<p class="ask-no-saved">Your published pages will show here after saving. ♡</p>';
  }
  function userChanged(user){
    if(!user){unsubscribe();unsubscribe=()=>{};subscribedUid='';pointers={};renderSaved();return;}
    if(subscribedUid===user.uid)return;
    unsubscribe();subscribedUid=user.uid;pointers={};renderSaved();
    if(!window.WENV_DB?.subscribeAnonymousPointers)return;
    unsubscribe=window.WENV_DB.subscribeAnonymousPointers(user.uid,data=>{if(currentUser?.uid!==user.uid)return;pointers=data||{};renderSaved();},err=>console.warn('Anonymous page list:',err));
  }
  async function editPage(c){
    if(!currentUser || !validCode(c))return;
    try{
      const page=await window.WENV_DB.getAnonymousPage(c);
      if(!page || page.ownerUid!==currentUser.uid)throw new Error('This page does not belong to your account.');
      code=c;draft=safeStyle(page.design);openStudio(false);toast('Editing your published page ♡');
    }catch(err){console.error(err);toast('Unable to open that page. Check your cloud connection.');}
  }
  function popupShare(c){
    const link=getLink(c);
    modal(`<div class="ask-share-modal"><div class="big">💌</div><h2>Your anonymous link is ready!</h2><p>Post on Instagram stories, Facebook, Messenger, or anywhere you like. Friends can open your personal paper design.</p><div class="ask-link-row"><input id="askShareLink" readonly aria-label="Public anonymous link" value="${esc(link)}"><button class="btn pri" id="askCopyLink" type="button">Copy</button></div><div class="ask-modal-actions"><button type="button" class="btn sec" id="askNativeShare">↗ Share link</button><button type="button" class="btn sec" id="askPreviewLink">Preview</button></div><p class="ask-share-warning">Anyone with this link can see your page and send you a letter after Google sign-in.</p></div>`);
    $a('askCopyLink').onclick=()=>copyLink(link);
    $a('askNativeShare').onclick=async()=>{if(navigator.share){try{await navigator.share({title:'Send me an anonymous envelope 💌',url:link});}catch(err){if(err?.name!=='AbortError')copyLink(link);}}else copyLink(link);};
    $a('askPreviewLink').onclick=()=>window.open(link,'_blank','noopener,noreferrer');
  }
  async function copyLink(link){try{await navigator.clipboard.writeText(link);toast('Link copied! ♡');}catch{const input=$a('askShareLink');input.focus();input.select();toast('Select and copy the link above ♡');}}
  async function saveShare(){
    if(saving || !currentUser)return toast('Sign in to create a public page.');
    if(!window.WENV_DB?.claimAnonymousPage)return toast('Firebase is still loading.');
    draft.heading=$a('askHeading').value;draft.subtitle=$a('askSubtitle').value;draft.signature=$a('askSignature').value;draft.paper=$a('askPaperColor').value;draft.accent=$a('askAccentColor').value;draft.sticker=$a('askStickerInput').value;draft.font=$a('askSignatureFont').value;
    draft=safeStyle(draft);draw();saving=true;
    const b=$a('askSaveShare');b.disabled=true;b.innerHTML='<span class="ask-button-spinner"></span> Saving…';
    try{
      let chosen=code, saved=false;
      for(let tries=0;tries<5&&!saved;tries++){
        chosen=chosen || genCode();
        saved=await window.WENV_DB.claimAnonymousPage(chosen,draft,currentUser.uid);
        if(!saved)chosen='';
      }
      if(!saved)throw new Error('Could not generate a unique page link.');
      code=chosen;await window.WENV_DB.saveAnonymousPointer(currentUser.uid,code);
      renderSaved();popupShare(code);burst($a('askPaper'),14);
    }catch(err){console.error('Save public page failed:',err);modal(`<div class="big">🥺</div><h2>Could not save your page</h2><p>${esc(err?.message||'Check Firebase connection and rules.')}</p><p>Deploy the included database.rules.json rules in Firebase first. Your design is still on this page.</p><button class="btn pri wide" onclick="closeModal()">Back to design</button>`);}
    finally{saving=false;b.disabled=false;b.innerHTML='<span>↗</span> Save & Share';}
  }
  async function openPublic(c){
    if(!validCode(c))return showPublicError('That page link is not valid.');
    activePublic=null;show('guest');go('ask');$a('askPublicHeading').textContent='Opening your secret page…';$a('askStartEnvelope').disabled=true;
    const seq=++loading;
    try{
      if(!window.WENV_DB?.getAnonymousPage)throw new Error('Firebase is not ready. Please reload.');
      const raw=await window.WENV_DB.getAnonymousPage(c);
      if(seq!==loading||location.hash!=='#ask='+c)return;
      if(!raw?.ownerUid || !raw?.design)throw new Error('This page does not exist or is unavailable.');
      activePublic={code:c,ownerUid:raw.ownerUid,design:safeStyle(raw.design)};
      paint($a('askPublicStage'),{paper:'askPublicPaper',heading:'askPublicHeading',subtitle:'askPublicSubtitle',signature:'askPublicSignature',sticker:'askPublicSticker',image:'askPublicImage'},activePublic.design);
      $a('askStartEnvelope').disabled=false;
    }catch(err){if(seq!==loading)return;console.warn(err);showPublicError(err.message||'Could not load the page');}
  }
  function showPublicError(message){show('guest');go('ask');$a('askPublicHeading').textContent='Oops, page unavailable ♡';$a('askPublicSubtitle').textContent=message;$a('askStartEnvelope').disabled=true;}
  let routedHash='';
  function checkHash(){
    if(!location.hash.startsWith('#ask='))return false;
    let c='';try{c=decodeURIComponent(location.hash.slice(5));}catch{showPublicError('The link contains invalid characters.');return true;}
    if(!validCode(c)){showPublicError('The link format looks incorrect.');return true;}
    if(activePublic?.code===c && $a('askGuest').hidden===false){go('ask');return true;}
    if(routedHash!==c || !$a('askGuest').hidden){routedHash=c;openPublic(c);}else{show('guest');go('ask');}
    return true;
  }
  function cancelCompose(){composing=false;draftEnvelope=null;document.body.classList.remove('ask-composing');$a('anonComposeBack').hidden=true;$a('anonSendDock').hidden=true;}
  function startCompose(){
    if(!activePublic)return toast('This page has not finished loading.');
    if(currentUser?.uid===activePublic.ownerUid)return toast('You cannot send an anonymous envelope to yourself.');
    composing=true;draftEnvelope=null;
    resetLetterEditor();
    $a('title').value='A little secret for you 💌';$a('from').value='';
    $a('editorTitle').textContent='Write your anonymous envelope 💌';
    $a('editorSubtitle').textContent='Only your chosen anonymous name will appear. Create your letter, then tap Send.';
    $a('make').textContent='💌 Send envelope message';
    document.body.classList.add('ask-composing');$a('anonComposeBack').hidden=false;$a('anonSendDock').hidden=false;
    go('create');
    // Mobile studio is already wired; the live preview stays behind its frosted editing panel.
    if(typeof updPreview==='function')updPreview();
  }
  function captureEnvelope(){
    const title=cleanText($a('title').value,60);
    if(!title){$a('title').focus();toast('Give your secret envelope a title ♡');return null;}
    if(typeof photoBusy!=='undefined' && photoBusy){toast('Finish uploading your photo first.');return null;}
    const count=Number($a('count').value)||1;
    const stored=clean({id:uid(),title,from:'',coverText:editorCoverText(),envelopeColor:envColor,createdAt:new Date().toISOString(),paperMagic:{typewriter:false,pageTurn:false,bouquetIntro:false},signature:{text:cleanText($a('signatureText').value,45),style:signatureStyle,align:'right'},pages:pages.slice(0,Math.min(count,8)).map(p=>({text:cleanText(p.text,600)||'A little mystery note ♡',color:p.color,photos:p.photos,effect:p.effect||'none',photoStyle:safePhotoStyle(p.photoStyle),photoLayout:safePhotoLayout(p.photoLayout)}))});
    return stored;
  }
  function nicknameModal(){
    modal(`<div class="ask-send-modal"><div class="big">🎀</div><h2>One last little secret…</h2><p>Choose the anonymous name they will see in their Received Envelopes. Your Google name and email are not shown on the letter.</p><label>Anonymous nickname<input id="askNick" maxlength="40" placeholder="e.g. Mystery Butterfly" autocomplete="off" value="Secret Butterfly"></label><p id="askSendStatus" class="ask-modal-status" role="status"></p><button class="btn pri wide" id="askConfirmSend" type="button">💌 Send anonymously</button><button class="btn sec wide" id="askGoBack" type="button">Back to envelope</button></div>`);
    $a('askConfirmSend').onclick=deliver;
    $a('askGoBack').onclick=()=>closeModal();
  }
  function beginSend(){
    if(!composing || !activePublic)return;
    const envelope=captureEnvelope();if(!envelope)return;
    draftEnvelope=envelope;
    if(currentUser){nicknameModal();return;}
    modal(`<div class="ask-send-modal"><div class="big">🔐</div><h2>Sign in before sending</h2><p>Continue with Google so messages can be protected from anonymous spam. Your Google name and email won't appear on your letter.</p><button class="google-button" id="askGoogleLogin" type="button"><span class="google-mark">G</span><span>Continue with Google</span></button><p class="ask-modal-status" id="askLoginStatus" role="status"></p><button class="btn sec wide" type="button" id="askCancelLogin">Back to editor</button></div>`);
    $a('askCancelLogin').onclick=()=>closeModal();
    $a('askGoogleLogin').onclick=async()=>{
      const btn=$a('askGoogleLogin');if(!window.WENV_AUTH?.signIn){$a('askLoginStatus').textContent='Google sign-in is not ready yet.';return;}
      btn.disabled=true;$a('askLoginStatus').textContent='Opening Google sign-in…';
      try{await window.WENV_AUTH.signIn();nicknameModal();}
      catch(err){console.error(err);if($a('askLoginStatus'))$a('askLoginStatus').textContent=err?.code==='auth/popup-closed-by-user'?'Sign-in was cancelled.':(err?.code==='auth/unauthorized-domain'?'Add this hosting domain to Firebase Auth authorized domains.':'Google sign-in failed. Check popups and try again.');}
      finally{if(btn.isConnected)btn.disabled=false;}
    };
  }
  async function deliver(){
    if(!composing || !activePublic || !currentUser || !draftEnvelope)return;
    const alias=cleanText($a('askNick').value,40);
    if(alias.length<2){$a('askSendStatus').textContent='Enter an anonymous name with at least 2 characters.';return;}
    if(currentUser.uid===activePublic.ownerUid){$a('askSendStatus').textContent='You cannot send to your own page.';return;}
    const button=$a('askConfirmSend');button.disabled=true;
    modal('<div class="ask-send-loading" role="status"><div class="ask-loader">💌</div><h2>Sending your secret envelope…</h2><p>A little love is on its way ♡</p></div>');
    try{
      // Re-fetch the page: never trust a destination UID sourced only from browser state.
      const live=await window.WENV_DB.getAnonymousPage(activePublic.code);
      if(!live || live.ownerUid!==activePublic.ownerUid)throw new Error('This page is no longer available.');
      await window.WENV_DB.sendAnonymousEnvelope(live.ownerUid,{title:draftEnvelope.title,from:alias,senderMode:'anonymous',anonymous:true,anonymousPageCode:activePublic.code,recipientUid:live.ownerUid,receivedAt:new Date().toISOString(),envelope:draftEnvelope});
      cancelCompose();resetLetterEditor();
      history.replaceState(null,'',location.pathname+location.search+'#ask='+activePublic.code);
      show('guest');go('ask');paint($a('askPublicStage'),{paper:'askPublicPaper',heading:'askPublicHeading',subtitle:'askPublicSubtitle',signature:'askPublicSignature',sticker:'askPublicSticker',image:'askPublicImage'},activePublic.design);
      modal('<div class="ask-send-success"><div class="big">💌</div><h2>Envelope delivered!</h2><p>Your anonymous envelope is now in their <b>Received Envelopes</b>. Only the nickname you chose appears as the sender.</p><button class="btn pri wide" type="button" onclick="closeModal()">Lovely! ♡</button></div>');
    }catch(err){console.error('Anonymous delivery failed:',err);modal(`<div class="ask-send-modal"><div class="big">🥺</div><h2>Could not send</h2><p>${esc(err?.message||'Please try again.')}</p><p>Make sure Firebase Realtime Database rules are updated.</p><button type="button" class="btn pri wide" id="askRetry">Try again</button><button type="button" class="btn sec wide" onclick="closeModal()">Back to editor</button></div>`);$a('askRetry').onclick=nicknameModal;}
  }
  function init(){
    $a('openAnonymousStudio').onclick=()=>openStudio(true);
    $a('askBackToMailbox').onclick=()=>{go('dash');};
    const themesNode=$a('askThemeGrid');themesNode.innerHTML=themes.map(t=>`<button type="button" data-ask-theme="${t.id}" style="--as-a:${t.a};--as-b:${t.b}" aria-label="${esc(t.label)}"><span>${t.mark}</span><small>${t.label}</small></button>`).join('');
    themesNode.onclick=e=>{const btn=e.target.closest('[data-ask-theme]');if(!btn)return;draft.theme=btn.dataset.askTheme;draw();updateThemeChecks();};
    $a('askHeading').addEventListener('input',e=>{draft.heading=e.target.value;draw();});
    $a('askSubtitle').addEventListener('input',e=>{draft.subtitle=e.target.value;draw();});
    $a('askSignature').addEventListener('input',e=>{draft.signature=e.target.value;draw();});
    $a('askPaperColor').addEventListener('input',e=>{draft.paper=e.target.value;draw();});
    $a('askAccentColor').addEventListener('input',e=>{draft.accent=e.target.value;draw();});
    $a('askStickerInput').addEventListener('change',e=>{draft.sticker=e.target.value;draw();});
    $a('askSignatureFont').addEventListener('change',e=>{draft.font=e.target.value;draw();});
    $a('askPhotoInput').addEventListener('change',async e=>{
      const file=e.target.files?.[0];e.target.value='';if(!file)return;
      if(!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size>7*1024*1024)return toast('Choose a JPG, PNG, or WebP image under 7 MB.');
      try{draft.photo=await compressPhoto(file);draw();toast('Picture added to your page ♡');}
      catch(err){console.warn(err);toast('Could not resize that picture. Try a smaller one.');}
    });
    $a('askRemovePhoto').onclick=()=>{draft.photo='';draw();toast('Photo removed');};
    document.querySelectorAll('[data-ask-tool]').forEach(b=>b.onclick=()=>tool(b.dataset.askTool));
    $a('askSaveShare').onclick=saveShare;
    $a('askStartEnvelope').onclick=startCompose;
    $a('anonComposeBack').onclick=()=>{cancelCompose();closeModal();go('ask');};
    $a('anonSendDockButton').onclick=beginSend;
    $a('askSavedCards').addEventListener('click',e=>{
      const edit=e.target.closest('[data-ask-edit]');if(edit)return editPage(edit.dataset.askEdit);
      const share=e.target.closest('[data-ask-share]');if(share)return popupShare(share.dataset.askShare);
    });
    fillForm();tool('text');updateThemeChecks();
    addEventListener('hashchange',()=>{if(location.hash.startsWith('#ask=')){cancelCompose();checkHash();} });
  }
  function updateThemeChecks(){document.querySelectorAll('[data-ask-theme]').forEach(b=>b.classList.toggle('on',b.dataset.askTheme===draft.theme));}
  window.WENV_ANON={get composing(){return composing;},openStudio,checkHash,userChanged,beginSend,cancelCompose};
  init();
})();
