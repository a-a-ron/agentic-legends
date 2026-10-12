# Agentic Legends

A browser-based side-scrolling platformer built with [Phaser 3](https://phaser.io)
+ Vite + TypeScript. Inspired by the
[`skills-dev/merge-of-legends`](https://github.com/skills-dev/merge-of-legends)
GitHub Skills exercise.

> Save the land of Codia and restore the sacred Mainline with the help of
> three mythical creatures and their gifts.

## Story

You're the lead developer in a magical place called **Codia**, where everything
normally runs smoothly on the main branch.

But something's gone wrong. A glitch in version control has caused everything
to split into unstable branches, and now people are stuck with detached HEADs.
Fixes aren't holding, and things are starting to break down fast.

The engineering team checked with the top experts and figured out the only way
to fix things: find three key resources that can help restore everything back
to normal.

Three mythical mentors stand ready:

| Mentor | Biome | Gift | Power unlocked |
| --- | --- | --- | --- |
| **Mona** | Forest Archives | Fork of Curiosity | Double-jump |
| **Ducky** | Frozen River | Bubbles of Clarity | Dissolves fog walls |
| **Copilot** | Sky of the Sacred Tree | Goggles of Insight | Reveals hidden platforms |

Once all three gifts are gathered, the Adventurer faces the **Mainline
Corruption** in a three-phase boss fight that demands every power you've earned.

## Controls

| Action | Keys |
| --- | --- |
| Move | `←` / `→` or `A` / `D` |
| Run (sprint) | `Shift` (or `X`) |
| Jump (and double-jump after Fork) | `Space` or `W` — hold for higher jump |
| Restart current stage | `R` |
| Quit to title | `Q` |
| Pause | `Esc` |
| Mute / unmute | `M` |
| Continue dialog | `Space` / `Enter` / click |

## Run locally

```bash
pnpm install
pnpm run assets   # one-time: optimizes raw PNGs into WebP
pnpm run dev      # http://localhost:5173/agentic-legends/
```

To produce a static build:

```bash
pnpm run build
pnpm run preview  # http://localhost:4173/agentic-legends/
```

## Deploy

Pushes to `main` are built and published to GitHub Pages by
`.github/workflows/deploy.yml`. Once the workflow has run and Pages is enabled
("Source: GitHub Actions"), the game lives at
<https://a-a-ron.github.io/agentic-legends/>.

## Project layout

```
agentic-legends/
├── assets-src/raw/             # raw PNGs copied from merge-of-legends
├── scripts/optimize-assets.ts  # sharp pipeline → WebP + portrait crops
├── src/
│   ├── main.ts                 # Phaser bootstrap
│   ├── config.ts               # game constants
│   ├── data/story.ts           # narration strings (verbatim tag lines)
│   ├── entities/               # Adventurer, Mentor, CorruptionEnemy
│   ├── scenes/                 # Boot, Preload, Title, Intro, 3 levels, Boss, Victory, GameOver
│   └── systems/                # Hud, DialogBox, AudioBus
├── public/
├── index.html
├── vite.config.ts              # base: '/agentic-legends/'
└── .github/workflows/deploy.yml
```

## Credits & attribution

- Inspiration & source images: [`skills-dev/merge-of-legends`](https://github.com/skills-dev/merge-of-legends).
  Images were downscaled for web delivery; cover/title text bands are cropped
  away from in-game character portraits.
- Engine: [Phaser 3](https://phaser.io) (MIT).
- Audio: sound effects are synthesized with the Web Audio API; the background
  music is an 8-bit MP3 loop (`src/assets/audio/theme.mp3`).

## License

&copy; 2026 Ari LiVigni &bull; [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/code_of_conduct.md) &bull; [MIT License](https://gh.io/mit)
