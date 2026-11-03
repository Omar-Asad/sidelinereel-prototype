// No-build prototype shell: state in localStorage, hash routing, an event log.
// The screens below are examples of the pattern. Keep the ones the chosen flow
// needs, delete the rest, and add new ones to SCREENS.

const KEY = "sidelinereel-proto";
const clone = (o) => JSON.parse(JSON.stringify(o));
let S = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || clone(window.SEED); }
  catch { return clone(window.SEED); }
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const byId = (list, id) => S[list].find((x) => x.id === id);

function log(msg) {
  const li = document.createElement("li");
  li.textContent = `${new Date().toLocaleTimeString()} · ${msg}`;
  $("#log ol").prepend(li);
}
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}
// Every state change goes through act(), so the log and storage never drift.
function act(msg, fn) { fn(); save(); log(msg); toast(msg); render(); }

const conf = (c) => (c >= 0.85 ? "ok" : c >= 0.6 ? "warn" : "bad");

// ---- Screens ---------------------------------------------------------------

const SCREENS = {
  home: {
    label: "Team",
    view() {
      const t = S.teams[0];
      const pending = S.clips.filter((c) => c.state === "pending").length;
      return `
        <h1>${esc(t.name)}</h1>
        <p class="muted">${esc(S.club.name)} · ${esc(t.coach)}</p>
        <div class="card">
          <span class="stat"><b>${S.players.length}</b>players</span>
          <span class="stat"><b>${S.games.length}</b>games</span>
          <span class="stat"><b>${pending}</b>clips to review</span>
        </div>
        <h2>Games</h2>
        ${S.games.map((g) => `
          <div class="card row">
            <div><strong>vs ${esc(g.opponent)}</strong><div class="muted">${g.date}</div></div>
            <span class="pill ${g.status === "processed" ? "ok" : "warn"}">${g.status}</span>
          </div>`).join("")}`;
    }
  },

  review: {
    label: "Review clips",
    view() {
      const list = S.clips.filter((c) => c.state === "pending");
      if (!list.length) return `<h1>Review clips</h1><div class="card">All caught up.</div>`;
      return `
        <h1>Review clips</h1>
        <p class="muted">Example human-in-the-loop step: the detector proposes, the coach confirms.</p>
        ${list.map((c) => {
          const p = byId("players", c.playerId);
          return `
            <div class="card row">
              <div class="thumb">${esc(c.kind)}</div>
              <div style="flex:1">
                <strong>${p ? esc(p.name) + " #" + p.number : "Unknown player"}</strong>
                <div class="muted">${esc(c.kind)} at ${c.at}</div>
              </div>
              <span class="pill ${conf(c.confidence)}">${Math.round(c.confidence * 100)}% match</span>
              <button data-act="approve" data-id="${c.id}" ${p ? "" : "disabled"}>Approve</button>
              <button class="bad" data-act="reject" data-id="${c.id}">Reject</button>
            </div>`;
        }).join("")}`;
    },
    on: {
      approve: (id) => act(`Approved clip ${id}`, () => (byId("clips", id).state = "approved")),
      reject: (id) => act(`Rejected clip ${id}`, () => (byId("clips", id).state = "rejected"))
    }
  },

  reels: {
    label: "Reels",
    view() {
      return `
        <h1>Player reels</h1>
        ${S.players.map((p) => {
          const n = S.clips.filter((c) => c.playerId === p.id && c.state === "approved").length;
          return `
            <div class="card row">
              <div><strong>${esc(p.name)} #${p.number}</strong>
                <div class="muted">${p.family ? esc(p.family) : "No family contact on file"}</div></div>
              <span class="pill ${n ? "ok" : "bad"}">${n} clip${n === 1 ? "" : "s"}</span>
            </div>`;
        }).join("")}`;
    }
  }
};

// ---- Router and wiring -----------------------------------------------------

function route() { const r = location.hash.slice(2); return SCREENS[r] ? r : "home"; }

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
  if (handler) handler(b.dataset.id);
});
$("#reset").addEventListener("click", () => act("Reset to seed data", () => (S = clone(window.SEED))));
window.addEventListener("hashchange", render);
render();
