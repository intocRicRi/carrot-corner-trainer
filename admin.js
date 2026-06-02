/* ============================================================================
 * Carrot Corner Trainer — admin logic (token-free, testing phase)
 * Generate a probe hand, grade it, save it. Hands persist in this browser
 * (localStorage) and show on the trainer instantly. "Download backup" exports
 * the deck so it can be committed to publish for everyone.
 * ==========================================================================*/

let deck = [];        // working deck (mirrors localStorage 'ccTrainerDeck')
let current = null;   // generated-but-not-yet-saved spot

/* ---- hand generation ----------------------------------------------------- */

function fullDeck() {
  const cards = [];
  for (const r of RANKS) for (const s of Object.keys(SUITS)) cards.push(r + s);
  return cards;
}
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRaiser(forced) {
  const opts = ["UTG", "HJ", "CO", "BTN"];
  return opts.includes(forced) ? forced : opts[Math.floor(Math.random() * opts.length)];
}

function makeOptions(potBB) {
  const sz = f => `≈ ${(potBB * f).toFixed(1)} BB`;
  return [
    { id: "A", code: "X",    label: "Check",            sub: "pot control", score: null, gto: false },
    { id: "B", code: "B33",  label: "Bet 33% pot",      sub: sz(0.33),      score: null, gto: false },
    { id: "C", code: "B75",  label: "Bet 75% pot",      sub: sz(0.75),      score: null, gto: false },
    { id: "D", code: "B150", label: "Overbet 150% pot", sub: sz(1.5),       score: null, gto: false }
  ];
}

function generateSpot(forcedRaiser) {
  const d = shuffle(fullDeck());
  const heroCards = [d[0], d[1]];
  const board = [d[2], d[3], d[4], d[5]];
  const raiser = pickRaiser(forcedRaiser);
  const openBB = 2.5;
  const potBB = +(openBB * 2 + 0.5).toFixed(1);

  const heroLbl = handLabelHTML(heroCards);
  const flopLbl = board.slice(0, 3).map(cardLabelHTML).join(" ");
  const turnLbl = cardLabelHTML(board[3]);

  return {
    id: "spot-" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    scenario: "turn-probe",
    title: "Turn Probe Opportunity",
    stakes: "NLHE 6-max",
    effective: "Effective stacks ≈ 100 BB",
    potBB, openBB,
    hero: { pos: "BB", cards: heroCards },
    raiserPos: raiser,
    board,
    streets: [
      { label: "Hero · BB", value: heroLbl },
      { label: "Preflop", value: `${raiser} opens ${openBB} BB · Hero calls` },
      { label: `Flop ${flopLbl}`, value: "check / check" },
      { label: `Turn ${turnLbl}`, value: "Hero to act", active: true }
    ],
    question: "What is your play?",
    options: makeOptions(potBB),
    feedback: "",
    author: "Pete Clarke"
  };
}

/* ---- preview ------------------------------------------------------------- */

function renderPreview(spot) {
  renderTable(spot, document.getElementById("adminTable"));
  document.getElementById("previewMeta").innerHTML =
    `<b>BB</b> ${handLabelHTML(spot.hero.cards)} &nbsp;·&nbsp; vs <b>${spot.raiserPos}</b> open ` +
    `&nbsp;·&nbsp; board ${spot.board.map(cardLabelHTML).join(" ")} &nbsp;·&nbsp; pot ${spot.potBB} BB`;
  document.getElementById("preview").hidden = false;
}

/* ---- grading form -------------------------------------------------------- */

function renderGradeForm(spot) {
  const rows = document.getElementById("gradeRows");
  rows.innerHTML = "";
  spot.options.forEach(opt => {
    const row = document.createElement("div");
    row.className = "grade-row";
    row.dataset.id = opt.id;
    const grades = GRADES.map(g => `<option value="${g.v}">${g.label} (${g.hint})</option>`).join("");
    row.innerHTML =
      `<span class="grade-row__code"><b>${opt.code}</b><small>${opt.label}</small></span>` +
      `<select class="grade-row__sel"><option value="">— grade —</option>${grades}</select>` +
      `<label class="grade-row__gto"><input type="checkbox" class="gto-box"/> GTO&nbsp;✅</label>` +
      `<span class="grade-row__swatch"></span>`;
    const sel = row.querySelector(".grade-row__sel");
    sel.addEventListener("change", () => {
      row.querySelector(".grade-row__swatch").className =
        "grade-row__swatch" + (sel.value ? " score-" + sel.value : "");
    });
    rows.appendChild(row);
  });
  document.getElementById("feedbackInput").value = spot.feedback || "";
  document.getElementById("gradeError").hidden = true;
  document.getElementById("gradeEmpty").hidden = true;
  document.getElementById("grade").hidden = false;
}

