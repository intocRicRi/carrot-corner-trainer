/* ============================================================================
 * Carrot Corner Trainer — app logic
 * Renders a spot (table + quiz) from data and handles answer feedback.
 * ==========================================================================*/

const SUITS = {
  h: { sym: "♥", cls: "red"  },
  d: { sym: "♦", cls: "red"  },
  s: { sym: "♠", cls: "dark" },
  c: { sym: "♣", cls: "dark" }
};

const RANK_DISPLAY = { T: "10" };

function rankOf(card) { const r = card.slice(0, -1); return RANK_DISPLAY[r] || r; }
function suitOf(card) { return SUITS[card.slice(-1)]; }

/** Build a playing-card element. */
function cardEl(card, { hole = false } = {}) {
  const suit = suitOf(card);
  const el = document.createElement("div");
  el.className = `card ${suit.cls}`;
  el.innerHTML =
    `<span class="r">${rankOf(card)}</span>` +
    `<span class="s">${suit.sym}</span>` +
    `<span class="pip">${suit.sym}</span>`;
  return el;
}

/** Render the felt table for a spot. */
function renderTable(spot) {
  const table = document.getElementById("table");
  table.innerHTML = "";

  const felt = document.createElement("div");
  felt.className = "felt";
  felt.innerHTML = `<div class="felt__mark">CARROT&nbsp;CORNER</div>`;
  table.appendChild(felt);

  // pot pill
  const pot = document.createElement("div");
  pot.className = "pot";
  pot.innerHTML = `Pot: <small>${spot.potBB} BB</small>`;
  table.appendChild(pot);

  // board cards
  const board = document.createElement("div");
  board.className = "board";
  spot.board.forEach(c => board.appendChild(cardEl(c)));
  table.appendChild(board);

  // pot chips marker
  const chips = document.createElement("div");
  chips.className = "potchips";
  chips.textContent = `${spot.potBB} BB`;
  table.appendChild(chips);

  // seats
  spot.seats.forEach(seat => {
    const el = document.createElement("div");
    el.className = `seat ${seat.slot} ${seat.state}`;
    const pod = document.createElement("div");
    pod.className = "seat__pod";
    pod.innerHTML =
      `<div class="seat__name">${seat.name}<span class="seat__pos">${seat.pos}</span></div>` +
      `<div class="seat__stack">${seat.stack}</div>` +
      (seat.note ? `<div class="seat__note">${seat.note}</div>` : "");

    // hero shows hole cards above the pod
    if (seat.slot === "hero") {
      const hc = document.createElement("div");
      hc.className = "holecards";
      spot.hero.cards.forEach(c => hc.appendChild(cardEl(c, { hole: true })));
      el.appendChild(hc);
    }
    el.appendChild(pod);
    table.appendChild(el);
  });

  // dealer button near the BTN seat
  const btn = spot.seats.find(s => s.pos === "BTN");
  if (btn) {
    const d = document.createElement("div");
    d.className = "dealer";
    d.textContent = "D";
    // anchor it roughly inside the felt toward the BTN seat
    d.style.left = "76%";
    d.style.top = "62%";
    table.appendChild(d);
  }

  document.getElementById("caption").textContent =
    `${spot.hero.pos} · ${spot.hero.cards.map(c => rankOf(c) + suitOf(c).sym).join(" ")} · Turn decision`;
}

/** Render the quiz portion. */
function renderQuiz(spot) {
  document.getElementById("title").textContent = spot.title;
  document.getElementById("stakes").textContent = `${spot.stakes} · ${spot.effective}`;
  document.getElementById("question").textContent = spot.question;
  document.getElementById("author").textContent = spot.author;
  document.getElementById("feedbackText").textContent = spot.feedback;

  const desc = document.getElementById("description");
  desc.innerHTML = spot.description.map(line => `<p>${line}</p>`).join("");

  const wrap = document.getElementById("options");
  wrap.innerHTML = "";
  spot.options.forEach(opt => {
    const b = document.createElement("button");
    b.className = "option";
    b.dataset.id = opt.id;
    b.dataset.score = opt.score;
    b.innerHTML =
      `<span class="option__gto${opt.gto ? "" : " no-gto"}">GTO&nbsp;✅</span>` +
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
}

/** Reveal scoring after the student answers. */
function reveal(spot, pickedId) {
  const wrap = document.getElementById("options");
  if (wrap.classList.contains("answered")) return;
  wrap.classList.add("answered");

  spot.options.forEach(opt => {
    const b = wrap.querySelector(`[data-id="${opt.id}"]`);
    b.disabled = true;
    b.classList.add(`score-${opt.score}`);
    if (opt.id === pickedId) b.classList.add("picked");
    if (opt.gto) b.querySelector(".option__gto").classList.add("show");
  });

  document.getElementById("legend").hidden = false;
  document.getElementById("feedback").hidden = false;
  document.getElementById("feedback").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function start(spot) {
  renderTable(spot);
  renderQuiz(spot);
  document.getElementById("reset").addEventListener("click", () => start(spot), { once: true });
}

document.addEventListener("DOMContentLoaded", () => start(SPOTS[0]));
