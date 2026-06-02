/* ============================================================================
 * Table design exploration — round 4.
 * The frame's orange IS the app background; the green felt IS the table.
 * Hero cards are seated on the orange rail at the bottom, overlapping only the
 * bottom edge of the felt (~10-15%). Everything stays inside the frame.
 * Dedicated renderer; the live trainer is untouched.
 * ==========================================================================*/

const CARROT_SVG =
  '<svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true">' +
  '<g transform="rotate(8 32 32)">' +
  '<path d="M22 26 L42 26 L33 60 Q32 63 31 60 Z" fill="#F47C20"/>' +
  '<path d="M22 26 L42 26 L39 36 L25 36 Z" fill="#E2680F"/>' +
  '<path d="M32 26 C30 16 22 14 18 16 C24 18 26 22 26 26 Z" fill="#3FA34D"/>' +
  '<path d="M32 26 C34 14 42 12 47 15 C40 16 37 21 36 26 Z" fill="#4CAF50"/>' +
  '</g></svg>';

const PERSON_SVG =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' +
  '<circle cx="12" cy="9" r="4.2" fill="#aeb6bd"/>' +
  '<path d="M3.5 21c0-4.4 4-7 8.5-7s8.5 2.6 8.5 7z" fill="#aeb6bd"/></svg>';

const SAMPLE = {
  potBB: 5.5, openBB: 2.5,
  hero: { pos: "BB", cards: ["Ks", "Js"] },
  raiserPos: "CO",
  board: ["8h", "Kd", "7h", "3s"]
};

function villainPod(seat) {
  return (
    `<div class="nt__seat ${seat.slot} ${seat.state}">` +
      `<div class="nt__pod">` +
        `<span class="nt__avatar">${PERSON_SVG}</span>` +
        `<span class="nt__pinfo">` +
          `<span class="nt__pname">${seat.name}<span class="nt__ppos">${seat.pos}</span></span>` +
          `<span class="nt__pstack">${seat.stack}</span>` +
        `</span>` +
      `</div>` +
    `</div>`
  );
}

function renderNT(spot, host) {
  host.classList.add("nt");
  const villains = buildSeats(spot).filter(s => s.slot !== "hero").map(villainPod).join("");

  host.innerHTML =
    `<div class="nt__frame">` +
      `<div class="nt__felt"></div>` +
      `<div class="nt__pot">Pot <b>${spot.potBB} BB</b></div>` +
      `<div class="nt__board"></div>` +
      `<div class="nt__brand">${CARROT_SVG}<span>CARROT&nbsp;CORNER</span></div>` +
      villains +
      `<div class="nt__dealer">D</div>` +
      `<div class="nt__hero">` +
        `<div class="nt__hero-cards"></div>` +
        `<div class="nt__hero-pod">` +
          `<span class="nt__avatar">${PERSON_SVG}</span>` +
          `<span class="nt__pinfo">` +
            `<span class="nt__pname">Hero<span class="nt__ppos">BB</span></span>` +
            `<span class="nt__pstack">100 BB</span>` +
          `</span>` +
        `</div>` +
      `</div>` +
    `</div>`;

  const board = host.querySelector(".nt__board");
  spot.board.forEach(c => board.appendChild(cardEl(c)));
  const hc = host.querySelector(".nt__hero-cards");
  spot.hero.cards.forEach(c => hc.appendChild(cardEl(c)));
}

async function getSpot() {
  try {
    const r = await fetch("spots.json", { cache: "no-store" });
    const d = await r.json();
    if (Array.isArray(d) && d[0]) return d[0];
  } catch { /* fall through */ }
  return SAMPLE;
}

document.addEventListener("DOMContentLoaded", async () => {
  const spot = await getSpot();
  document.querySelectorAll(".variation .table").forEach(el => renderNT(spot, el));
});
