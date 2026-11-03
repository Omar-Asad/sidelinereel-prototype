// SidelineReel: confusable-number confirmation. No build step.
// Implements spec rules R-01 (confusable pairs), R-02 (routing), R-07 (cut-off),
// R-08 (thumbnail) and R-09 ("Not my kid") on fictional data.

const KEY = "sidelinereel-confirm-v1";
const clone = (o) => JSON.parse(JSON.stringify(o));
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---- Rules -----------------------------------------------------------------

// R-01: one digit added or removed (4/14), or two digits swapped (12/21).
function confusable(a, b) {
  const x = String(a), y = String(b);
  if (x === y) return false;
  const [s, l] = x.length < y.length ? [x, y] : [y, x];
  if (l.length - s.length === 1) {
    for (let i = 0; i < l.length; i++) if (l.slice(0, i) + l.slice(i + 1) === s) return true;
  }
  return x.length === 2 && y.length === 2 && x === [...y].reverse().join("");
}

function seedState() {
  const st = clone(window.SEED);
  st.reports = 0;
  st.cutoffRun = false;
  st.clips.forEach((c) => {
    // R-02: queue only uncertain matches on a player who has a confusable partner.
    if (partners(st, c.match).length && c.confidence < st.threshold) {
      c.status = "queued"; c.assigned = null;
    } else {
      c.status = "auto"; c.assigned = c.match;
    }
  });
  return st;
}

function partners(st, playerId) {
  const p = st.players.find((x) => x.id === playerId);
  return p ? st.players.filter((o) => confusable(p.number, o.number)) : [];
}

function pairs(st) {
  const out = [];
  st.players.forEach((a, i) => st.players.slice(i + 1).forEach((b) => {
    if (confusable(a.number, b.number)) out.push([a, b].sort((m, n) => m.number - n.number));
  }));
  return out.sort((m, n) => m[0].number - n[0].number);
}

// ---- State -----------------------------------------------------------------

