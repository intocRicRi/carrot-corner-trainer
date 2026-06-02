/* ============================================================================
 * Refined "Midnight Glass" (C) — per-street action recap + higher-contrast
 * answers. Two answer treatments shown (C1 filled, C2 outline+glow).
 * ==========================================================================*/

const S = {
  potBB: 5.5, openBB: 2.5, hero: { pos: "BB", cards: ["Ks", "Js"] }, raiserPos: "CO",
  board: ["8h", "Kd", "7h", "3s"],
  options: [
    { code: "Check", sub: "pot control", score: "okay", gto: true },
    { code: "B33",   sub: "≈ 1.8 BB",    score: "okay", gto: true },
    { code: "B75",   sub: "≈ 4.1 BB",    score: "best", gto: true, picked: true },
    { code: "B150",  sub: "≈ 8.3 BB",    score: "best", gto: true }
  ],
  feedback: "In theory all options are okay. In practice a small bet underperforms — the pool rarely raises this node and is capped/condensed after checking the flop (8x, 7x, 99–QQ, weak top pair over-represented). So B75 and B150 are best; X/B33 underperform from lack of aggression on later streets.",
  author: "Pete Clarke",
  // one entry per street; river omitted when not relevant
  streets: [
    { name: "Preflop", act: "CO opens 2.5 BB · Hero calls" },
    { name: "Flop", act: "checks through" },
    { name: "Turn", act: "Hero to act", live: true }
  ]
};

const GR = [["best","Best"],["good","Good"],["okay","OK"],["mistake","Mistake"],["horrible","Blunder"]];

function bannerHTML() {
  return `<button class="ld-theme">Turn Probe Opportunity <span class="ld-chev">▾</span></button>` +
    `<div class="ld-nav"><button class="ld-navbtn">◀</button><span class="ld-count">Hand 1 / 12</span>` +
    `<button class="ld-navbtn">▶</button><button class="ld-shuffle">⤳ Random</button></div>`;
}
function streetsHTML() {
  return `<div class="ld-streets">` + S.streets.map(s =>
    `<div class="ld-street${s.live ? " ld-street--live" : ""}">` +
      `<span class="ld-street__name">${s.name}</span>` +
      `<span class="ld-street__act">${s.act}</span></div>`).join("") + `</div>`;
}
function answersHTML() {
  return S.options.map(o =>
    `<button class="ans ${o.score ? "score-" + o.score : ""} ${o.picked ? "picked" : ""}" disabled>` +
      `<span class="ans__gto ${o.gto ? "show" : ""}">GTO&nbsp;✅</span>` +
      `<span class="ans__code">${o.code}</span><span class="ans__sub">${o.sub}</span>` +
      (o.picked ? `<span class="ans__pick">✓</span>` : "") + `</button>`).join("");
}
function legendHTML() {
  return `<span class="ld-legtitle">Answer quality</span>` +
    GR.map(([k, l]) => `<span class="ld-leg"><i class="dot s-${k}"></i>${l}</span>`).join("") +
    `<span class="ld-leg"><i class="gto-chip">GTO&nbsp;✅</i>solver-approved</span>`;
}
function coachHTML() {
  return `<div class="ld-coachhead"><span class="feedback__avatar">PC</span>` +
    `<span class="ld-coachname">${S.author}</span><span class="ld-coachrole">Coach feedback</span></div>` +
    `<p class="ld-coachtext">${S.feedback}</p>`;
}

function buildLD(ld) {
  ld.innerHTML =
    `<header class="ld-banner">${bannerHTML()}</header>` +
    `<div class="table ld-table"></div>` +
    `<div class="ld-action">${streetsHTML()}</div>` +
    `<div class="ld-answers">${answersHTML()}</div>` +
    `<div class="ld-legend">${legendHTML()}</div>` +
    `<div class="ld-coach">${coachHTML()}</div>`;
  renderTable(S, ld.querySelector(".ld-table"));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".ld").forEach(buildLD);
});
