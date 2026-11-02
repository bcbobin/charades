# Holiday Charades

Phone-friendly charades for two teams sharing one phone. Every holiday has its own
URL and theme on top of the same layout and game engine.

| URL | Holiday |
| --- | --- |
| `/` | Homepage — lists every holiday, soonest first |
| `/halloween/` | Spooky Charades 🎃 |
| `/thanksgiving/` | Gobble Charades 🦃 |
| `/christmas/` | Jolly Charades 🎄 |
| `/new-years/` | Countdown Charades 🥂 |
| `/valentines/` | Sweetheart Charades 💘 |
| `/st-patricks/` | Lucky Charades 🍀 |
| `/easter/` | Hoppy Charades 🐰 |
| `/canada-day/` | True North Charades 🍁 |
| `/fourth-of-july/` | Firework Charades 🎆 |

## How it's put together

- `shared/game.js` — the whole game (layout, dealing, timer, scores, settings). It reads
  `window.THEME` from the holiday page.
- `shared/game.css` — the shared layout, styled only through CSS variables.
- `shared/kofi.js` — the ☕ Ko-fi tip panel (links with `data-kofi` open it in a sheet).
- `shared/everyday.js` — non-holiday words mixed into every holiday (about 25% of cards; more for a
  holiday category with fewer than 12 words).
- `<holiday>/index.html` — the holiday's colors and fonts (`:root` variables), its preset
  team names, and its own word lists split into `easy` and `hard`.

Scores, team names and timer length are saved per holiday on each device (localStorage).
Team names start as the holiday's presets; tap a team name (or ⚙️ Settings) to change them.

### Word suggestions

**💡 Suggest a word** on every game opens a form for a word, its category, Easy/Hard, and an
optional name (shown on the card) and email (so you can tell them when it's added). Each
suggestion becomes a row in a private Google Sheet, not an email.

One-time setup:

1. Create a Google Sheet (e.g. "Charades suggestions"), then **Extensions → Apps Script**.
2. Replace the code with `tools/suggestions.gs` and save.
3. **Deploy → New deployment → Web app**, Execute as **Me**, Who has access **Anyone**, then
   Deploy and authorize.
4. Copy the web app URL (ends in `/exec`) into `SUGGEST_URL` at the top of `shared/game.js`.

Until step 4, the form tells players suggestions aren't switched on yet. The script ignores bots
that tick a hidden checkbox and accepts at most 20 suggestions a minute.

To add a suggestion, put the word in the holiday's `words.<category>.<easy|hard>` list. If they
gave a name, also add it to `credits` on that page's `window.THEME`, using the word exactly as
written in the list:

```js
credits: { "Hocus Pocus": "sam" },
```

The name then appears in the card's bottom corner and on the acting screen. Words in
`shared/everyday.js` take credits the same way, under `window.EVERYDAY.credits`. Mark the row
**Added?** in the sheet and email them if they left an address.

### Adding a holiday

1. Copy a holiday folder (e.g. `christmas/`) to a new folder name — that's the URL.
2. Change the `:root` colors/font, the Google Fonts link, and `window.THEME` (`id` must be
   unique; it keys the saved scores).
3. Add an entry to `HOLIDAYS` in the root `index.html` with its date and card colors.

## Run locally

```bash
python serve.py
```

It prints LAN/Tailscale URLs to open on phones.

## Deploy to GitHub Pages

The site is plain static files with relative links, so it works at
`https://<user>.github.io/<repo>/` without any build step.

1. Push this folder to a GitHub repository (e.g. `charades`).
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. After a minute the homepage is live at `https://<user>.github.io/<repo>/` and each
   holiday at `https://<user>.github.io/<repo>/christmas/` and so on.
