# W-Envelope Cute v17.2 — Anonymous Envelope Pages

This build extends the **existing Firebase Auth + Realtime Database** project. It does **not** replace the original Create, Recent, Received, Share, Admin, or Settings features.

## New workflow

**Page owner (User 1)**
1. Sign in with Google on your hosted site.
2. Open **My Envelopes → 💌 Create anonymous page** (replaces the old + New action in that toolbar; the normal Created tab is still available).
3. Use the fixed bottom toolbar to edit **Text**, **Background**, **Picture**, and **Signature**. Select from 8 themes, adjust paper/accent colors, add a small uploaded photo, and customize the paper sticker.
4. Select **Save & Share**. A modal displays your public link, Copy, Share, and Preview. Saved pages are listed below the editor and can be edited again (same public URL).
5. Post the resulting `https://YOUR-HOST/index.html#ask=XXXXXXXXXXXX` link on Instagram, Facebook, Messenger, etc. (Use the actual hosted URL, not a localhost preview URL.)

**Visitor (User 2)**
1. Open User 1's link. The personalized page can be viewed **without signing in**.
2. Click **Send envelope message**. The existing Created Envelope editor opens with a blurred/frosted surrounding appearance, and its action is now **Send envelope** (also available in a floating bottom Send toolbar). Write/edit an envelope as normal.
3. Click **Send envelope**. If signed out, click **Continue with Google** in the modal. Google's email and profile name are not displayed to the owner by the anonymous envelope page.
4. Choose an **anonymous nickname**, then click **Send anonymously**. An animated loading modal and a success/error modal display.
5. User 1 receives the complete envelope in **My Envelopes → Received Envelopes**, with a new-mail count. The existing paper reader can open the received envelope.

**Important privacy note:** This is *pseudonymous*, not zero-knowledge anonymity. Sender authentication is required to submit, and Firebase/hosting infrastructure may retain authentication and abuse-prevention logs. The message record intentionally does not contain User 2's Google name, email, or sender UID, but it does contain the sender's chosen nickname. Do not promise users absolute anonymity.

## REQUIRED DEPLOYMENT: publish the included rules

**The new features will not save or send until the updated Realtime Database rules are published.**

1. Back up your existing database rules if you customized them.
2. Firebase Console → project **w-envcute** → **Build → Realtime Database → Rules**.
3. Replace the rules with the **entire** updated `database.rules.json` included with this ZIP and click **Publish**. It adds `anonymousPages` and `users/$uid/anonymousPages` and protects anonymous inbox writes with a public page ownership check.
4. Deploy **all** of the site's HTML, CSS and JavaScript files to the same hosting target. Make sure `css/v17-anonymous.css` and `js/anonymous.js` are uploaded.
5. Firebase Console → Authentication → Sign-in method: **Google enabled**. Firebase Auth → Settings → **Authorized domains**: add the final hosted domain if it isn't there.
6. Use **two different Google accounts** in separate browser profiles for testing. Create/share as User 1, sign in/send as User 2, then confirm receipt and unread badge as User 1.

## Testing / troubleshooting

- **The paper link opens but says unavailable**: verify the full URL and publish the updated rules. A link only exists after Save & Share succeeds.
- **Saving returns PERMISSION_DENIED**: publish the new Realtime Database rules; verify the owner is signed in and connected to the correct Firebase project.
- **Google sign-in is blocked**: deploy to HTTPS/localhost; check popup blockers, the Google Auth provider and Authorized domains. `file://` is not an acceptable sign-in environment.
- **Sending returns PERMISSION_DENIED**: both the public page write and recipient inbox rule changes must be deployed; ensure User 2 is logged in and is not User 1.
- **Username editing**: the pencil now opens the Account & Data username dialog even during a server-enforced 7-day cooldown, to show when editing becomes available. Profiles update using a merge instead of a destructive overwrite, and detailed errors appear in the dialog. The 7-day restriction is retained and cannot be bypassed by UI changes.
- **No web app preview in the build environment**: these files have been syntax/structure checked, but the live Google popup and Firebase read/write flow require the deployed site and two signed-in accounts; those calls were not exercised with your live database.

## Files updated

- `index.html` — public page, owner page studio, floating Send toolbar, and script/style imports.
- `css/v17-anonymous.css` — new responsive theme, page, toolbar, and dialogs.
- `js/anonymous.js` — public page editor, Firebase save/share, visitor composition, sign-in, nickname, and delivery.
- `js/app.js` — existing navigation, create, unread badges, auth flow, and username-edit UX integration.
- `js/firebase.js` — Firebase page storage, authenticated anonymous inbox submission, and non-destructive username update.
- `database.rules.json` — public page access with owner-controlled writes, owner-side saved-page list, anonymous inbox write validation.

### Security limitations

Google sign-in reduces casual anonymous spam but is not rate limiting. A production system should add backend anti-spam controls (rate limiting, abuse reporting, optional moderation, blocking) before encouraging large-scale public submissions. Database rules alone do not make users perfectly anonymous or prevent all spam.
