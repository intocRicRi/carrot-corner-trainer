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

- `index.html` — page shell
- `styles.css` — styling + the Carrot Corner table
- `app.js` — renders a spot and handles the answer reveal
- `spots.js` — **all spot content lives here**; add an object to `SPOTS` to add a question

## Run locally

Any static file server works, e.g.:

```bash
python -m http.server 47830
```

Then open <http://localhost:47830/index.html>.

## Status

Proof of concept — one spot (a turn probe with K♠ J♠).
