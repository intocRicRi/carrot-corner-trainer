/* ============================================================================
 * poker.js — board-texture + hand-connection classification (GTO-Wizard style)
 * and constrained hand generation (rejection sampling).
 * Pure functions; no DOM. Used by the admin generator and validated standalone.
 * ==========================================================================*/

const RVAL = { "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"T":10,"J":11,"Q":12,"K":13,"A":14 };
function rval(card)  { return RVAL[card.slice(0, -1)]; }
function rsuit(card) { return card.slice(-1); }

/* ---- deck ---------------------------------------------------------------- */
function pokerDeck() {
  const ranks = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
  const suits = ["s","h","d","c"];
  const d = [];
  for (const r of ranks) for (const s of suits) d.push(r + s);
  return d;
}
function pokerShuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---- flop texture (uses the first 3 board cards) ------------------------- */
const FLOP_OPTS = {
  suit: [["any","Any"], ["rainbow","Rainbow"], ["two-tone","Two-tone"], ["monotone","Monotone"]],
  pair: [["any","Any"], ["unpaired","Unpaired"], ["paired","Paired"]],
  conn: [["any","Any"], ["connected","Connected"], ["disconnected","Disconnected"]],
  high: [["any","Any"], ["ace","Ace-high"], ["broadway","Broadway (K–T)"], ["low","Low (≤9)"]]
};

function classifyFlop(flop) {
  const suits = flop.map(rsuit);
  const uniqSuits = new Set(suits).size;
  const suit = uniqSuits === 1 ? "monotone" : uniqSuits === 2 ? "two-tone" : "rainbow";

  const ranks = flop.map(rval);
  const uniqRanks = [...new Set(ranks)];
  const pair = uniqRanks.length < 3 ? "paired" : "unpaired";

  const conn = flopConnected(uniqRanks) ? "connected" : "disconnected";

  const hi = Math.max(...ranks);
  const high = hi === 14 ? "ace" : hi >= 10 ? "broadway" : "low";
  return { suit, pair, conn, high };
}
function flopConnected(uniqRanks) {
  const variants = [uniqRanks.slice()];
  if (uniqRanks.includes(14)) variants.push(uniqRanks.map(r => (r === 14 ? 1 : r)));
  return variants.some(rs => {
    const s = [...new Set(rs)].sort((a, b) => a - b);
    return s.length >= 2 && (s[s.length - 1] - s[0]) <= 4;
  });
}
function matchFlop(c, constraint) {
  if (!constraint || constraint === "random") return true;
  for (const k of ["suit", "pair", "conn", "high"]) {
    if (constraint[k] && constraint[k] !== "any" && c[k] !== constraint[k]) return false;
  }
  return true;
}

/* ---- hand-connection (made-hand class at the decision board) ------------- */
const CONNECTION_OPTS = [
  ["any", "Any"],
  ["straight-plus", "Straight or better"],
  ["set", "Set / Trips"],
  ["two-pair", "Two pair"],
  ["overpair", "Overpair"],
  ["top-pair", "Top pair"],
  ["middle-pair", "Middle pair"],
  ["weak-pair", "Weak / bottom pair"],
  ["underpair", "Underpair"],
  ["ace-high", "Ace high / no pair"],
  ["combo-draw", "Combo draw"],
  ["flush-draw", "Flush draw"],
  ["oesd", "Open-ended straight draw"],
  ["gutshot", "Gutshot"],
  ["air", "Air"]
];

function countByRank(cards) {
  const c = {};
  cards.forEach(card => { const v = rval(card); c[v] = (c[v] || 0) + 1; });
  return c;
}
function hasFlush(cards) {
  const s = {};
  cards.forEach(c => { const k = rsuit(c); s[k] = (s[k] || 0) + 1; });
  return Object.values(s).some(n => n >= 5);
}
function hasStraight(cards) {
  const vals = new Set(cards.map(rval));
  if (vals.has(14)) vals.add(1);
  const arr = [...vals].sort((a, b) => a - b);
  let run = 1;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] === arr[i - 1] + 1) { run++; if (run >= 5) return true; }
    else run = 1;
  }
  return false;
}
function isStraightOrBetter(cards) {
  const counts = Object.values(countByRank(cards));
  const quads = counts.some(n => n >= 4);
  const fullHouse = counts.some(n => n >= 3) && counts.filter(n => n >= 2).length >= 2;
  return quads || fullHouse || hasFlush(cards) || hasStraight(cards);
}
function straightDraw(cards) {
  if (hasStraight(cards)) return null;
  const vals = new Set(cards.map(rval));
  if (vals.has(14)) vals.add(1);
  const present = [...vals];
  for (let lo = 2; lo <= 11; lo++) {               // 4 consecutive present -> OESD
    if ([0, 1, 2, 3].every(i => present.includes(lo + i))) return "oesd";
  }
  for (let lo = 1; lo <= 10; lo++) {               // 4 of a 5-window present -> gutshot
    if ([lo, lo + 1, lo + 2, lo + 3, lo + 4].filter(r => present.includes(r)).length >= 4) return "gutshot";
  }
  return null;
}
function drawType(hole, board) {
  const cards = hole.concat(board);
  const bySuit = {};
  cards.forEach(c => { const s = rsuit(c); (bySuit[s] = bySuit[s] || []).push(c); });
  let fd = false;
  for (const s in bySuit) if (bySuit[s].length === 4 && hole.some(h => rsuit(h) === s)) fd = true;
  const sd = straightDraw(cards);
  if (fd && sd) return "combo-draw";
  if (fd) return "flush-draw";
  if (sd) return sd;
  return null;
}

