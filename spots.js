/* ============================================================================
 * Carrot Corner Trainer — spot data
 * ----------------------------------------------------------------------------
 * Each spot is one multiple-choice training question. The UI is fully driven
 * by this data, so adding a new spot = adding a new object to SPOTS.
 *
 * score values (drive the answer colours after the student picks):
 *   'best'     -> dark green   (highest-EV in practice)
 *   'good'     -> light green  (solid, slightly behind best)
 *   'okay'     -> yellow       (acceptable but underperforms)
 *   'mistake'  -> orange       (a real error)
 *   'horrible' -> red          (blunder)
 *
 * gto: true  -> shows the "GTO ✅" badge above the option once answered
 *               (i.e. the option is theoretically correct / in the solver mix)
 * ==========================================================================*/

const SPOTS = [
  {
    id: "turn-probe-kj",
    title: "Turn Probe Opportunity",
    stakes: "$0.25 NL · 6-max · Rush & Cash",
    effective: "Effective stacks ≈ 100 BB",
    potBB: 5,
    hero: { name: "Hero", pos: "SB", cards: ["Ks", "Js"] },
    board: ["8h", "Kd", "7h", "3s"],

    // Ring layout — `slot` maps to a fixed anchor position around the felt.
    seats: [
      { slot: "hero",      name: "Hero",   pos: "SB",  stack: "≈100 BB", state: "live",   note: "you" },
      { slot: "bottomLeft",name: "Villain",pos: "BB",  stack: "100 BB",  state: "folded", note: "folds" },
      { slot: "topLeft",   name: "Villain",pos: "UTG", stack: "207 BB",  state: "folded", note: "folds" },
      { slot: "topCenter", name: "Villain",pos: "HJ",  stack: "109 BB",  state: "live",   note: "opens 2 BB" },
      { slot: "topRight",  name: "Villain",pos: "CO",  stack: "101 BB",  state: "folded", note: "folds" },
      { slot: "bottomRight",name:"Villain",pos: "BTN", stack: "50 BB",   state: "folded", note: "folds" }
    ],

    description: [
      "You're in the <b>Small Blind</b> with <b>K♠ J♠</b>.",
      "The <b>Hijack</b> opens to 2 BB. It folds to you; you flat. The Big Blind folds. Heads-up to the flop (pot 5 BB).",
      "<b>Flop (8♥ K♦ 7♥):</b> you check, the Hijack <b>checks back</b>.",
      "<b>Turn (3♠):</b> the action is on you."
    ],

    question:
      "The pre-flop raiser declined to c-bet the flop. On the 3♠ turn, what do you do with top pair (K♠ J♠)?",

    options: [
      { id: "A", code: "B33",  label: "Bet 33% pot",     sub: "≈ 1.6 BB",  score: "okay", gto: true },
      { id: "B", code: "B75",  label: "Bet 75% pot",     sub: "≈ 3.75 BB", score: "best", gto: true },
      { id: "C", code: "B150", label: "Overbet 150% pot",sub: "≈ 7.5 BB",  score: "best", gto: true },
      { id: "D", code: "X",    label: "Check",           sub: "pot control",score: "okay", gto: true }
    ],

    feedback:
      "In theory all options are okay with this hand. In practice, a small bet is likely to " +
      "underperform due to the lack of raising by population in this node. Population is likely " +
      "quite capped and condensed when they check the flop here. Hands like 8x, 7x and 99, TT, JJ, " +
      "QQ and weak top pair will appear at a higher frequency than in theory. Therefore B75 and " +
      "B150 are the best options. X/C will also underperform due to lack of aggression across turn " +
      "and river from the pool.",

    author: "Pete Clarke"
  }
];
