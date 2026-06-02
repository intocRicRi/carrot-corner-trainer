/* ============================================================================
 * Carrot Corner Trainer — admin logic
 * Generate a probe hand, grade it, and publish it to the public site by
 * committing spots.json to GitHub via the API (token kept in this browser only).
 * ==========================================================================*/

/* Repo coordinates for publishing. */
const REPO = { owner: "intocRicRi", name: "carrot-corner-trainer", branch: "main", path: "spots.json" };
const TOKEN_KEY = "ccGitHubToken";

let deck = [];        // working deck (mirrors localStorage + published spots.json)
let current = null;   // generated-but-not-yet-saved spot
let ghToken = null;   // GitHub token (localStorage only, never committed)

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
    stakes: "$0.25 NL · 6-max",
    effective: "Effective stacks ≈ 100 BB",
    potBB, openBB,
    hero: { pos: "BB", cards: heroCards },
    raiserPos: raiser,
    board,
    description: [
      `You're in the <b>Big Blind</b> with <b>${heroLbl}</b>.`,
      `${capitalize(POS_NAME[raiser])} opens to ${openBB} BB. It folds to you; you call. Heads-up to the flop (pot ${potBB} BB).`,
      `<b>Flop (${flopLbl}):</b> you check, ${POS_NAME[raiser]} checks back.`,
      `<b>Turn (${turnLbl}):</b> the action is on you.`
    ],
    question: `The pre-flop raiser declined to c-bet the flop. On the ${turnLbl} turn, what is your play with ${heroLbl}?`,
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

/* ---- GitHub publishing --------------------------------------------------- */

/* UTF-8 safe base64 (the deck contains ♠♥♦♣ and may contain accents). */
function b64Unicode(str) { return btoa(unescape(encodeURIComponent(str))); }
function fromB64Unicode(b64) { return decodeURIComponent(escape(atob(b64.replace(/\n/g, "")))); }

function ghHeaders() {
  return {
    "Authorization": "Bearer " + ghToken,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}
function contentsUrl(withRef) {
  const base = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${REPO.path}`;
  return withRef ? `${base}?ref=${REPO.branch}` : base;
}

async function ghGetContent() {
  const res = await fetch(contentsUrl(true), { headers: ghHeaders(), cache: "no-store" });
  if (res.status === 404) return { deck: [], sha: null };
  if (!res.ok) throw new Error("GET " + res.status);
  const j = await res.json();
  const text = j.content ? fromB64Unicode(j.content) : "[]";
  const parsed = JSON.parse(text || "[]");
  return { deck: Array.isArray(parsed) ? parsed : [], sha: j.sha };
}

async function publish(message) {
  if (!ghToken) { setStatus("local"); return false; }
  setStatus("publishing");
  try {
    let sha = null;
    try { sha = (await ghGetContent()).sha; } catch { /* may be 404/new */ }
    const body = {
      message,
      content: b64Unicode(JSON.stringify(deck, null, 2)),
      branch: REPO.branch
    };
    if (sha) body.sha = sha;
    const res = await fetch(contentsUrl(false), {
      method: "PUT", headers: ghHeaders(), body: JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error("PUT " + res.status + " " + t.slice(0, 140));
    }
    setStatus("published");
    return true;
  } catch (e) {
    setStatus("error", e.message);
    return false;
  }
}

/* token connect / status */
function setStatus(state, msg) {
  const el = document.getElementById("ghStatus");
  const map = {
    disconnected: ["● Not connected", "off"],
    connected:    ["● Connected — saves publish live", "ok"],
    publishing:   ["● Publishing…", "busy"],
    published:    ["✓ Published — live in ~1 min", "ok"],
    local:        ["● Saved locally — connect to publish", "warn"],
    error:        ["✕ " + (msg || "Publish error"), "err"]
  };
  const [text, cls] = map[state] || map.disconnected;
  el.textContent = text;
  el.className = "connect__status " + cls;
}

async function connect(token, silent) {
  ghToken = token;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.name}`, { headers: ghHeaders() });
    if (!res.ok) { ghToken = null; if (!silent) setStatus("error", "token rejected (" + res.status + ")"); return false; }
    localStorage.setItem(TOKEN_KEY, token);
    setStatus("connected");
    document.getElementById("ghForget").hidden = false;
    document.getElementById("ghToken").value = "";
    document.getElementById("ghToken").placeholder = "Token saved in this browser ✓";
    return true;
  } catch (e) {
    ghToken = null;
    if (!silent) setStatus("error", e.message);
    return false;
  }
}

function forgetToken() {
  ghToken = null;
  localStorage.removeItem(TOKEN_KEY);
  document.getElementById("ghForget").hidden = true;
  document.getElementById("ghToken").placeholder = "Paste GitHub token (fine-grained · Contents: Read and write)";
  setStatus("disconnected");
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
      `<button class="decklist__del" data-id="${s.id}" title="Delete & publish">✕</button>`;
    list.appendChild(li);
  });
  list.querySelectorAll(".decklist__del").forEach(btn => {
    btn.addEventListener("click", async () => {
      deck = deck.filter(s => s.id !== btn.dataset.id);
      writeLocalDeck(deck);
      refreshDeckUI();
      await publish("Remove hand from trainer deck");
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
  // restore token + load freshest deck
  const saved = localStorage.getItem(TOKEN_KEY);
  if (saved) {
    const ok = await connect(saved, true);
    if (ok) {
      try { deck = (await ghGetContent()).deck; }
      catch { deck = readLocalDeck() || await fetchPublishedDeck(); }
    } else {
      setStatus("disconnected");
      deck = readLocalDeck() || await fetchPublishedDeck();
    }
  } else {
    setStatus("disconnected");
    deck = readLocalDeck() || await fetchPublishedDeck();
  }
  writeLocalDeck(deck);
  refreshDeckUI();

  // connect controls
  document.getElementById("ghConnect").addEventListener("click", async () => {
    const t = document.getElementById("ghToken").value.trim();
    if (!t) return;
    if (await connect(t, false)) {
      try { deck = (await ghGetContent()).deck; writeLocalDeck(deck); refreshDeckUI(); } catch {}
    }
  });
  document.getElementById("ghForget").addEventListener("click", forgetToken);
  document.getElementById("ghHelp").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("ghHelpBox").hidden = !document.getElementById("ghHelpBox").hidden;
  });

  // generate / preview
  document.getElementById("genBtn").addEventListener("click", newHand);
  document.getElementById("skipBtn").addEventListener("click", newHand);
  document.getElementById("useBtn").addEventListener("click", () => {
    if (current) renderGradeForm(current);
    document.getElementById("grade").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // save → publish
  document.getElementById("saveBtn").addEventListener("click", async () => {
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
    const hero = handLabelHTML(current.hero.cards).replace(/<[^>]+>/g, "");
    current = null;
    document.getElementById("grade").hidden = true;
    document.getElementById("gradeEmpty").hidden = false;
    document.getElementById("preview").hidden = true;
    await publish(`Add hand to trainer deck (${hero})`);
    newHand();
  });

  // deck actions
  document.getElementById("downloadBtn").addEventListener("click", downloadDeck);
  document.getElementById("publishBtn").addEventListener("click", () => publish("Publish trainer deck"));
  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("Reload the published deck and discard local drafts?")) return;
    try {
      deck = ghToken ? (await ghGetContent()).deck : await fetchPublishedDeck();
      writeLocalDeck(deck);
      refreshDeckUI();
    } catch (e) { setStatus("error", e.message); }
  });
}

document.addEventListener("DOMContentLoaded", init);
