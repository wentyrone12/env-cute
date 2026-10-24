/* W-Envelope Cute v4.6 — responsive owner payment dashboard.
   Firebase rules, not the visual UID check, authorize sensitive data and writes.
   A payment reference is untrusted until independently matched to a bank transaction. */
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[ch]);
const cfg = window.WENV_PAYMENT || {};
const firebaseConfig = window.WENV_FIREBASE_CONFIG || {};
const price = () => Number(cfg.premiumPricePHP || 0);
const currency = amount => '₱' + (Number.isFinite(Number(amount)) ? Number(amount).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '—');
const prettyDate = timestamp => Number.isFinite(Number(timestamp)) && Number(timestamp) > 0
  ? new Date(Number(timestamp)).toLocaleString('en-PH', {dateStyle:'medium',timeStyle:'short'}) : 'Unknown';
const isAdmin = user => Boolean(user && cfg.adminUid && user.uid === cfg.adminUid);
const legalMethods = ['maya','gotyme'];
const legalStatuses = ['pending','approved','rejected'];
const sectionMeta = {
  dashboard: ['Dashboard','A clear view of your premium requests.','Recent payment requests','Review the latest incoming transfers.'],
  maya: ['Maya Payments','Manage Maya premium transfers separately.','Maya payment requests','Only Maya transaction submissions appear here.'],
  gotyme: ['GoTyme Payments','Manage GoTyme premium transfers separately.','GoTyme payment requests','Only GoTyme transaction submissions appear here.'],
  all: ['All Payments','Browse every payment request in one place.','All payment requests','Filter by status or search customer details.']
};
let auth = null, signIn = null, signOut = null, writeReview = null;
let current = null, requests = [], section = 'dashboard', term = '', statusFilter = 'all';
let pageSize = 12, stopListening = () => {}, selectedReview = null, reviewBusy = false, triggerBeforeDialog = null, toastTimer;

