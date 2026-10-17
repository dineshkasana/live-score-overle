import { auth, matchRef, defaultState, isFirebaseConfigured, signInWithEmailAndPassword, signOut, onAuthStateChanged, onValue, set, ref, db, DEFAULT_MATCH_ID, ADMIN_EMAIL } from "./firebase.js";

const $ = id => document.getElementById(id);
let state = null, matchId = DEFAULT_MATCH_ID, unsubscribe = null, tickHandle = null, currentUser = null, saving = false;
const status = (msg, cls="") => { $("adminStatus").textContent = msg; $("adminStatus").className = `status-line ${cls}`; };
const setConnection = (msg, cls="") => { $("connection").textContent = msg; $("connection").className = `pill ${cls}`; };
const clone = x => JSON.parse(JSON.stringify(x));
function safeClock(seconds) { seconds = Math.max(0, Math.floor(seconds || 0)); return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`; }
function clockLeft(kind) {
  if (!state) return 0;
  const m = state.match;
  const total = kind === "raid" ? m.raidSeconds : m.clockSeconds;
  const running = kind === "raid" ? m.raidRunning : m.clockRunning;
  const started = kind === "raid" ? m.raidStartedAt : m.clockStartedAt;
  return Math.max(0, total - (running ? Math.floor((Date.now() - started)/1000) : 0));
}
function snapshot(label) {
  const copy = clone(state);
  copy.history = Array.isArray(copy.history) ? copy.history : [];
  copy.history.push({ label, at: Date.now() });
  if (copy.history.length > 40) copy.history = copy.history.slice(-40);
  return copy;
}
async function save(next, label, addHistory=true) {
  if (!currentUser) throw new Error("Please sign in first.");
  if (addHistory && state) { const before = clone(state); before.history = []; next.history = [...(state.history || []), { label, at: Date.now(), before }].slice(-25); }
  await set(matchRef(matchId), next);
}
async function act(team, action) {
  if (!state) return;
  if (action === "timeout") {
    const next = clone(state); next.teams[team].timeouts = (next.teams[team].timeouts || 0) + 1;
    await save(next, `${next.teams[team].name}: timeout`, true); return;
  }
  const points = { raid: 1, bonus: 1, tackle: 1, super: 2, allout: 2 }[action];
  const next = clone(state);
  next.teams[team].score = Math.max(0, Number(next.teams[team].score || 0) + points);
  const idx = Number(next.activePlayer[team] || 0);
  if (next.teams[team].players[idx]) next.teams[team].players[idx].points = Number(next.teams[team].players[idx].points || 0) + points;
  const labels = {raid:"Raid",bonus:"Bonus",tackle:"Tackle",super:"Super tackle",allout:"All out"};
  await save(next, `${next.teams[team].name}: ${labels[action]} +${points}`, true);
}
async function loadMatch(id) {
  matchId = id.trim() || DEFAULT_MATCH_ID;
  if (unsubscribe) unsubscribe();
  $("matchId").value = matchId;
  $("overlayLink").value = `${location.origin}${location.pathname.replace(/admin\.html$/, "overlay.html")}?match=${encodeURIComponent(matchId)}`;
  setConnection("CONNECTING");
  const r = matchRef(matchId);
  unsubscribe = onValue(r, async snap => {
    if (!snap.exists()) {
      if (currentUser && !saving) {
        saving = true;
        try { await set(r, defaultState()); } catch(e) { status(e.message, "error"); }
        saving = false;
      }
      return;
    }
    state = snap.val(); render();
    setConnection("CONNECTED", "success");
  }, err => { setConnection("DATABASE ERROR", "error"); status(err.message, "error"); });
}
function renderTeam(team) {
  if (!state) return;
  const t = state.teams[team], letter = team;
  $(`score${team}`).textContent = Number(t.score || 0);
  $(`name${team}`).value = t.name || "";
  $(`logoUrl${team}`).value = t.logo || "";
  $(`color${team}`).value = t.color || (team==="A"?"#e13a43":"#2474e8");
  $(`team${team}Box`).style.setProperty("--team-color", t.color || "#ffca56");
  const logo = $(`logo${team}`);
  if (t.logo) { logo.innerHTML = `<img src="${escapeAttr(t.logo)}" alt="" style="width:100%;height:100%;object-fit:contain;border-radius:12px">`; }
  else { logo.textContent = letter; }
  $(`timeouts${team}`).textContent = `TIMEOUTS ${Number(t.timeouts||0)}`;
  const select = $(`active${team}`); const old = Number(state.activePlayer?.[team] || 0);
  select.innerHTML = (t.players || []).map((p,i)=>`<option value="${i}">${escapeHtml(p.name || `Player ${i+1}`)}</option>`).join("");
  if (t.players?.length) select.value = String(Math.min(old,t.players.length-1));
  $(`players${team}`).innerHTML = (t.players || []).map((p,i)=>`<div class="player-row ${i===old?"active":""}"><span class="pname">${escapeHtml(p.name || `Player ${i+1}`)} <span class="muted">#${i+1}</span></span><span class="ppts">${Number(p.points||0)} pts <button class="btn-small" data-rename="${team}" data-index="${i}" style="padding:4px 7px">Edit</button></span></div>`).join("");
}
function render() {
  if (!state) return;
  $("leagueName").value = state.meta?.leagueName || "";
  $("matchTitle").value = state.meta?.matchTitle || "";
  $("venue").value = state.meta?.venue || "";
  renderTeam("A"); renderTeam("B");
  $("halfPill").textContent = Number(state.match?.half || 1) === 1 ? "1ST HALF" : Number(state.match?.half)===2 ? "2ND HALF" : `HALF ${state.match.half}`;
  $("matchClock").textContent = safeClock(clockLeft("match"));
  $("raidClock").textContent = safeClock(clockLeft("raid"));
  $("historyCount").textContent = `${(state.history||[]).length} ACTIONS`;
  $("historyList").innerHTML = (state.history||[]).slice().reverse().map(h=>`<div class="history-item"><span>${escapeHtml(h.label || "Action")}</span><span>${new Date(h.at||Date.now()).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span></div>`).join("") || `<p class="muted small">No actions yet.</p>`;
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function escapeAttr(s){return escapeHtml(s);}
async function updateMeta() {
  const next = clone(state); next.meta = {leagueName:$("leagueName").value.trim()||"PALWAS KABADDI LEAGUE",matchTitle:$("matchTitle").value.trim()||"MATCH 01",venue:$("venue").value.trim()||""};
  next.teams.A.name = $("nameA").value.trim() || "TEAM A"; next.teams.B.name = $("nameB").value.trim() || "TEAM B";
  next.teams.A.logo = $("logoUrlA").value.trim(); next.teams.B.logo = $("logoUrlB").value.trim();
  next.teams.A.color = $("colorA").value; next.teams.B.color = $("colorB").value;
  await save(next,"Updated match setup",true); status("Match details saved.", "success");
}
function clockAction(kind, operation) {
  const next = clone(state); const m = next.match; const isRaid = kind==="raid";
  const totalKey = isRaid?"raidSeconds":"clockSeconds", runKey=isRaid?"raidRunning":"clockRunning", startKey=isRaid?"raidStartedAt":"clockStartedAt";
  const defaultSecs = isRaid?30:1200;
  const left = clockLeft(kind);
  if(operation==="start"){ if(left<=0) m[totalKey]=defaultSecs; m[runKey]=true; m[startKey]=Date.now(); }
  if(operation==="pause"){ m[totalKey]=left; m[runKey]=false; m[startKey]=0; }
  if(operation==="reset"){ m[totalKey]=defaultSecs; m[runKey]=false; m[startKey]=0; }
  save(next, `${isRaid?"Raid timer":"Match clock"} ${operation}`, true).catch(e=>status(e.message,"error"));
}
$("loginBtn").addEventListener("click", async ()=>{
  $("loginMessage").textContent="Signing in…";
  try { await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value); $("loginMessage").textContent="Signed in."; }
  catch(e){ $("loginMessage").textContent=e.message; $("loginMessage").className="status-line error"; }
});
$("logoutBtn").addEventListener("click",()=>signOut(auth));
onAuthStateChanged(auth, async user=>{
  currentUser=user;
  const configured=isFirebaseConfigured();
  $("setupWarning").classList.toggle("hidden",configured);
  $("loginPanel").classList.toggle("hidden",!configured||!!user);
  $("adminApp").classList.toggle("hidden",!configured||!user);
  $("logoutBtn").classList.toggle("hidden",!user);
  if(user){
    if(ADMIN_EMAIL!=="admin@example.com" && user.email!==ADMIN_EMAIL){ await signOut(auth); $("loginMessage").textContent="This account is not the configured admin email."; return; }
    setConnection("AUTHENTICATED","success");
    await loadMatch($("matchId").value || DEFAULT_MATCH_ID);
    if(tickHandle) clearInterval(tickHandle);
    tickHandle=setInterval(()=>{if(state){$("matchClock").textContent=safeClock(clockLeft("match"));$("raidClock").textContent=safeClock(clockLeft("raid"));}},250);
  } else {
    if(unsubscribe){unsubscribe();unsubscribe=null;} state=null;
    setConnection(configured?"SIGNED OUT":"SETUP REQUIRED");
    if(tickHandle){clearInterval(tickHandle);tickHandle=null;}
  }
});
$("saveMetaBtn").addEventListener("click",()=>updateMeta().catch(e=>status(e.message,"error")));
$("matchId").addEventListener("change",()=>{if(currentUser)loadMatch($("matchId").value).catch(e=>status(e.message,"error"));});
document.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",()=>act(btn.dataset.team,btn.dataset.action).catch(e=>status(e.message,"error"))));
$("activeA").addEventListener("change",async e=>{const next=clone(state);next.activePlayer.A=Number(e.target.value);await save(next,"Changed active player A",false);});
$("activeB").addEventListener("change",async e=>{const next=clone(state);next.activePlayer.B=Number(e.target.value);await save(next,"Changed active player B",false);});
for(const team of ["A","B"]){
  $(`addPlayer${team}`).addEventListener("click",async()=>{
    const name=prompt("Enter player name:"); if(!name?.trim())return;
    const next=clone(state);next.teams[team].players.push({name:name.trim(),points:0});await save(next,`Added player to team ${team}`,true);
  });
  $(`resetPlayers${team}`).addEventListener("click",async()=>{
    if(!confirm(`Reset all player points for team ${team}?`))return;
    const next=clone(state);next.teams[team].players=next.teams[team].players.map(p=>({...p,points:0}));await save(next,`Reset player points team ${team}`,true);
  });
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-rename]"); if(!b)return;
  const team=b.dataset.rename, idx=Number(b.dataset.index), old=state.teams[team].players[idx]?.name||"";
  const name=prompt("Edit player name:",old);if(!name?.trim())return;
  const next=clone(state);next.teams[team].players[idx].name=name.trim();await save(next,`Renamed player on team ${team}`,true);
});
$("matchStart").addEventListener("click",()=>clockAction("match","start"));
$("matchPause").addEventListener("click",()=>clockAction("match","pause"));
$("matchReset").addEventListener("click",()=>clockAction("match","reset"));
$("raidStart").addEventListener("click",()=>clockAction("raid","start"));
$("raidPause").addEventListener("click",()=>clockAction("raid","pause"));
$("raidReset").addEventListener("click",()=>clockAction("raid","reset"));
$("halfBtn").addEventListener("click",async()=>{const next=clone(state);next.match.half=Number(next.match.half||1)===1?2:1;await save(next,`Switched to half ${next.match.half}`,true);});
$("statusBtn").addEventListener("click",async()=>{const next=clone(state);next.match.status=next.match.status==="LIVE"?"READY":"LIVE";await save(next,`Match status ${next.match.status}`,true);$("statusBtn").textContent=next.match.status==="LIVE"?"Mark Match READY":"Mark Match LIVE";});
$("undoBtn").addEventListener("click",async()=>{
  const h=state?.history||[]; if(!h.length){status("Nothing to undo.");return;}
  const last=h[h.length-1]; if(!last.before){status("This earlier action has no undo snapshot.");return;}
  if(!confirm(`Undo: ${last.label}?`))return;
  const restored=clone(last.before); restored.history=h.slice(0,-1); await set(matchRef(matchId),restored); status("Last action undone.","success");
});
$("resetMatchBtn").addEventListener("click",async()=>{
  if(!confirm("Reset both scores, player points, timers, timeouts and history for this match? This cannot be undone."))return;
  const old=state;const next=defaultState();next.meta=old.meta;next.teams.A.name=old.teams.A.name;next.teams.B.name=old.teams.B.name;next.teams.A.logo=old.teams.A.logo;next.teams.B.logo=old.teams.B.logo;next.teams.A.color=old.teams.A.color;next.teams.B.color=old.teams.B.color;next.teams.A.players=old.teams.A.players.map(p=>({...p,points:0}));next.teams.B.players=old.teams.B.players.map(p=>({...p,points:0}));await set(matchRef(matchId),next);status("Match reset.","success");
});
$("copyOverlayBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("overlayLink").value);status("Overlay link copied.","success");}catch{ $("overlayLink").select();status("Select and copy the overlay link.");}});
