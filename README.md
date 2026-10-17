# Palwas Kabaddi League — Live Scoreboard

A mobile-friendly starter website for:
- Phone 1: transparent score overlay for a streaming/browser overlay source.
- Phone 2: authenticated admin control panel.
- Firebase Realtime Database sync between phones.
- Team names/logos, scores, raid, bonus, tackle, super tackle, all-out, timeouts, players, half, match clock, raid clock, history and Undo.

## Important before use
This is a starter implementation. Test it privately before using it in a real tournament. Firebase must be configured and database rules must be published correctly. It is not affiliated with or endorsed by Pro Kabaddi League.

## A. Create Firebase project
1. On your Windows PC, open https://console.firebase.google.com/ and create a project.
2. In Project settings > General > Your apps, add a **Web app**.
3. Copy its config values into `firebase-config.js`.
   - `apiKey`
   - `authDomain`
   - `databaseURL`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
4. In Build > Realtime Database, create a database. Copy its exact URL to `databaseURL` in `firebase-config.js`. The URL may look like `https://PROJECT-default-rtdb.firebaseio.com` or another region-specific URL; use the URL Firebase shows.
5. In Build > Authentication > Sign-in method, enable **Email/Password**.
6. In Authentication > Users, add one admin user with an email and a strong password.
7. Set `ADMIN_EMAIL` in `firebase-config.js` to the exact admin email.
8. Open `database.rules.json` and replace `YOUR_ADMIN_EMAIL` with that same email.
9. In Realtime Database > Rules, paste the contents of `database.rules.json` and click Publish.
   - Overlay reads the match data publicly, so team names, scores, player names, and match state are public to anyone who knows the match ID.
   - Only the configured admin email can write data.
   - Never put a password or service-account private key in the website.
   - Do not use broad public write rules such as `.write: true`.

## B. Test locally on Windows
Firebase uses ES modules and remote HTTPS imports, so don't just double-click the HTML files.
1. Install Node.js LTS from https://nodejs.org/ and restart the terminal.
2. Extract this ZIP to a folder, for example `C:\pkl-scoreboard`.
3. Open Command Prompt in that folder.
4. Run:
   ```bat
   npx serve .
   ```
   If it asks to install `serve`, type `y`.
5. Open the local URL it prints (often `http://localhost:3000`).
6. Visit `admin.html`, sign in with the Firebase admin email/password.
7. Visit `overlay.html?match=pkl-final-2026-a7k3` to check the transparent overlay.
8. Test on the same PC first. For two phones, deploy it online using section C.

## C. Deploy to Firebase Hosting (recommended)
1. Install Node.js LTS: https://nodejs.org/
2. Open Command Prompt in the project folder.
3. Run:
   ```bat
   npm install
   npx firebase login
   ```
4. Copy `.firebaserc.example` to a new file named `.firebaserc` and replace `YOUR_PROJECT_ID` with your Firebase project ID.
5. Confirm `firebase.json` and `database.rules.json` are in the project folder.
6. Deploy:
   ```bat
   npx firebase deploy
   ```
7. Firebase prints your Hosting URL, usually `https://YOUR_PROJECT_ID.web.app`.
8. Admin page: `https://YOUR_PROJECT_ID.web.app/admin.html`
9. Overlay page: `https://YOUR_PROJECT_ID.web.app/overlay.html?match=pkl-final-2026-a7k3`

If CLI deploy gives a database rules error, publish `database.rules.json` manually in Firebase Console > Realtime Database > Rules and deploy Hosting separately:
```bat
npx firebase deploy --only hosting
```

## D. Two-phone workflow
1. Connect both phones to the internet.
2. On Phone 2, open the `/admin.html` URL and sign in.
3. Set league title, match title, venue, team names, and optional logo image URLs; press **Save match details**.
4. Add/edit player names. Select the active player for the team before awarding a point.
5. Use the score action buttons. The score and overlay update live.
6. On Phone 1, open the `/overlay.html?match=YOUR_MATCH_ID` URL in the browser overlay source supported by your streaming app. The overlay page has a transparent background.
7. If the streaming app does not support a web overlay/browser source, the overlay page alone will not automatically appear on top of the camera feed. Use a streaming app that supports web overlays or a PC/OBS browser source.
8. Keep the admin page private. The overlay link is intended to be public.

## E. Match rules and controls
- Raid +1, Bonus +1, Tackle +1, Super Tackle +2, All Out +2 are configured as simple defaults. Confirm the tournament's exact scoring rules before a match.
- Active player selection assigns all points from the chosen action to that player. In a real scoring workflow, select the correct player before awarding points.
- Timeout increments that team's timeout count but does not pause the match clock automatically.
- Match clock defaults to 20:00; raid clock defaults to 30 seconds. Adjust code defaults if your tournament uses different durations.
- Undo restores the previous snapshot for the most recent action with a saved snapshot. Some administrative actions (such as active player selection) do not create a snapshot.
- Reset scores & clock clears scores, player points, timeouts, timers and history after confirmation.

## F. Overlay notes
- Transparent overlay pages are normally intended to be loaded as a browser/web source in a streaming app or OBS, not merely viewed as a normal full-screen camera app.
- If a browser overlay tool requires a transparent background, this project uses `background: transparent`.
- On a phone, overlay support varies by streaming app and Android version. If your chosen app cannot add a remote web page as an overlay, stream from a PC with OBS Browser Source or choose an Android streaming app with Web Overlay support.

## G. Troubleshooting
- **Firebase not configured:** check every value in `firebase-config.js`, save, redeploy.
- **Permission denied:** admin email must exactly match `ADMIN_EMAIL` and `YOUR_ADMIN_EMAIL` in the rules; publish the rules.
- **Overlay says match not found:** sign into admin and open that same match ID once to initialize it.
- **No live sync:** both devices need internet; check Realtime Database URL and rules.
- **Images not showing:** use a direct, publicly accessible HTTPS image URL.
- **Admin URL loads but cannot sign in:** confirm Email/Password sign-in is enabled and the user exists in Authentication > Users.

## Security checklist
- No admin password is stored in code.
- Do not share admin credentials.
- The match ID is not a password.
- Public read means the overlay's match data is readable by anyone with the match ID. Do not store private personal information in the match data.
- The configured admin email is the only email permitted to write by the included rules.
