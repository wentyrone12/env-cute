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
          subscribeReceived(uid, next, fail) { return dbModule.onValue(dbModule.ref(db, 'users/' + uid + '/received'), snap => next(snap.val() || {}), fail) },
          saveReceived(uid, key, item) { return dbModule.set(dbModule.ref(db, 'users/' + uid + '/received/' + key), item) },
          removeReceived(uid, key) { return dbModule.remove(dbModule.ref(db, 'users/' + uid + '/received/' + key)) },
          subscribePremium(uid, next, fail) { return dbModule.onValue(dbModule.ref(db,'users/' + uid + '/subscription/paidPremium'),snap=>next(snap.val()),fail) },
          subscribePayments(uid, next, fail) { return dbModule.onValue(dbModule.ref(db,'premiumPayments/' + uid),snap=>next(snap.val()||{}),fail) },
          submitPayment(uid, request) { return dbModule.set(dbModule.push(dbModule.ref(db,'premiumPayments/' + uid)),request) },
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