function setStatus(message, type = 'info', title) {
  $('#adminStatus').textContent = message;
  const notice = $('#adminNotice');
  notice.className = 'admin-notice' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
  $('#adminNoticeTitle').textContent = title || (type === 'error' ? 'Something needs attention' : type === 'success' ? 'Connected successfully' : 'Admin connection');
  $('#adminNoticeIcon').textContent = type === 'error' ? '⚠' : type === 'success' ? '✓' : '◌';
  notice.hidden = false;
  $('#dismissNotice').hidden = type === 'error';
  $('#adminConnection').className = 'admin-connection' + (type === 'error' ? ' error' : type === 'success' ? ' connected' : '');
  $('#adminConnText').textContent = type === 'error' ? 'Attention' : type === 'success' ? 'Connected' : 'Connecting';
}
function flash(message) {
  const el = $('#adminToast');
  clearTimeout(toastTimer); el.textContent = message; el.classList.add('visible');
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3200);
}
$('#dismissNotice').onclick = () => {$('#adminNotice').hidden = true;};
function setIdentity(user) {
  $('#adminIdentity').hidden = !user;
  if (!user) return;
  $('#adminEmail').textContent = user.email || user.displayName || '(no email)';
  $('#adminActualUid').textContent = user.uid;
  $('#adminExpectedUid').textContent = cfg.adminUid || '(not configured)';
  $('#adminProject').textContent = firebaseConfig.projectId || '(missing)';
}
$('#adminCopyUid').onclick = async () => {
  try {await navigator.clipboard.writeText($('#adminActualUid').textContent); flash('UID copied to clipboard.');}
  catch {flash('Please select and copy the UID from the details panel.');}
};
$('#adminLogin').disabled = true;
$('#adminLogin').onclick = async () => {
  if (!signIn) return setStatus('Google sign-in has not loaded. Check your connection.', 'error');
  $('#adminLogin').disabled = true;
  setStatus('Opening Google account selection…');
  try {await signIn();}
  catch(error) {
    const code = String(error?.code || '');
    if(code.includes('unauthorized-domain')) setStatus('Add this hostname in Firebase Authentication → Settings → Authorized domains.', 'error', 'Google login blocked');
    else if(code.includes('operation-not-allowed')) setStatus('Enable Google under Firebase Authentication → Sign-in method.', 'error', 'Google provider disabled');
    else if(code.includes('popup-blocked')) setStatus('Allow browser popups for this website and retry.', 'error', 'Popup blocked');
    else if(code.includes('popup-closed-by-user') || code.includes('cancelled-popup-request')) setStatus('Google account selection was cancelled. You can retry.');
    else setStatus('Google sign-in failed (' + (error?.code || 'unknown') + '): ' + (error?.message || 'Check browser or internet connection.'),'error');
  } finally {$('#adminLogin').disabled = false;}
};
$('#adminSignOut').onclick = async () => {
  try {if(signOut) await signOut();}
  catch(error) {setStatus('Sign-out failed: ' + error.message, 'error');}
};
function onSession(user, { ref, onValue }) {
  stopListening(); stopListening = () => {};
  closeReview(true);
  current = null; requests = [];
  setIdentity(user);
  $('#adminLogin').hidden = Boolean(user);
  $('#adminSignOut').hidden = !user;
  $('#adminLoginPanel').hidden = Boolean(user);
  $('#adminDashboard').hidden = true;
  render();
  if(!user) {setStatus('Sign in with the authorized Google account to open the payments dashboard.'); return;}
  if(!cfg.adminUid) {setStatus('Missing admin UID in js/payment-config.js. Find your UID under Admin access & setup help.','error','Admin configuration required'); return;}
  if(!isAdmin(user)) {setStatus('The signed-in account UID differs from the configured admin UID. Sign out and choose the authorized account.','error','UID mismatch'); $('#adminHelp').open = true; return;}
  current = user;
  setStatus('Your UID matches. Checking Realtime Database read permissions…');
  $('#adminWelcomeName').textContent = 'Welcome back, ' + (user.displayName ? user.displayName.split(' ')[0] : 'Admin') + ' ✨';
  stopListening = onValue(ref('premiumPayments'), snapshot => {
    if(!current || current.uid !== user.uid) return;
    requests = [];
    for(const [uid, entries] of Object.entries(snapshot.val() || {})) {
      if (!entries || typeof entries !== 'object') continue;
      for(const [id, item] of Object.entries(entries)) {
        if(item && typeof item === 'object') requests.push({...item,uid,id});
      }
    }
    requests.sort((a,b) => Number(b.submittedAt || 0) - Number(a.submittedAt || 0));
    $('#adminDashboard').hidden = false;
    $('#adminLoginPanel').hidden = true;
    render();
    const pendingCount = requests.filter(item => item.status === 'pending').length;
    setStatus('Admin access confirmed. ' + pendingCount + ' pending request' + (pendingCount === 1 ? '' : 's') + ' awaiting verification.', 'success', 'Admin workspace ready');
  }, error => {
    $('#adminDashboard').hidden = true;
    const denied = String(error?.code || '').toLowerCase().includes('permission');
    setStatus(denied
      ? 'Permission denied by Firebase. Publish your updated database.rules.json in Realtime Database → Rules and verify the admin UID.'
      : 'Cannot load payment requests: ' + (error?.message || 'Check internet and Firebase configuration.'), 'error', 'Database access failed');
    if(denied) $('#adminHelp').open = true;
  });
}

