const KEY = "whisper_envelopes_v1", $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    const ENV = ["#e994b7", "#f3a6a6", "#f2c879", "#a995d9", "#8db7d9", "#8dc7b0", "#d5aa76", "#d88383"];
    const PAPER = ["#fffaf2", "#fff1f6", "#f5efff", "#edf8ff", "#effbf3", "#fff7df"];
    const ROT = [-2, 2, -4, 3, -1], calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
    const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const hexOk = c => /^#[0-9a-f]{6}$/i.test(c), uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const fmt = d => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const shade = (h, p) => { const t = p < 0 ? 0 : 255, k = Math.abs(p); return "#" + [1, 3, 5].map(i => Math.round(parseInt(h.substr(i, 2), 16) * (1 - k) + t * k).toString(16).padStart(2, "0")).join("") };
    const vars = c => `--c:${c};--cl:${shade(c, .3)};--cf:${shade(c, -.07)};--cd:${shade(c, -.2)}`;
    const SIGNATURE_STYLES = [
      { name: "Classic", font: '"Caveat",cursive' },
      { name: "Dancing", font: '"Dancing Script",cursive' },
      { name: "Elegant", font: '"Great Vibes",cursive' },
      { name: "Playful", font: '"Pacifico",cursive' },
      { name: "Flowing", font: '"Satisfy",cursive' },
      { name: "Allura", font: '"Allura",cursive' },
      { name: "Sacramento", font: '"Sacramento",cursive' },
      { name: "Parisienne", font: '"Parisienne",cursive' },
      { name: "Bold ink", font: '"Kaushan Script",cursive' },
      { name: "Calligraphy", font: '"Cormorant Garamond",serif' }
    ];
    const safeImage = src => typeof src === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src) && src.length < 190000 ? src : null;
    const PHOTO_STYLES = [
      { id: 'classic', name: 'Classic', desc: 'Timeless cream' },
      { id: 'blush', name: 'Blush', desc: 'Soft pink ribbon' },
      { id: 'film', name: 'Film', desc: 'Vintage film' },
      { id: 'scrapbook', name: 'Scrapbook', desc: 'Washi-tape look' },
      { id: 'modern', name: 'Dreamy', desc: 'Rounded glass' }
    ];
    const PHOTO_LAYOUTS = [
      { id: 'stack', name: 'Classic Stack', desc: 'Layered keepsakes' },
      { id: 'fan', name: 'Sweet Fan', desc: 'Fanned out cards' },
      { id: 'stair', name: 'Staircase', desc: 'Diagonal memories' },
      { id: 'ribbon', name: 'Ribbon', desc: 'Wavy overlapping row' },
      { id: 'petal', name: 'Petal Bloom', desc: 'Petal-shaped collage' }
    ];
    const safePhotoStyle = style => PHOTO_STYLES.some(v => v.id === style) ? style : 'classic';
    const safePhotoLayout = layout => PHOTO_LAYOUTS.some(v => v.id === layout) ? layout : 'stack';
    const safeCode = code => typeof code === 'string' && /^[a-z0-9-]{4,32}$/.test(code) ? code : '';
    const DEFAULT_COVER_TEXT = 'Welcome to W-Envelope Cute';
    const safeCoverText = value => typeof value === 'string' && value.trim()
      ? value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 64)
      : DEFAULT_COVER_TEXT;
    function clean(d) {
      if (!d || !Array.isArray(d.pages) || !d.pages.length) return null;
      const signature = d.signature && typeof d.signature === 'object' ? d.signature : {};
      return {
        id: String(d.id || uid()).replace(/\W/g, '').slice(0, 30),
        title: String(d.title || 'A little surprise').slice(0, 80),
        from: String(d.from || '').slice(0, 40),
        coverText: safeCoverText(d.coverText),
        envelopeColor: hexOk(d.envelopeColor) ? d.envelopeColor : ENV[0],
        createdAt: String(d.createdAt || new Date().toISOString()).slice(0, 40),
        shortCode: safeCode(d.shortCode), customCode: safeCode(d.customCode),
        linkCodes: [...new Set([...(Array.isArray(d.linkCodes) ? d.linkCodes.slice(0, 50) : []), d.shortCode, d.customCode].map(safeCode).filter(Boolean))].slice(0, 50),
        signature: { text: String(signature.text || '').slice(0, 45), style: Number.isInteger(+signature.style) ? Math.max(0, Math.min(9, +signature.style)) : 0, align: ['left', 'center', 'right'].includes(signature.align) ? signature.align : 'right' },
        updatedAt: String(d.updatedAt || d.createdAt || new Date().toISOString()).slice(0, 40),
        pages: d.pages.slice(0, 10).map(p => ({
          text: String(p && p.text || '').slice(0, 600),
          color: hexOk(p && p.color) ? p.color : PAPER[0],
          photos: Array.isArray(p && p.photos) ? p.photos.slice(0, 4).map(safeImage).filter(Boolean) : [],
          effect: ['none', 'hearts', 'sparkles', 'flowers', 'stars', 'butterflies'].includes(p && p.effect) ? p.effect : 'none',
          photoStyle: safePhotoStyle(p && p.photoStyle),
          photoLayout: safePhotoLayout(p && p.photoLayout)
        }))
      };
    }
    let store = [], receivedStore = [], currentUser = null, accountKey = null;
    let mailboxView = 'recent', editingId = null, premiumApproved = false, premiumPayments = [];
    let stopReceived = () => { }, stopSubscription = () => { };
    const isPremium = () => premiumApproved === true;
    const pageLimit = () => isPremium() ? 10 : 8;
    const photoLimit = () => isPremium() ? 4 : 2;
    function updatePageOptions() {
      const old = Number($('#count').value) || 3;
      const max = Math.max(pageLimit(), editingId && store.find(e => e.id === editingId)?.pages.length || 0);
      $('#count').innerHTML = Array.from({ length: max }, (_, i) => `<option value="${i + 1}">${i + 1} page${i ? 's' : ''}</option>`).join('');
      $('#count').value = String(Math.min(old, max));
    }
    function editorCoverText() {
      if (isPremium()) return safeCoverText($('#coverText').value);
      if (editingId) {
        const original = store.find(e => e.id === editingId);
        return safeCoverText(original?.coverText);
      }
      return DEFAULT_COVER_TEXT;
    }
    function updateCoverEditorLock() {
      const field = $('#coverText');
      field.disabled = !isPremium();
      $('#coverUpgrade').hidden = isPremium();
      $('#coverPlanLabel').textContent = isPremium() ? '✦ Unlocked' : '🔒 Free default';
      $('#coverPlanLabel').classList.toggle('unlocked', isPremium());
      $('#coverTextNote').textContent = isPremium()
        ? 'Write a short greeting (up to 64 characters). It will appear in the preview and on shared envelopes.'
        : (editingId && store.find(e => e.id === editingId)?.coverText !== DEFAULT_COVER_TEXT)
          ? 'Original premium greeting is preserved while you edit on Free. Upgrade to change it.'
          : 'Free plan uses the original greeting. Subscribe to Premium to customize it.';
      updPreview();
    }
    function updateSubscriptionUI() {
      $('#settingsPlanStatus').textContent = isPremium() ? 'Premium' : 'Free';
      $('#premiumPlanBtn').textContent = isPremium() ? '✓ Premium active' : '✦ Choose Maya or GoTyme';
      $('#premiumPlanBtn').disabled = isPremium();
      $('#freePlanBtn').textContent = isPremium() ? 'Premium account' : '✓ Current free plan';
      $('#freePlanBtn').disabled = true;
      $('#premiumPriceDisplay').innerHTML = Number(window.WENV_PAYMENT?.premiumPricePHP) > 0
        ? '₱' + Number(window.WENV_PAYMENT.premiumPricePHP).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' <small>· one-time manual approval</small>'
        : 'Set price <small>· in payment-config.js</small>';
      $('#premiumAccountStatus').textContent = isPremium() ? '✓ Premium access verified by the owner.'
        : premiumPayments.some(v => v.status === 'pending') ? '⏳ Payment reference submitted; awaiting manual verification.'
        : 'Free plan. Select a payment method to request Premium.';
      renderPaymentHistory(); updatePageOptions(); renderPages(); renderSignatureStyles(); updateCoverEditorLock();
    }
    function watchPremium(uid) {
      stopSubscription();
      stopSubscription = window.WENV_DB.subscribePremium(uid, data => {
        if (currentUser?.uid !== uid) return;
        premiumApproved = !!(data && data.enabled === true);
        updateSubscriptionUI();
      }, err => console.warn('Premium status:', err));
    }
    let stopPayments = () => {};
    function watchPayments(uid) {
      stopPayments();
      stopPayments = window.WENV_DB.subscribePayments(uid, data => {
        if (currentUser?.uid !== uid) return;
        premiumPayments = Object.entries(data || {}).map(([id,p]) => ({...p, id}))
          .sort((x,y)=>Number(y.submittedAt||0)-Number(x.submittedAt||0));
        updateSubscriptionUI();
      }, err => console.warn('Payment requests:', err));
    }
    function renderPaymentHistory() {
      const target = $('#paymentRequestList'); if (!target) return;
      target.innerHTML = premiumPayments.slice(0,5).map(p => `<div class="payment-request-item"><span>${p.method==='maya'?'Maya':'GoTyme'} • ${esc(p.reference || '')}</span><b class="payment-state">${p.status === 'approved' ? '✓ Approved' : p.status === 'rejected' ? '✕ Rejected' : '⏳ Pending'}</b></div>`).join('');
    }
    const paymentMethods = { maya: { label: 'Maya (PayMaya)', icon: '💜' }, gotyme: {label: 'GoTyme Bank', icon: '💙'} };
    function paymentReady(method) {
      const cfg = window.WENV_PAYMENT || {}, dest = cfg[method] || {};
      return Number.isFinite(Number(cfg.premiumPricePHP)) && Number(cfg.premiumPricePHP) > 0 &&
        String(dest.accountName || '').trim().length > 1 && String(dest.accountNumber || '').trim().length >= 8;
    }
    function paymentPicker() {
      if (isPremium()) return toast('Your Premium plan is already active ♡');
      modal(`<div class="pay-dialog"><div class="mh"><h2>Choose your payment 💌</h2><button class="x" onclick="closeModal()" aria-label="Close">×</button></div><p class="pay-intro">Select a payment method. A transfer is reviewed by the website owner before Premium becomes active.</p><div class="pay-methods"><button class="pay-method" onclick="paymentDetails('maya')"><span>💜</span><b>Maya</b><small>PayMaya wallet transfer</small></button><button class="pay-method" onclick="paymentDetails('gotyme')"><span>💙</span><b>GoTyme</b><small>GoTyme Bank transfer</small></button></div><p class="pay-note">Never enter your PIN, OTP, or bank password on this website.</p></div>`);
    }
    function paymentDetails(method) {
      if (!paymentMethods[method]) return;
      const dest = window.WENV_PAYMENT?.[method] || {}, amount = Number(window.WENV_PAYMENT?.premiumPricePHP || 0);
      const ready = paymentReady(method);
      const amountText = amount > 0 ? '₱' + amount.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2}) : 'Not configured';
      modal(`<div class="pay-dialog"><div class="mh"><h2>${paymentMethods[method].icon} ${paymentMethods[method].label}</h2><button class="x" onclick="closeModal()" aria-label="Close">×</button></div><div class="payment-step"><b>1. Review payment details</b><div class="payment-destination"><small>Premium price</small><strong>${esc(amountText)}</strong><small>Recipient name</small><strong>${esc(dest.accountName || 'Not yet configured')}</strong><small>Recipient ${method==='maya'?'wallet number':'account number'}</small><div class="pay-copy-row"><strong>${esc(dest.accountNumber || 'Not yet configured')}</strong>${ready?`<button class="btn sec" type="button" onclick="copyPaymentNumber('${method}')">Copy</button>`:''}</div></div></div><div class="payment-step"><b>2. Send using your official ${paymentMethods[method].label} app</b><p>Check the recipient details and amount inside your banking app before sending money. Never pay if the destination is missing or unverified.</p></div><div class="payment-step"><b>3. Submit the transaction reference</b><label class="payment-reference-label">Transaction / receipt reference<input id="paymentReference" maxlength="64" autocomplete="off" placeholder="Enter the reference from your bank receipt" ${ready?'':'disabled'} /></label><button class="btn pri wide" id="paymentSubmit" type="button" ${ready?'':'disabled'}>Submit for manual verification</button><small class="pay-note">Submitting does not activate Premium or confirm payment.</small></div>${!ready?'<p class="pay-config-warning">⚠️ Payments are not available yet. The site owner must set a real price and recipient details in js/payment-config.js.</p>':''}<button class="btn sec wide" onclick="paymentPicker()" type="button">← Change payment method</button></div>`);
      if (ready) $('#paymentSubmit').onclick = () => submitPaymentRequest(method);
    }
    function copyPaymentNumber(method) {
      const number = String(window.WENV_PAYMENT?.[method]?.accountNumber || '');
      if (!number) return;
      navigator.clipboard?.writeText(number).then(()=>toast('Account number copied')).catch(()=>toast('Select the number to copy'));
    }
    let sendingPayment = false;
    async function submitPaymentRequest(method) {
      if (sendingPayment || !currentUser || !paymentReady(method) || isPremium()) return;
      const ref = $('#paymentReference')?.value?.trim() || '';
      if (!/^[A-Za-z0-9][A-Za-z0-9._\-\/ ]{5,63}$/.test(ref)) return toast('Enter a valid transaction reference (6–64 characters).');
      const amount = Number(window.WENV_PAYMENT.premiumPricePHP);
      const button = $('#paymentSubmit'); button.disabled = true; button.textContent = 'Submitting…'; sendingPayment = true;
      try {
        await window.WENV_DB.submitPayment(currentUser.uid, {
          uid: currentUser.uid, method, reference: ref, amount,
          status: 'pending', submittedAt: Date.now(), email: String(currentUser.email||'').slice(0,100)
        });
        modal(`<div class="big">⏳</div><h2>Request received</h2><p>Your ${paymentMethods[method].label} reference is pending review. The owner will verify the transfer directly in the payment account before activating Premium. No access is granted yet.</p><button class="btn pri wide" onclick="closeModal()">Back to Subscription</button>`);
      } catch(err) { console.error(err); toast('Could not submit request. Check Firebase rules.'); button.disabled = false; button.textContent = 'Submit for manual verification'; }
      finally { sendingPayment = false; }
    }
    function recordReceived(key, e, code = '') {
      if (!currentUser || !e) return;
      if (store.some(m => m.id === e.id)) return; // your own letter, not a received letter
      const item = { title: e.title, from: e.from || '', createdAt: e.createdAt || '', receivedAt: new Date().toISOString(), code, envelope: code ? null : clean(e) };
      window.WENV_DB.saveReceived(currentUser.uid, key, item).catch(err => console.warn('Received history save:', err));
    }
    function watchReceived(uid) { stopReceived(); stopReceived = window.WENV_DB.subscribeReceived(uid, data => { if (currentUser?.uid !== uid) return; receivedStore = Object.entries(data || {}).map(([key, item]) => ({ ...item, key })).sort((a, b) => String(b.receivedAt || '').localeCompare(String(a.receivedAt || ''))); renderDash() }, err => console.warn('Received collection sync:', err)); }

    let cloudReady = false, stopCloud = () => { }, connectionUid = null, cloudConnected = false;
    function cloudState(msg, status = 'loading') {
      $('#cloudStatus').textContent = msg;
      $('#cloudStatus').dataset.state = status;
    }
    function loadAccount(uid) {
      accountKey = 'wenvcute_envelopes_v2_' + uid;
      try {
        if (localStorage.getItem(accountKey) === null && localStorage.getItem(KEY) !== null) {
          const legacy = JSON.parse(localStorage.getItem(KEY) || '[]');
          if (Array.isArray(legacy)) localStorage.setItem(accountKey, JSON.stringify(legacy.map(clean).filter(Boolean)));
          localStorage.removeItem(KEY);
        }
        const data = JSON.parse(localStorage.getItem(accountKey) || '[]');
        store = Array.isArray(data) ? data.slice(0, 500).map(clean).filter(Boolean) : [];
      } catch { store = [] }
    }
    async function watchCloud(uid) {
      stopCloud(); stopCloud = () => { }; cloudReady = false;
      cloudState('⏳ Syncing envelopes...');
      const legacy = store.slice();
      let first = true;
      stopCloud = window.WENV_DB.subscribe(uid, async remote => {
        if (!currentUser || currentUser.uid !== uid) return;
        const online = Object.values(remote || {}).map(clean).filter(Boolean).sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
        store = online; cloudReady = true; cloudConnected = true;
        cloudState('All envelopes synced to your Google account', 'ok'); renderDash();
        if (first) {
          first = false;
          const existing = new Set(online.map(e => e.id));
          const missing = legacy.filter(e => !existing.has(e.id));
          if (missing.length) {
            cloudState(`⏳ Importing ${missing.length} previously saved envelopes...`);
            let errors = 0;
            for (const e of missing) {
              if (!currentUser || currentUser.uid !== uid) return;
              try { await window.WENV_DB.put(uid, e) } catch (err) { errors++; console.error(err) }
            }
            if (errors) { cloudState(`${errors} old envelopes failed to upload. Check your database rules.`, 'error'); return }
          }
          // Prevent deleted envelopes from reappearing on the next login.
          try { localStorage.removeItem(accountKey) } catch { }
          cloudState('All envelopes synced to your Google account', 'ok');
        }
      }, err => {
        if (!currentUser || currentUser.uid !== uid) return;
        cloudReady = false; cloudConnected = false;
        cloudState('⚠️ Cloud sync unavailable. Check Firebase Database rules / connection.', 'error');
        console.error('Realtime Database sync:', err);
        toast('Cloud sync failed. Envelopes cannot be saved until connected.');
      });
    }
    async function cloudPut(e) {
      if (!currentUser || !cloudReady) throw Error('Cloud not ready');
      await window.WENV_DB.put(currentUser.uid, clean(e));
    }
    async function cloudRemove(id) {
      if (!currentUser || !cloudReady) throw Error('Cloud not ready');
      await window.WENV_DB.remove(currentUser.uid, id);
    }
    let signatureStyle = 0, signatureAlign = 'right', photoBusy = false;


    let envColor = ENV[0], paper = PAPER[0], pages, recv = null, idx = 0, preview = false, created = null, tt;
    const blank = () => Array.from({ length: 10 }, () => ({ text: '', color: paper, photos: [], effect: 'none', photoStyle: 'classic', photoLayout: 'stack' })); pages = blank();

    /* envelope component */
    const sheets = (cols, coverText = DEFAULT_COVER_TEXT) => cols.slice(0, 5).map((p, i) => `<div class="sht" style="--p:${p};--i:${i};--r:${ROT[i]}deg"><b>${esc(safeCoverText(coverText))}</b></div>`).join('');
    const envHTML = (c, cols, o = {}) => `<div class="env${o.float ? " float" : ""}" ${o.id ? `id="${o.id}"` : ""} ${o.play ? "data-play" : ""} style="${vars(c)}"><div class="eb"></div><div class="sh">${sheets(cols, o.coverText)}</div><div class="fr"><i class="pb"></i><i class="pl"></i><i class="pr"></i></div><div class="fl"></div>${o.play ? '<button class="seal" aria-label="Open envelope">♡</button>' : '<span class="seal">♡</span>'}</div>`;

    /* nav */
    function go(n) {
      if (!currentUser) return;
      $$(".screen").forEach(s => s.classList.toggle("on", s.id === n)); $$(".tab").forEach(t => t.classList.toggle("on", t.dataset.go === n));
      document.body.classList.toggle("receiving", n === "recv"); scrollTo({ top: 0, behavior: calm || document.body.classList.contains("reduce-motion") ? "auto" : "smooth" }); if (n === "dash") renderDash()
    }
    function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2800) }
    function modal(h) { $("#mc").innerHTML = h; $("#modal").classList.add("show"); setTimeout(() => { const f = $("#mc .btn,#mc input"); f && f.focus() }, 60) }
    const closeModal = () => $("#modal").classList.remove("show");
    function burst(el, n = 14) {
      if (!appearance.hearts || appearance.reduceMotion) return;
      const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }, S = ["♡", "♥", "💗", "💖", "✦", "✧"];
      for (let i = 0; i < n; i++) {
        const h = document.createElement("i"); h.className = "fx"; h.textContent = S[i % S.length];
        h.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;font-size:${16 + Math.random() * 14}px;--dx:${Math.random() * 260 - 130}px;--dy:${-90 - Math.random() * 230}px;--s:${.8 + Math.random()};animation-delay:${i * 45}ms`;
        document.body.append(h); setTimeout(() => h.remove(), 2800 + i * 45)
      }
    }

    /* create */
    function swatches(el, list, cur, fn) {
      el.innerHTML = list.map(c => `<button type="button" class="dot${c === cur ? " on" : ""}" style="background:${c}" aria-label="Color ${c}" aria-pressed="${c === cur}"></button>`).join("");
      [...el.children].forEach((b, i) => b.onclick = () => { [...el.children].forEach(x => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false") }); b.classList.add("on"); b.setAttribute("aria-pressed", "true"); fn(list[i]) })
    }
    const n = () => +$("#count").value;
    // These tabs switch the *editor*, never the stored page data. All page drafts
    // remain in `pages[]` even when another tab is displayed or a page count changes.
    let activeLetterPage = 0;
    function pageTabHasContent(i) {
      return Boolean((pages[i]?.text || '').trim() || (pages[i]?.photos || []).length || (pages[i]?.effect && pages[i].effect !== 'none'));
    }
    function refreshPageTabMarkers() {
      $$('#letterPageTabs [data-letter-page]').forEach(b => {
        b.classList.toggle('has-content', pageTabHasContent(+b.dataset.letterPage));
      });
    }
    function updatePageTabArrows() {
      const rail = $('#letterPageTabs');
      if (!rail || !rail.classList.contains('is-scrollable')) return;
      $('#letterPageLeft').disabled = rail.scrollLeft < 3;
      $('#letterPageRight').disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3;
    }
    function renderPageTabs() {
      const count = n();
      const rail = $('#letterPageTabs');
      const priorScroll = rail.scrollLeft;
      const scrollable = count >= 5;
      activeLetterPage = Math.min(Math.max(activeLetterPage, 0), count - 1);
      $('#letterPageCount').textContent = `Page ${activeLetterPage + 1} of ${count}`;
      $('#letterPageHint').textContent = scrollable
        ? ''
        : '';
      rail.classList.toggle('is-scrollable', scrollable);
      $('#letterPageLeft').hidden = $('#letterPageRight').hidden = !scrollable;
      rail.innerHTML = pages.slice(0, count).map((p, i) =>
        `<button type="button" class="letter-page-tab${pageTabHasContent(i) ? ' has-content' : ''}" role="tab" id="letterPageTab${i}" data-letter-page="${i}" aria-controls="letterPagePanel" aria-selected="${i === activeLetterPage}" tabindex="${i === activeLetterPage ? 0 : -1}">Page ${i + 1}</button>`
      ).join('');
      rail.scrollLeft = scrollable ? priorScroll : 0;
      rail.querySelectorAll('[data-letter-page]').forEach(btn => {
        btn.onclick = () => selectLetterPage(+btn.dataset.letterPage);
        btn.onkeydown = e => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
          e.preventDefault();
          const nextIndex = e.key === 'Home' ? 0 : e.key === 'End' ? count - 1
            : Math.max(0, Math.min(count - 1, activeLetterPage + (e.key === 'ArrowRight' ? 1 : -1)));
          selectLetterPage(nextIndex);
          $('#letterPageTab' + nextIndex)?.focus({ preventScroll: true });
        };
      });
      requestAnimationFrame(() => {
        if (!scrollable) return;
        const active = $('#letterPageTab' + activeLetterPage);
        if (!active) return;
        const left = active.getBoundingClientRect().left - rail.getBoundingClientRect().left;
        rail.scrollBy({
          left: left - (rail.clientWidth - active.clientWidth) / 2,
          behavior: calm || document.body.classList.contains('reduce-motion') ? 'instant' : 'smooth'
        });
        updatePageTabArrows();
      });
      updatePageTabArrows();
    }
    function selectLetterPage(pageIndex) {
      if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= n() || pageIndex === activeLetterPage) return;
      activeLetterPage = pageIndex;
      renderPages();
    }
    function updPreview() { const e = $("#pvEnv .env"); e.style.cssText = vars(envColor); e.querySelector(".sh").innerHTML = sheets(pages.slice(0, n()).map(p => p.color), editorCoverText()); $("#pvTitle").textContent = $("#title").value.trim() || "Your envelope" }
    function renderSignatureStyles() {
      const text = $('#signatureText').value.trim() || 'With love ♡';
      const rail = $('#signatureStyles'), previousScroll = rail.scrollLeft;
      rail.innerHTML = SIGNATURE_STYLES.map((style, i) => `<button type="button" role="tab" class="sig-style${i === signatureStyle ? ' on' : ''}" data-signature="${i}" aria-selected="${i === signatureStyle}" aria-label="${style.name} signature" tabindex="${i === signatureStyle ? '0' : '-1'}"><b style="font-family:${style.font}">Aa</b><small>${style.name}</small></button>`).join('');
      rail.scrollLeft = previousScroll;
      const preview = $('#signaturePreview'); preview.textContent = text;
      preview.style.fontFamily = SIGNATURE_STYLES[signatureStyle].font;
      preview.style.fontStyle = signatureStyle === 9 ? 'italic' : 'normal';
      updateSignaturePosition();
      rail.querySelectorAll('[data-signature]').forEach(b => b.onclick = () => {
        signatureStyle = Number(b.dataset.signature); renderSignatureStyles();
        rail.querySelector(`[data-signature="${signatureStyle}"]`)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
      });
      updateSignatureArrows();
    }
    function updateSignaturePosition() {
      const original = editingId && store.find(e => e.id === editingId);
      const showAlign = isPremium() ? signatureAlign : (original?.signature?.align || 'right');
      $('#signaturePreview').style.textAlign = showAlign;
      $('#sigAlignHint').textContent = isPremium() ? '✦ Premium positions unlocked' : '🔒 Free uses right alignment';
      $$('[data-align]').forEach(button => {
        const position = button.dataset.align, locked = !isPremium() && position !== 'right';
        button.classList.toggle('active', position === showAlign);
        button.classList.toggle('locked', locked);
        button.setAttribute('aria-pressed', String(position === showAlign));
        button.setAttribute('aria-disabled', String(locked));
        const lock = button.querySelector('.sig-lock'); if (lock) lock.hidden = !locked;
      });
    }
    document.querySelectorAll('[data-align]').forEach(button => button.onclick = () => {
      const position = button.dataset.align;
      if (!isPremium() && position !== 'right') {
        modal(`<div class="big">🔒</div><h2>Signature positions</h2><p>Left and Center signatures are included with Premium. On Free, the signature stays on the right.</p><div class="row"><button class="btn sec" onclick="closeModal()">Not now</button><button class="btn pri" onclick="closeModal();go('settings');setSettingsPage('subscription')">View Premium</button></div>`);
        return;
      }
      signatureAlign = position; updateSignaturePosition();
    });
    function updateSignatureArrows() {
      const el = $('#signatureStyles');
      $('#signaturePrev').disabled = el.scrollLeft < 3;
      $('#signatureNext').disabled = el.scrollLeft + el.clientWidth >= el.scrollWidth - 3;
    }
    $('#signatureStyles').addEventListener('scroll', updateSignatureArrows, { passive: true });
    $('#signaturePrev').onclick = () => $('#signatureStyles').scrollBy({ left: -220, behavior: 'smooth' });
    $('#signatureNext').onclick = () => $('#signatureStyles').scrollBy({ left: 220, behavior: 'smooth' });
    $('#signatureStyles').addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
      e.preventDefault(); signatureStyle = (signatureStyle + (e.key === 'ArrowRight' ? 1 : 9)) % 10;
      renderSignatureStyles(); const b = $(`#signatureStyles [data-signature="${signatureStyle}"]`); b?.focus({ preventScroll: true }); b?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
    function lockedDesignNotice() {
      modal(`<div class="big">🔒</div><h2>Premium photo designs</h2><p>Classic border and Stack layout are included with Free. Unlock all five borders and all five layer formats with Premium.</p><div class="row"><button class="btn sec" onclick="closeModal()">Maybe later</button><button class="btn pri" onclick="closeModal();go('settings');setSettingsPage('subscription')">✦ View subscription</button></div>`);
    }
    /* v4.1: reusable layered photo stack in the creator AND the paper reader. */
    function photoStackMarkup(srcs, context, pageIndex, selectedStyle = 'classic', selectedLayout = 'stack') {
      const photoStyle = safePhotoStyle(selectedStyle), photoLayout = safePhotoLayout(selectedLayout);
      const list = (srcs || []).filter(safeImage);
      if (!list.length) return '';
      const count = list.length;
      const cards = list.map((src, k) => {
        // Keep each photo slightly visible behind the one on top; fanning is responsive via CSS custom properties.
        const middle = (count - 1) / 2;
        // Five distinct compositions, each keeps cards inside the photo area on phones.
        let baseX = 0, baseY = 0, baseR = 0;
        if (photoLayout === 'fan') { baseX = (k - middle) * 46; baseY = 13 + Math.abs(k - middle) * 11; baseR = (k - middle) * 13; }
        else if (photoLayout === 'stair') { baseX = (k - middle) * 40; baseY = 10 + k * 16; baseR = (k - middle) * -3; }
        else if (photoLayout === 'ribbon') { baseX = (k - middle) * 39; baseY = (k % 2 ? 0 : 22) + 8; baseR = k % 2 ? 8 : -9; }
        else if (photoLayout === 'petal') {
          const xs = count === 1 ? [0] : count === 2 ? [-39, 39] : count === 3 ? [-47, 0, 47] : [-46, 43, -33, 33];
          const ys = count === 1 ? [15] : count === 2 ? [10, 10] : count === 3 ? [8, 37, 8] : [6, 6, 35, 35];
          const rs = count === 1 ? [0] : count === 2 ? [-12, 12] : count === 3 ? [-14, 0, 14] : [-16, 16, -9, 9];
          baseX = xs[k]; baseY = ys[k]; baseR = rs[k];
        } else { baseX = (k - middle) * 11; baseY = k * 6; baseR = (k - middle) * -7; }
        const fanX = (k - middle) * 94, fanR = (k - middle) * -8, fanY = Math.abs(k - middle) * 9 + 6;
        return `<button type="button" class="polaroid-card" data-photo-open="${context}:${pageIndex}:${k}" aria-label="Open photo ${k + 1} of ${count}" style="--stack-x:${baseX}px;--stack-y:${baseY}px;--stack-r:${baseR}deg;--fan-x:calc(${fanX}px * var(--fan-scale,1));--fan-r:${fanR}deg;--fan-y:${fanY}px;--order:${k + 1}"><span class="polaroid-image"><img src="${src}" alt="Photo ${k + 1} of ${count}" loading="lazy"></span><span class="polaroid-caption">♡ little memory <b>${String(k + 1).padStart(2, '0')}</b></span></button>`;
      }).join('');
      return `<div class="photo-stack-area photo-variant--${photoStyle} photo-layout--${photoLayout}"><div class="photo-stack-title"><span class="photo-bloom">✧</span><span>${count} sweet ${count === 1 ? 'photo' : 'photos'} · hover or tap to explore</span><span class="photo-bloom">✧</span></div><div class="photo-stack" data-photo-stack="${context}" data-paper-index="${pageIndex}" aria-label="Stack of ${count} photos">${cards}</div><button type="button" class="photo-stack-action" data-photo-spread aria-expanded="false">↔ Spread photos</button><div class="photo-index-picker" role="group" aria-label="Open one of the photos">${list.map((_, k) => `<button type="button" data-photo-open="${context}:${pageIndex}:${k}" aria-label="View photo ${k + 1} of ${count}">${k + 1}</button>`).join('')}</div></div>`;
    }
    const photoViewer = { photos: [], index: 0, opener: null };
    function openPhotoViewer(source, pageIndex, index, opener) {
      let imgs = source === 'editor' ? pages[pageIndex]?.photos : recv?.pages[pageIndex]?.photos;
      imgs = (imgs || []).filter(safeImage);
      if (!imgs.length || index < 0 || index >= imgs.length) return;
      photoViewer.photos = imgs; photoViewer.index = index; photoViewer.opener = opener || document.activeElement;
      $('#photoLightbox').dataset.photoStyle = safePhotoStyle((source === 'editor' ? pages[pageIndex] : recv?.pages[pageIndex])?.photoStyle);
      $('#photoLightbox').hidden = false;
      document.body.style.overflow = 'hidden';
      drawPhotoViewer();
      $('#photoLightboxClose').focus({ preventScroll: true });
    }
    function drawPhotoViewer() {
      const i = photoViewer.index, l = photoViewer.photos.length, img = $('#photoLightboxImage');
      img.src = photoViewer.photos[i]; img.alt = `Envelope picture ${i + 1} of ${l}`;
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      $('#photoLightboxCount').textContent = `${i + 1} / ${l}`;
      $('#photoLightboxSubtitle').textContent = l === 1 ? 'One lovely photo' : `${l} precious memories`;
      $('#photoLightboxCaption').textContent = ['A sweet little moment ♡', 'Something worth keeping ✨', 'A lovely memory 💗', 'Made with love 🌸'][i % 4];
      $('#photoLightboxPrev').disabled = l < 2; $('#photoLightboxNext').disabled = l < 2;
    }
    function movePhotoViewer(dir) { const l = photoViewer.photos.length; if (l < 2) return; photoViewer.index = (photoViewer.index + dir + l) % l; drawPhotoViewer(); }
    function closePhotoViewer() {
      if ($('#photoLightbox').hidden) return;
      $('#photoLightbox').hidden = true; document.body.style.overflow = '';
      $('#photoLightboxImage').removeAttribute('src');
      if (photoViewer.opener?.isConnected) photoViewer.opener.focus({ preventScroll: true });
      photoViewer.photos = [];
    }
    document.addEventListener('click', e => {
      const spread = e.target.closest('[data-photo-spread]');
      if (spread) { const wrap = spread.closest('.photo-stack-area'); const stack = wrap?.querySelector('.photo-stack'); if (stack) { const open = stack.classList.toggle('is-spread'); spread.setAttribute('aria-expanded', String(open)); spread.textContent = open ? '♡ Stack photos' : '↔ Spread photos'; } return; }
      const photo = e.target.closest('[data-photo-open]');
      if (photo) { const [kind, pi, idx] = photo.dataset.photoOpen.split(':'); if (kind === 'editor' || kind === 'reader') openPhotoViewer(kind, +pi, +idx, photo); return; }
    });
    $('#photoLightboxClose').onclick = closePhotoViewer;
    $('#photoLightboxPrev').onclick = () => movePhotoViewer(-1);
    $('#photoLightboxNext').onclick = () => movePhotoViewer(1);
    $('#photoLightbox').onclick = e => { if (e.target.id === 'photoLightbox') closePhotoViewer() };
    let lightboxTouchX = 0;
    $('#photoLightboxImage').addEventListener('touchstart', e => { lightboxTouchX = e.changedTouches[0].clientX }, { passive: true });
    $('#photoLightboxImage').addEventListener('touchend', e => { const diff = e.changedTouches[0].clientX - lightboxTouchX; if (Math.abs(diff) > 38) movePhotoViewer(diff < 0 ? 1 : -1) }, { passive: true });
    function renderPages() {
      activeLetterPage = Math.min(Math.max(activeLetterPage, 0), n() - 1);
      renderPageTabs();
      // Only render the *selected* paper. Other drafts stay in the pages array.
      $('#pages').innerHTML = pages.slice(activeLetterPage, activeLetterPage + 1).map((p, offset) => {
        const i = activeLetterPage + offset;
        return `
        <div class="pg letter-page-panel" id="letterPagePanel" role="tabpanel" aria-labelledby="letterPageTab${i}">
          <div class="pgh"><span>Page ${i + 1}</span><small id="cc${i}">${p.text.length}/600</small></div>
          <textarea maxlength="600" data-i="${i}" aria-label="Page ${i + 1} message" placeholder="${i ? 'Keep going…' : 'Write something sweet…'}">${esc(p.text)}</textarea>
          <div class="pgc"><span>Paper</span><div class="sw sm" data-i="${i}"></div></div>
          <div class="photo-tools">
            <div class="photo-toolbar">
              <label class="photo-add${p.photos.length >= photoLimit() ? ' disabled' : ''}">Add picture<input type="file" accept="image/jpeg,image/png,image/webp" data-photo="${i}" multiple ${p.photos.length >= photoLimit() ? 'disabled' : ''} /></label>
              <small>${p.photos.length}/${photoLimit()} pictures · JPG/PNG/WebP</small>
            </div>
            <div class="photo-design-duo" aria-label="Photo styling choices">
              <div class="polaroid-chooser photo-design-side" role="group" aria-label="Polaroid border style for page ${i + 1}">
                <div class="polaroid-chooser-title"><b>Border</b><small>${isPremium() ? 'Choose frame' : 'Classic free · others Premium ✦'}</small></div>
                <div class="polaroid-options">${PHOTO_STYLES.map((v, j) => `<button type="button" class="polaroid-style-option photo-variant--${v.id}${safePhotoStyle(p.photoStyle) === v.id ? ' on' : ''}${!isPremium() && j ? ' is-locked' : ''}" data-photo-style="${v.id}" data-page="${i}" aria-pressed="${safePhotoStyle(p.photoStyle) === v.id}" aria-label="${v.name}${!isPremium() && j ? ' - Premium locked' : ''}" title="${v.desc}"><span class="polaroid-mini-frame"><span class="polaroid-mini-picture">♡</span><span class="polaroid-mini-foot"></span></span><span class="polaroid-style-name">${!isPremium() && j ? '🔒 ' : ''}${v.name}</span></button>`).join('')}</div>
              </div>
              <div class="polaroid-chooser photo-design-side" role="group" aria-label="Polaroid layering format for page ${i + 1}">
                <div class="polaroid-chooser-title"><b>Layout</b><small>${isPremium() ? 'Choose Layout' : 'Stack free · others Premium ✦'}</small></div>
                <div class="polaroid-options">${PHOTO_LAYOUTS.map((v, j) => `<button type="button" class="polaroid-style-option layer-style-option${safePhotoLayout(p.photoLayout) === v.id ? ' on' : ''}${!isPremium() && j ? ' is-locked' : ''}" data-photo-layout="${v.id}" data-page="${i}" aria-pressed="${safePhotoLayout(p.photoLayout) === v.id}" aria-label="${v.name}${!isPremium() && j ? ' - Premium locked' : ''}" title="${v.desc}"><span class="layer-mini layer-mini--${v.id}" aria-hidden="true"><i></i><i></i><i></i></span><span class="polaroid-style-name">${!isPremium() && j ? '🔒 ' : ''}${v.name}</span></button>`).join('')}</div>
              </div>
            </div>
            <div class="photo-previews">${photoStackMarkup(p.photos, 'editor', i, p.photoStyle, p.photoLayout)}${!p.photos.length ? '' : ''}${p.photos.length ? `<div class="photo-remove-list">${p.photos.map((_, k) => `<button type="button" data-remove-photo="${i}:${k}" aria-label="Remove photo ${k + 1}">✕ Photo ${k + 1}</button>`).join('')}</div>` : ''}</div>
          </div>
          <div class="effect-picker"><b>Page emoji transition</b><small>${isPremium() ? ' Choose an animation for this paper.' : ' Premium feature — subscribe to customize.'}</small>
            <select data-effect="${i}" ${isPremium() ? '' : 'disabled'}>
              ${[['none', 'No effect'], ['hearts', '💗 Floating hearts'], ['sparkles', '✨ Sparkles'], ['flowers', '🌸 Floating flowers'], ['stars', '⭐ Twinkling stars'], ['butterflies', '🦋 Butterflies']].map(([v, t]) => `<option value="${v}" ${p.effect === v ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
        </div>`;
      }).join('');
      $$('#pages [data-photo-style]').forEach(b => b.onclick = () => {
        const id = safePhotoStyle(b.dataset.photoStyle), i = Number(b.dataset.page);
        if (!isPremium() && id !== 'classic') return lockedDesignNotice();
        pages[i].photoStyle = id; renderPages(); toast('Border style updated ♡');
      });
      $$('#pages [data-photo-layout]').forEach(b => b.onclick = () => {
        const id = safePhotoLayout(b.dataset.photoLayout), i = Number(b.dataset.page);
        if (!isPremium() && id !== 'stack') return lockedDesignNotice();
        pages[i].photoLayout = id; renderPages(); toast('Photo layout updated ♡');
      });
      $$('#pages [data-effect]').forEach(select => select.onchange = () => { pages[+select.dataset.effect].effect = select.value; refreshPageTabMarkers() });
      $$('#pages .sw').forEach(el => { const i = +el.dataset.i; swatches(el, PAPER, pages[i].color, c => { pages[i].color = c; updPreview() }) });
      $$('#pages textarea').forEach(t => t.oninput = () => { const i = +t.dataset.i; pages[i].text = t.value; $('#cc' + i).textContent = t.value.length + '/600'; refreshPageTabMarkers() });
      $$('#pages [data-photo]').forEach(input => input.onchange = async e => {
        if (photoBusy) { toast('Please finish uploading the current pictures first'); return }
        const i = +input.dataset.photo; const files = [...e.target.files]; input.value = '';
        if (pages[i].photos.length + files.length > photoLimit()) return toast(`Maximum of ${photoLimit()} pictures per paper`);
        photoBusy = true; $('#make').disabled = true; toast('Preparing your pictures...');
        try { for (const f of files) pages[i].photos.push(await compressPhoto(f)); renderPages(); toast('Picture added ♡') }
        catch (err) { renderPages(); toast(err.message || 'Could not read this picture') }
        finally { photoBusy = false; $('#make').disabled = false }
      });
      $$('#pages [data-remove-photo]').forEach(b => b.onclick = () => {
        const [i, k] = b.dataset.removePhoto.split(':').map(Number);
        pages[i].photos.splice(k, 1); renderPages();
      });
      updPreview();
    }
    async function compressPhoto(file) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw Error('Choose JPG, PNG or WebP only');
      if (file.size > 8 * 1024 * 1024) throw Error('Picture must be smaller than 8 MB');
      const src = URL.createObjectURL(file);
      try {
        const img = new Image(); img.src = src; await img.decode();
        const ratio = Math.min(1, 720 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
        const ctx = canvas.getContext('2d'); if (!ctx) throw Error('Image editor unavailable');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let result = '';
        for (const q of [.78, .65, .50, .38]) { result = canvas.toDataURL('image/jpeg', q); if (result.length < 125000) break }
        if (result.length >= 190000) throw Error('Image is still too large. Try a smaller photo');
        return result;
      } finally { URL.revokeObjectURL(src) }
    }
    function resetLetterEditor() {
      editingId = null; envColor = ENV[0]; paper = PAPER[0]; pages = blank(); activeLetterPage = 0;
      $('#title').value = $('#from').value = $('#signatureText').value = ''; $('#coverText').value = DEFAULT_COVER_TEXT; signatureStyle = 0; signatureAlign = 'right';
      $('#editorTitle').textContent = 'Design your envelope';
      $('#editorSubtitle').textContent = 'Pick the colors, then write each page.';
      $('#editBanner').hidden = true; $('#make').textContent = '💌 Seal my envelope';
      updatePageOptions(); $('#count').value = '3'; renderPages(); renderSignatureStyles(); updateCoverEditorLock();
    }
    function editEnv(id) {
      const e = store.find(v => v.id === id); if (!e) return toast('Envelope not found');
      closeModal(); editingId = e.id; envColor = e.envelopeColor;
      pages = blank(); e.pages.forEach((p, i) => { pages[i] = { text: p.text, color: p.color, photos: [...(p.photos || [])], effect: p.effect || 'none', photoStyle: safePhotoStyle(p.photoStyle), photoLayout: safePhotoLayout(p.photoLayout) } });
      $('#title').value = e.title; $('#from').value = e.from || ''; $('#coverText').value = safeCoverText(e.coverText);
      signatureStyle = e.signature?.style || 0; signatureAlign = e.signature?.align || 'right'; $('#signatureText').value = e.signature?.text || '';
      activeLetterPage = 0;
      $('#editorTitle').textContent = 'Edit existing envelope ✏️';
      $('#editorSubtitle').textContent = 'Make changes without creating a new envelope. Existing short links will be refreshed.';
      $('#editBanner').hidden = false; $('#make').textContent = '☁️ Save changes';
      updatePageOptions(); $('#count').value = String(e.pages.length);
      swatches($('#envSw'), ENV, envColor, c => { envColor = c; updPreview() });
      swatches($('#paperSw'), PAPER, pages[0].color, c => { paper = c; pages.forEach(p => p.color = c); renderPages() });
      renderPages(); renderSignatureStyles(); updateCoverEditorLock(); go('create');
    }
    $('#cancelEdit').onclick = () => { resetLetterEditor(); go('dash') };
    async function refreshPublishedLinks(e) {
      const codes = [...new Set([...(e.linkCodes || []), e.shortCode, e.customCode].filter(Boolean))];
      if (!codes.length) return true;
      let ok = true;
      for (const code of codes) try { if (!await window.WENV_DB.claim(code, e, currentUser.uid)) ok = false; }
        catch (err) { console.warn('Failed to update public link', code, err); ok = false }
      return ok;
    }
    let creating = false;
    async function create() {
      if (!currentUser) return;
      if (!cloudReady) return toast('Cloud sync is not connected yet. Please check Firebase settings.');
      if (photoBusy || creating) return toast('Finish uploading your pictures first');
      if (n() > pageLimit() && !editingId) return toast('Subscribe to Premium for 9–10 pages');
      const t = $('#title').value.trim();
      if (!t) { const input = $('#title'); input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake'); input.focus(); return toast('Give your envelope a title first 💌') }
      const original = editingId ? store.find(v => v.id === editingId) : null;
      if (editingId && !original) return toast('Original envelope not found. Refresh and try again.');
      const e = clean({
        id: original?.id || uid(), title: t, from: $('#from').value.trim(), envelopeColor: envColor,
        coverText: editorCoverText(),
        createdAt: original?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
        shortCode: original?.shortCode, customCode: original?.customCode, linkCodes: original?.linkCodes,
        signature: { text: $('#signatureText').value.trim(), style: signatureStyle, align: isPremium() ? signatureAlign : (original?.signature?.align || 'right') },
        pages: pages.slice(0, n()).map((p, pageIndex) => ({ text: p.text.trim() || 'A little message just for you. ♡', color: p.color, photos: p.photos, effect: p.effect || 'none', photoStyle: isPremium() ? safePhotoStyle(p.photoStyle) : (p.photoStyle === 'classic' ? 'classic' : (original ? safePhotoStyle(original.pages?.[pageIndex]?.photoStyle) : 'classic')), photoLayout: isPremium() ? safePhotoLayout(p.photoLayout) : (p.photoLayout === 'stack' ? 'stack' : (original ? safePhotoLayout(original.pages?.[pageIndex]?.photoLayout) : 'stack')) }))
      });
      creating = true; $('#make').disabled = true; $('#make').textContent = editingId ? '☁️ Updating envelope...' : '☁️ Saving envelope...';
      try {
        await cloudPut(e);
        const linksUpdated = await refreshPublishedLinks(e);
        store = [e, ...store.filter(v => v.id !== e.id)]; renderDash(); created = e;
        const wasEditing = !!editingId;
        resetLetterEditor();
        modal(`<div class="big">💌</div><h2>${wasEditing ? 'Changes saved!' : 'Envelope saved to the cloud!'}</h2><p>${wasEditing ? 'Your existing envelope was updated.' : 'Your envelope is stored under your Google account.'} ${linksUpdated ? 'Existing short links are up to date.' : 'Some older links could not be refreshed; check your Firebase rules.'}</p><div class="row"><button class="btn sec" onclick="closeModal();previewEnv('${e.id}')">👀 View</button><button class="btn pri" onclick="shareEnv('${e.id}')">🔗 Short link</button></div>`);
        cloudState('☁️ Envelopes synced', 'ok');
        burst(null, 20);
      } catch (err) {
        console.error(err);
        cloudState('⚠️ Unable to save. Your unsaved draft is still in the editor.', 'error');
        toast('Cloud save failed. Check Firebase rules. Your draft is still here.');
      }
      finally { creating = false; $('#make').disabled = false; $('#make').textContent = editingId ? '☁️ Save changes' : '💌 Seal my envelope' }
    }


    /* dashboard */
    function renderDash() {
      const L = $('#list');
      $('#recentCount').textContent = store.length; $('#receivedCount').textContent = receivedStore.length;
      $('#total').textContent = `${store.length} created · ${receivedStore.length} received`;
      $('#recentTab').classList.toggle('on', mailboxView === 'recent'); $('#receivedTab').classList.toggle('on', mailboxView === 'received');
      $('#recentTab').setAttribute('aria-selected', String(mailboxView === 'recent')); $('#receivedTab').setAttribute('aria-selected', String(mailboxView === 'received'));
      $('#mailboxNote').textContent = mailboxView === 'recent' ? 'Letters you created. Edit them anytime, then share the same short link.' : 'Letters people sent you through shared links. Open them here without searching old chats.';
      if (mailboxView === 'recent') {
        if (!store.length) { L.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="big">💌</div><h3>No recent envelopes</h3><p class="soft">Start with your first letter.</p><button class="btn pri" data-go="create">Create envelope</button></div>'; return }
        L.innerHTML = store.map(e => `<article class="card"><div class="thumb" style="background:${shade(e.envelopeColor, .72)}">${envHTML(e.envelopeColor, e.pages.map(p => p.color), { coverText: e.coverText })}</div><div class="info"><h3>${esc(e.title)}</h3><div class="meta"><span class="chip">${e.pages.length} pages</span><small>${fmt(e.updatedAt || e.createdAt)}</small></div><div class="acts"><button class="btn sec" onclick="previewEnv('${e.id}')">👀 View</button><button class="btn sec" onclick="editEnv('${e.id}')">✏️ Edit</button><button class="btn pri" onclick="shareEnv('${e.id}')">🔗 Share</button><button class="btn dng" onclick="askDelete('${e.id}')" aria-label="Delete ${esc(e.title)}">🗑</button></div></div></article>`).join('');
      } else {
        if (!receivedStore.length) { L.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="big">📭</div><h3>No received envelopes yet</h3><p class="soft">Open a shared envelope link and it will be saved to this collection.</p></div>'; return }
        L.innerHTML = receivedStore.map(e => `<article class="card"><div class="thumb" style="background:linear-gradient(135deg,#ffe1f0,#eadfff)"><div style="font-size:65px">💌</div></div><div class="info"><h3>${esc(e.title || 'Lovely letter')}</h3><div class="meta"><span class="chip">From ${esc(e.from || 'Someone')}</span><small>${fmt(e.receivedAt)}</small></div><div class="acts"><button class="btn pri" data-received="${esc(e.key)}">💌 Read letter</button><button class="btn dng" data-remove-received="${esc(e.key)}" aria-label="Remove from received">Remove</button></div></div></article>`).join('');
      }
    }
    function setMailbox(view) { mailboxView = view; renderDash(); }
    $('#recentTab').onclick = () => setMailbox('recent');
    $('#receivedTab').onclick = () => setMailbox('received');
    document.addEventListener('click', async event => {
      const view = event.target.closest('[data-received]');
      if (view) {
        const item = receivedStore.find(v => v.key === view.dataset.received); if (!item) return;
        if (item.code) { location.hash = 'e=' + encodeURIComponent(item.code); checkHash() }
        else if (item.envelope) { setup(clean(item.envelope), true) }
        return;
      }
      const remove = event.target.closest('[data-remove-received]');
      if (remove) {
        const key = remove.dataset.removeReceived;
        try { await window.WENV_DB.removeReceived(currentUser.uid, key); toast('Removed from received letters') }
        catch (err) { console.error(err); toast('Could not remove received letter') }
      }
    });
    function askDelete(id) {
      modal(`<div class="big">🥺</div><h2>Delete this envelope?</h2><p>Remove it from your synced collection? Existing shared links will keep working; only share envelopes you trust others to read.</p><div class="row"><button class="btn sec" onclick="closeModal()">Keep it</button><button class="btn dng" onclick="delEnv('${id}')">Delete</button></div>`)
    }
    async function delEnv(id) {
      if (!cloudReady) return toast('Cloud unavailable. Try again when synced.');
      try { await cloudRemove(id); closeModal(); toast('Envelope removed from your cloud collection') }
      catch (err) { console.error(err); toast('Could not delete the envelope from Firebase') }
    }

    /* short links: Firebase stores envelope payload, never in the link itself */
    const enc = e => { const j = JSON.stringify({ title: e.title, from: e.from, envelopeColor: e.envelopeColor, pages: e.pages }); return btoa(String.fromCharCode(...new TextEncoder().encode(j))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
    const dec = s => { try { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)))) } catch { return null } };
    const shortUrl = code => location.href.split(/[?#]/)[0] + '#e=' + encodeURIComponent(code);
    const randomCode = () => {
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789', nums = new Uint8Array(12); crypto.getRandomValues(nums);
      return Array.from(nums, b => chars[b % chars.length]).join('');
    };
    async function publishCode(code, e) {
      if (!currentUser || !cloudReady) throw Error('Cloud not ready');
      const outcome = await window.WENV_DB.claim(code, e, currentUser.uid);
      if (!outcome) throw Error('This link name is already taken');
      return shortUrl(code);
    }
    async function ensureCode(e) {
      if (e.shortCode) {
        // Safe to retry publishing, especially for migrated envelopes.
        await publishCode(e.shortCode, e);
        return e.shortCode;
      }
      for (let attempt = 0; attempt < 4; attempt++) {
        const code = randomCode();
        if (!await window.WENV_DB.claim(code, e, currentUser.uid)) continue;
        e.shortCode = code; e.linkCodes = [...new Set([...(e.linkCodes || []), code])];
        try { await cloudPut(e) } catch (err) { console.error('Could not remember alias:', err); }
        return code;
      }
      throw Error('Could not generate a unique share link');
    }
    async function shareEnv(id) {
      if (!currentUser) return;
      if (!cloudReady) return toast('Connect to Firebase before sharing.');
      const e = store.find(x => x.id === id); if (!e) return toast('Envelope no longer available');
      modal(`<div class="mh"><h2>Share your envelope</h2><button class="x" aria-label="Close" onclick="closeModal()">×</button></div>
        <div class="share-studio">
          <p class="hint-small">Create a short, reusable link. Your letter and pictures stay in Firebase instead of the URL.</p>
          <label>Short link</label><div class="share-row"><input id="shareIn" readonly value="Generating link..." aria-label="Shareable short link" /><button class="btn pri" id="cp" disabled>Copy</button></div>
          <div class="share-actions"><button class="btn sec" id="nat" ${navigator.share ? '' : 'hidden'} disabled>↗ Share link</button></div>
          ${isPremium() ? `<label>✦ Rename your link (Premium)<input id="aliasInput" maxlength="32" placeholder="e.g. for-someone-special" autocomplete="off" /></label>
          <p class="hint-small">4–32 lowercase letters, numbers or hyphens. A custom name may be easier for others to guess.</p>
          <button class="btn sec wide" id="saveAlias" disabled>Save custom link name</button>
          <p class="hint-small" id="aliasStatus" role="status" aria-live="polite"></p>` : `<div class="share-locked"><strong>🔒 Custom link names are Premium</strong>
          <p>Your free plan includes a random short link. Activate Premium to create a personal link name.</p>
          <button type="button" class="btn sec" id="upgradeShareLink">✦ View Subscription</button></div>`}
          ${location.protocol === 'file:' ? '<p class="warn">Publish on Netlify or GitHub Pages. file:// links cannot be shared across devices.</p>' : ''}
        </div>`);
      let activeCode = '';
      function setLink(code) {
        activeCode = code; $('#shareIn').value = shortUrl(code); $('#cp').disabled = false;
        if ($('#nat')) $('#nat').disabled = false;
        if ($('#saveAlias')) $('#saveAlias').disabled = false;
      }
      $('#cp').onclick = async () => {
        if (!activeCode) return;
        try { await navigator.clipboard.writeText(shortUrl(activeCode)); toast('Short link copied! 💌') }
        catch { const field = $('#shareIn'); field.focus(); field.select(); document.execCommand('copy'); toast('Link selected for copying') }
      };
      if ($('#nat')) $('#nat').onclick = () => { if (activeCode && navigator.share) navigator.share({ title: e.title, text: 'A little surprise for you 💌', url: shortUrl(activeCode) }).catch(() => { }) };
      if (isPremium()) {
        $('#aliasInput').value = e.customCode || '';
        $('#saveAlias').onclick = async () => {
          if (!isPremium()) return toast('Custom link names require Premium.');
          const input = $('#aliasInput'); const code = input.value.trim().toLowerCase().replace(/\s+/g, '-'); input.value = code;
          if (!safeCode(code)) return $('#aliasStatus').textContent = 'Use 4–32 lowercase letters, digits, or hyphens.';
          const b = $('#saveAlias'); b.disabled = true; b.textContent = 'Saving...'; $('#aliasStatus').textContent = 'Checking availability...';
          try {
            await publishCode(code, e); e.customCode = code; e.linkCodes = [...new Set([...(e.linkCodes || []), code])].slice(0, 50);
            await cloudPut(e); setLink(code); $('#aliasStatus').textContent = '✓ Custom link saved! Previous links still work.';
          } catch (err) { console.error(err); $('#aliasStatus').textContent = err.message === 'This link name is already taken' ? 'This link name is taken. Try another.' : 'Could not save custom link. Check Firebase rules.'; }
          finally { b.disabled = false; b.textContent = 'Save custom link name'; }
        };
      } else {
        $('#upgradeShareLink').onclick = () => { closeModal(); go('settings'); setSettingsPage('subscription'); };
      }
      try {
        const code = (isPremium() && e.customCode) || await ensureCode(e);
        await publishCode(code, e);
        if ($('#shareIn')) setLink(code);
      } catch (err) { console.error(err); if ($('#shareIn')) $('#shareIn').value = 'Unable to create short link'; toast('Short links need Firebase Database access. Check your rules.'); }
    }


    /* receiver */
    function setup(e, prev) {
      recv = e; idx = 0; preview = prev; $("#recvTitle").textContent = e.title;
      $("#recvSub").textContent = e.from ? `From ${e.from}` : "Someone prepared a little surprise for you.";
      const s = $("#recvScene"); s.className = "scene"; s.innerHTML = `<div class="tilt">${envHTML(e.envelopeColor, e.pages.map(p => p.color), { float: 1, play: 1, id: "recvEnv", coverText: e.coverText })}</div>`;
      $("#hint").style.display = ""; $("#reader").hidden = true; $("#back").hidden = !prev; go("recv")
    }
    function previewEnv(id) { if (!currentUser) return; const e = store.find(x => x.id === id); if (e) { closeModal(); setup(e, true) } }
    function openRecv() {
      const env = $("#recvEnv"); if (!env || env.classList.contains("open")) return; env.classList.remove("float"); env.classList.add("open"); $("#hint").style.display = "none"; burst(env, 18);
      setTimeout(() => $("#recvScene").classList.add("done"), 1900);
      setTimeout(() => { $("#recvScene").classList.add("gone"); $("#reader").hidden = false; show(0, 1) }, 2550)
    }
    function show(i, dir) {
      idx = i; const p = recv.pages[i], el = $("#page"), last = i === recv.pages.length - 1;
      el.style.setProperty("--paper", p.color); el.className = "page"; void el.offsetWidth; el.className = "page " + (dir > 0 ? "fn" : "fp");
      $('#pgTxt').textContent = p.text; $('#pgNo').textContent = `Page ${i + 1} of ${recv.pages.length}`;
      const photos = $('#pgPhotos'); photos.innerHTML = photoStackMarkup(p.photos, 'reader', i, p.photoStyle, p.photoLayout);
      photos.hidden = !(p.photos || []).length;
      $("#dots").innerHTML = recv.pages.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
      $("#prev").style.visibility = i ? "visible" : "hidden"; $("#next").textContent = last ? "Finish ♡" : "Next ›";
      const sig = recv.signature || {};
      $('#sign').textContent = last ? (sig.text ? '— ' + sig.text : recv.from ? '— ' + recv.from : '') : '';
      $('#sign').style.fontFamily = SIGNATURE_STYLES[Number(sig.style) || 0]?.font || SIGNATURE_STYLES[0].font;
      $('#sign').style.fontStyle = (Number(sig.style) || 0) === 9 ? 'italic' : 'normal';
      $('#sign').style.textAlign = ['left','center','right'].includes(sig.align) ? sig.align : 'right';
      renderPaperEffect(p.effect || 'none');
    }
    function renderPaperEffect(effect) {
      const layer = $('#paperEmoji');
      layer.textContent = '';
      if (appearance.reduceMotion || !effect || effect === 'none') return;
      const icons = { hearts: ['💗', '💕', '💖'], sparkles: ['✨', '✧', '✦'], flowers: ['🌸', '🌷', '🌼'], stars: ['⭐', '🌟', '✨'], butterflies: ['🦋', '🦋', '✨'] }[effect];
      if (!icons) return;
      for (let i = 0; i < 11; i++) {
        const el = document.createElement('span'); el.className = 'emoji-particle'; el.textContent = icons[i % icons.length];
        el.style.left = `${5 + (i * 23) % 91}%`; el.style.top = `${18 + (i * 17) % 75}%`;
        el.style.animationDelay = `${i * -.43}s`; el.style.animationDuration = `${4 + (i % 3)}s`;
        layer.append(el);
      }
    }
    const prev = () => idx > 0 && show(idx - 1, -1);
    function next() {
      if (idx < recv.pages.length - 1) return show(idx + 1, 1); burst(null, 26);
      modal(`<div class="big">💌</div><h2>That was the last page</h2><p>${recv.from ? "With love, " + esc(recv.from) : "Thanks for reading."}</p><div class="row"><button class="btn sec" onclick="closeModal();show(0,-1)">Read again</button>${preview ? '<button class="btn pri" onclick="leave()">Back to my envelopes</button>' : '<button class="btn pri" onclick="leave(1)">Make my own</button>'}</div>`)
    }
    function leave(c) { closeModal(); history.replaceState(null, '', location.pathname + location.search); recv = null; go(c ? 'create' : 'dash') }
    let hashRequest = 0;
    function checkHash() {
      if (!currentUser) return false;
      const h = location.hash;
      if (h.startsWith('#e=')) {
        const code = decodeURIComponent(h.slice(3));
        const request = ++hashRequest;
        if (!safeCode(code)) { toast('Invalid short link'); go('home'); return true }
        go('recv'); $('#recvHead').hidden = false; $('#recvTitle').textContent = 'Opening your letter...'; $('#recvSub').textContent = 'Finding your envelope in Firebase 💌';
        $('#recvScene').innerHTML = ''; $('#hint').style.display = 'none'; $('#reader').hidden = true; $('#back').hidden = true;
        window.WENV_DB.getPublic(code).then(raw => {
          if (request !== hashRequest || currentUser === null || location.hash !== h) return;
          const obj = clean(raw && raw.envelope);
          if (!obj) { toast('This short link does not exist'); history.replaceState(null, '', location.pathname + location.search); go('home'); return }
          setup(obj, false);
          recordReceived('link-' + code, obj, code);
        }).catch(err => { if (request !== hashRequest) return; console.error(err); toast('Could not load envelope. Check internet or public-link rules.'); go('home') });
        return true;
      }
      if (!h.startsWith('#envelope=')) return false;
      const d = clean(dec(h.slice(10)));
      if (!d) { toast('This older envelope link looks broken'); return false }
      setup(d, false); recordReceived('legacy-' + String(h).split('').reduce((v, c) => (Math.imul(v, 31) + c.charCodeAt(0)) >>> 0, 7).toString(36), d, ''); return true;
    }


    /* account-scoped appearance; persistence is local to this browser */
    const DEFAULT_APPEARANCE = Object.freeze({ start: "#fff1f7", end: "#f4ecff", text: "#5b4260", accent: "#ee7fae", font: "nunito", size: "1", hearts: true, reduceMotion: false });
    const THEMES = [
      { name: "Blush", start: "#fff1f7", end: "#f4ecff", text: "#5b4260", accent: "#ee7fae" },
      { name: "Lavender", start: "#eee6ff", end: "#dff4ff", text: "#53426d", accent: "#a389d5" },
      { name: "Peach", start: "#fff2df", end: "#ffe0eb", text: "#70475c", accent: "#e89280" },
      { name: "Mint", start: "#e9fff2", end: "#dcefff", text: "#3a6262", accent: "#71b5ab" }
    ];
    const FONTS = { nunito: '"Nunito",system-ui,sans-serif', fredoka: '"Fredoka",system-ui,sans-serif', system: 'system-ui,sans-serif', georgia: 'Georgia,serif', trebuchet: '"Trebuchet MS",system-ui,sans-serif' };
    let appearance = { ...DEFAULT_APPEARANCE }, appearanceKey = null;
    function validatedAppearance(raw) {
      if (!raw || typeof raw !== "object") return { ...DEFAULT_APPEARANCE };
      const a = { ...DEFAULT_APPEARANCE };
      for (const name of ["start", "end", "text", "accent"]) if (hexOk(raw[name])) a[name] = raw[name];
      if (Object.hasOwn(FONTS, raw.font)) a.font = raw.font;
      if (["0.92", "1", "1.1", "1.2"].includes(String(raw.size))) a.size = String(raw.size);
      if (typeof raw.hearts === "boolean") a.hearts = raw.hearts;
      if (typeof raw.reduceMotion === "boolean") a.reduceMotion = raw.reduceMotion;
      return a;
    }
    function loadAppearance(uid) {
      appearanceKey = "wenvcute_appearance_v2_" + uid;
      try { appearance = validatedAppearance(JSON.parse(localStorage.getItem(appearanceKey) || "null")) }
      catch { appearance = { ...DEFAULT_APPEARANCE } }
      applyAppearance();
    }
    function applyAppearance() {
      const root = document.documentElement.style;
      root.setProperty("--gradient-start", appearance.start);
      root.setProperty("--gradient-end", appearance.end);
      root.setProperty("--theme-ink", appearance.text);
      root.setProperty("--theme-muted", shade(appearance.text, .26));
      root.setProperty("--accent", appearance.accent);
      root.setProperty("--accent-light", shade(appearance.accent, .26));
      root.setProperty("--text-scale", appearance.size);
      root.setProperty("--ui", FONTS[appearance.font]);
      document.body.classList.toggle("no-fx", !appearance.hearts);
      document.body.classList.toggle("reduce-motion", appearance.reduceMotion);
      for (const [name, id] of [["start", "gradStart"], ["end", "gradEnd"], ["text", "textColor"], ["accent", "accentColor"]]) {
        $("#" + id).value = appearance[name]; $("#" + id + "Label").textContent = appearance[name].toUpperCase();
      }
      $("#fontChoice").value = appearance.font;
      $("#textSize").value = appearance.size;
      $("#showHearts").checked = appearance.hearts;
      renderThemePresets();
    }
    function changeAppearance(patch) {
      appearance = validatedAppearance({ ...appearance, ...patch });
      applyAppearance();
      if (currentUser && appearanceKey) {
        try { localStorage.setItem(appearanceKey, JSON.stringify(appearance)) }
        catch { toast("Could not save appearance preferences") }
      }
    }
    function renderThemePresets() {
      $("#themePresets").innerHTML = THEMES.map((t, i) => {
        const on = ["start", "end", "text", "accent"].every(k => t[k] === appearance[k]);
        return `<button type="button" class="theme-preset${on ? " on" : ""}" data-preset="${i}" aria-pressed="${on}"><span class="theme-preview" style="background:linear-gradient(135deg,${t.start},${t.end})"></span><span class="theme-label">${t.name}</span></button>`;
      }).join("");
    }
    function setSettingsPage(id) {
      $$(".settings-nav").forEach(b => { const on = b.dataset.settings === id; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)) });
      $$(".settings-panel").forEach(p => p.classList.toggle("on", p.id === "settings-" + id));
    }
    function safePhoto(url) {
      return typeof url === "string" && /^https:\/\//i.test(url) ? url : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23f5dbea'/%3E%3Ctext x='50' y='68' text-anchor='middle' font-size='56'%3E%F0%9F%92%97%3C/text%3E%3C/svg%3E";
    }
    function renderUser(user) {
      const name = user.displayName || user.email?.split("@")[0] || "Envelope friend";
      $("#navName").textContent = name;
      $("#accountName").textContent = name;
      $("#accountEmail").textContent = user.email || "Signed in with Google";
      $("#navAvatar").src = $("#accountAvatar").src = safePhoto(user.photoURL);
    }
    function authStatus(message, error = false) {
      $("#authStatus").textContent = message;
      $("#authStatus").classList.toggle("error", error);
    }
    function authError(error) {
      const code = error && error.code;
      const msg = ({
        "auth/popup-closed-by-user": "Sign-in window closed. Try again when you’re ready.",
        "auth/cancelled-popup-request": "The sign-in attempt was cancelled. Please try again.",
        "auth/popup-blocked": "Your browser blocked the Google popup. Allow popups or use redirect below.",
        "auth/unauthorized-domain": "This website domain must be added to Firebase Authentication → Settings → Authorized domains.",
        "auth/operation-not-allowed": "Enable Google as a sign-in provider in Firebase Authentication → Sign-in method.",
        "auth/network-request-failed": "Network problem. Check your internet connection and try again.",
        "auth/operation-not-supported-in-this-environment": "Open the site using localhost or HTTPS, not file://."
      })[code];
      authStatus(msg || "Could not sign in. Check Firebase Authentication configuration and try again.", true);
      $("#googleRedirect").hidden = !(code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment");
    }
    function showAuthControls() {
      const ok = !!window.WENV_AUTH.signIn;
      $("#googleSignIn").disabled = !ok;
      $("#googleButtonText").textContent = "Continue with Google";
      if (ok && !currentUser) authStatus(location.protocol === "file:" ? "Open this file via localhost or HTTPS for Google sign-in." : "Sign in with your Google account to continue.", location.protocol === "file:");
      if (location.protocol === "file:") $("#googleRedirect").hidden = true;
    }
    function setSignedInUser(user) {
      const oldUid = currentUser && currentUser.uid;
      currentUser = user || null;
      document.body.classList.toggle('authenticated', !!user);
      $('#authGate').hidden = !!user;
      if (!user) {
        stopCloud(); stopReceived(); stopSubscription(); stopPayments(); stopCloud = stopReceived = stopSubscription = stopPayments = () => { }; cloudReady = false; cloudConnected = false; receivedStore = []; premiumApproved = false; premiumPayments = []; editingId = null;
        accountKey = null; appearanceKey = null; store = []; recv = null; connectionUid = null;
        $('#googleRedirect').hidden = true;
        updateSubscriptionUI(); showAuthControls(); return;
      }
      if (oldUid !== user.uid) {
        premiumApproved = false; premiumPayments = [];
        loadAccount(user.uid); loadAppearance(user.uid); renderUser(user); renderDash();
        watchReceived(user.uid); watchPremium(user.uid); watchPayments(user.uid);
        if (!checkHash()) go('home');
        watchCloud(user.uid);
      }
    }


    window.WENV_AUTH = {
      signIn: null, signOut: null, redirect: null,
      ready(actions) { Object.assign(this, actions); showAuthControls() },
      user: setSignedInUser,
      fail(error) { $("#googleSignIn").disabled = true; authStatus("Firebase did not load. Check your connection and reload the site.", true); console.error("Firebase load failed:", error) },
      redirectError: authError
    };
    $("#googleSignIn").onclick = async () => {
      if (!window.WENV_AUTH.signIn) return;
      if (location.protocol === "file:") { authStatus("Google sign-in needs localhost or an HTTPS website. Run the HTML using a local web server.", true); return }
      $("#googleSignIn").disabled = true; $("#googleButtonText").textContent = "Opening Google…"; authStatus("Choose your Google account in the popup.");
      try { await window.WENV_AUTH.signIn() }
      catch (e) { authError(e) }
      finally { $("#googleSignIn").disabled = false; $("#googleButtonText").textContent = "Continue with Google" }
    };
    $("#googleRedirect").onclick = async () => {
      if (location.protocol === "file:" || !window.WENV_AUTH.redirect) return;
      authStatus("Redirecting to Google…");
      try { await window.WENV_AUTH.redirect() } catch (e) { authError(e) }
    };
    document.addEventListener("click", e => {
      const b = e.target.closest("[data-settings]"); if (b) setSettingsPage(b.dataset.settings);
      const p = e.target.closest("[data-preset]"); if (p) changeAppearance({ ...THEMES[Number(p.dataset.preset)] });
    });
    for (const [id, name] of [["gradStart", "start"], ["gradEnd", "end"], ["textColor", "text"], ["accentColor", "accent"]]) {
      $("#" + id).addEventListener("input", e => changeAppearance({ [name]: e.target.value }));
    }
    $("#fontChoice").onchange = e => changeAppearance({ font: e.target.value });
    $("#textSize").onchange = e => changeAppearance({ size: e.target.value });
    $("#showHearts").onchange = e => changeAppearance({ hearts: e.target.checked });
    $("#resetAppearance").onclick = () => { changeAppearance({ ...DEFAULT_APPEARANCE }); toast("Original appearance restored 💗") };
    $('#premiumPlanBtn').onclick = paymentPicker;
    $("#signOutBtn").onclick = () => modal(`<div class="big">👋</div><h2>Sign out?</h2><p>You can come back with the same Google account. Your envelopes will remain synced to your Google account in Firebase.</p><div class="row"><button class="btn sec" onclick="closeModal()">Stay here</button><button class="btn dng" onclick="confirmSignOut()">Sign out</button></div>`);
    async function confirmSignOut() {
      closeModal();
      try { await window.WENV_AUTH.signOut() } catch { toast("Sign out failed. Please try again.") }
    }
    $("#exportEnvelopes").onclick = () => {
      if (!currentUser) return;
      const contents = JSON.stringify({ format: "wenvcute-backup", version: 1, exportedAt: new Date().toISOString(), envelopes: store }, null, 2);
      const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = "w-envelope-cute-backup-" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast("Backup downloaded ♡");
    };
    $("#importEnvelopes").onclick = () => $("#importFile").click();
    $("#importFile").onchange = async e => {
      const file = e.target.files[0]; e.target.value = ""; if (!file) return;
      if (file.size > 8 * 1024 * 1024) return toast("Backup is too large (8 MB maximum)");
      try {
        const data = JSON.parse(await file.text());
        if (!data || data.format !== "wenvcute-backup" || !Array.isArray(data.envelopes)) throw Error("invalid format");
        const imported = data.envelopes.slice(0, 500).map(clean).filter(Boolean);
        if (!imported.length) return toast("No valid envelopes found in the backup");
        const existing = new Set(store.map(v => v.id));
        const fresh = imported.filter(v => !existing.has(v.id));
        if (!cloudReady) return toast('Cloud not connected. Try again when synced.');
        let succeeded = 0;
        for (const item of fresh) { await cloudPut(item); succeeded++ }
        toast(`${succeeded} envelopes imported to Firebase 💌`);
      } catch { toast("Could not read this envelope backup") }
    };
    $("#clearEnvelopes").onclick = () => {
      if (!store.length) return toast("No envelopes to delete");
      modal(`<div class="big">🗑️</div><h2>Delete all envelopes?</h2><p>This will delete ${store.length} synced envelope${store.length === 1 ? "" : "s"} from your Google account on all devices. Make a backup first if needed.</p><div class="row"><button class="btn sec" onclick="closeModal()">Cancel</button><button class="btn dng" onclick="confirmClear()">Delete all</button></div>`);
    };
    async function confirmClear() {
      if (!cloudReady) return toast('Cloud is unavailable');
      closeModal();
      try { await window.WENV_DB.clear(currentUser.uid); toast('All synced envelopes deleted') }
      catch (err) { console.error(err); toast('Could not clear Firebase envelopes') }
    }
    $("#footerYear").textContent = $("#copyrightYear").textContent = new Date().getFullYear();

    /* events */
    document.addEventListener("click", e => {
      const g = e.target.closest("[data-go]"); if (g) { if (g.dataset.go === 'create' && editingId) resetLetterEditor(); return go(g.dataset.go) }
      const v = e.target.closest(".env[data-play]"); if (!v) return;
      if (v.id === "recvEnv") return openRecv();
      const o = v.classList.toggle("open"); if (o) burst(v, 10)
    });
    document.addEventListener("pointermove", e => {
      if (calm || e.pointerType === "touch") return; const s = e.target.closest("[data-tilt]");
      if (!s || !s.firstElementChild) return; const r = s.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      s.firstElementChild.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 10}deg)`
    });
    document.addEventListener("pointerout", e => { const s = e.target.closest && e.target.closest("[data-tilt]"); if (s && s.firstElementChild && !s.contains(e.relatedTarget)) s.firstElementChild.style.transform = "" });
    addEventListener("keydown", e => {
      if (!$('#photoLightbox').hidden) {
        if (e.key === 'Escape') { e.preventDefault(); closePhotoViewer(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); movePhotoViewer(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); movePhotoViewer(-1); }
        else if (e.key === 'Tab') {
          const buttons = [$('#photoLightboxClose'), $('#photoLightboxPrev'), $('#photoLightboxNext')].filter(b => !b.disabled);
          if (e.shiftKey && document.activeElement === buttons[0]) { e.preventDefault(); buttons[buttons.length - 1].focus(); }
          else if (!e.shiftKey && document.activeElement === buttons[buttons.length - 1]) { e.preventDefault(); buttons[0].focus(); }
        }
        return;
      }
      if (e.key === "Escape") return closeModal();
      if (!recv || $("#reader").hidden || $("#modal").classList.contains("show") || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev()
    });
    let tx = 0; $("#page").addEventListener("touchstart", e => { tx = e.target.closest('.paper-photos') ? null : e.touches[0].clientX }, { passive: true });
    $("#page").addEventListener("touchend", e => { if (tx === null || e.target.closest('.paper-photos')) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) d < 0 ? next() : prev() });
    $("#modal").onclick = e => { if (e.target.id === "modal") closeModal() };
    $("#prev").onclick = prev; $("#next").onclick = next; $("#make").onclick = create;
    $('#title').oninput = updPreview;
    $('#coverText').oninput = updPreview;
    $('#coverUpgrade').onclick = () => { go('settings'); setSettingsPage('subscription'); };
    $('#count').onchange = () => { activeLetterPage = 0; renderPages() };
    $('#letterPageTabs').addEventListener('scroll', updatePageTabArrows, { passive: true });
    $('#letterPageLeft').onclick = () => $('#letterPageTabs').scrollBy({ left: -$('#letterPageTabs').clientWidth * .75, behavior: 'smooth' });
    $('#letterPageRight').onclick = () => $('#letterPageTabs').scrollBy({ left: $('#letterPageTabs').clientWidth * .75, behavior: 'smooth' });
    $('#signatureText').oninput = renderSignatureStyles;
    addEventListener("hashchange", checkHash);

    /* init */
    const bg = $("#bg"); for (let i = 0; i < 9; i++) {
      const s = document.createElement("i"); s.textContent = ["♡", "✦", "♥", "✧"][i % 4];
      s.style.cssText = `left:${(i * 37 + 8) % 96}%;top:${(i * 53 + 10) % 88}%;font-size:${14 + i % 4 * 8}px;animation-delay:${-i * 1.3}s;animation-duration:${9 + i % 4 * 3}s`; bg.append(s)
    }
    updatePageOptions(); $('#count').value = '3';
    swatches($("#envSw"), ENV, envColor, c => { envColor = c; updPreview() });
    swatches($("#paperSw"), PAPER, paper, c => { paper = c; pages.forEach(p => p.color = c); renderPages() });
    $("#demo").innerHTML = envHTML(ENV[0], PAPER.slice(0, 3), { float: 1, play: 1 });
    $("#pvEnv").innerHTML = envHTML(envColor, [paper], { play: 1 });
    renderPages(); renderSignatureStyles(); renderDash();
    // Firebase observer decides when the app becomes visible and which account owns local data.
