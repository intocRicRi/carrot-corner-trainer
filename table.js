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
    `<span class="r">${rankOf(card)}</span>` +
    `<span class="s">${SUITS[k].sym}</span>` +
    `<span class="pip">${SUITS[k].sym}</span>`;
  return el;
}

/* Clockwise seating order, and the visual slots in the same order starting from
 * Hero (always bottom-centre). Rotating by Hero's position seats everyone else
 * in their correct relative places. */
const CW_ORDER = ["BTN", "SB", "BB", "UTG", "HJ", "CO"];
const VISUAL_SLOTS = ["hero", "bottomLeft", "topLeft", "topCenter", "topRight", "bottomRight"];

/* Dealer-button anchor just inside the felt next to each slot's seat. */
const DEALER_AT = {
  hero:        { left: "63%", top: "73%" },
  bottomLeft:  { left: "24%", top: "53%" },
  topLeft:     { left: "19%", top: "32%" },
  topCenter:   { left: "61%", top: "17%" },
  topRight:    { left: "81%", top: "32%" },
  bottomRight: { left: "76%", top: "53%" }
};

/** Derive the six seats — Hero always bottom-centre, everyone else in order. */
function buildSeats(spot) {
  const openTxt = `opens ${spot.openBB ?? 2.5} BB`;
  const heroPos = spot.hero.pos;
  const found = CW_ORDER.indexOf(heroPos);
  const base = found < 0 ? CW_ORDER.indexOf("BB") : found;
  return VISUAL_SLOTS.map((slot, k) => {
    const pos = CW_ORDER[(base + k) % CW_ORDER.length];
    if (slot === "hero") {
      return { slot: "hero", pos: heroPos, name: "Hero", stack: "100 BB", state: "", note: "you" };
    }
    const isRaiser = pos === spot.raiserPos;
    return { slot, pos, name: "Villain", stack: "100 BB", state: isRaiser ? "live" : "folded", note: isRaiser ? openTxt : "folds" };
  });
}

/* Carrot Corner mark drawn on the felt under the board. */
const CARROT_SVG =
  '<svg viewBox="0 0 64 64" aria-hidden="true">' +
  '<g transform="rotate(8 32 32)">' +
  '<path d="M22 26 L42 26 L33 60 Q32 63 31 60 Z" fill="#F47C20"/>' +
  '<path d="M22 26 L42 26 L39 36 L25 36 Z" fill="#E2680F"/>' +
  '<path d="M32 26 C30 16 22 14 18 16 C24 18 26 22 26 26 Z" fill="#3FA34D"/>' +
  '<path d="M32 26 C34 14 42 12 47 15 C40 16 37 21 36 26 Z" fill="#4CAF50"/>' +
  '</g></svg>';

function villainSeatHTML(seat) {
  return (
    `<div class="nt__seat ${seat.slot} ${seat.state}">` +
      `<div class="nt__pod"><span class="nt__pinfo">` +
        `<span class="nt__pname">${seat.name}<span class="nt__ppos">${seat.pos}</span></span>` +
        `<span class="nt__pstack">${seat.stack}</span>` +
      `</span></div>` +
    `</div>`
  );
}

/**
 * Render the poker table for a spot into `table` (a .table element).
 * Layout: pot -> board -> CARROT CORNER inside the felt; villains on the rail;
 * hero hand seated on the bottom rail, overlapping only the felt's edge.
 */
function renderTable(spot, table) {
  table.classList.add("nt");
  const seats = buildSeats(spot);
  const villains = seats.filter(s => s.slot !== "hero").map(villainSeatHTML).join("");
  const btn = seats.find(s => s.pos === "BTN");
  const dp = DEALER_AT[btn ? btn.slot : "topRight"] || DEALER_AT.topRight;

  table.innerHTML =
    `<div class="nt__frame">` +
      `<div class="nt__felt"></div>` +
      `<div class="nt__pot">Pot <b>${spot.potBB} BB</b></div>` +
      `<div class="nt__board"></div>` +
      `<div class="nt__brand">${CARROT_SVG}<span>CARROT&nbsp;CORNER</span></div>` +
      villains +
      `<div class="nt__dealer" style="left:${dp.left};top:${dp.top}">D</div>` +
      `<div class="nt__hero">` +
        `<div class="nt__hero-cards"></div>` +
        `<div class="nt__hero-pod"><span class="nt__pinfo">` +
          `<span class="nt__pname">Hero<span class="nt__ppos">${spot.hero.pos}</span></span>` +
          `<span class="nt__pstack">100 BB</span>` +
        `</span></div>` +
      `</div>` +
    `</div>`;

  const board = table.querySelector(".nt__board");
  spot.board.forEach(c => board.appendChild(cardEl(c)));
  const hc = table.querySelector(".nt__hero-cards");
  spot.hero.cards.forEach(c => hc.appendChild(cardEl(c)));
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

/* Scenario store (new model): localStorage 'ccScenarios' else scenarios.json */
const SCEN_KEY = "ccScenarios";
function readLocalScenarios() {
  try {
    const raw = localStorage.getItem(SCEN_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return Array.isArray(d) ? d : null;
  } catch { return null; }
}
function writeLocalScenarios(scenarios) {
  localStorage.setItem(SCEN_KEY, JSON.stringify(scenarios));
}
async function fetchPublishedScenarios() {
  try {
    const res = await fetch("scenarios.json", { cache: "no-store" });
    if (res.ok) { const d = await res.json(); if (Array.isArray(d)) return d; }
  } catch { /* ignore */ }
  return [];
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
