/* W-Envelope Cute v20 — anonymous letters + consent-based identity payment requests.
 * Emails are NOT in the recipient's messages; Firebase rules gate identity consent reads.
 */
(() => {
 'use strict';
 const el=id=>document.getElementById(id);
 const clean=t=>String(t??'');
 const esc=t=>clean(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const date=t=>{const d=new Date(t);return Number.isNaN(d.getTime())?'Unknown date':d.toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'});};
 const fmt=t=>clean(t).slice(0,150);
 let uid='',messages=[],requests={},fresh={},legacy={},stopInbox=()=>{},stopLegacy=()=>{},stopPay=()=>{},viewing=false,selected=null,busy=false;
 const overlay=document.createElement('div');overlay.id='askLetterOverlay';overlay.className='ask-letter-overlay';overlay.hidden=true;
 document.body.appendChild(overlay);
 function dismiss(){overlay.hidden=true;overlay.innerHTML='';document.body.classList.remove('ask-letter-open');}
 function showOverlay(html){overlay.innerHTML=html;overlay.hidden=false;document.body.classList.add('ask-letter-open');overlay.querySelector('[data-close-letter]')?.focus({preventScroll:true});}
 overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('[data-close-letter]'))dismiss();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)dismiss();});
 function restoreDashboard(){
   viewing=false;el('askMessageCenter').hidden=true;
   el('list').hidden=document.getElementById('sendTab').classList.contains('on');
   el('mailboxNote').hidden=false;
   document.querySelector('#dash .mailbox-tabs').hidden=false;
   el('askOpenMessages').setAttribute('aria-expanded','false');
 }
 function openMessages(){
   if(!uid || !document.body.classList.contains('authenticated'))return;
   viewing=true;el('askMessageCenter').hidden=false;
   for(const id of ['list','mailboxNote','mailboxSend'])el(id).hidden=true;
   document.querySelector('#dash .mailbox-tabs').hidden=true;
   el('askOpenMessages').setAttribute('aria-expanded','true');render();
 }
 function render(){
   if(!uid)return;
   el('askMessagesBadge').textContent=String(messages.length);
   const box=el('askMessageItems');
   if(!messages.length){box.innerHTML='<p class="ask-message-empty"><img class="wenv-empty-logo" src="assets/w-envelope-icon.png" alt="">No anonymous messages yet. Share your page to receive your first secret.</p>';return;}
   box.innerHTML=messages.map(({key,...m})=>{
     const t=clean(m.envelope?.pages?.[0]?.text||'');
     return `<button type="button" class="ask-message-tile" data-ask-letter="${esc(key)}"><span class="ask-tile-kicker"><img class="wenv-inline-mark" src="assets/w-envelope-icon.png" alt=""> SECRET MESSAGE · ${m.readAt?'OPENED':'NEW'}</span><span class="ask-tile-intro">${esc(t.slice(0,96))}${t.length>96?'…':''}</span><span class="ask-tile-meta">${esc(fmt(m.from)||'Anonymous')} · ${esc(date(m.receivedAt))}</span></button>`;
   }).join('');
 }
 async function openLetter(key){
   selected=messages.find(m=>m.key===key);if(!selected)return;
   const m=selected,txt=clean(m.envelope?.pages?.[0]?.text||'');
   const consent=m.source==='legacy' && !!m.identityOptIn,req=requests[key];
   const helper=req?.status==='approved'?'Approved — you can view the email the sender consented to share.':req?.status==='pending'?'Your ₱10 transfer is awaiting manual admin verification.':req?.status==='rejected'?'The payment request was rejected. Contact support if you sent the transfer.':consent?'Only with the sender’s explicit permission and a verified ₱10 payment.':'This sender chose full anonymity. Their email cannot be revealed.';
   showOverlay(`<section class="ask-letter-dialog" role="dialog" aria-modal="true" aria-label="Anonymous paper letter"><div class="ask-letter-toolbar"><span><img class="wenv-inline-mark" src="assets/w-envelope-icon.png" alt=""> A letter just for you</span><button type="button" data-close-letter aria-label="Close letter">×</button></div><div class="ask-letter-paper"><span class="ask-letter-kicker">AN ANONYMOUS LITTLE NOTE ♡</span><h2>Dear you,</h2><blockquote>${esc(txt)}</blockquote><small>From ${esc(fmt(m.from)||'Anonymous')}<br>${esc(date(m.receivedAt))}</small></div><div class="ask-letter-bottom"><button type="button" class="btn pri" id="askRevealAction">View who is this · ₱10</button><small>${esc(helper)}</small></div></section>`);
   const btn=el('askRevealAction');
   if(!consent){btn.disabled=true;btn.textContent='Sender kept their identity private';}
   else if(req?.status==='pending'){btn.disabled=true;btn.textContent='Payment under review';}
   else if(req?.status==='rejected'){btn.disabled=true;btn.textContent='Payment rejected';}
   else if(req?.status==='approved')btn.textContent='Reveal consented email';
   btn.onclick=()=>req?.status==='approved'?revealEmail(key):openPayment(key);
   if(!m.readAt){(m.source==='fresh'?window.WENV_DB?.markAnonymousMessageRead?.(uid,key):window.WENV_DB?.markReceivedRead?.(uid,key))?.catch(console.warn);}
 }
 async function revealEmail(key){
  try{
   const consent=await window.WENV_DB.getAnonymousConsent(uid,key);
   if(!consent?.consented || !consent?.email)throw Error('This consent is no longer available.');
   showOverlay(`<section class="ask-reveal-dialog" role="dialog" aria-modal="true" aria-label="Sender consented email"><h2>Consented sender email</h2><p>This sender explicitly agreed to reveal their Google email following verified payment.</p><div class="ask-reveal-bank"><strong id="askRevealedEmail"></strong></div><button type="button" class="btn pri" data-close-letter>Done</button></section>`);
   el('askRevealedEmail').textContent=consent.email;
  }catch(err){showOverlay(`<section class="ask-reveal-dialog"><h2>Unable to show email</h2><p>${esc(err?.message||'Check your connection and permissions.')}</p><button class="btn pri" data-close-letter>Close</button></section>`);}
 }
 function openPayment(key){
   const m=messages.find(x=>x.key===key);
   if(!m?.identityOptIn)return;
   const payment=window.WENV_PAYMENT||{};
   showOverlay(`<section class="ask-reveal-dialog" role="dialog" aria-modal="true" aria-label="Identity reveal payment"><h2>View who sent this</h2><p><strong>₱10 one-time manual payment</strong> for this specific letter. Only available because the sender agreed to share their email with you after payment.</p><label>Payment method<select id="askRevealMethod"><option value="maya">Maya</option><option value="gotyme">GoTyme</option></select></label><div class="ask-reveal-bank" id="askRevealBank"></div><label>Transaction reference number<input id="askRevealReference" type="text" maxlength="64" autocomplete="off" placeholder="Enter real payment reference"></label><p class="ask-reveal-status" id="askRevealStatus" role="status"></p><button type="button" class="btn pri" id="askSubmitReveal">Submit ₱10 for admin review</button><button type="button" class="btn sec" data-close-letter>Cancel</button></section>`);
   const bank=el('askRevealBank');
   const renderBank=()=>{const method=el('askRevealMethod').value;const dest=payment[method]||{};bank.textContent=(method==='maya'?'Maya':'GoTyme')+' · '+(dest.accountName||'Receiving account not configured')+' · '+(dest.accountNumber||'Set up account number in payment-config.js')+' · ₱10.00';};
   el('askRevealMethod').onchange=renderBank;renderBank();
   el('askSubmitReveal').onclick=async()=>{
     if(busy)return;
     const method=el('askRevealMethod').value,reference=el('askRevealReference').value.trim();
     const status=el('askRevealStatus');
     if(!['maya','gotyme'].includes(method)||reference.length<6){status.textContent='Enter a valid transaction reference (at least 6 characters).';return;}
     if(!payment[method]?.accountNumber){status.textContent='This payment channel is not configured yet.';return;}
     if(!uid||requests[key]){status.textContent='A request for this letter already exists.';return;}
     busy=true;el('askSubmitReveal').disabled=true;status.textContent='Submitting for manual verification…';
     try{await window.WENV_DB.submitRevealRequest(uid,key,{ownerUid:uid,messageId:key,amount:10,method,reference,status:'pending',submittedAt:Date.now()});dismiss();openLetter(key);}
     catch(err){status.textContent=err?.message||'Could not submit. Check Firebase rules.';}
     finally{busy=false;if(el('askSubmitReveal'))el('askSubmitReveal').disabled=false;}
   };
 }
 function subscribe(owner){
   if(!owner||!window.WENV_DB)return;
   stopInbox();stopLegacy();stopPay();uid=owner;messages=[];fresh={};legacy={};requests={};render();
   const merge=()=>{messages=[...Object.entries(fresh).map(([key,v])=>({key,...v,source:'fresh'})),...Object.entries(legacy).filter(([,v])=>v?.anonymous===true&&v?.anonymousPageCode).map(([key,v])=>({key,...v,source:'legacy'}))].sort((a,b)=>Date.parse(b.receivedAt||0)-Date.parse(a.receivedAt||0));render();};
   stopInbox=window.WENV_DB.subscribeAnonymousMessages(uid,data=>{if(uid!==owner)return;fresh=data||{};merge();},console.warn);
   stopLegacy=window.WENV_DB.subscribeReceived(uid,data=>{if(uid!==owner)return;legacy=data||{};merge();},console.warn);
   stopPay=window.WENV_DB.subscribeRevealRequests(uid,data=>{if(uid===owner)requests=data||{};},console.warn);
 }
 el('askOpenMessages').onclick=()=>viewing?restoreDashboard():openMessages();
 el('askMessagesBack').onclick=restoreDashboard;
 el('askMessageItems').addEventListener('click',e=>{const b=e.target.closest('[data-ask-letter]');if(b)openLetter(b.dataset.askLetter);});
 document.addEventListener('wenv-user-ready',e=>{const owner=e.detail?.uid;if(owner&&window.WENV_DB)subscribe(owner);else if(owner){let tries=0;const timer=setInterval(()=>{if(window.WENV_DB){clearInterval(timer);subscribe(owner);}else if(++tries>30)clearInterval(timer);},200);}});
})();
