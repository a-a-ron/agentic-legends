# Changelog

All notable changes to **Agentic Legends** are documented here.
This project follows [Semantic Versioning](https://semver.org/) and
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Versions in the `0.x` range are **beta** — APIs, levels, and balance may
change at any time. The first GA release will be `1.0.0`.

## [0.1.14] - Beta

### Changed
- **Forest Archive Rats.** Replaced the first level's corruption bugs with the
  supplied pixel-art rat sprite; rats patrol slowly along the ground.

## [0.1.13] - Beta

### Changed
- **Mona Character Artwork.** Replaced Mona's Forest Archive mentor portrait with
  the new transparent pixel-art wizard image. The PNG is kept lossless to preserve
  crisp pixel edges and transparency.

## [0.1.12] - Beta

### Added
- **Forest Archive Custom Background.** Updated Level 1 ("Forest Archives — find Mona")
  with custom pixel-art dungeon library artwork featuring warm torchlit stone pillars,
  ancient scrolls, archive bookshelves, and mystical glowing runes.
- **Parallax Background Tiling.** Upgraded level background rendering in `BaseLevelScene`
  to use seamless `TileSprite` parallax scrolling with configurable opacity, tint, and
  scroll factors to prevent screen-edge clipping across wide levels.

## [0.1.11] - Beta

### Added
- **Custom Hero Title Screen.** Integrated pixel-art title artwork featuring
  Mona the Octocat, the "RESTORE THE SACRED MAINLINE" banner, twinkling ambient
  stars, floating motes, and an interactive Start button.
- **Procedural Web Audio Sound Effects & Music.** Dynamic retro synthesizer
  effects for jumps, double jumps, landing thuds, hit impacts, reward pickups,
  quiz correct fanfare, quiz wrong buzzer, UI clicks/hovers, and ambient polyphonic
  BGM with global audio mute controls.
- **Game Feel & Visual Polish.** Screen shake on damage and lava collisions,
  camera flash effects, landing and jump dust particle effects, floating damage
  numbers (`-1 ♥`), leap cues, Copilot Orb aura particles, and quiz button bounce
  and sparkle animations.

## [0.1.10] - Beta

### Changed
- **New Knowledge Check questions.** The three trivia questions now cover
  GitHub Copilot Proficiency and the Microsoft Pro Badge credential, with
  a learning takeaway shown after each answer. Long answer options now
  scale down to fit their row. (`src/data/quizzes.ts`, `src/systems/Quiz.ts`.)

## [0.1.9] - Beta

### Changed
- **Larger HUD legend on touch devices.** The "CONTROLS" panel in the
  top-right corner now uses a 20 px monospace body (up from 13 px), an
  18 px bold header, taller line-height, and a 320 px-wide panel so
  the on-screen glyphs (`◀ ▶ ⤒ ↺ ⛶`) are comfortably readable on a
  landscape phone. Desktop sizing is unchanged. Adds a `Fullscreen ⛶`
  row to the legend on touch. (`src/systems/Hud.ts`.)
- **Larger trivia card on touch devices.** The Knowledge Check modal
  now uses a 30 px header, 26 px prompt, 22 px option text (up from
  17 px), 50 px-tall option rows with 56 px spacing, a 1100 × 560
  card, and a beefier "Tap or press Space to continue" pill so the
  quiz is easy to read and tap on a phone in landscape. Desktop
  sizing is unchanged. (`src/systems/Quiz.ts`.)

## [0.1.8] - Beta

### Added
- **Fullscreen toggle (`⛶`) for mobile devices.** A new tappable button
  appears on the Title screen (top-right, labeled "Fullscreen") and in
  the in-game HUD (next to the `↺` restart button) on touch devices.
  On Android Chrome / Edge and other browsers that support the
  Fullscreen API it calls `scene.scale.toggleFullscreen()` from the tap
  gesture, hiding the browser chrome. On iOS Safari — which blocks the
  Fullscreen API — the button shows a small dialog telling the player
  to use Share → **Add to Home Screen** and launch from the home icon
  (already enabled via the existing `apple-mobile-web-app-capable`
  metas). New helper: `src/systems/FullscreenButton.ts`.

### Changed
- **Title screen tap-to-start is now a dedicated button.** The
  "Press SPACE or tap here to begin" prompt is now an interactive
  pill, so tapping the new fullscreen button (or anywhere else on the
  Title scene) no longer accidentally starts the game.

## [0.1.7] - Beta

### Added
- **Portrait-orientation rotation prompt.** When the game loads on a
  small touch device held in portrait, a full-screen overlay now asks
  the player to rotate to landscape so the Codia map, HUD legend, and
  trivia cards all fit on screen. The overlay is hidden automatically
  the moment the device flips to landscape and never appears on
  desktops. (`index.html`, CSS `@media (orientation: portrait) and
  (max-width: 900px)`.)

### Changed
- **HUD legend is now touch-aware.** On touch devices the controls
  panel swaps the keyboard hints (Shift/Esc/R/Q) for the on-screen
  glyphs the player can actually tap (◀ ▶ ⤒ ↺) plus a "tap an answer"
  hint for the trivia card and a reminder to keep the phone in
  landscape, so the legend stays useful and compact on mobile.
  (`src/systems/Hud.ts`.)

## [0.1.6] - Beta

### Changed
- Victory-screen QR caption updated from "Scan to win prizes!" to
  **"Scan to get points on the leaderboard!"** to match the booth's
  scoring flow.

## [0.1.5] - Beta

### Added
- **Final-stand goal sprite uses the GitHub Copilot avatar.** The
  source `github-copilot.jpg` (1200×1200) is now baked into a clean
  transparent `copilot-orb.png` via a new `alphaKey` branch in
  `scripts/optimize-assets.ts` (alpha-keys near-white pixels, resizes
  to 512×512). The orb hovers at the end of the Mainline arena and
  triggers victory on touch.
- **Prize QR code on the Victory screen.** After defeating the final
  level, the closing narration sits on the left and a pristine
  scannable QR card ("Scan to win prizes!") sits on the right.
  `al-qrcode.png` is shipped passthrough so it stays pixel-perfect.
- **Tappable retry/restart UI for mobile**:
  - New `↺` button in the HUD restarts the current level with the
    same `{powers, hearts, wrongAnswers}` data.
  - Game Over screen now offers large "Retry stage" and "Back to
    title" buttons in addition to the R / T keyboard shortcuts.
  - Victory screen has a "▶ Play again" button (in addition to Space).

### Changed
- **Mobile / landscape phone polish.** `index.html` adds
  `apple-mobile-web-app-capable`, `mobile-web-app-capable`, and
  `apple-mobile-web-app-status-bar-style: black-translucent` metas,
  plus `user-scalable=no` and `env(safe-area-inset-*)` padding on
  `#game` so the notch and home indicator don't overlap the canvas.
  `TouchControls` button radius is clamped to 38–70 px so the D-pad
  and jump button stay comfortable across phone and tablet sizes.

### Verified
- Wrong-answer → next-level extra-bug penalty fires on **every**
  knowledge-check transition (Mona→Ducky→Copilot→Boss) via the
  existing `wrongAnswers` plumbing in `BaseLevelScene` and
  `BossMainlineScene`. HUD banner copy unchanged.

## [0.1.4] - Beta

### Added
- **Mobile / touch support.** When the game detects a touch device, an
  on-screen control overlay appears in the level scenes: `◀` `▶` on the
  bottom-left for movement and `⤒` on the bottom-right for jump.
  Multi-touch is enabled so the player can hold a direction and tap
  jump simultaneously. Driven by a shared `TouchInputState` on the
  Phaser registry that the `Adventurer` ORs into the keyboard inputs.
- Quiz "continue" prompt is now tappable on mobile (label reads
  `▶ Tap or press Space to continue`).

### Changed
- `index.html` viewport CSS hardened for phones: `touch-action: none`,
  `overscroll-behavior: none`, disabled tap highlight / text selection,
  and switched height to `100dvh` so the canvas fits below the URL bar
  on iOS Safari and Chrome Android.

## [0.1.3] - Beta

### Fixed
- Final-level **Copilot Orb** now renders reliably. The magenta arena
  overlay was at the same depth as gameplay objects and could mask
  later-added sprites; explicit depths (`overlay = -10`, `halo = 9`,
  `orb = 10`) keep the orb in front. The orb is also larger (160 px)
  and sits a bit lower so it's obviously reachable, with a brighter
  halo and a programmatic fallback texture if the PNG ever fails to
  load.

## [0.1.2] - Beta

### Changed
- End-of-level reward modal hides the redundant text caption on Levels 2
  (Ducky) and 3 (Copilot) so the in-image artwork stands on its own.
- Level 3 (Copilot): falling into the gaps is now **fatal** — you lose
  the run instead of just dropping a heart. Use the bridge platforms.
- In-world reward "gift" sprites are now clean Phaser-drawn icons (a
  fork-gem, a bubble cluster, and a pair of goggles) instead of the
  speech-bubble poster art that contained dialog text.
- The in-world mentor sprite for Ducky and Copilot crops the title band
  ("ENLIGHTENMENT" / "SPELLS") off the top of the portrait so no
  text is visible in-game.
- **Final level reworked**: the boss fight is replaced by a single
  hovering **Copilot Orb** at the end of the arena. Touch it to win.
  The orb uses the supplied Copilot artwork (`copilot-orb.png`).

### Added
- Animated **lava** in the floor gaps on Level 3, with shimmering glow
  and bobbing bubbles. Touching the lava is now fatal — the screen
  flashes red and the run ends immediately.
- End-of-level Knowledge Check now **shuffles answer order** on every
  attempt, so the correct option's letter (A/B/C/D) is randomized per
  play. Backed by `src/util/shuffle.ts` (pure / RNG-seedable) with 6
  new Vitest cases (24 tests total).
- **Wrong-answer penalty** — every wrong guess on a knowledge check
  spawns one extra corruption bug on the next level (and on the
  Mainline). A yellow HUD banner (`⚠ N extra bugs from missed
  knowledge checks!`) appears so the player understands the spike.
  Wrong-answer counts are propagated through `scene.start` data.

## [0.1.1] - Beta

### Changed
- Mona (Level 1) knowledge check now offers four answers — added **D. 10**.
  Correct answer is still **B. 6**.

### Added
- Vitest test suite with 18 passing tests covering the `fitWithin` poster
  scaler and the GH-600 quiz dataset.
- `CI` workflow (`.github/workflows/ci.yml`) that runs `tsc --noEmit` and
  `pnpm test` on every push to `main` and on pull requests.
- `.github/CODEOWNERS` assigning `@arilivigni` to all paths.

### Fixed
- Release workflow now extracts the matching `CHANGELOG.md` section into
  the GitHub Release body (with auto-generated commit notes appended), and
  runs the test suite before building the bundle.

## [0.1.0] - Beta

First public beta of the agentic-legends platformer.

### Added
- Three story levels — Mona (Fork of Curiosity), Ducky (Bubbles of Clarity),
  Copilot (Goggles of Insight) — plus a Mainline boss skirmish.
- Adventurer with hearts, sprint, variable jump, fork double-jump, bubbles
  fog-clear, and goggles hidden-platform reveal.
- Double-tap-Space leap for reaching tall platforms (tip surfaced on the
  Copilot level).
- Per-level GH-600 *Developing in Agentic AI Systems* multiple-choice quiz
  shown after the reward pickup; correct answer required to advance.
- Full-screen reward poster modal (uses the official intro art with text)
  shown when collecting each gift.
- Pause (Esc), mute (M), restart (R), and quit (Q) controls; on-screen
  controls panel.
- GitHub Pages deploy workflow.

### Known limitations
- Audio is procedural (no licensed soundtrack yet).
- Single difficulty curve.
- No persistent save / leaderboard.
