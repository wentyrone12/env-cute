# W-Envelope Cute v16 — Mobile photo picker / Account & Data / Admin cleanup

## Changes

### Mobile Borders / Layouts
- Premium-only choices show an obvious 🔒 Premium label over the thumbnail as well as a lock glyph in the name. Existing Premium checks remain in place; free users cannot apply locked choices.
- Removed the old `Open` button next to the photo-picker style count. This does not reopen the large Studio editor when selecting Borders or Layouts.
- Left/Right Previous and Next **paper page** controls only appear if the envelope has more than one paper page. On single-page envelopes the page controls are hidden. Selecting another paper page changes the active page used by both the live preview and editor.
- Swipe the mobile photo picker down (or tap its chevron) to hide it and view more of the live photo. A small `Show photo styles` handle reopens **only the photo selector**, not the Studio editor. Horizontal style swipes still work.

### Account & Data
- Username and linked Google email are inside the existing **Your account** section. The redundant separate username settings card is gone.
- The username pencil opens a focused, responsive popup card with input, save and cancel controls. The seven-day cooldown and username directory, search and Firebase validation from v15 remain unchanged.
- Removed Manage Premium, My envelopes and Create letter quick-action buttons from Account & Data. Those actions remain accessible from their appropriate navigation areas.

### Administrator dashboard
- Dashboard now ends after the **Payment channels** chart (no duplicate method cards, payment-request list, or extra helper/footer blocks beneath it).
- All Payments, Maya, GoTyme, Support and Feedback sections still have their dedicated lists and functions.
- Admin Sign out moved to the topbar so it remains accessible after dashboard cleanup.

## How to publish
1. Back up your currently deployed site.
2. Deploy the files from `env-cute-main/` to your existing hosting directory. Preserve your real Firebase configuration if it differs from the supplied file.
3. If your Firebase rules already match v15, **no additional database structure/rule change is required for these v16 UI-only changes**. For a fresh deploy, publish the included `database.rules.json` from Firebase Console > Realtime Database > Rules, and verify all admin permissions match your configured UID.
4. Test on a phone: create a 2-page envelope, tap Borders or Layouts, switch paper pages, swipe down to hide styles and tap Show photo styles. Test with a Free and a Premium account.
5. Test the username popup and seven-day edit lock using two real signed-in accounts. Test All Payments from its admin sidebar tab.

## Verification
- JavaScript syntax checked with Node.
- Local mobile Chromium tests with a mocked/unauthed application rendering: 60 choices, 59 Free-user lock badges, multi-page arrows, single-page hidden arrows, hide/reopen behavior, username dialog open/close, and admin list visibility state.
- Firebase backend writes/Google sign-in were not live-tested in this environment. This is not a claim of successful cloud integration or a security audit.
