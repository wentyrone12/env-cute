W-ENVELOPE CUTE v12 — DESKTOP GALLERIES + PREMIUM COLORS + ACCOUNT DATA
=====================================================================

SETUP
1. Extract the ZIP; open W-Envelope-Cute/env-cute-main in VS Code.
2. Start index.html using Live Server (or publish to HTTPS).
3. Retain your existing js/firebase-config.js and js/payment-config.js settings.
4. Hard-refresh the browser (Ctrl+Shift+R) to load css/v12-desktop-palettes-account.css and updated app.js.

FEATURES
- On laptop/desktop (861px and wider), Border and Layout galleries use
  vertically scrolling two-column grids inside the editing inspector.
- Signature font choices also use a vertically scrolling two-column grid.
- The original mobile horizontal Border/Layout/Signature choices remain intact.
- Premium users get 152 envelope colors and 150 paper colors, all locally
  generated; no paid API or extra network requests. Both palettes scroll DOWN
  on desktop. Free users keep the original 8 envelope / 6 paper colors.
- Existing saved colors are preserved while editing even if Premium is no
  longer active. Free users cannot select unrelated Premium colors.
- Click your Google profile photo/name at the top right to open Settings >
  Account & Data. The account page includes current Premium plan state,
  Google sign-in information, summary statistics derived from your own
  envelopes/received items/payment requests, last updated envelope, sync
  indicator, account ID copy, and quick navigation shortcuts.
- Data access is unchanged. Premium state is read from Firebase subscriptions;
  UI labels alone never grant Premium or Admin permissions.

TESTING NOTES
- The included source was checked using Node.js syntax checking, HTML-ID
  validation, and CSS parsing.
- Isolated Chromium tests at desktop 1365px and mobile 390px verified gallery
  direction, clickable account navigation, and 152/150 vs 8/6 color counts.
- Browser tests used mock Firebase accounts/records because live Firebase
  credentials are not available here. Verify Google sign-in, Premium approval,
  and cloud saves in your actual deployed environment.
