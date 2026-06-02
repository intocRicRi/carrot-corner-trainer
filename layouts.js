/* ============================================================================
 * Page-layout exploration — 4 ways to distribute table + decision + coach so
 * the feedback shows without scrolling. Each demo is rendered in the ANSWERED
 * state (as if the student picked B75). Scratch page; the trainer is untouched.
 * ==========================================================================*/

const PICKED = "C"; // pretend the student chose B75

const SAMPLE = {
  title: "Turn Probe Opportunity", stakes: "NLHE 6-max", effective: "Effective stacks ≈ 100 BB",
  potBB: 5.5, openBB: 2.5, hero: { pos: "BB", cards: ["Ks", "Js"] }, raiserPos: "CO",
  board: ["8h", "Kd", "7h", "3s"],
  streets: [
    { label: "Hero · BB", value: '<span class="suit-s">♠K</span> <span class="suit-s">♠J</span>' },
    { label: "Preflop", value: "CO opens 2.5 BB · Hero calls" },
    { label: 'Flop <span class="suit-h">♥8</span> <span class="suit-d">♦K</span> <span class="suit-h">♥7</span>', value: "check / check" },
    { label: 'Turn <span class="suit-s">♠3</span>', value: "Hero to act", active: true }
  ],
  question: "What is your play?",
  options: [
    { id: "A", code: "X",    label: "Check",            sub: "pot control", score: "okay", gto: true },
    { id: "B", code: "B33",  label: "Bet 33% pot",      sub: "≈ 1.8 BB", score: "okay", gto: true },
    { id: "C", code: "B75",  label: "Bet 75% pot",      sub: "≈ 4.1 BB", score: "best", gto: true },
    { id: "D", code: "B150", label: "Overbet 150% pot", sub: "≈ 8.3 BB", score: "best", gto: true }
  ],
  feedback: "In theory all options are okay. In practice a small bet underperforms — the pool rarely raises this node and is capped/condensed after checking the flop (8x, 7x, 99–QQ, weak top pair over-represented). So B75 and B150 are best; X/B33 underperform from lack of aggression on later streets.",
  author: "Pete Clarke"
};

const GR = [["best","Best"],["good","Good"],["okay","OK"],["mistake","Mistake"],["horrible","Blunder"]];

function headHTML(s) {
  return `<div class="quiz__head"><h2 class="quiz__title">${s.title}</h2>` +
    `<span class="quiz__progress">Spot 1 / 1</span></div>` +
    `<p class="quiz__stakes">${s.stakes} · ${s.effective}</p>`;
}
function streetsHTML(s) {
  return `<div class="streets">` + s.streets.map(t =>
    `<div class="street${t.active ? " active" : ""}"><span class="street__label">${t.label}</span>` +
    `<span class="street__val">${t.value}</span></div>`).join("") + `</div>`;
}
function questionHTML(s) { return `<p class="question">${s.question}</p>`; }
function optionsHTML(s) {
  return `<div class="options answered">` + s.options.map(o =>
    `<button class="option ${o.score ? "score-" + o.score : ""} ${o.id === PICKED ? "picked" : ""}" disabled>` +
      `<span class="option__gto ${o.gto ? "show" : ""}">GTO&nbsp;✅</span>` +
      `<span class="option__key">${o.id}</span>` +
      `<span class="option__body"><span class="option__code">${o.code}</span>` +
        `<span class="option__label">${o.label}</span>` +
        (o.sub ? `<span class="option__sub">${o.sub}</span>` : "") + `</span>` +
      `<span class="option__pick">YOUR PICK</span></button>`).join("") + `</div>`;
}
function legendHTML() {
  return `<div class="legend">` + GR.map(([k, l]) =>
    `<span class="legend__item"><i class="dot s-${k}"></i>${l}</span>`).join("") +
    `<span class="legend__item"><i class="gto-chip">GTO&nbsp;✅</i>In theory</span></div>`;
}
function feedbackHTML(s) {
  return `<div class="feedback ld__fb">` +
    `<div class="feedback__author"><span class="feedback__avatar">PC</span>` +
      `<span class="feedback__name">${s.author}</span>` +
      `<span class="feedback__role">Coach feedback</span></div>` +
    `<p class="feedback__text">${s.feedback}</p>` +
    `<div class="feedback__actions"><button class="btn-ghost">Try again</button>` +
      `<button class="btn-primary">Next hand →</button></div></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const s = SAMPLE;
  document.querySelectorAll(".layoutdemo").forEach(demo => {
    renderTable(s, demo.querySelector(".ld__table"));
    const decision = demo.querySelector(".ld__decision");
    const coach = demo.querySelector(".ld__coach");

    if (demo.classList.contains("C")) {
      // in-place: feedback takes the action-shorthand spot
      decision.innerHTML = headHTML(s) + feedbackHTML(s) + questionHTML(s) + optionsHTML(s);
    } else {
      decision.innerHTML = headHTML(s) + streetsHTML(s) + questionHTML(s) + optionsHTML(s);
      if (coach) coach.innerHTML = legendHTML() + feedbackHTML(s);
    }
  });
});