// Navigation is intentionally independent from the authentication state, but data remains guarded.
$$('.admin-nav').forEach(button => button.addEventListener('click', () => {setActiveSection(button.dataset.section); }));
$$('[data-open-method]').forEach(button => button.addEventListener('click', () => setActiveSection(button.dataset.openMethod)));
function setActiveSection(next) {
  if(!sectionMeta[next]) return;
  section = next; pageSize = 12;
  const meta = sectionMeta[next];
  $('#adminTitle').textContent = meta[0];
  $('#adminSubtitle').textContent = meta[1];
  $('#adminListHeading').textContent = meta[2];
  $('#adminListSubtitle').textContent = meta[3];
  $('#adminListEyebrow').textContent = next === 'dashboard' ? 'RECENT ACTIVITY' : 'PAYMENT RECORDS';
  $$('.admin-nav').forEach(node => {
    const selected = node.dataset.section === next;
    node.classList.toggle('active', selected);
    selected ? node.setAttribute('aria-current','page') : node.removeAttribute('aria-current');
  });
  $('#adminStats').hidden = next !== 'dashboard';
  $('#adminMethodSummary').hidden = next !== 'dashboard';
  $('.admin-welcome').hidden = next !== 'dashboard';
  render();
  if(window.innerWidth <= 720) window.scrollTo({top:0,behavior:'smooth'});
}
$('#adminSearch').oninput = event => {term = event.target.value.trim().toLowerCase(); pageSize = 12; renderList();};
$('#adminFilter').onchange = event => {statusFilter = event.target.value; pageSize = 12; renderList();};
$('#loadMorePayments').onclick = () => {pageSize += 12; renderList();};
function render() {
  const stat = status => requests.filter(item => item.status === status).length;
  const methodStat = method => requests.filter(item => item.method === method);
  $('#statPending').textContent = stat('pending').toLocaleString('en-PH');
  $('#statApproved').textContent = stat('approved').toLocaleString('en-PH');
  $('#statRejected').textContent = stat('rejected').toLocaleString('en-PH');
  $('#statRevenue').textContent = currency(requests.filter(item => item.status === 'approved').reduce((sum,item) => sum + (Number(item.amount) || 0),0));
  for(const method of legalMethods) {
    const entries = methodStat(method);
    const pending = entries.filter(x => x.status === 'pending').length;
    $('#' + method + 'Summary').textContent = pending + ' pending · ' + entries.length + ' total';
    $('#' + method + 'Badge').textContent = pending > 99 ? '99+' : pending;
    $('#' + method + 'Badge').hidden = pending === 0;
  }
  renderList();
}
function matchingRequests() {
  return requests.filter(item => {
    if(section === 'maya' || section === 'gotyme') if(item.method !== section) return false;
    if(statusFilter !== 'all' && item.status !== statusFilter) return false;
    if(!term) return true;
    return [item.email, item.reference, item.uid, item.method, item.status, item.id]
      .some(value => String(value ?? '').toLowerCase().includes(term));
  });
}
function renderList() {
  const list = $('#adminList');
  const matching = matchingRequests();
  $('#resultCount').textContent = matching.length.toLocaleString('en-PH') + ' request' + (matching.length === 1 ? '' : 's');
  $('#loadMorePayments').hidden = matching.length <= pageSize;
  if(!matching.length) {
    list.innerHTML = `<div class="admin-empty"><span aria-hidden="true" style="font-size:32px">${requests.length ? '🔎' : '💌'}</span><strong>${requests.length ? 'No matching payments' : 'No payment requests yet'}</strong><p>${requests.length ? 'Try a different search or status filter.' : 'Customer-submitted Maya and GoTyme requests will appear here.'}</p></div>`;
    return;
  }
  list.innerHTML = matching.slice(0,pageSize).map(item => {
    const globalIndex = requests.indexOf(item);
    const method = item.method === 'maya' ? 'Maya' : item.method === 'gotyme' ? 'GoTyme' : 'Unknown';
    const methodClass = legalMethods.includes(item.method) ? item.method : '';
    const statusClass = legalStatuses.includes(item.status) ? item.status : '';
    const safeStatus = legalStatuses.includes(item.status) ? item.status : 'unknown';
    const pending = item.status === 'pending';
    const mismatch = !(price() > 0 && Number(item.amount) === price());
    return `<article class="admin-pay-card"><div class="admin-payment-main">
      <div class="admin-payment-head"><h3>${escapeHTML(item.email || 'Unknown customer')}</h3><span class="admin-method-tag ${methodClass}">${escapeHTML(method)}</span><span class="admin-status-tag ${statusClass}">${escapeHTML(safeStatus[0].toUpperCase()+safeStatus.slice(1))}</span></div>
      <div class="admin-payment-meta"><span>Reference: <code>${escapeHTML(item.reference || '—')}</code></span><span>${escapeHTML(prettyDate(item.submittedAt))}</span></div>
      <div class="admin-payment-amount">${currency(item.amount)}</div>
      ${mismatch && pending ? '<p class="admin-pay-warning">⚠ Amount does not match the configured Premium price. Do not approve.</p>' : ''}
      </div><div class="admin-payment-actions">${pending
        ? `<button type="button" class="admin-approve" data-review="approve" data-index="${globalIndex}" ${mismatch ? 'disabled title="Price mismatch"' : ''}>✓ Approve</button><button type="button" class="admin-reject" data-review="reject" data-index="${globalIndex}">✕ Reject</button>`
        : '<span class="admin-readonly">Reviewed request</span>'}</div></article>`;
  }).join('');
}
$('#adminList').addEventListener('click', event => {
  const button = event.target.closest('[data-review]');
  if(!button || button.disabled) return;
  const item = requests[Number(button.dataset.index)];
  if(item) openReview(item, button.dataset.review === 'approve', button);
});