let S = load();
function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || seedState(); } catch { return seedState(); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

const player = (id) => S.players.find((p) => p.id === id);
const label = (p) => (p ? `#${p.number} ${p.name}` : "Unassigned");
const clip = (id) => S.clips.find((c) => c.id === id);
const inReel = (c) => c.assigned && (c.status === "auto" || c.status === "confirmed");

function log(msg) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} · ${msg}`;
  $("#log ol").prepend(li);
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}
function act(msg, fn) { fn(); save(); log(msg); toast(msg); render(); }

const pill = (c) => (c >= 0.85 ? "ok" : c >= 0.6 ? "warn" : "bad");
const thumb = (c, blur) => `<div class="thumb">${blur ? "#?" : esc(c.kind)}</div>`;

// ---- Screens ---------------------------------------------------------------

const SCREENS = {
  queue: {
    label: "1 · Coach confirms",
    view() {
      const q = S.clips.filter((c) => c.status === "queued");
      const pr = pairs(S).map(([a, b]) => `<span class="pill">${a.number} · ${b.number}</span>`).join(" ");
      return `
        <h1>${esc(S.team.coach)}: confirm before the recap</h1>
        <p class="muted">${esc(S.team.name)} · weekly recap builds ${esc(S.team.recapCutoff)}</p>
        <div class="card"><strong>Look-alike numbers on this roster</strong>
          <div class="muted" style="margin-top:6px">${pr || "None"}</div>
          <div class="muted" style="margin-top:6px">Only uncertain clips on these numbers come here (below ${Math.round(S.threshold * 100)}% match). Everything else goes straight to reels, as today.</div>
        </div>
        <h2>${q.length ? `${q.length} clip${q.length === 1 ? "" : "s"} need${q.length === 1 ? "s" : ""} one tap` : "All confirmed"}</h2>
        ${q.length ? "" : `<div class="card">Nothing waiting. Every clip is in the right reel.</div>`}
        ${q.map((c) => {
          const guess = player(c.match);
          const cands = c.reported ? S.players : [guess, ...partners(S, c.match)];
          return `
            <div class="card">
              <div class="row">
                ${thumb(c, true)}
                <div style="flex:1">
                  <strong>Who is this? ${esc(c.kind)} at ${c.at}</strong>
                  <div class="muted">${c.reported ? "A parent tapped “Not my kid”" : `Model guessed ${esc(label(guess))}`} <span class="pill ${pill(c.confidence)}">${Math.round(c.confidence * 100)}% match</span></div>
                </div>
              </div>
              <div class="choices">
                ${cands.map((p) => `<button data-act="assign" data-id="${c.id}" data-p="${p.id}">${esc(label(p))}</button>`).join("")}
                <button class="ghost" data-act="neither" data-id="${c.id}">Neither</button>
              </div>
            </div>`;
        }).join("")}`;
    },
    on: {
      assign: (id, p) => act(`Coach assigned clip ${id} to ${label(player(p))}`, () => {
        Object.assign(clip(id), { status: "confirmed", assigned: p });
      }),
      neither: (id) => act(`Coach marked clip ${id} as neither`, () => {
        Object.assign(clip(id), { status: "neither", assigned: null });
      })
    }
  },

  reel: {
    label: "2 · Parent's reel",
    view() {
      const kid = player(S.viewing) || player("p14");
      const mine = S.clips.filter((c) => inReel(c) && c.assigned === kid.id);
      const waiting = S.clips.filter((c) => c.status === "queued" && (c.match === kid.id || partners(S, c.match).some((p) => p.id === kid.id))).length;
      return `
        <h1>${esc(kid.name)}'s reel</h1>
        <p class="muted">Viewing as the family of
          <select id="kid">${S.players.map((p) => `<option value="${p.id}" ${p.id === kid.id ? "selected" : ""}>${esc(label(p))}</option>`).join("")}</select>
        </p>
        <div class="card row">
          ${mine[0] ? thumb(mine[0]) : `<div class="thumb">—</div>`}
          <div style="flex:1"><strong>This week's reel</strong>
            <div class="muted">Thumbnail uses a confirmed clip only${waiting ? ` · ${waiting} look-alike clip${waiting === 1 ? "" : "s"} still with the coach, not shown` : ""}</div></div>
          <span class="pill ${mine.length ? "ok" : "warn"}">${mine.length} clip${mine.length === 1 ? "" : "s"}</span>
        </div>
        ${mine.map((c) => `
          <div class="card row">
            ${thumb(c)}
            <div style="flex:1"><strong>${esc(c.kind)}</strong><div class="muted">${c.at} · ${c.status === "confirmed" ? "confirmed by coach" : "auto-tagged"}</div></div>
            <button class="bad" data-act="notmine" data-id="${c.id}">Not my kid</button>
          </div>`).join("")}
        ${mine.length ? "" : `<div class="card muted">No clips yet this week.</div>`}`;
    },
    on: {
      notmine: (id) => act(`Parent reported clip ${id}: “Not my kid”. Back to the coach.`, () => {
        Object.assign(clip(id), { status: "queued", assigned: null, reported: true });
        S.reports += 1;
      })
    }
  },

  health: {
    label: "3 · Recap & health",
    view() {
      const count = (s) => S.clips.filter((c) => c.status === s).length;
      const delivered = S.clips.filter(inReel).length;
      const rate = delivered ? Math.round((S.reports / delivered) * 1000) : 0;
      const stat = (n, t) => `<span class="stat"><b>${n}</b>${t}</span>`;
      return `
        <h1>Recap cut-off and product health</h1>
        <div class="card">
          ${stat(count("auto"), "auto-tagged")}
          ${stat(count("queued"), "waiting on coach")}
          ${stat(count("confirmed"), "coach-confirmed")}
          ${stat(count("held"), "held at cut-off")}
          ${stat(S.reports, "“Not my kid”")}
          ${stat(rate, "wrong-kid per 1,000 delivered")}
        </div>
        <div class="row" style="margin:10px 0">
          <span class="muted">At cut-off, unconfirmed clips are left out of personal reels and shown unnamed in the team recap.</span>
          <button data-act="cutoff" ${S.cutoffRun ? "disabled" : ""}>Run recap cut-off</button>
        </div>
        <h2>Team recap</h2>
        ${S.clips.filter((c) => inReel(c) || c.status === "held").map((c) => `
          <div class="card row">
            ${thumb(c)}
            <div style="flex:1"><strong>${esc(c.kind)} · ${c.at}</strong></div>
            <span class="pill ${c.status === "held" ? "warn" : "ok"}">${c.status === "held" ? "Unnamed" : esc(label(player(c.assigned)))}</span>
          </div>`).join("")}`;
    },
    on: {
      cutoff: () => act("Recap cut-off ran: unconfirmed clips held, unnamed in the recap", () => {
        S.clips.forEach((c) => { if (c.status === "queued") c.status = "held"; });
        S.cutoffRun = true;
      })
    }
  }
};

// ---- Router and wiring -----------------------------------------------------

function route() { const r = location.hash.slice(2); return SCREENS[r] ? r : "queue"; }

function render() {
  const r = route();
  $("#nav").innerHTML = Object.entries(SCREENS)
    .map(([k, s]) => `<a href="#/${k}" class="${k === r ? "on" : ""}">${s.label}</a>`).join("");
  $("#app").innerHTML = SCREENS[r].view();
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const handler = SCREENS[route()].on?.[b.dataset.act];
  if (handler) handler(b.dataset.id, b.dataset.p);
});
document.addEventListener("change", (e) => {
  if (e.target.id === "kid") { S.viewing = e.target.value; save(); render(); }
});
$("#reset").addEventListener("click", () => act("Reset to this week's clips", () => (S = seedState())));
window.addEventListener("hashchange", render);
render();