function collectGrades(spot) {
  const missing = [];
  [...document.querySelectorAll(".grade-row")].forEach(row => {
    const opt = spot.options.find(o => o.id === row.dataset.id);
    const score = row.querySelector(".grade-row__sel").value;
    opt.score = score || null;
    opt.gto = row.querySelector(".gto-box").checked;
    if (!score) missing.push(opt.code);
  });
  const feedback = document.getElementById("feedbackInput").value.trim();
  spot.feedback = feedback;
  return { missing, feedbackEmpty: !feedback };
}

/* ---- deck UI ------------------------------------------------------------- */

function refreshDeckUI() {
  document.getElementById("deckCount").textContent =
    `${deck.length} hand${deck.length === 1 ? "" : "s"}`;
  document.getElementById("deckCount2").textContent = deck.length;

  const list = document.getElementById("deckList");
  list.innerHTML = "";
  if (!deck.length) {
    list.innerHTML = `<li class="decklist__empty">No hands saved yet.</li>`;
    return;
  }
  deck.forEach((s, i) => {
    const best = s.options.filter(o => o.score === "best").map(o => o.code).join(", ") || "—";
    const li = document.createElement("li");
    li.className = "decklist__item";
    li.innerHTML =
      `<span class="decklist__n">${i + 1}</span>` +
      `<span class="decklist__hand">BB ${handLabelHTML(s.hero.cards)} vs ${s.raiserPos}` +
        ` · ${s.board.map(cardLabelHTML).join(" ")}</span>` +
      `<span class="decklist__best">best: ${best}</span>` +
      `<button class="decklist__del" data-id="${s.id}" title="Delete">✕</button>`;
    list.appendChild(li);
  });
  list.querySelectorAll(".decklist__del").forEach(btn => {
    btn.addEventListener("click", () => {
      deck = deck.filter(s => s.id !== btn.dataset.id);
      writeLocalDeck(deck);
      refreshDeckUI();
    });
  });
}

function downloadDeck() {
  const blob = new Blob([JSON.stringify(deck, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "spots.json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

/* ---- wiring -------------------------------------------------------------- */

function newHand() {
  current = generateSpot(document.getElementById("raiserSel").value);
  renderPreview(current);
  document.getElementById("grade").hidden = true;
  document.getElementById("gradeEmpty").hidden = false;
}

async function init() {
  const local = readLocalDeck();
  deck = local && local.length ? local : await fetchPublishedDeck();
  writeLocalDeck(deck);
  refreshDeckUI();

  document.getElementById("genBtn").addEventListener("click", newHand);
  document.getElementById("skipBtn").addEventListener("click", newHand);

  document.getElementById("useBtn").addEventListener("click", () => {
    if (current) renderGradeForm(current);
    document.getElementById("grade").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    if (!current) return;
    const { missing, feedbackEmpty } = collectGrades(current);
    const err = document.getElementById("gradeError");
    if (missing.length || feedbackEmpty) {
      const parts = [];
      if (missing.length) parts.push(`grade ${missing.join(", ")}`);
      if (feedbackEmpty) parts.push("write feedback");
      err.textContent = "Please " + parts.join(" and ") + ".";
      err.hidden = false;
      return;
    }
    deck.push(current);
    writeLocalDeck(deck);
    refreshDeckUI();
    current = null;
    document.getElementById("grade").hidden = true;
    document.getElementById("gradeEmpty").hidden = false;
    document.getElementById("preview").hidden = true;
    newHand();
  });

  document.getElementById("downloadBtn").addEventListener("click", downloadDeck);
  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("Reload the published deck and discard local changes?")) return;
    deck = await fetchPublishedDeck();
    writeLocalDeck(deck);
    refreshDeckUI();
  });
}

document.addEventListener("DOMContentLoaded", init);
