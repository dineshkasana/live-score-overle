import { matchRef, onValue, DEFAULT_MATCH_ID, isFirebaseConfigured } from "./firebase.js";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const matchId=(params.get("match")||DEFAULT_MATCH_ID).trim();
let state=null,timer=null;
function safeClock(s){s=Math.max(0,Math.floor(s||0));return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;}
function left(kind){if(!state)return 0;const m=state.match||{};const isRaid=kind==="raid";const total=isRaid?m.raidSeconds:m.clockSeconds;const running=isRaid?m.raidRunning:m.clockRunning;const started=isRaid?m.raidStartedAt:m.clockStartedAt;return Math.max(0,(total||0)-(running?Math.floor((Date.now()-started)/1000):0));}
function logo(id,url,letter){const el=$(id);if(url){el.innerHTML=`<img src="${String(url).replace(/"/g,"&quot;")}" alt="">`;}else{el.textContent=letter;}}
function render(){if(!state)return;const t=state.teams||{},a=t.A||{},b=t.B||{},m=state.match||{},meta=state.meta||{};
$("league").textContent=meta.leagueName||"PALWAS KABADDI LEAGUE";$("matchTitle").textContent=meta.matchTitle||"MATCH 01";$("venue").textContent=meta.venue||"";
$("nameA").textContent=a.name||"TEAM A";$("nameB").textContent=b.name||"TEAM B";
const sideA=document.querySelector(".side-a"),sideB=document.querySelector(".side-b");
if(sideA)sideA.style.background=a.color||"#e13a43";if(sideB)sideB.style.background=b.color||"#2474e8";$("scoreA").textContent=String(Number(a.score||0)).padStart(2,"0");$("scoreB").textContent=String(Number(b.score||0)).padStart(2,"0");
$("timeoutA").textContent=`TIMEOUTS ${Number(a.timeouts||0)}`;$("timeoutB").textContent=`TIMEOUTS ${Number(b.timeouts||0)}`;
logo("logoA",a.logo,"A");logo("logoB",b.logo,"B");
const ev=state.lastEvent;const eventEl=$("pointEvent");
if(eventEl){if(ev&&ev.at){eventEl.textContent=ev.points>0?`${ev.teamName} +${ev.points} POINT${ev.points===1?"":"S"} — ${ev.action}`:`${ev.teamName||"MATCH UPDATE"} — ${ev.action||"UPDATED"}`;eventEl.classList.add("show");}else{eventEl.textContent="";eventEl.classList.remove("show");}}$("half").textContent=Number(m.half||1)===1?"1ST HALF":Number(m.half)===2?"2ND HALF":`HALF ${m.half}`;
$("status").textContent=m.status||"READY";$("liveBadge").style.display=m.status==="LIVE"?"flex":"none";
$("matchClock").textContent=safeClock(left("match"));$("raidClock").textContent=`RAID ${String(left("raid")).padStart(2,"0")}`;
$("overlayError").classList.remove("show");}
if(!isFirebaseConfigured()){$("overlayError").textContent="Firebase is not configured. Read README.md."; $("overlayError").classList.add("show");}
else{
  onValue(matchRef(matchId),snap=>{if(!snap.exists()){$("overlayError").textContent="Match not found. Open Admin and initialize this Match ID."; $("overlayError").classList.add("show");return;}state=snap.val();render();},err=>{$("overlayError").textContent="Connection error: "+err.message;$("overlayError").classList.add("show");});
  timer=setInterval(()=>{if(state){$("matchClock").textContent=safeClock(left("match"));$("raidClock").textContent=`RAID ${String(left("raid")).padStart(2,"0")}`;}},250);
}
