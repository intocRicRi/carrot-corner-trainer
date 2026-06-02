# Carrot Corner Trainer

A multiple-choice poker trainer to accompany the NLHE 6-max cash-game courses at
[carrotcorner.com](https://carrotcorner.com/) (Pete Clarke's poker school).

Each **spot** shows a branded poker table, the action leading up to a decision, a
question, and four answers. When the student picks an answer, the options recolour by
quality and a **GTO ✅** badge appears over the theoretically correct choices — then
Pete Clarke's written feedback is revealed.

## Answer scoring

| Colour | Meaning |
|---|---|
| 🟢 Dark green | Best play in practice |
| 🟩 Light green | Good |
| 🟨 Yellow | OK, but underperforms |
| 🟧 Orange | A mistake |
| 🟥 Red | A blunder |

A **GTO ✅** badge marks options that are theoretically sound (in the solver mix),
independent of the practical colour.

## Tech

Static, data-driven web app — no build step, no external image assets (the table is
recreated in CSS).

- `index.html` / `app.js` — the trainer (student-facing): loads the deck, shows a
  hand count, plays spots one at a time with the colour-coded answer reveal.
- `admin.html` / `admin.js` — the coach tool: generate a probe hand, grade each
  option, write feedback, and publish.
- `table.js` — shared library: four-colour deck, card + table rendering, helpers,
  deck persistence.
- `styles.css` — all styling, including the CSS-recreated Carrot Corner table.
- `spots.json` — the published deck (committed). The trainer reads this.

## How hands are added (admin → live)

The admin generates a hand for the **Turn Probe** scenario (Hero BB, one raiser opens,
Hero calls heads-up, flop checks through, turn probe), the coach grades the four options
(Check / B33 / B75 / B150) and writes feedback, then **Save & publish**.

Publishing commits `spots.json` to this repo via the GitHub API, so saved hands go live
for everyone in ~1 minute. To enable it, paste a **fine-grained personal access token**
into the admin's *Connect* bar (Repository → this repo, **Contents: Read and write**).
The token is stored only in your browser (`localStorage`) and is never committed.

Hands also persist locally (`localStorage`), so they appear on your own trainer instantly
even before publishing.

## Run locally

Any static file server works, e.g.:

```bash
python -m http.server 47830
```

Then open <http://localhost:47830/index.html> (trainer) or `/admin.html` (coach).

## Status

Proof of concept — one scenario (turn probe), four-colour deck, admin authoring with
direct-to-GitHub publishing.
