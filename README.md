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
- `shared/everyday.js` — non-holiday words mixed into every holiday (about 25% of cards; more for a
  holiday category with fewer than 12 words).
- `<holiday>/index.html` — the holiday's colors and fonts (`:root` variables), its preset
  team names, and its own word lists split into `easy` and `hard`.

Scores, team names and timer length are saved per holiday on each device (localStorage).
Team names start as the holiday's presets; tap a team name (or ⚙️ Settings) to change them.

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
