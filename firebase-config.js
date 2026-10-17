// 1) Firebase Console > Project settings > Your apps > Web app > SDK setup.
// 2) Copy your project's config values here. These are public app identifiers,
//    NOT a password. Protect writes with the database rules in database.rules.json.
export const firebaseConfig = {
  apiKey: "PASTE_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_DATABASE_NAME-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_MESSAGING_SENDER_ID",
  appId: "PASTE_APP_ID"
};

// Use a hard-to-guess match ID, e.g. "pkl-final-2026-a7k3".
// This ID appears in both links; it is not a replacement for authentication.
export const DEFAULT_MATCH_ID = "pkl-final-2026-a7k3";

// Replace with the exact email address you will use for the Firebase admin login.
// IMPORTANT: also replace YOUR_ADMIN_EMAIL in database.rules.json with this email.
export const ADMIN_EMAIL = "admin@example.com";
