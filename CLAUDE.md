# Carrot Corner Trainer — Project Instructions

NLHE 6-max cash-game MCQ poker trainer for Pete Clarke's school (carrotcorner.com).
Static, data-driven web app. The user is missioned by Pete Clarke and may use all
Carrot Corner branding/assets.

## Git / deploy workflow (IMPORTANT)

- **Do NOT push to GitHub on every change.** Default loop: edit → verify on **localhost**
  (the preview server) → stop. No push.
- **Push only at a milestone** — i.e. when the user says so ("push", "ship it",
  "let's publish", "milestone") or when a coherent feature is clearly complete and the
  user has signed off. When unsure whether something is a milestone, ask before pushing.
- Local commits are fine anytime as restore points (they don't touch GitHub). Keep the
  local history tidy; fold work into a clear commit at the milestone.
- Pushing triggers a GitHub Pages rebuild (~1 min) that updates the public site, so
  batching pushes keeps the live URL stable while iterating.
- This is the user's **own** public repo (`intocRicRi/carrot-corner-trainer`) — pushing
  here is allowed. (The global no-remote-push rule applies only to Seven-of-Di/* repos.)

## Run & preview locally

- Preview config **`carrot-trainer`** (in `C:\Users\UKGC\Documents\Claude\LIA\.claude\launch.json`):
  python `http.server` on **port 47830** serving this folder.
- Trainer: <http://localhost:47830/index.html> · Admin: `/admin.html`
- Source is plain static files — just reload after edits (no build step).
- If the preview server isn't listed, start it again (it stops on machine restarts).

## Live site

- Public URL (GitHub Pages): <https://intocricri.github.io/carrot-corner-trainer/>
- Rebuilds automatically ~1 min after a push to `main`.

## Architecture (quick map)

- `index.html` / `app.js` — trainer (student): loads the deck, shows a hand count, plays
  spots with the colour-coded answer reveal + GTO badge.
- `admin.html` / `admin.js` — coach tool: generate a probe hand, grade the 4 options,
  write feedback, save. **Token-free / local-only for now** (saves to `localStorage`
  key `ccTrainerDeck`, show on the trainer in the same browser). "Download backup"
  exports `spots.json` to publish.
- `table.js` — shared: four-colour deck (♠ black ♥ red ♦ blue ♣ green), card + table
  render, deck persistence helpers. Card **faces** show rank-then-suit (normal card
  look); inline **text** labels show suit-then-rank (e.g. ♥8).
- `styles.css` — all styling incl. the CSS-recreated Carrot Corner felt table.
- `spots.json` — the published deck the trainer reads (one object per spot).

## Open thread

- **Shared persistence** (any admin user's add/remove syncs to the trainer for everyone)
  is still pending a backend decision — recommended **Firebase Realtime Database**
  (token-free, live sync) vs a Cloudflare commit-proxy. Waiting on the user to set up
  one free account / paste the Firebase config.
