(() => {
  'use strict';
  const btn = document.getElementById('wenvInstallBtn');
  const status = document.getElementById('wenvInstallStatus');
  if (!btn || !status) return;
  let deferred = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const explain = () => {
    if (standalone()) { btn.disabled = true; btn.textContent = '✓ Installed'; status.textContent = 'You are using the installed app.'; }
    else if (deferred) { btn.disabled = false; btn.textContent = 'Install W-Envelope Cute'; status.textContent = 'Ready to install on your device.'; }
    else if (ios) { btn.disabled = false; btn.textContent = 'How to install on iPhone'; status.textContent = 'Safari → Share → Add to Home Screen. The install button will show the steps.'; }
    else { btn.disabled = false; btn.textContent = 'Install on this device'; status.textContent = 'If no install dialog appears, use your browser menu → Install app / Add to Home screen.'; }
  };
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; explain(); });
  window.addEventListener('appinstalled', () => { deferred = null; explain(); });
  btn.addEventListener('click', async () => {
    if (standalone()) return;
    if (deferred) {
      const prompt = deferred;deferred = null;
      try {await prompt.prompt(); const choice=await prompt.userChoice;status.textContent=choice?.outcome==='accepted'?'Installation requested ♡':'You can install whenever you like.';}
      catch(err){status.textContent='Install prompt unavailable. Use your browser menu instead.';}
      explain();return;
    }
    status.textContent=ios ? 'In Safari: tap Share (square with arrow) → Add to Home Screen → Add.' : 'In Chrome or Edge: open the ⋮ menu → Install app (or Add to Home screen). Use HTTPS hosting.';
  });
  explain();
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(err=>console.warn('App offline support unavailable:',err)));
  }
})();