/** Primary made-hand / draw class of `hole` on `board` (made hands beat draws). */
function classifyConnection(hole, board) {
  const cards = hole.concat(board);
  if (isStraightOrBetter(cards)) return "straight-plus";

  const valCount = countByRank(cards);
  const holeVals = hole.map(rval);
  const boardVals = board.map(rval);
  const topBoard = Math.max(...boardVals);
  const uniqBoardDesc = [...new Set(boardVals)].sort((a, b) => b - a);
  const isPocket = holeVals[0] === holeVals[1];

  for (const v in valCount) if (valCount[v] >= 3 && holeVals.includes(+v)) return "set";

  const heroPairVals = Object.keys(valCount)
    .filter(v => valCount[v] >= 2 && holeVals.includes(+v)).map(Number);
  if (heroPairVals.length >= 2) return "two-pair";

  if (isPocket && valCount[holeVals[0]] === 2) {
    return holeVals[0] > topBoard ? "overpair" : "underpair";
  }
  if (heroPairVals.length === 1) {
    const pv = heroPairVals[0];
    if (pv === uniqBoardDesc[0]) return "top-pair";
    if (pv === uniqBoardDesc[1]) return "middle-pair";
    return "weak-pair";
  }

  const d = drawType(hole, board);
  if (d) return d;
  return holeVals.includes(14) ? "ace-high" : "air";
}

/* ---- constrained generation (rejection sampling) ------------------------- */
const STREET_BOARD = { Flop: 3, Turn: 4, River: 5 };

/**
 * Deal hero + board matching a scenario's flop texture and hand-connection.
 * Returns { hero:[c,c], board:[...] } or null if no match within `maxTries`.
 */
function generateConstrainedHand(scenario, maxTries) {
  maxTries = maxTries || 6000;
  const n = STREET_BOARD[scenario.decisionStreet] || 4;
  const flopWant = scenario.flop || "random";
  const connWant = scenario.handConnection || "any";
  for (let t = 0; t < maxTries; t++) {
    const d = pokerShuffle(pokerDeck());
    const hero = [d[0], d[1]];
    const board = d.slice(2, 2 + n);
    if (!matchFlop(classifyFlop(board.slice(0, 3)), flopWant)) continue;
    if (connWant !== "any" && classifyConnection(hero, board) !== connWant) continue;
    return { hero, board };
  }
  return null;
}
