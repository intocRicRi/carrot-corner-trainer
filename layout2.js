/* ============================================================================
 * Layout v2 — banner (theme + hand nav) · compact HUD · answer row (no keys).
 * Shown answered, in a simulated screen, to prove the no-scroll fit.
 * Scratch page; the trainer is untouched.
 * ==========================================================================*/

const PICKED = "C";

const S = {
  potBB: 5.5, openBB: 2.5, hero: { pos: "BB", cards: ["Ks", "Js"] }, raiserPos: "CO",
  board: ["8h", "Kd", "7h", "3s"],
  options: [
    { id: "A", code: "Check", sub: "pot control", score: "okay", gto: true },
    { id: "B", code: "B33",   sub: "≈ 1.8 BB",    score: "okay", gto: true },
    { id: "C", code: "B75",   sub: "≈ 4.1 BB",    score: "best", gto: true },
    { id: "D", code: "B150",  sub: "≈ 8.3 BB",    score: "best", gto: true }
  ],
  feedback: "In theory all options are okay. In practice a small bet underperforms — the pool rarely raises this node and is capped/condensed after checking the flop (8x, 7x, 99–QQ, weak top pair over-represented). So B75 and B150 are best; X/B33 underperform from lack of aggression on later streets.",
  author: "Pete Clarke"
};

function answersHTML(s) {
  return s.options.map(o =>
    `<button class="ans ${o.score ? "score-" + o.score : ""} ${o.id === PICKED ? "picked" : ""}" disabled>` +
      `<span class="ans__gto ${o.gto ? "show" : ""}">GTO&nbsp;✅</span>` +
      `<span class="ans__code">${o.code}</span>` +
      `<span class="ans__sub">${o.sub}</span>` +
      (o.id === PICKED ? `<span class="ans__pick">YOUR PICK</span>` : "") +
    `</button>`).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".v2").forEach(v => {
    renderTable(S, v.querySelector(".table"));
    v.querySelector(".v2__answers").innerHTML = answersHTML(S);
    v.querySelector(".v2__fbtext").textContent = S.feedback;
    v.querySelector(".v2__author").textContent = S.author;
  });
});
