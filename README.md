# PRICETAG WARS

A 60-second multiplayer game show where you guess prices of the weirdest stuff on Amazon. Closest without going over wins.

**Stack:** Single HTML file, Firebase Realtime Database (free tier), zero build step.
**Hosting cost:** $0 (GitHub Pages + Firebase free tier).
**Monetization:** Amazon Associates affiliate links shown after every match.

---

## What's in this folder

```
index.html          The whole game — single file, vanilla JS, Firebase modular SDK from CDN
products.json       Catalog of 45 weird products with redacted titles + emoji placeholders
firebase-rules.json Realtime Database security rules
README.md           This file
```

---

## Quickstart (15 minutes)

### 1. Create a Firebase project

1. Go to https://console.firebase.google.com → **Add project**.
2. Skip Google Analytics (not needed).
3. Once created, on the left sidebar click **Build → Realtime Database → Create Database**.
4. Pick a region close to your users.
5. Start in **test mode** for now (we'll lock it down in step 4).

### 2. Get your Firebase config

1. In the Firebase console, click the gear icon → **Project settings**.
2. Scroll to "Your apps" → click **`</>`** to register a web app.
3. Give it any nickname, skip hosting, click **Register**.
4. Copy the `firebaseConfig` object that appears.

### 3. Wire it into the game

Open `index.html`, find this block near the top of the `<script>`:

```js
const firebaseConfig = {
  apiKey:        "REPLACE_ME",
  authDomain:    "REPLACE_ME.firebaseapp.com",
  databaseURL:   "https://REPLACE_ME-default-rtdb.firebaseio.com",
  ...
};
```

Replace it with the config from step 2. Make sure `databaseURL` is included — Firebase sometimes omits it from the snippet.

### 4. Lock down the database

1. Firebase console → **Realtime Database → Rules** tab.
2. Paste the contents of `firebase-rules.json`.
3. Click **Publish**.

These rules allow anyone to read/write to a room with a 4-character code, but enforce data shapes so nobody can stuff 5MB of garbage into your DB.

### 5. (Optional) Set your Amazon Associates tag

In `index.html`, find:

```js
const AMAZON_TAG = "yourtag-20";
```

Replace with your Associates tracking ID. Apply at https://affiliate-program.amazon.com if you don't have one. Until you have a tag, the affiliate links still work — they just don't pay you.

### 6. Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "ship it"
git branch -M main
git remote add origin https://github.com/YOU/pricetag-wars.git
git push -u origin main
```

Then on GitHub → repo → **Settings → Pages → Source: main / root → Save**. Your game is live at `https://YOU.github.io/pricetag-wars/` in about 60 seconds.

---

## Replacing the seed products with real ones

The included `products.json` has 45 placeholder ASINs (`B0XXXXXX01` etc.). To monetize, you need real Amazon products. Two options:

**Option A — Manual curation (recommended for v1).**
Hunt for 50–100 weird products on Amazon. For each:
- Copy the ASIN (10-character ID after `/dp/` in the URL)
- Copy the title
- Note the price
- Edit `products.json`

The game auto-generates a redacted title using the `redactedTitle` field — for now you write it by hand. Pick which words to obscure (the funny ones — "T-Rex", "Pickle", "Cat Butt") and replace the letters with `▇` characters of approximately the same length.

**Option B — Amazon Product Advertising API.**
If you're an approved Associate with sales, you can use PA-API to programmatically pull product data. Out of scope for this README, but the JSON shape in `products.json` is what you'd populate.

### What the redaction should hide

The whole game depends on the redacted title not being Google-able in 8 seconds. Rules of thumb:

- **Hide:** the distinctive noun, brand names, character/animal references
- **Keep:** generic category words ("Costume", "Mug", "Pillow"), sizes, model numbers, materials

Bad: `▇▇▇▇▇▇▇ ▇▇▇▇▇▇ ▇▇▇▇▇▇ Adult` (everything redacted, no fun)
Bad: `Inflatable Hot Dog Costume Adult` (nothing redacted, instant lookup)
Good: `Inflatable ▇▇▇ ▇▇▇ Costume Adult` (you know it's a food costume — could be hot dog, taco, pickle)

### Fake products

Set `isFake: true` and `truePrice: 0` for products that don't really exist. These trigger "trick rounds" where players guess what the *median* of all guesses will be — pure Keynesian beauty contest, impossible to look up. Mix in 1 fake per 8–10 real products.

---

## Product images

By default the game shows emoji-on-color SVG placeholders (functional but cheap-looking). To use real Amazon product images, add an `imageUrl` field to each product:

```json
{
  "asin": "B0XXXXXX01",
  "fullTitle": "Inflatable T-Rex Costume Adult Size",
  "imageUrl": "https://m.media-amazon.com/images/I/abc123.jpg",
  ...
}
```

Then in `index.html`, find the `placeholderImage` call inside `renderGame` and change it to:

```js
qs('product-image').src = product.imageUrl || placeholderImage(product.emoji, product.color);
```

Note: hot-linking Amazon images is generally allowed for affiliates but check current Associates terms.

---

## Free-tier capacity

Firebase Realtime Database free ("Spark") tier limits:
- 100 simultaneous connections
- 1 GB storage
- 10 GB/month transfer

A typical match transfers ~5KB of state. You can serve roughly 50,000 matches/month before hitting the cap. By that point you should be making enough affiliate revenue to upgrade to the pay-as-you-go tier (where the same usage costs about $1).

To stay safe on the free tier, the game does NOT keep dead rooms around — `onDisconnect` removes player slots and empty rooms get garbage-collected by being orphaned. If you want explicit cleanup, add a Cloud Function (or a cron-style script) that deletes rooms older than 1 hour.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ CLIENT (single HTML file, served from GitHub Pages)  │
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Title   │→ │ Lobby   │→ │ Game     │→ │ End     │ │
│  │ screen  │  │ (4-char │  │ (5 round │  │ (winner │ │
│  │         │  │  code)  │  │  loop)   │  │  + ads) │ │
│  └─────────┘  └─────────┘  └──────────┘  └─────────┘ │
│                                                      │
│  Per-client: state.uid (random), state.roomCode      │
│  Host election: lowest joinedAt non-bot player       │
│  Host runs hostTick() every 250ms                    │
└──────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
   ┌────────────────┐            ┌──────────────────┐
   │ Firebase RTDB  │            │ products.json    │
   │ /rooms/{code}/ │            │ (static, on CDN) │
   │   phase        │            │                  │
   │   roundIndex   │            │ - asin           │
   │   productIndex │            │ - fullTitle      │
   │   players/{uid}│            │ - redactedTitle  │
   └────────────────┘            │ - emoji + color  │
                                 │ - truePrice      │
                                 │ - isFake         │
                                 └──────────────────┘
```

### Phase machine

```
lobby → countdown(3s) → redacted(8s) → reveal(4s) → scoring(5.5s) → next round
                                                                     ↓
                                                                  end (after round 5)
```

### Anti-cheat layers
1. **8-second timer** — too short to phone-Google for most people.
2. **Redacted title + blurred image** — you can't search what you can't name.
3. **10% fake rounds** — no ground truth to look up; closest to median wins.
4. **Speed bonus** — guessing fast is worth 2x; lookup-attack winners still lose matches.

### Determinism
Scores are computed by every client from the same room state, so the host writes them once after the redacted phase ends. If the host crashes mid-match, the lowest-joinedAt remaining player is auto-elected and the game continues from current Firebase state.

---

## Roadmap (if you want to extend it)

- [ ] Public matchmaking queue ("Quick Play" button → joins or creates a `/queue` entry)
- [ ] Persistent player accounts via Firebase Auth (anonymous → Google upgrade path)
- [ ] Daily leaderboards
- [ ] Custom room themes ("Kitchen Gadgets," "Tech," "Halloween")
- [ ] User-submitted products with a moderation queue
- [ ] Twitch extension for streamers — viewers play along
- [ ] Spectator mode
- [ ] Sound effects (game-show buzzer, ka-ching, sad trombone)

---

## License

MIT for the code. The product data in `products.json` is placeholder seed data that you must replace with real Amazon products before going live.
