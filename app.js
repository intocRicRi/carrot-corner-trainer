/* ============================================================================
 * Carrot Corner Trainer — trainer logic
 * Loads the deck, shows a count, plays spots one at a time with colour reveal.
 * ==========================================================================*/

let DECK = [];
let index = 0;

async function loadDeck() {
  const local = readLocalDeck();
  if (local && local.length) return local;   // drafts on this browser
  return await fetchPublishedDeck();          // committed spots.json
}

/* Compact hand-history shorthand (falls back to old prose if needed). */
function renderAction(spot) {
  const el = document.getElementById("action");
  if (Array.isArray(spot.streets)) {
    el.innerHTML = spot.streets.map(s =>
      `<div class="street${s.active ? " active" : ""}">` +
        `<span class="street__label">${s.label}</span>` +
        `<span class="street__val">${s.value}</span>` +
      `</div>`).join("");
  } else if (Array.isArray(spot.description)) {
    el.innerHTML = spot.description.map(line => `<p>${line}</p>`).join("");
  } else {
    el.innerHTML = "";
  }
}

function renderSpot(spot) {
  // table
  renderTable(spot, document.getElementById("table"));

  // quiz text
  document.getElementById("title").textContent = spot.title;
  document.getElementById("stakes").textContent = `${spot.stakes} · ${spot.effective}`;
  document.getElementById("question").innerHTML = spot.question;
  document.getElementById("author").textContent = spot.author || "Coach";
  document.getElementById("feedbackText").textContent = spot.feedback;
  document.getElementById("progress").textContent = `Spot ${index + 1} / ${DECK.length}`;

  renderAction(spot);

  // options
  const wrap = document.getElementById("options");
  wrap.className = "options";
  wrap.innerHTML = "";
  spot.options.forEach(opt => {
    const b = document.createElement("button");
    b.className = "option";
    b.dataset.id = opt.id;
    b.innerHTML =
      `<span class="option__gto">GTO&nbsp;✅</span>` +
      `<span class="option__key">${opt.id}</span>` +
      `<span class="option__body">` +
        `<span class="option__code">${opt.code}</span>` +
        `<span class="option__label">${opt.label}</span>` +
        (opt.sub ? `<span class="option__sub">${opt.sub}</span>` : "") +
      `</span>` +
      `<span class="option__pick">YOUR PICK</span>`;
    b.addEventListener("click", () => reveal(spot, opt.id));
    wrap.appendChild(b);
  });

  // reset reveal state
  document.getElementById("legend").hidden = true;
  document.getElementById("feedback").hidden = true;
}

function reveal(spot, pickedId) {
  const wrap = document.getElementById("options");
  if (wrap.classList.contains("answered")) return;
  wrap.classList.add("answered");

  spot.options.forEach(opt => {
    const b = wrap.querySelector(`[data-id="${opt.id}"]`);
    b.disabled = true;
    if (opt.score) b.classList.add(`score-${opt.score}`);
    if (opt.id === pickedId) b.classList.add("picked");
    if (opt.gto) b.querySelector(".option__gto").classList.add("show");
  });

  document.getElementById("legend").hidden = false;
  document.getElementById("feedback").hidden = false;
  document.getElementById("feedback").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function show(i) {
  index = (i + DECK.length) % DECK.length;
  renderSpot(DECK[index]);
}

function updateCount() {
  document.getElementById("deckCount").textContent =
    `${DECK.length} hand${DECK.length === 1 ? "" : "s"}`;
}

async function init() {
  DECK = await loadDeck();
  updateCount();

  const empty = document.getElementById("empty");
  const layout = document.getElementById("layout");
  if (!DECK.length) {
    empty.hidden = false;
    layout.hidden = true;
    return;
  }
  empty.hidden = true;
  layout.hidden = false;

  document.getElementById("retry").addEventListener("click", () => show(index));
  document.getElementById("next").addEventListener("click", () => show(index + 1));

  show(0);
}

document.addEventListener("DOMContentLoaded", init);
