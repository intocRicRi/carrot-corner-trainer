/* ============================================================================
 * Carrot Corner Trainer — trainer logic (Midnight Glass layout).
 * Banner (theme + hand nav) · table · per-street recap · answer row (no keys,
 * outline+glow on reveal) · labelled legend · coach feedback. No scrolling.
 * ==========================================================================*/

let DECK = [];
let index = 0;

const GRADE_LABELS = [
  ["best", "Best"], ["good", "Good"], ["okay", "OK"], ["mistake", "Mistake"], ["horrible", "Blunder"]
];

async function loadDeck() {
  const local = readLocalDeck();
  if (local && local.length) return local;
  return await fetchPublishedDeck();
}

function renderRecap(spot) {
  document.getElementById("recap").innerHTML = (spot.recap || []).map(s =>
    `<div class="street${s.live ? " street--live" : ""}">` +
      `<span class="street__name">${s.street}</span>` +
      `<span class="street__act">${s.action}</span></div>`).join("");
}

function renderAnswers(spot) {
  const el = document.getElementById("answers");
  el.classList.remove("answered");
  el.innerHTML = spot.options.map(o =>
    `<button class="ans" data-id="${o.id}">` +
      `<span class="ans__gto">GTO&nbsp;✅</span>` +
      `<span class="ans__code">${o.code}</span>` +
      (o.sub ? `<span class="ans__sub">${o.sub}</span>` : "") +
      `<span class="ans__pick">✓</span>` +
    `</button>`).join("");
  el.querySelectorAll(".ans").forEach(b =>
    b.addEventListener("click", () => reveal(spot, b.dataset.id)));
}

function renderLegend() {
  document.getElementById("legend").innerHTML =
    `<span class="legtitle">Answer quality</span>` +
    GRADE_LABELS.map(([k, l]) => `<span class="leg"><i class="dot s-${k}"></i>${l}</span>`).join("") +
    `<span class="leg"><i class="gto-chip">GTO&nbsp;✅</i>solver-approved</span>`;
}

function renderCoach(spot, revealed) {
  const el = document.getElementById("coach");
  if (!revealed) {
    el.className = "tcoach tcoach--idle";
    el.innerHTML = `<span class="tcoach__hint">Pick your play to see ${spot.author || "the coach"}’s feedback.</span>`;
    return;
  }
  el.className = "tcoach";
  el.innerHTML =
    `<div class="tcoach__head"><span class="feedback__avatar">PC</span>` +
      `<span class="tcoach__name">${spot.author || "Coach"}</span>` +
      `<span class="tcoach__role">Coach feedback</span></div>` +
    `<p class="tcoach__text">${spot.feedback}</p>` +
    `<div class="tcoach__actions">` +
      `<button class="btn-ghost" id="retry">Try again</button>` +
      `<button class="btn-primary" id="next">Next hand →</button></div>`;
  document.getElementById("retry").addEventListener("click", () => show(index));
  document.getElementById("next").addEventListener("click", () => show(index + 1));
}

function reveal(spot, pickedId) {
  const wrap = document.getElementById("answers");
  if (wrap.classList.contains("answered")) return;
  wrap.classList.add("answered");
  spot.options.forEach(o => {
    const b = wrap.querySelector(`.ans[data-id="${o.id}"]`);
    b.disabled = true;
    if (o.score) b.classList.add("score-" + o.score);
    if (o.id === pickedId) b.classList.add("picked");
    if (o.gto) b.querySelector(".ans__gto").classList.add("show");
  });
  renderCoach(spot, true);
}

function renderSpot(spot) {
  renderTable(spot, document.getElementById("table"));
  document.getElementById("themeName").textContent = spot.title || "Spot";
  document.getElementById("handCount").textContent = `Hand ${index + 1} / ${DECK.length}`;
  renderRecap(spot);
  renderAnswers(spot);
  renderLegend();
  renderCoach(spot, false);
}

function show(i) {
  index = (i + DECK.length) % DECK.length;
  renderSpot(DECK[index]);
}

async function init() {
  DECK = await loadDeck();

  const empty = document.getElementById("empty");
  const layout = document.getElementById("layout");
  if (!DECK.length) {
    empty.hidden = false;
    layout.hidden = true;
    document.getElementById("handCount").textContent = "0 hands";
    return;
  }
  empty.hidden = true;
  layout.hidden = false;

  document.getElementById("prevBtn").addEventListener("click", () => show(index - 1));
  document.getElementById("nextBtn").addEventListener("click", () => show(index + 1));
  document.getElementById("randomBtn").addEventListener("click", () => {
    if (DECK.length < 2) return show(index);
    let r; do { r = Math.floor(Math.random() * DECK.length); } while (r === index);
    show(r);
  });

  show(0);
}

document.addEventListener("DOMContentLoaded", init);
