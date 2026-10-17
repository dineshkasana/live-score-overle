import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { DEFAULT_MATCH_ID, ADMIN_EMAIL } from "./firebase-config.js";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyADrm_UJ0Kj7yc_5uHfc7OPskNl7FjK9Ug",
  authDomain: "live-score-overlay.firebaseapp.com",
  databaseURL: "https://live-score-overlay-default-rtdb.firebaseio.com/",
  projectId: "live-score-overlay",
  storageBucket: "live-score-overlay.firebasestorage.app",
  messagingSenderId: "805833268443",
  appId: "1:805833268443:web:5acfae9ff1f524da5e80fe",
  measurementId: "G-3YHB0PNTT8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getDatabase(app);
export const auth = getAuth(app);
export { ref, onValue, set, signInWithEmailAndPassword, signOut, onAuthStateChanged, DEFAULT_MATCH_ID, ADMIN_EMAIL };

export function matchRef(matchId = DEFAULT_MATCH_ID) {
  return ref(db, `matches/${matchId}`);
}

export function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== "PASTE_API_KEY_HERE" &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID" &&
    Boolean(firebaseConfig.databaseURL && firebaseConfig.databaseURL.startsWith("https://"));
}

export function defaultState() {
  return {
    meta: { leagueName: "PALWAS KABADDI LEAGUE", matchTitle: "MATCH 01", venue: "PALWAS" },
    teams: {
      A: { name: "PALWAS WARRIORS", logo: "", color: "#e13a43", score: 0, timeouts: 0, players: [
        { name: "Player 1", points: 0 }, { name: "Player 2", points: 0 }, { name: "Player 3", points: 0 },
        { name: "Player 4", points: 0 }, { name: "Player 5", points: 0 }, { name: "Player 6", points: 0 }, { name: "Player 7", points: 0 }
      ]},
      B: { name: "RAMSAGAR RAIDERS", logo: "", color: "#2474e8", score: 0, timeouts: 0, players: [
        { name: "Player 1", points: 0 }, { name: "Player 2", points: 0 }, { name: "Player 3", points: 0 },
        { name: "Player 4", points: 0 }, { name: "Player 5", points: 0 }, { name: "Player 6", points: 0 }, { name: "Player 7", points: 0 }
      ]}
    },
    match: { half: 1, clockSeconds: 1200, clockRunning: false, clockStartedAt: 0, raidSeconds: 30, raidRunning: false, raidStartedAt: 0, status: "READY" },
    activeTeam: "A",
    activePlayer: { A: 0, B: 0 },
    history: []
  };
}
