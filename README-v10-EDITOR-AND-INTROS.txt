W-Envelope Cute v10 | Mobile Editor Fix + 36 Premium Intro Animations
==================================================================

Mobile Creator (viewport <= 860px)
- The top nav item "Created" opens the letter creator. "My envelopes" still opens the collection.
- The bottom swipeable toolbar has 14 stages: Title, From, Pages, Envelope,
  Paper, Greeting, Write, Photos, Borders, Layouts, Effects, Magic, Sign, Seal.
- The first four tools now reveal their real inputs: a specificity bug in the
  legacy CSS previously left them hidden.
- Back/Next scrolls between tool stages; the active tool's controls appear in
  an expandable panel, without discarding the values already entered.
- Draft progress bar shows the current stage, edited-tool count and live values.
  IMPORTANT: "Draft" does not mean saved in Firebase; use Seal to save.
- The preview above the editor updates as you type or change colors.
- Desktop retains the complete full editor.

36 Premium Intro Animations
- In Create > Magic / Paper Magic, enable "Animated intro".
- Select a design from the searchable-by-category gallery (All, Flowers,
  Hearts, Magic, Cute, Elegant), then tap Preview to try it.
- Options include Bouquet, Giant beating heart, Heart rain, Rose rainfall,
  Sakura, Butterflies, Galaxy, Sparkles, Confetti and many others.
- Animations are saved as paperMagic.introStyle in the envelope / public link.
- Recipients see the selected intro even on Free accounts.
- Existing envelopes with bouquetIntro:true and no introStyle still show Bouquet.
- Under Reduce Motion the animation is skipped.
- The full screen intro can be dismissed via the Skip intro control.

Set up / testing
1. Unzip this complete project, not just the modified files.
2. Serve env-cute-main via localhost/HTTPS (e.g. VS Code Live Server).
3. Ensure your Firebase configuration and security rules remain valid.
4. Hard refresh or clear old cached files after replacing a previous version.
5. Sign in, select Created, try each toolbar, configure Magic and seal envelope.

Validation
- JavaScript syntax check: pass.
- Browser UI test at 390px viewport in an isolated mock-Firebase environment:
  first four tools visible and editable; progress updates; Next navigation;
  category filtering; Giant Heart Preview displays then closes; saved envelope
  contains introStyle; no uncaught page exceptions.
- Desktop UI test: controls visible, mobile dock hidden.
- Live Google login/Firebase and deployment not tested here.