function detail(title, content, wide = false) {
  return `<div class="admin-dialog-detail${wide ? ' wide' : ''}"><b>${escapeHTML(title)}</b>${escapeHTML(content)}</div>`;
}
function openReview(item, approved, trigger) {
  if(!current || !isAdmin(current) || item.status !== 'pending') return;
  if(approved && (price() <= 0 || Number(item.amount) !== price())) return flash('Price mismatch: approval is blocked.');
  triggerBeforeDialog = trigger;
  selectedReview = {uid:item.uid,id:item.id,approved}; reviewBusy = false;
  const method = item.method === 'maya' ? 'Maya' : item.method === 'gotyme' ? 'GoTyme' : 'Unknown';
  $('#reviewDialogIcon').textContent = approved ? '💗' : '🧾';
  $('#reviewDialogTitle').textContent = approved ? 'Approve Premium payment?' : 'Reject payment request?';
  $('#reviewDialogDescription').textContent = approved
    ? 'Independently verify that this exact amount, recipient, date and reference match an incoming bank transfer. A reference submitted by the customer is not proof.'
    : 'This will mark the request as rejected. The customer will not receive Premium access from this request.';
  $('#reviewDialogDetails').innerHTML = detail('Payment method',method) + detail('Reported amount',currency(item.amount)) + detail('Expected price',currency(price())) + detail('Submitted',prettyDate(item.submittedAt)) + detail('Customer email',item.email,true) + detail('Transaction reference',item.reference,true) + detail('Customer UID',item.uid,true);
  $('#reviewVerificationRow').hidden = !approved;
  $('#reviewVerified').checked = false;
  $('#reviewDialogError').hidden = true;
  $('#reviewConfirm').textContent = approved ? 'Approve & Activate' : 'Reject Request';
  $('#reviewConfirm').classList.toggle('reject',!approved);
  $('#reviewConfirm').disabled = approved;
  $('#reviewDialog').hidden = false;
  document.body.style.overflow = 'hidden';
  $('#reviewDialogClose').focus();
}
function closeReview(force = false) {
  if(reviewBusy && !force) return;
  $('#reviewDialog').hidden = true;
  document.body.style.overflow = '';
  selectedReview = null;
  const focus = triggerBeforeDialog;
  triggerBeforeDialog = null;
  if(!force && focus?.isConnected && !focus.disabled) focus.focus();
}
$('#reviewDialogClose').onclick = () => closeReview();
$('#reviewCancel').onclick = () => closeReview();
$('#reviewDialog').addEventListener('click', event => {if(event.target.id === 'reviewDialog') closeReview();});
$('#reviewVerified').onchange = event => {if(selectedReview?.approved && !reviewBusy) $('#reviewConfirm').disabled = !event.target.checked;};
window.addEventListener('keydown', event => {
  if($('#reviewDialog').hidden) return;
  if(event.key === 'Escape') {event.preventDefault();closeReview();}
  // Keep focus within the custom modal.
  if(event.key === 'Tab') {
    const focusable = [...$('.admin-dialog').querySelectorAll('button:not([disabled]),input:not([disabled])')].filter(node => !node.closest('[hidden]'));
    const first=focusable[0], last=focusable[focusable.length-1];
    if(event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}
    else if(!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}
  }
});
$('#reviewConfirm').onclick = async () => {
  if(!selectedReview || !current || !isAdmin(current) || reviewBusy) return;
  const {uid,id,approved} = selectedReview;
  const item = requests.find(row => row.uid === uid && row.id === id);
  if(!item || item.status !== 'pending') {closeReview();return flash('This request has already been updated.');}
  if(approved && (!$('#reviewVerified').checked || price() <= 0 || Number(item.amount) !== price())) return;
  reviewBusy = true;
  $('#reviewConfirm').disabled = true;
  $('#reviewDialogClose').disabled = true;
  $('#reviewCancel').disabled = true;
  $('#reviewConfirm').textContent = 'Saving…';
  $('#reviewDialogError').hidden = true;
  try {
    await writeReview(item, approved, current.uid);
    reviewBusy = false;
    closeReview(true);
    flash(approved ? 'Payment approved. Premium was activated. ✓' : 'Payment request rejected.');
  } catch(error) {
    reviewBusy = false;
    $('#reviewDialogError').textContent = 'Firebase update failed (' + (error?.code || 'database') + '): ' + (error?.message || 'Check database rules and connection.');
    $('#reviewDialogError').hidden = false;
    $('#reviewConfirm').textContent = approved ? 'Try approving again' : 'Try rejecting again';
    $('#reviewConfirm').disabled = approved && !$('#reviewVerified').checked;
  } finally {
    $('#reviewDialogClose').disabled = false;
    $('#reviewCancel').disabled = false;
  }
};

