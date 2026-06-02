# Flappy Bird

A polished browser-based clone of the classic **Flappy Bird** game, built with vanilla HTML, CSS, and JavaScript using the Canvas 2D API.

## Overview

The player controls a bird that must navigate through an endless series of pipe gaps. Each successful pass through a gap increases the score. The game gets progressively harder as the score climbs — pipes move faster, gaps shrink, and spawn intervals shorten.

## Features

- **Smooth physics-based gameplay** with gravity and flap mechanics
- **Parallax scrolling** background (clouds, far hills, near hills)
- **Animated bird** with rotation, flapping wings, and body tilt
- **Particle effects** on scoring and on game over
- **Dynamic difficulty scaling** that ramps from Easy → Normal → Hard
- **Score pop animation** when scoring
- **Best score tracking** (in-session)
- **Three input methods**: Space/ArrowUp keys, mouse click, and touch
- **Responsive layout** that shrinks on small screens
- **Start and Game Over overlays** with HUD

## Project Structure

```
flappy-bird/
├── index.html          # Markup, canvas, overlays, HUD
├── flappy-style.css    # Layout, overlays, animations, responsive rules
├── flappy-script.js    # Game loop, physics, rendering, input
└── README.md           # This file
```

## Getting Started

This is a static site — no build step or dependencies are required.

1. Clone or download the project folder.
2. Open `index.html` directly in any modern browser, **or** serve the folder with a local server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node (http-server)
   npx http-server
   ```
3. Visit `http://localhost:8000` (or just open the HTML file).

## How to Play

| Action            | Input                       |
| ----------------- | --------------------------- |
| Start / Restart   | `Space`, `ArrowUp`, click, or tap |
| Flap (in game)    | Same as above               |

Avoid the pipes and the ground. The game ends on any collision.

## Controls Reference

Implemented in `flappy-script.js:520-548`:

- **Keyboard**: `keydown` listener for `Space` and `ArrowUp`
- **Mouse**: `click` on the canvas or any overlay
- **Touch**: `touchstart` on the canvas

All inputs funnel through `handleInput()`, which dispatches based on `gameState`:
- `start` → start the game
- `playing` → flap
- `gameover` → restart

## Game Architecture

The game uses a single `requestAnimationFrame` loop with three states managed by `gameState`:

```
'start' → 'playing' → 'gameover'
   ↑          ↓          ↓
   └──────────┴──────────┘
```

### Core Modules (in `flappy-script.js`)

| Concern             | Function(s)                              |
| ------------------- | ---------------------------------------- |
| Main loop           | `gameLoop()` (line 514)                  |
| Update step         | `update()` (line 208)                    |
| Render step         | `draw()` (line 494)                      |
| Bird setup          | `initBird()` (line 156)                  |
| Game reset          | `initGame()` (line 169)                  |
| Input dispatcher    | `handleInput()` (line 521)               |
| Pipe generation     | `spawnPipe()` (line 194)                 |
| Particles           | `spawnParticles`, `updateParticles`, `drawParticles` (lines 101-137) |
| Background scenery  | `initClouds`, `initHills`, `drawCloud`, `drawHill` (lines 78-98, 361-383) |
| Difficulty scaling  | `updateDifficulty()` (line 140)          |

## Game Constants

Tuned for a snappy, responsive feel (`flappy-script.js:12-34`):

| Constant                      | Value     | Purpose                              |
| ----------------------------- | --------- | ------------------------------------ |
| `GRAVITY`                     | `0.38`    | Downward acceleration per frame      |
| `FLAP_FORCE`                  | `-9`      | Upward velocity on flap              |
| `PIPE_WIDTH`                  | `60`      | Width of every pipe                  |
| `BASE_PIPE_SPEED`             | `3`       | Starting horizontal scroll speed     |
| `MAX_PIPE_SPEED`              | `6`       | Cap on speed scaling                 |
| `BASE_PIPE_GAP`               | `150`     | Starting vertical gap between pipes  |
| `MIN_PIPE_GAP`                | `110`     | Floor on gap scaling                 |
| `BASE_PIPE_INTERVAL`          | `1600 ms` | Starting spawn interval              |
| `MIN_PIPE_INTERVAL`           | `1000 ms` | Floor on spawn interval              |
| `BIRD_WIDTH` / `BIRD_HEIGHT`  | `40 / 30` | Bird hitbox                          |
| `BIRD_X`                      | `80`      | Fixed horizontal bird position       |
| `GROUND_HEIGHT`               | `80`      | Height of ground strip               |

## Difficulty Scaling

Implemented in `updateDifficulty()` (`flappy-script.js:140`). As the score increases:

- **Speed** scales up at `+0.08` per point, capped at `6`
- **Gap** shrinks by `2px` per point, floored at `110px`
- **Spawn interval** shortens by `10ms` per point, floored at `1000ms`

The HUD label in the top-right (`#hud`) updates as follows:

| Score range           | Label    |
| --------------------- | -------- |
| 0–3                   | Easy     |
| 4–9                   | Normal   |
| 10+                   | Hard     |

## Visuals

- **Sky** — vertical linear gradient (`#70c5ce` → `#87ceeb`)
- **Hills** — two parallax layers drawn as quadratic curves
- **Clouds** — translucent ellipse clusters
- **Ground** — solid band with a thin green top line and animated diagonal stripes
- **Pipes** — body + cap, with a vertical highlight stripe
- **Bird** — yellow body, lighter wing, white eye with black pupil, red beak
- **Particles** — small fading circles for score/hit feedback

## File-by-File Notes

### `index.html`
Defines the `<canvas id="gameCanvas">` (400×600), the `#startOverlay` and `#gameOverOverlay` panels, the `#scoreDisplay`, and the `#hud` difficulty indicator. Links the stylesheet and loads the game script at the end of `<body>`.

### `flappy-style.css`
- Centers the game container on a dark gradient background.
- Styles overlays with a translucent dark backdrop and a pulsing hint line.
- Adds the `scorePop` keyframe animation triggered when a point is scored.
- Defines a media query that shrinks the game to 320×480 below `480px` viewport width.

### `flappy-script.js`
- Holds all game state in module-scope `let` variables.
- Uses `requestAnimationFrame` for the loop.
- Drawing is done with raw Canvas 2D calls (`fillRect`, `ellipse`, `quadraticCurveTo`, etc.).
- Best score lives in memory only (no `localStorage` persistence).

## Customization

Common tweaks:

- **Make it easier**: increase `BASE_PIPE_GAP` or decrease `BASE_PIPE_SPEED`.
- **Make it harder**: lower `MIN_PIPE_GAP` or raise `MAX_PIPE_SPEED`.
- **Change bird color**: edit `COLORS.birdBody` / `COLORS.birdWing` in `flappy-script.js:48`.
- **Persist best score**: add `localStorage.setItem('flappyBest', bestScore)` in `gameOver()` and read it in `initGame()`.

## Browser Support

Works in any modern browser with Canvas 2D and ES6 support (Chrome, Firefox, Edge, Safari). Touch input requires a touch-capable device.

## License

This is a personal/educational project. The Flappy Bird concept is © .Gears, used here for learning purposes.
