/* ============================================================================
 * Carrot Corner Trainer — Admin (scenario model).
 * Views: list -> create -> detail. In detail you generate hands that match the
 * scenario's flop texture + hand connection (poker.js), grade them, and save.
 * Local-only; "Download backup" exports scenarios.json for publishing.
 * ==========================================================================*/

let scenarios = [];
let active = null;     // active scenario object (detail view)
let current = null;    // generated-but-unsaved hand { hero:[], board:[] }
let addState = "idle"; // idle | preview | grade

const POSITIONS = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];
const RAISERS = ["UTG", "HJ", "CO", "BTN"];
const STREETS = ["Preflop", "Flop", "Turn", "River"];

const root = () => document.getElementById("adminRoot");
const persist = () => writeLocalScenarios(scenarios);
const flopLabel = v => (FLOP_OPTS.suit.find(o => o[0] === v.suit)[1]); // unused helper guard
const connLabel = v => (CONNECTION_OPTS.find(o => o[0] === v) || ["", v])[1];

function flopSummary(f) {
  if (!f) return "Random flop";
  const parts = [];
  for (const k of ["suit", "pair", "conn", "high"]) {
    if (f[k] && f[k] !== "any") parts.push(FLOP_OPTS[k].find(o => o[0] === f[k])[1]);
  }
  return parts.length ? parts.join(" · ") : "Any flop";
}
function esc(s) { return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
function selectHTML(id, opts, val) {
  return `<select id="${id}">` + opts.map(([v, l]) =>
    `<option value="${v}"${v === val ? " selected" : ""}>${l}</option>`).join("") + `</select>`;
}

/* ============================ LIST VIEW ================================= */
function renderList() {
  active = null; current = null; addState = "idle";
  root().innerHTML =
    `<section class="panel">
      <div class="ahead">
        <h1 class="ahead__title">Scenarios</h1>
        <div class="ahead__actions">
          <button class="btn-ghost" id="resetBtn" title="Reload published scenarios, discard local changes">Reset from published</button>
          <button class="btn-ghost" id="dlBtn">⬇ Download backup</button>
          <button class="btn-primary" id="newBtn">+ New scenario</button>
        </div>
      </div>
      <div class="scards">${
        scenarios.length
          ? scenarios.map((s, i) =>
              `<button class="scard" data-i="${i}">
                 <div class="scard__name">${esc(s.name)}</div>
                 <div class="scard__meta">${s.stackDepth} BB · ${s.decisionStreet} · ${s.hands.length} hand(s)</div>
                 <div class="scard__rules">Flop: ${flopSummary(s.flop)}<br/>Hand: ${connLabel(s.handConnection)}</div>
               </button>`).join("")
          : `<p class="amuted">No scenarios yet. Click <b>New scenario</b> to create one.</p>`
      }</div>
    </section>`;

  root().querySelectorAll(".scard").forEach(b =>
    b.addEventListener("click", () => { active = scenarios[+b.dataset.i]; renderDetail(); }));
  document.getElementById("newBtn").addEventListener("click", renderCreate);
  document.getElementById("dlBtn").addEventListener("click", downloadBackup);
  document.getElementById("resetBtn").addEventListener("click", async () => {
    if (!confirm("Reload the published scenarios and discard local changes?")) return;
    scenarios = await fetchPublishedScenarios(); persist(); renderList();
  });
}

/* ============================ CREATE VIEW =============================== */
function renderCreate() {
  const pot = 5.5;
  const sz = f => `≈ ${(pot * f).toFixed(1)} BB`;
  const defAns = [
    { code: "Check", label: "Check", sub: "pot control" },
    { code: "B33", label: "Bet 33% pot", sub: sz(0.33) },
    { code: "B75", label: "Bet 75% pot", sub: sz(0.75) },
    { code: "B150", label: "Overbet 150% pot", sub: sz(1.5) }
  ];
  root().innerHTML =
    `<section class="panel">
      <div class="ahead"><h1 class="ahead__title">New scenario</h1>
        <button class="btn-ghost" id="backBtn">← Cancel</button></div>

      <div class="form2">
        <label class="field"><span>Name</span><input id="f_name" value="Turn Probe Opportunity"/></label>
        <label class="field"><span>Stack depth (BB)</span><input id="f_stack" type="number" value="100"/></label>
        <label class="field"><span>Hero position</span>${selectHTML("f_hero", POSITIONS.map(p => [p, p]), "BB")}</label>
        <label class="field"><span>Raiser position</span>${selectHTML("f_raiser", RAISERS.map(p => [p, p]), "CO")}</label>
        <label class="field"><span>Open size (BB)</span><input id="f_open" type="number" step="0.5" value="2.5"/></label>
        <label class="field"><span>Decision street</span>${selectHTML("f_street", STREETS.slice(1).map(s => [s, s]), "Turn")}</label>
        <label class="field"><span>Pot at decision (BB)</span><input id="f_pot" type="number" step="0.5" value="5.5"/></label>
      </div>

      <h2 class="panel__title">Action recap (one line per street)</h2>
      <div class="form2">
        <label class="field"><span>Preflop</span><input id="a_Preflop" value="CO opens 2.5 BB · Hero calls"/></label>
        <label class="field"><span>Flop</span><input id="a_Flop" value="checks through"/></label>
        <label class="field"><span>Turn</span><input id="a_Turn" value="Hero to act"/></label>
        <label class="field"><span>River</span><input id="a_River" value="Hero to act"/></label>
      </div>

      <h2 class="panel__title">Flop type (GTO Wizard categories)</h2>
      <div class="form4">
        <label class="field"><span>Suitedness</span>${selectHTML("fl_suit", FLOP_OPTS.suit, "any")}</label>
        <label class="field"><span>Pairing</span>${selectHTML("fl_pair", FLOP_OPTS.pair, "any")}</label>
        <label class="field"><span>Connectivity</span>${selectHTML("fl_conn", FLOP_OPTS.conn, "any")}</label>
        <label class="field"><span>High card</span>${selectHTML("fl_high", FLOP_OPTS.high, "any")}</label>
      </div>

      <h2 class="panel__title">Hero hand connection at the decision</h2>
      <label class="field field--wide">${selectHTML("f_conn", CONNECTION_OPTS, "any")}</label>

      <h2 class="panel__title">Answers (editable — pre-filled)</h2>
      <div class="answersedit" id="answersEdit">${defAns.map((a, i) =>
        `<div class="ansrow">
           <input class="ans_code" data-i="${i}" value="${esc(a.code)}" placeholder="code"/>
           <input class="ans_label" data-i="${i}" value="${esc(a.label)}" placeholder="label"/>
           <input class="ans_sub" data-i="${i}" value="${esc(a.sub)}" placeholder="sub"/>
         </div>`).join("")}</div>

      <div class="form__save">
        <span class="grade__error" id="createErr" hidden></span>
        <button class="btn-primary" id="saveScnBtn">Create scenario</button>
      </div>
    </section>`;

  document.getElementById("backBtn").addEventListener("click", renderList);
  document.getElementById("saveScnBtn").addEventListener("click", createScenario);
}

function createScenario() {
  const v = id => document.getElementById(id).value;
  const name = v("f_name").trim();
  if (!name) { const e = document.getElementById("createErr"); e.textContent = "Please name the scenario."; e.hidden = false; return; }
  const decisionStreet = v("f_street");
  const upto = STREETS.slice(0, STREETS.indexOf(decisionStreet) + 1);
  const actions = upto.map(st => ({ street: st, action: v("a_" + st).trim(), live: st === decisionStreet }));
  const answers = [...document.querySelectorAll(".ansrow")].map(r => ({
    code: r.querySelector(".ans_code").value.trim(),
    label: r.querySelector(".ans_label").value.trim(),
    sub: r.querySelector(".ans_sub").value.trim()
  })).filter(a => a.code);

  const scn = {
    id: "scn-" + Date.now().toString(36),
    name, stackDepth: +v("f_stack") || 100,
    heroPos: v("f_hero"), raiserPos: v("f_raiser"), openBB: +v("f_open") || 2.5,
    decisionStreet, potBB: +v("f_pot") || 5.5,
    actions,
    flop: { suit: v("fl_suit"), pair: v("fl_pair"), conn: v("fl_conn"), high: v("fl_high") },
    handConnection: v("f_conn"),
    answers, hands: []
  };
  scenarios.push(scn); persist();
  active = scn; renderDetail();
}

/* ============================ DETAIL VIEW ============================== */
function renderDetail() {
  current = null; addState = "idle";
  const s = active;
  root().innerHTML =
    `<section class="panel">
      <div class="ahead">
        <div><button class="btn-ghost" id="backBtn">← Scenarios</button></div>
        <div class="ahead__actions">
          <button class="btn-ghost" id="delScnBtn">Delete scenario</button>
        </div>
      </div>
      <h1 class="ahead__title">${esc(s.name)}</h1>
      <p class="amuted">${s.stackDepth} BB · ${s.decisionStreet} decision · Flop: ${flopSummary(s.flop)} · Hand: ${connLabel(s.handConnection)}</p>

      <div class="addhand" id="addPanel"></div>

      <h2 class="panel__title">Hands · <span id="handCount2">${s.hands.length}</span></h2>
      <ul class="hlist" id="handsList"></ul>
    </section>`;

  document.getElementById("backBtn").addEventListener("click", renderList);
  document.getElementById("delScnBtn").addEventListener("click", () => {
    if (!confirm("Delete this scenario and its hands?")) return;
    scenarios = scenarios.filter(x => x !== s); persist(); renderList();
  });
  renderAddPanel();
  renderHandsList();
}

function renderAddPanel() {
  const el = document.getElementById("addPanel");
  if (addState === "idle") {
    el.innerHTML = `<button class="btn-primary" id="genBtn">+ Add hand (generate)</button>`;
    document.getElementById("genBtn").addEventListener("click", generate);
    return;
  }
  if (addState === "preview") {
    el.innerHTML =
      `<div class="preview">
        <div class="table table--sm" id="adminTable"></div>
        <div class="preview__meta" id="previewMeta"></div>
        <div class="preview__actions">
          <button class="btn-ghost" id="skipBtn">↻ Skip</button>
          <button class="btn-primary" id="useBtn">Use this hand ↓</button>
        </div>
      </div>`;
    renderTable(spotFor(current), document.getElementById("adminTable"));
    document.getElementById("previewMeta").innerHTML =
      `Hero ${handLabelHTML(current.hero)} · board ${current.board.map(cardLabelHTML).join(" ")} ` +
      `· <b>${connLabel(active.handConnection)}</b>`;
    document.getElementById("skipBtn").addEventListener("click", generate);
    document.getElementById("useBtn").addEventListener("click", () => { addState = "grade"; renderAddPanel(); });
    return;
  }
  // grade
  const grades = GRADES.map(g => `<option value="${g.v}">${g.label} (${g.hint})</option>`).join("");
  el.innerHTML =
    `<div class="preview"><div class="table table--sm" id="adminTable"></div>
       <div class="preview__meta" id="previewMeta"></div></div>
     <div class="grade">
       <p class="grade__hint">Grade each option and tick GTO&nbsp;✅ where sound, then write the feedback.</p>
       <div class="grade__rows" id="gradeRows">${active.answers.map((a, i) =>
         `<div class="grade-row" data-i="${i}">
            <span class="grade-row__code"><b>${esc(a.code)}</b><small>${esc(a.label)}</small></span>
            <select class="grade-row__sel"><option value="">— grade —</option>${grades}</select>
            <label class="grade-row__gto"><input type="checkbox" class="gto-box"/> GTO&nbsp;✅</label>
            <span class="grade-row__swatch"></span>
          </div>`).join("")}</div>
       <label class="field"><span>Coach feedback</span><textarea id="feedbackInput" rows="5"></textarea></label>
       <div class="grade__save">
         <span class="grade__error" id="gradeErr" hidden></span>
         <button class="btn-ghost" id="skip2Btn">↻ Skip</button>
         <button class="btn-primary" id="saveHandBtn">Save hand</button>
       </div>
     </div>`;
  renderTable(spotFor(current), document.getElementById("adminTable"));
  document.getElementById("previewMeta").innerHTML =
    `Hero ${handLabelHTML(current.hero)} · board ${current.board.map(cardLabelHTML).join(" ")}`;
  el.querySelectorAll(".grade-row__sel").forEach(sel =>
    sel.addEventListener("change", () => {
      sel.closest(".grade-row").querySelector(".grade-row__swatch").className =
        "grade-row__swatch" + (sel.value ? " score-" + sel.value : "");
    }));
  document.getElementById("skip2Btn").addEventListener("click", generate);
  document.getElementById("saveHandBtn").addEventListener("click", saveHand);
}

function spotFor(hand) {
  return { potBB: active.potBB, openBB: active.openBB, hero: { pos: active.heroPos, cards: hand.hero }, raiserPos: active.raiserPos, board: hand.board };
}

function generate() {
  const res = generateConstrainedHand(active, 8000);
  if (!res) {
    addState = "idle"; renderAddPanel();
    alert("Couldn't find a hand matching the flop type + hand connection within the attempt limit. Loosen the constraints.");
    return;
  }
  current = res; addState = "preview"; renderAddPanel();
}

function saveHand() {
  const rows = [...document.querySelectorAll(".grade-row")];
  const missing = [];
  const options = active.answers.map((a, i) => {
    const row = rows[i];
    const score = row.querySelector(".grade-row__sel").value;
    if (!score) missing.push(a.code);
    return { id: "ABCD".charAt(i) || "o" + i, code: a.code, label: a.label, sub: a.sub, score: score || null, gto: row.querySelector(".gto-box").checked };
  });
  const feedback = document.getElementById("feedbackInput").value.trim();
  const err = document.getElementById("gradeErr");
  if (missing.length || !feedback) {
    err.textContent = "Please " + [missing.length ? "grade " + missing.join(", ") : "", feedback ? "" : "write feedback"].filter(Boolean).join(" and ") + ".";
    err.hidden = false; return;
  }
  active.hands.push({
    id: "hand-" + Date.now().toString(36),
    hero: { pos: active.heroPos, cards: current.hero },
    board: current.board, options, feedback, author: "Pete Clarke"
  });
  persist();
  addState = "idle"; current = null;
  document.getElementById("handCount2").textContent = active.hands.length;
  renderAddPanel(); renderHandsList();
}

function renderHandsList() {
  const list = document.getElementById("handsList");
  if (!active.hands.length) { list.innerHTML = `<li class="amuted">No hands yet.</li>`; return; }
  list.innerHTML = active.hands.map((h, i) => {
    const best = h.options.filter(o => o.score === "best").map(o => o.code).join(", ") || "—";
    return `<li class="hrow">
      <span class="hrow__n">${i + 1}</span>
      <span class="hrow__hand">${handLabelHTML(h.hero.cards)} · ${h.board.map(cardLabelHTML).join(" ")}</span>
      <span class="hrow__best">best: ${best}</span>
      <button class="hrow__del" data-id="${h.id}" title="Delete">✕</button></li>`;
  }).join("");
  list.querySelectorAll(".hrow__del").forEach(b =>
    b.addEventListener("click", () => {
      active.hands = active.hands.filter(h => h.id !== b.dataset.id); persist();
      document.getElementById("handCount2").textContent = active.hands.length;
      renderHandsList();
    }));
}

/* ============================ misc ===================================== */
function downloadBackup() {
  const blob = new Blob([JSON.stringify(scenarios, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "scenarios.json";
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

async function init() {
  const local = readLocalScenarios();
  scenarios = local && local.length ? local : await fetchPublishedScenarios();
  persist();
  renderList();
}
document.addEventListener("DOMContentLoaded", init);