async function boot() {
  if(location.protocol === 'file:') {
    setStatus('Open this page using localhost or a deployed HTTPS website, not file://.','error','A web server is required');return;
  }
  if(!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    setStatus('Firebase config is missing. Verify js/firebase-config.js loads correctly.','error','Configuration missing');return;
  }
  try {
    const [appMod, authMod, dbMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js')
    ]);
    const app=appMod.initializeApp(firebaseConfig);
    auth=authMod.getAuth(app);
    const db=dbMod.getDatabase(app);
    const provider=new authMod.GoogleAuthProvider();
    provider.setCustomParameters({prompt:'select_account'});
    signIn=() => authMod.signInWithPopup(auth,provider);
    signOut=() => authMod.signOut(auth);
    writeReview=async (item, approved, reviewerUid) => {
      const now=Date.now();
      const changes={
        [`premiumPayments/${item.uid}/${item.id}/status`]:approved ? 'approved' : 'rejected',
        [`premiumPayments/${item.uid}/${item.id}/reviewedAt`]:now,
        [`premiumPayments/${item.uid}/${item.id}/reviewedBy`]:reviewerUid
      };
      if(approved) changes[`users/${item.uid}/subscription/paidPremium`]={enabled:true,approvedAt:now,approvedBy:reviewerUid,sourceRequest:item.id};
      await dbMod.update(dbMod.ref(db),changes);
    };
    $('#adminLogin').disabled = false;
    setStatus('Firebase is ready. Checking your signed-in account…');
    authMod.onAuthStateChanged(auth,
      user => onSession(user,{ref:path => dbMod.ref(db,path),onValue:dbMod.onValue}),
      error => setStatus('Authentication state failed: '+(error?.message || error),'error'));
  } catch(error) {
    $('#adminLogin').disabled = true;
    setStatus('Firebase SDK could not load. Confirm internet, HTTPS/localhost and required JS files. '+(error?.message || error),'error','Firebase unavailable');
  }
}
setActiveSection('dashboard');
boot();
