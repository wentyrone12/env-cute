W - ENVELOPE CUTE v4.1 · AESTHETIC LAYERED PHOTOS + VIEWER
Author credit: Wenxyz

NEW IN v4.1 — AESTHETIC PICTURE STACKS
  - Paper images now display as overlapping Polaroid-style cards, not a grid.
  - Hover on desktop to fan photos outward; each card lifts and translates.
  - Use ↔ Spread photos on phones or desktop to expose the stack.
  - Numbered 1–4 buttons let you open a specific photo without needing to
    target a partially-covered card.
  - Click or tap a photo to open a cute large-view dialog with Previous/Next,
    a counter, Escape-to-close, and swipe navigation on touchscreens.
  - Both the Create editor and the opened envelope reader use this new style.
  - Supports original Free (2) and Premium Demo (4) photos per paper.
  - Existing photos and Firebase database formats are UNCHANGED.
  - No changes are required to existing published Database/Storage Rules.


FILES
  index.html           Complete enhanced single-file frontend (HTML/CSS/JS)
  database.rules.json  Firebase Realtime Database security rules
  storage.rules        Firebase Cloud Storage security rules (music uploads)

1) FIREBASE AUTHENTICATION / WEBSITE
  - Firebase Console → project w-envcute → Authentication → Sign-in method
    Enable Google.
  - Authentication → Settings → Authorized domains: register the exact HTTPS
    domain serving your website; add localhost for local development.
  - Host index.html at your HTTPS site, e.g. Netlify.
  - Development: python -m http.server 5500 ; http://localhost:5500/
  - Do not open index.html directly using file:// for Google authentication.

2) REALTIME DATABASE — REQUIRED
  - Firebase Console → Realtime Database → Rules
  - Merge paths in database.rules.json into existing rules and Publish.
    If this project has other apps, do not accidentally delete their rules.
  - /users/<uid>/envelopes stores the user's created letters.
  - /users/<uid>/received stores letters previously opened through share links.
  - /users/<uid>/subscription/demoPremium stores per-account DEMO premium.
  - /publicEnvelopes/<alias> stores shareable message snapshots.
  - This version allows owners to update published short-link records after edits.

3) FIREBASE STORAGE — REQUIRED ONLY FOR UPLOADED MUSIC
  - Firebase Console → Storage → Create / enable a bucket.
  - Publish contents of storage.rules in Storage → Rules (not Database Rules).
  - Storage uploads music to music/<uid>/<envelopeId>/<filename>.
  - Firebase Cloud Storage requires a Blaze (pay-as-you-go) Firebase project.
    Your Firebase billing may incur actual infrastructure charges even though
    this web app's "Premium subscription" is a NO-PAYMENT DEMO.
  - Without Storage setup, envelope creation/editing, images, signatures,
    and cloud-saved collection still work, but music uploads will fail.

4) WHAT CHANGED
  - My envelopes → Recent Envelopes: envelopes you created, with View, Edit,
    Share and Delete. Edit loads all existing pages, colors, photos,
    signature, links and soundtrack into the Create editor. Save updates
    the same envelope ID rather than creating another record.
  - My envelopes → Received Envelopes: envelopes opened via a shared link
    are saved to the signed-in receiver's account in the cloud. Receivers
    can reopen them and remove a received record from their list.
  - Subscription navbar shows FREE vs PREMIUM DEMO. Button activates or
    deactivates demo access and syncs this toggle with the Google account.
  - FREE: up to 8 pages, 2 pictures per paper, 10 signature styles.
  - PREMIUM DEMO: up to 10 pages, 4 pictures per paper, emoji effect per
    paper (hearts / sparkles / flowers / stars / butterflies), soundtrack
    MP3/M4A/WAV/OGG/AAC <= 10 MiB per envelope.
  - Recipients see a click-to-play music control that stays visible across
    all pages. Music never autoplays.
  - Edited shared links update their public copies if Database Rules permit.
    Legacy original #envelope= links have embedded content and cannot be
    remotely updated. Previously issued custom links from old versions
    that are no longer tracked might still contain older content.
  - Page tabs remain clickable and horizontally swipeable when 5+ pages.

5) WHAT 'SUBSCRIPTION' MEANS HERE
  - There is NO payment gateway, billing, paid entitlement or real checkout.
  - Premium is a demonstration switch; it is NOT access-controlled in a
    production-secure way. Any signed-in user can activate it.
  - Before selling subscriptions, implement a server-verifiable purchase
    process, provider webhooks and security rules/custom claims; do not
    charge money using the existing client-side demo toggle.

6) NOTES / PRIVACY / LIMITATIONS
  - Account envelope collections sync across devices via Realtime Database.
  - Picture attachments are compact JPEG data in Realtime Database. For
    production/high traffic, use Storage/CDN and consider upload quotas.
  - Anyone holding a shared short link can read its published envelope.
    Short URLs are not cryptographic encryption and readable aliases can be
    guessed. Don't share secrets in a public envelope.
  - Shared links stay published after the owner deletes an envelope from
    their personal collection (older app behavior).
  - Storage download URLs contain access tokens and should be treated as
    shareable when inserted into public envelope records.
  - UI/syntax/mock tests are not a substitute for a live Firebase end-to-end
    test. Publish your Rules and test using two different Google accounts.

TROUBLESHOOTING
  - Google popup fails: Enable Google provider and authorize hostname.
  - Firebase permission denied: Publish correct Realtime Database rules.
  - Music error 402/403: Check Storage bucket and Firebase Blaze plan.
  - Audio unavailable: Check Storage rules, bucket, file type and network.
  - Received empty: Sign in then OPEN the shared link at least once.
