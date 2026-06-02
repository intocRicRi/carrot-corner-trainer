/* ============================================================================
 * Carrot Corner Trainer — shared library (used by trainer + admin)
 * Card model, four-colour deck rendering, table rendering, spot helpers.
 * ==========================================================================*/

/* Four-colour deck: ♠ black · ♥ red · ♦ blue · ♣ green */
const SUITS = {
  s: { sym: "♠", name: "Spades" },
  h: { sym: "♥", name: "Hearts" },
  d: { sym: "♦", name: "Diamonds" },
  c: { sym: "♣", name: "Clubs" }
};

const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
const RANK_DISPLAY = { T: "10" };

/* Full position name (for prose) and short tag (for chips) */
const POS_NAME  = { UTG: "UTG", HJ: "the Hijack", CO: "the Cutoff", BTN: "the Button" };

function rankOf(card) { const r = card.slice(0, -1); return RANK_DISPLAY[r] || r; }
function suitKey(card) { return card.slice(-1); }
function suitSym(card) { return SUITS[suitKey(card)].sym; }

/** A colour-coded suit glyph then the rank, e.g. <span class="suit-s">♠K</span> */
function cardLabelHTML(card) {
  const k = suitKey(card);
  return `<span class="suit-${k}">${SUITS[k].sym}${rankOf(card)}</span>`;
}
function handLabelHTML(cards) { return cards.map(cardLabelHTML).join(" "); }

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Build a four-colour playing-card element. */
function cardEl(card) {
  const k = suitKey(card);
  const el = document.createElement("div");
  el.className = `card suit-${k}`;
  el.innerHTML =
    `<span class="s">${SUITS[k].sym}</span>` +
    `<span class="r">${rankOf(card)}</span>` +
    `<span class="pip">${SUITS[k].sym}</span>`;
  return el;
}

/* Fixed ring layout. Hero is always BB (bottom-centre) in this scenario. */
const SEAT_SLOTS = [
  { pos: "UTG", slot: "bottomLeft"  },
  { pos: "HJ",  slot: "topLeft"     },
  { pos: "CO",  slot: "topCenter"   },
  { pos: "BTN", slot: "topRight"    },
  { pos: "SB",  slot: "bottomRight" },
  { pos: "BB",  slot: "hero"        }
];

/** Derive the six seats from a spot's raiser position. */
function buildSeats(spot) {
  const openTxt = `opens ${spot.openBB ?? 2.5} BB`;
  return SEAT_SLOTS.map(s => {
    if (s.pos === "BB") {
      return { slot: "hero", pos: "BB", name: "Hero", stack: "100 BB", state: "", note: "you" };
    }
    const isRaiser = s.pos === spot.raiserPos;
    return {
      slot: s.slot, pos: s.pos, name: "Villain", stack: "100 BB",
      state: isRaiser ? "live" : "folded",
      note: isRaiser ? openTxt : "folds"
    };
  });
}

/** Render the felt table for a spot into `table` (a .table element). */
function renderTable(spot, table) {
  table.innerHTML = "";

  const felt = document.createElement("div");
  felt.className = "felt";
  felt.innerHTML = `<div class="felt__mark">CARROT&nbsp;CORNER</div>`;
  table.appendChild(felt);

  const pot = document.createElement("div");
  pot.className = "pot";
  pot.innerHTML = `Pot: <small>${spot.potBB} BB</small>`;
  table.appendChild(pot);

  const board = document.createElement("div");
  board.className = "board";
  spot.board.forEach(c => board.appendChild(cardEl(c)));
  table.appendChild(board);

  buildSeats(spot).forEach(seat => {
    const el = document.createElement("div");
    el.className = `seat ${seat.slot} ${seat.state}`.trim();
    const pod = document.createElement("div");
    pod.className = "seat__pod";
    pod.innerHTML =
      `<div class="seat__name">${seat.name}<span class="seat__pos">${seat.pos}</span></div>` +
      `<div class="seat__stack">${seat.stack}</div>` +
      (seat.note ? `<div class="seat__note">${seat.note}</div>` : "");
    if (seat.slot === "hero") {
      const hc = document.createElement("div");
      hc.className = "holecards";
      spot.hero.cards.forEach(c => hc.appendChild(cardEl(c)));
      el.appendChild(hc);
    }
    el.appendChild(pod);
    table.appendChild(el);
  });

  // dealer button (just inside the felt, toward the BTN seat / top-right)
  const d = document.createElement("div");
  d.className = "dealer";
  d.textContent = "D";
  d.style.left = "69%";
  d.style.top = "34%";
  table.appendChild(d);
}

/* The five answer grades, in order of quality (drive colours + labels). */
const GRADES = [
  { v: "best",     label: "Best",    hint: "dark green" },
  { v: "good",     label: "Good",    hint: "light green" },
  { v: "okay",     label: "OK",      hint: "yellow" },
  { v: "mistake",  label: "Mistake", hint: "orange" },
  { v: "horrible", label: "Blunder", hint: "red" }
];

/* ----------------------------------------------------------------------------
 * Deck persistence — shared between trainer and admin.
 *   localStorage 'ccTrainerDeck'  = live working deck (drafts, this browser)
 *   spots.json                    = published deck (committed, public site)
 * The trainer prefers the local deck if present, else fetches spots.json.
 * ------------------------------------------------------------------------- */
const DECK_KEY = "ccTrainerDeck";

function readLocalDeck() {
  try {
    const raw = localStorage.getItem(DECK_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return Array.isArray(d) ? d : null;
  } catch { return null; }
}

function writeLocalDeck(deck) {
  localStorage.setItem(DECK_KEY, JSON.stringify(deck));
}

async function fetchPublishedDeck() {
  try {
    const res = await fetch("spots.json", { cache: "no-store" });
    if (res.ok) {
      const d = await res.json();
      if (Array.isArray(d)) return d;
    }
  } catch { /* ignore */ }
  return [];
}
