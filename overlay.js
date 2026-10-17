import { matchRef, onValue, DEFAULT_MATCH_ID, isFirebaseConfigured } from "./firebase.js";
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const matchId = (params.get("match") || DEFAULT_MATCH_ID).trim();
let state = null, previousState = null;
const hideTimers = { A: null, B: null };

function safeClock(s) {
  s = Math.max(0, Math.floor(s || 0));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function left(kind) {
  if (!state) return 0;
  const m = state.match || {}, raid = kind === "raid";
  const total = raid ? m.raidSeconds : m.clockSeconds;
  const running = raid ? m.raidRunning : m.clockRunning;
  const started = raid ? m.raidStartedAt : m.clockStartedAt;
  return Math.max(0, (total || 0) - (running ? Math.floor((Date.now() - started) / 1000) : 0));
}
function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : fallback;
}
function logo(id, url, letter) {
  const el = $(id);
  if (url) { const img = document.createElement("img"); img.src = String(url); img.alt = ""; el.replaceChildren(img); }
  else el.textContent = letter;
}
function announcePoint(team, message, color) {
  const el = $(`point${team}`);
  if (!el || !message) return;
  if (hideTimers[team]) clearTimeout(hideTimers[team]);
  el.textContent = message;
  el.style.background = color || "#ffd15e";
  el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
  hideTimers[team] = setTimeout(() => { el.classList.remove("show"); el.textContent = ""; hideTimers[team] = null; }, 800);
}
function pointLabel(next, team) {
  const history = Array.isArray(next.history) ? next.history : [];
  const last = history[history.length - 1];
  if (!last?.label) return null;
  const teamName = next.teams?.[team]?.name || `TEAM ${team}`;
  const label = String(last.label);
  if (!label.startsWith(`${teamName}:`)) return null;
  const action = label.slice(teamName.length + 1).trim();
  const patterns = [
    [/^Raid\s+\+\d+/i, "RAID"], [/^Bonus\s+\+\d+/i, "BONUS"],
    [/^Tackle\s+\+\d+/i, "TACKLE"], [/^Super tackle\s+\+\d+/i, "SUPER TACKLE"],
    [/^All out\s+\+\d+/i, "ALL OUT"]
  ];
  for (const [pattern, name] of patterns) {
    if (pattern.test(action)) return `${name} ${action.match(/\+\d+/)?.[0] || "+1"} • ${teamName}`;
  }
  return null;
}
function detectPoints(next) {
  if (!previousState || !next.teams || !previousState.teams) return;
  for (const team of ["A", "B"]) {
    const before = Number(previousState.teams?.[team]?.score || 0);
    const after = Number(next.teams?.[team]?.score || 0);
    if (after > before) {
      const delta = after - before;
      const color = safeColor(next.teams?.[team]?.color, team === "A" ? "#e13a43" : "#2474e8");
      const msg = pointLabel(next, team) || `+${delta} POINT${delta === 1 ? "" : "S"} • ${next.teams?.[team]?.name || `TEAM ${team}`}`;
      announcePoint(team, msg, color);
      const score = $(`score${team}`);
      if (score) { score.classList.remove("score-pop"); void score.offsetWidth; score.classList.add("score-pop"); setTimeout(() => score.classList.remove("score-pop"), 450); }
    }
  }
}
function render() {
  if (!state) return;
  const teams = state.teams || {}, a = teams.A || {}, b = teams.B || {}, m = state.match || {}, meta = state.meta || {};
  $("league").textContent = meta.leagueName || "PALWAS KABADDI LEAGUE";
  $("matchTitle").textContent = meta.matchTitle || "MATCH 01"; $("venue").textContent = meta.venue || "";
  $("nameA").textContent = a.name || "TEAM A"; $("nameB").textContent = b.name || "TEAM B";
  $("scoreA").textContent = String(Number(a.score || 0)).padStart(2, "0"); $("scoreB").textContent = String(Number(b.score || 0)).padStart(2, "0");
  $("timeoutA").textContent = `TIMEOUTS ${Number(a.timeouts || 0)}`; $("timeoutB").textContent = `TIMEOUTS ${Number(b.timeouts || 0)}`;
  $("sideA").style.setProperty("--team-color", safeColor(a.color, "#e13a43"));
  $("sideB").style.setProperty("--team-color", safeColor(b.color, "#2474e8"));
  logo("logoA", a.logo, "A"); logo("logoB", b.logo, "B");
  $("half").textContent = Number(m.half || 1) === 1 ? "1ST HALF" : Number(m.half) === 2 ? "2ND HALF" : `HALF ${m.half}`;
  $("status").textContent = m.status || "READY"; $("liveBadge").style.display = m.status === "LIVE" ? "flex" : "none";
  $("matchClock").textContent = safeClock(left("match")); $("raidClock").textContent = `RAID ${String(left("raid")).padStart(2, "0")}`;
  $("overlayError").classList.remove("show");
}
if (!isFirebaseConfigured()) {
  $("overlayError").textContent = "Firebase is not configured. Read README.md."; $("overlayError").classList.add("show");
} else {
  onValue(matchRef(matchId), snap => {
    if (!snap.exists()) { $("overlayError").textContent = "Match not found. Open Admin and initialize this Match ID."; $("overlayError").classList.add("show"); return; }
    const next = snap.val();
    detectPoints(next);
    previousState = JSON.parse(JSON.stringify(next));
    state = next; render();
  }, err => { $("overlayError").textContent = "Connection error: " + err.message; $("overlayError").classList.add("show"); });
  setInterval(() => { if (state) { $("matchClock").textContent = safeClock(left("match")); $("raidClock").textContent = `RAID ${String(left("raid")).padStart(2, "0")}`; } }, 250);
}
