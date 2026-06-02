/* ============================================================================
 * Carrot Corner Trainer — trainer logic (scenario model).
 * Banner theme switcher = scenario list; hand nav moves within a scenario.
 * ==========================================================================*/

let SCENARIOS = [];
let scen = null;     // active scenario
let sIdx = 0;        // index within playable scenarios
let hIdx = 0;        // hand index within the scenario

const GRADE_LABELS = [
  ["best", "Best"], ["good", "Good"], ["okay", "OK"], ["mistake", "Mistake"], ["horrible", "Blunder"]
];

async function loadScenarios() {
  const local = readLocalScenarios();
  if (local && local.length) return local;
  return await fetchPublishedScenarios();
}
function playableScenarios() {
  return SCENARIOS.filter(s => Array.isArray(s.hands) && s.hands.length);
}
function spotForTable(s, hand) {
  return { potBB: s.potBB, openBB: s.openBB, hero: hand.hero, raiserPos: s.raiserPos, board: hand.board };
}

function renderRecap(s) {
  document.getElementById("recap").innerHTML = (s.actions || []).map(a =>
    `<div class="street${a.live ? " street--live" : ""}">` +
      `<span class="street__name">${a.street}</span>` +
      `<span class="street__act">${a.action}</span></div>`).join("");
}

function renderAnswers(hand) {
  const el = document.getElementById("answers");
  el.classList.remove("answered");
  el.innerHTML = hand.options.map(o =>
    `<button class="ans" data-id="${o.id}">` +
      `<span class="ans__gto">GTO&nbsp;✅</span>` +
      `<span class="ans__code">${o.code}</span>` +
      (o.sub ? `<span class="ans__sub">${o.sub}</span>` : "") +
      `<span class="ans__pick">✓</span>` +
    `</button>`).join("");
  el.querySelectorAll(".ans").forEach(b => b.addEventListener("click", () => reveal(b.dataset.id)));
}

function renderLegend() {
  document.getElementById("legend").innerHTML =
    `<span class="legtitle">Answer quality</span>` +
    GRADE_LABELS.map(([k, l]) => `<span class="leg"><i class="dot s-${k}"></i>${l}</span>`).join("") +
    `<span class="leg"><i class="gto-chip">GTO&nbsp;✅</i>solver-approved</span>`;
}

function renderCoach(hand, revealed) {
  const el = document.getElementById("coach");
  const author = hand.author || "Coach";
  if (!revealed) {
    el.className = "tcoach tcoach--idle";
    el.innerHTML = `<span class="tcoach__hint">Pick your play to see ${author}’s feedback.</span>`;
    return;
  }
  el.className = "tcoach";
  el.innerHTML =
    `<div class="tcoach__head"><span class="feedback__avatar">PC</span>` +
      `<span class="tcoach__name">${author}</span>` +
      `<span class="tcoach__role">Coach feedback</span></div>` +
    `<p class="tcoach__text">${hand.feedback}</p>` +
    `<div class="tcoach__actions">` +
      `<button class="btn-ghost" id="retry">Try again</button>` +
      `<button class="btn-primary" id="next">Next hand →</button></div>`;
  document.getElementById("retry").addEventListener("click", () => showHand(hIdx));
  document.getElementById("next").addEventListener("click", () => showHand(hIdx + 1));
}

function reveal(pickedId) {
  const wrap = document.getElementById("answers");
  if (wrap.classList.contains("answered")) return;
  wrap.classList.add("answered");
  const hand = scen.hands[hIdx];
  hand.options.forEach(o => {
    const b = wrap.querySelector(`.ans[data-id="${o.id}"]`);
    b.disabled = true;
    if (o.score) b.classList.add("score-" + o.score);
    if (o.id === pickedId) b.classList.add("picked");
    if (o.gto) b.querySelector(".ans__gto").classList.add("show");
  });
  document.getElementById("legend").classList.add("show");
  renderCoach(hand, true);
}

function renderSpot() {
  const hand = scen.hands[hIdx];
  renderTable(spotForTable(scen, hand), document.getElementById("table"));
  document.getElementById("themeName").textContent = scen.name;
  document.getElementById("themeMeta").textContent = `${scen.stackDepth} BB`;
  document.getElementById("handCount").textContent = `Hand ${hIdx + 1} / ${scen.hands.length}`;
  renderRecap(scen);
  renderAnswers(hand);
  renderLegend();
  document.getElementById("legend").classList.remove("show");
  renderCoach(hand, false);
}

function showHand(i) {
  const n = scen.hands.length;
  hIdx = (i + n) % n;
  renderSpot();
}

function buildThemeMenu() {
  const menu = document.getElementById("themeMenu");
  const ps = playableScenarios();
  menu.innerHTML = ps.map((s, i) =>
    `<button class="tmenu__item${i === sIdx ? " active" : ""}" data-i="${i}">` +
      `<span>${s.name}</span><span class="tmenu__count">${s.hands.length}</span></button>`).join("");
  menu.querySelectorAll(".tmenu__item").forEach(b =>
    b.addEventListener("click", () => { setScenario(+b.dataset.i); menu.hidden = true; }));
}

function setScenario(i) {
  const ps = playableScenarios();
  sIdx = (i + ps.length) % ps.length;
  scen = ps[sIdx];
  hIdx = 0;
  renderSpot();
  buildThemeMenu();
}

async function init() {
  SCENARIOS = await loadScenarios();
  const ps = playableScenarios();

  const empty = document.getElementById("empty");
  const layout = document.getElementById("layout");
  if (!ps.length) {
    empty.hidden = false;
    layout.hidden = true;
    document.getElementById("handCount").textContent = "—";
    return;
  }
  empty.hidden = true;
  layout.hidden = false;

  document.getElementById("prevBtn").addEventListener("click", () => showHand(hIdx - 1));
  document.getElementById("nextBtn").addEventListener("click", () => showHand(hIdx + 1));
  document.getElementById("randomBtn").addEventListener("click", () => {
    const n = scen.hands.length;
    if (n < 2) return showHand(hIdx);
    let r; do { r = Math.floor(Math.random() * n); } while (r === hIdx);
    showHand(r);
  });

  const themeBtn = document.getElementById("themeBtn");
  const menu = document.getElementById("themeMenu");
  themeBtn.addEventListener("click", e => { e.stopPropagation(); menu.hidden = !menu.hidden; });
  document.addEventListener("click", () => { menu.hidden = true; });

  setScenario(0);
}

document.addEventListener("DOMContentLoaded", init);
