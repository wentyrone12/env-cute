/* W-Envelope Cute v22 — boot animation before Google sign-in (not shown to public anonymous visitors). */
(() => {
  'use strict';
  const root=document.documentElement;
  const splash=document.getElementById('wenvBootIntro');
  if(!splash || !root.classList.contains('wenv-booting'))return;
  splash.hidden=false;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const finish=()=>{splash.hidden=true;root.classList.remove('wenv-booting');};
  const timer=setTimeout(finish,reduced?1320:3380);
  window.addEventListener('pagehide',()=>{clearTimeout(timer);finish();},{once:true});
})();
