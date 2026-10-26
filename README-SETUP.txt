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


------------------------------------------------------------
V5.0 — 24 PREMIUM BORDER STYLES + 24 PHOTO LAYOUTS + ADMIN CHARTS
------------------------------------------------------------
HOW TO USE THE NEW PHOTO DESIGN STUDIO
1. Open Create -> Your letter pages -> Add picture.
2. Swipe sideways through the Border and Layout designs in the editor.
3. Premium accounts can select any of the 24 frames and 24 layouts.
   Free accounts can still use Classic Border + Classic Stack.
4. You can use a different border and layout on every envelope page.
5. Changes show in the editor, the shared envelope reader and the photo gallery.
   They are saved alongside each page and work with older envelopes.

ADMIN STATISTICS
1. Open admin.html on localhost or HTTPS.
2. Sign in using the Google account matching js/payment-config.js adminUid.
3. Dashboard displays live totals from premiumPayments, supportTickets,
   and feedbackEntries, subject to your already-published Firebase Rules.
4. View donuts: request status and Maya/GoTyme payment share.
5. View the activity line and switch between Submitted requests and Approved
   reported value, with Last 7 / 30 / 90 days options.
6. Other metrics: total payment requests, unique payment request customers,
   approval ratio, open support, open feedback, average feedback rating.

IMPORTANT
* Statistics are computed from actual Firebase records once available.
* The dashboard does NOT claim to count ALL registered accounts, private
  envelopes or site visitors: those are not available via current rules.
* Approved value is the sum of manually approved user-submitted amounts;
  it is not independent confirmation of money received in a bank account.
* Existing database.rules.json and payment authentication are unchanged.
* No charting CDN, extra npm packages, database migrations or demo entries.
* If updates aren't showing, hard-refresh the browser (Ctrl + Shift + R).
* New CSS: css/premium-gallery.css and css/admin-analytics.css.
------------------------------------------------------------


============================================================
V6.0 — PREMIUM PAPER MAGIC (TYPEWRITER + 3D PAGE TURNS)
============================================================
NEW IN THIS VERSION
- Premium creators can turn on Typewriter (one Unicode-aware character at a
  time, from left to right) and Realistic page turning separately.
- Three typewriter speed options: Gentle, Classic, and Quick.
- Page turns animate like a 3D sheet with shadow, fold, and back-paper surface.
- Back and Next both animate; rapid repeat taps cannot jumble page order.
- The Show full text action reveals an animated message immediately.
- Mobile touch swipes and keyboard arrows still navigate papers.
- OS/browser Reduce Motion preference or the site's Reduce Motion setting
  suppresses both effects for accessibility.
- Creator selections are saved in a validated paperMagic object inside the
  envelope. They are included in Firebase envelope backups, existing shared
  link updates, and the recipient's view. Recipients do not need Premium.
- Old envelopes keep their old appearance until a Premium user edits and
  re-saves them with Paper Magic switched on.
- New Free envelopes have both special effects off. Previously saved effects
  are preserved if a creator later edits without Premium access.

HOW TO ENABLE
1. Sign in and make sure Premium has already been approved.
2. Create (or edit) an envelope.
3. Open the new "Paper Magic" section, located above "Your letter pages".
4. Turn on Live typewriter and/or Realistic page turning.
5. Choose typing speed; write at least two pages to see the page turn.
6. Save envelope, choose View, click the envelope seal, then Next / Back.
7. Sharing a newly saved short link also shares the animations.

DEPLOYMENT
- Upload/replace index.html, css/paper-magic.css, and js/app.js together.
- The rest of the ZIP remains unchanged, including admin.html and the existing
  24 border + 24 layout gallery and admin charts from v5.
- No database schema migration or Firebase rules changes are required for
  reading/saving these per-envelope effect fields under existing permissions.
- Existing share URLs can be refreshed when editing if existing link update
  permissions allow it. Embedded legacy URLs cannot be remotely updated.
- After deploying, hard-refresh the page (Ctrl+Shift+R) to pick up JS/CSS.

QUALITY CHECKS
- JavaScript syntax checked with Node.js.
- Browser smoke tested in Chromium at desktop (1280px) and mobile (390px),
  including forward/back flipping, typewriter, skip, persistence, and reduced
  motion; Firebase calls were mocked in browser tests.
- A live Firebase end-to-end check is still needed on your deployed website.
- This is a client-side Premium UI; enforce paid entitlement on a trusted
  backend / Firebase Rules for stricter production purchase verification.

VERSION NOTE: Older sections of this README document historical features and
setup of past versions. The current code uses manually approved paidPremium
rather than the old demo toggle described in the historical v4 section.


New in v7: Premium bouquet intro overlay before the envelope appears, and anchored photo area while typewriter animation runs.
