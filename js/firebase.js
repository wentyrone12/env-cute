(async () => {
      try {
        const [appModule, authModule, dbModule] = await Promise.all([
          import("https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js"),
          import("https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js"),
          import("https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js")
        ]);
        const firebaseConfig = window.WENV_FIREBASE_CONFIG;
        const app = appModule.initializeApp(firebaseConfig);
        const auth = authModule.getAuth(app);
        const db = dbModule.getDatabase(app);
        window.WENV_DB = {
          // Public NGL-style pages. Ownership is enforced by Realtime Database rules.
          getAnonymousPage(code) { return dbModule.get(dbModule.ref(db,'anonymousPages/'+code)).then(s=>s.val()||null) },
          async claimAnonymousPage(code, page, ownerUid, ownerUsername = "") {
            const label = /^[a-z0-9_]{3,20}$/.test(ownerUsername) ? ownerUsername : "";
            const target=dbModule.ref(db,'anonymousPages/'+code);
            const result=await dbModule.runTransaction(target,old=>{
              if (!old) return {ownerUid,ownerUsername:label,design:page,createdAt:Date.now()};
              if (old.ownerUid === ownerUid) return { ...old, ownerUsername:label || old.ownerUsername || "", design:page, updatedAt:Date.now() };
              return;
            },{applyLocally:false});
            return result.committed;
          },
          saveAnonymousPointer(ownerUid,code) { return dbModule.set(dbModule.ref(db,'users/'+ownerUid+'/anonymousPages/'+code),Date.now()) },
          getAnonymousPointers(uid) { return dbModule.get(dbModule.ref(db,'users/'+uid+'/anonymousPages')).then(s=>s.val()||{}) },
          subscribeAnonymousPointers(uid,next,fail) { return dbModule.onValue(dbModule.ref(db,'users/'+uid+'/anonymousPages'),s=>next(s.val()||{}),fail) },
          // The anonymous inbox write is directly authorized by page ownership rules.
          newAnonymousMessageId(recipientUid){ return dbModule.push(dbModule.ref(db,'users/'+recipientUid+'/anonymousMessages')).key },
          sendAnonymousEnvelope(recipientUid, payload, messageId){ return dbModule.set(dbModule.ref(db,'users/'+recipientUid+'/anonymousMessages/'+messageId),payload) },
          subscribeAnonymousMessages(uid, next, fail){return dbModule.onValue(dbModule.ref(db,'users/'+uid+'/anonymousMessages'),snap=>next(snap.val()||{}),fail)},
          markAnonymousMessageRead(uid,key){return dbModule.update(dbModule.ref(db,'users/'+uid+'/anonymousMessages/'+key),{readAt:Date.now()})},
          removeAnonymousMessage(uid,key){return dbModule.remove(dbModule.ref(db,'users/'+uid+'/anonymousMessages/'+key))},
          saveAnonymousConsent(recipientUid,messageId,code,email){return dbModule.set(dbModule.ref(db,'anonymousSenderConsents/'+recipientUid+'/'+messageId),{senderUid:auth.currentUser.uid,code,email,consented:true,createdAt:Date.now()})},
          revokeAnonymousConsent(recipientUid,messageId){return dbModule.remove(dbModule.ref(db,'anonymousSenderConsents/'+recipientUid+'/'+messageId))},
          getAnonymousConsent(recipientUid,messageId){return dbModule.get(dbModule.ref(db,'anonymousSenderConsents/'+recipientUid+'/'+messageId)).then(s=>s.val()||null)},
          subscribeRevealRequests(uid,next,fail){return dbModule.onValue(dbModule.ref(db,'identityRevealPayments/'+uid),s=>next(s.val()||{}),fail)},
          submitRevealRequest(uid,messageId,data){return dbModule.set(dbModule.ref(db,'identityRevealPayments/'+uid+'/'+messageId),data)},
          getMyProfile(uid) { return dbModule.get(dbModule.ref(db,'users/'+uid+'/profile')).then(s=>s.val()||null) },
          setMyProfile(uid, profile) { return dbModule.update(dbModule.ref(db,'users/'+uid+'/profile'),profile) },
          async reserveUsername(username, uid, displayName) {
            const target = dbModule.ref(db,'usernames/'+username);
            const result = await dbModule.runTransaction(target,previous=>{
              if (!previous) return {uid,username,displayName,createdAt:Date.now()};
              if (previous.uid === uid) return previous;
              return;
            },{applyLocally:false});
            return result.committed || result.snapshot.val()?.uid === uid;
          },
          searchUsernames(prefix) {
            const q=dbModule.query(dbModule.ref(db,'usernames'),dbModule.orderByKey(),dbModule.startAt(prefix),dbModule.endAt(prefix+'\uf8ff'),dbModule.limitToFirst(12));
            return dbModule.get(q).then(s=>Object.entries(s.val()||{}).map(([username,v])=>({...v,username})).filter(v=>v.uid));
          },
          getUsername(username) { return dbModule.get(dbModule.ref(db,'usernames/'+username)).then(s=>s.val()) },
          releaseOldUsername(username,uid) {
            return dbModule.runTransaction(dbModule.ref(db,'usernames/'+username), old => {
              if (!old || old.uid !== uid) return;
              return null;
            },{applyLocally:false}).then(result => result.committed || !result.snapshot.exists());
          },
          serverTimestamp() { return dbModule.serverTimestamp() },
          clearPreviousUsername(uid) { return dbModule.remove(dbModule.ref(db,'users/'+uid+'/profile/previousUsername')) },
          sendDirectEnvelope(uid, item) { return dbModule.set(dbModule.push(dbModule.ref(db,'users/'+uid+'/received')),item) },
          markReceivedRead(uid,key) { return dbModule.update(dbModule.ref(db,'users/'+uid+'/received/'+key),{readAt:Date.now()}) },
          subscribeReceived(uid, next, fail) { return dbModule.onValue(dbModule.ref(db, 'users/' + uid + '/received'), snap => next(snap.val() || {}), fail) },
          saveReceived(uid, key, item) { return dbModule.set(dbModule.ref(db, 'users/' + uid + '/received/' + key), item) },
          removeReceived(uid, key) { return dbModule.remove(dbModule.ref(db, 'users/' + uid + '/received/' + key)) },
          subscribePremium(uid, next, fail) { return dbModule.onValue(dbModule.ref(db,'users/' + uid + '/subscription/paidPremium'),snap=>next(snap.val()),fail) },
          subscribePayments(uid, next, fail) { return dbModule.onValue(dbModule.ref(db,'premiumPayments/' + uid),snap=>next(snap.val()||{}),fail) },
          submitPayment(uid, request) { return dbModule.set(dbModule.push(dbModule.ref(db,'premiumPayments/' + uid)),request) },
          subscribeInquiries(kind, uid, next, fail) {
            const key = kind === 'support' ? 'supportTickets' : 'feedbackEntries';
            return dbModule.onValue(dbModule.ref(db,key + '/' + uid),snapshot=>next(snapshot.val()||{}),fail);
          },
          submitInquiry(kind, uid, entry) {
            const key = kind === 'support' ? 'supportTickets' : 'feedbackEntries';
            return dbModule.set(dbModule.push(dbModule.ref(db,key + '/' + uid)),entry);
          },
          subscribe(uid, next, fail) { return dbModule.onValue(dbModule.ref(db, 'users/' + uid + '/envelopes'), snap => next(snap.val() || {}), fail) },
          put(uid, envelope) { return dbModule.set(dbModule.ref(db, 'users/' + uid + '/envelopes/' + envelope.id), envelope) },
          remove(uid, id) { return dbModule.remove(dbModule.ref(db, 'users/' + uid + '/envelopes/' + id)) },
          clear(uid) { return dbModule.remove(dbModule.ref(db, 'users/' + uid + '/envelopes')) },
          async claim(code, envelope, uid) {
            const path = dbModule.ref(db, 'publicEnvelopes/' + code);
            const snapshot = await dbModule.runTransaction(path, current => {
              if (current === null) return { ownerUid: uid, envelope: clean(envelope), createdAt: new Date().toISOString() };
              if (current.ownerUid === uid && current.envelope?.id === envelope.id) return { ...current, envelope: clean(envelope), updatedAt: new Date().toISOString() };
              return;
            }, { applyLocally: false });
            if (snapshot.committed) return true;
            const existing = snapshot.snapshot.val();
            return !!(existing && existing.ownerUid === uid && existing.envelope && existing.envelope.id === envelope.id);
          },
          async getPublic(code) { const snap = await dbModule.get(dbModule.ref(db, 'publicEnvelopes/' + code)); return snap.val() }
        };
        const provider = new authModule.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        window.WENV_AUTH.ready({
          signIn: () => authModule.signInWithPopup(auth, provider),
          redirect: () => authModule.signInWithRedirect(auth, provider),
          signOut: () => authModule.signOut(auth)
        });
        authModule.onAuthStateChanged(auth,
          user => window.WENV_AUTH.user(user),
          error => window.WENV_AUTH.fail(error)
        );
        authModule.getRedirectResult(auth).catch(error => window.WENV_AUTH.redirectError(error));
      } catch (error) {
        window.WENV_AUTH.fail(error);
      }
    })();
