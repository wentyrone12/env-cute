# W-Envelope Cute v15 — Account Identity & Mobile Photo Studio

## Changes

- Settings → Account & Data displays the searchable envelope username and the Google email side-by-side in dedicated profile rows. Tap the pencil button next to username to edit it; Google email is read-only (change that in the Google account, not here).
- First username claim and every successful change start a **7-day cooldown**. The app displays the remaining time. Firebase Database Rules enforce the cooldown using the server time. For accounts created with v14, the first cooldown uses the timestamp of the original username reservation.
- The `usernames` directory is the source for Send Envelope lookups. A rename reserves the new name, updates the profile, and retires the old directory entry. Interrupted cleanup is retried at next sign-in.
- On mobile, tapping the Borders or Layouts bottom toolbar auto-closes the full glass editor. A separate, horizontal photo-based carousel remains visible below the actual preview, so users can swipe through 60 border styles or 60 layouts and tap to apply immediately. Premium lock checks remain in place. Tap **Open** inside the carousel to return to the full editor; the carousel hides while the editor is open.
- Uses the latest image uploaded to that letter page for thumbnails; before any image is uploaded, a bundled sample nature picture is used for demonstration.

## Required Firebase setup

**Deploy the entire updated website** so the new HTML, CSS, JS, and sample photo asset load together. Then:

1. Firebase Console → Your project → Realtime Database → **Rules**.
2. Replace the deployed database rules with the full content of `database.rules.json` from **this** v15 folder.
3. Click **Publish**. Preserve your backup of existing rules first if you customized them independently.
4. Sign in with Google. Open **Settings → Account & Data**. Claim or change a username using the pencil icon.
5. In a different logged-in account, open **My Envelopes → Send Envelope** and search for the current username. The prior username should not be searchable after a completed rename.

**Important:** A cooldown is based on the server, not localStorage. Editing JavaScript or the device time does not bypass the published rules. Client-side tests do not replace a live two-account Firebase verification.

## Notes

- Username format: 3–20 lowercase ASCII letters, digits, underscores; case-insensitive input is normalized to lowercase.
- Username changes are limited to one successful change every 7 days (including the first claim).
- The rename is a multi-step client sequence; in unstable network conditions, it may partially complete. Pending old-directory cleanup is retried on the user's next Account & Data load.
- Do not remove Firebase configurations, authenticated routes, or `database.rules.json` while deploying.
