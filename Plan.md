# Tango Puzzle Trainer — Implementation Plan

A browser-only (no backend) web app that generates and presents random, uniquely-solvable Tango (LinkedIn daily puzzle) boards, with a live timer and validation.

---

## Background

**Tango** is LinkedIn's daily 6×6 logic puzzle. The player fills each cell with a ☀️ (sun) or 🌙 (moon) obeying three rules:

| Rule | Description |
|---|---|
| **Balance** | Every row and column must contain exactly 3 suns and 3 moons. |
| **No Triplet** | No three consecutive identical symbols in any row or column. |
| **Adjacency Markers** | `=` means the two touching cells must be the **same** symbol; `×` means they must be **opposite**. |

Every puzzle has a **unique, deductively reachable** solution, and each cell can be determined using only single-row/column reasoning combined with adjacency markers — no cross-row/column comparison is required.

---

## Proposed Changes

### Component Architecture

```
index.html          — Shell, Google Fonts link, meta tags
style.css           — All visual styling (dark mode, animations, glassmorphism)
src/
  generator.js      — Board generation + marker placement + solvability check
  solver.js         — Constraint-propagation solver (pure logic, no guessing)
  game.js           — Game state, timer, input handling, win detection
  ui.js             — DOM rendering, cell click handling, animations
main.js             — Entry point — ties everything together
```

All files are plain ES modules (no build step needed).

---

### [NEW] `index.html`

- Semantic HTML5 shell
- Google Fonts (`Inter` / `Outfit`) loaded in `<head>`
- SEO meta tags: title, description, viewport, theme-color
- Structure:
  - **Header** — title "Tango Trainer", subtitle, `New Game` button
  - **Timer bar** — `HH:MM:SS` live stopwatch (truncated to seconds)
  - **Board container** — dynamically injected 6×6 grid
  - **Status banner** — shows "Solved! 🎉" when complete
  - **Rules modal** — toggled with a `?` button

---

### [NEW] `style.css`

Design system tokens and full visual styling:

- **Dark mode palette**: Deep navy background (`#0a0e1a`), card glass panels, neon-teal accent
- **Glassmorphism** board card: `backdrop-filter: blur(12px)`, subtle border
- **Smooth CSS transitions** on all cell fills (symbol swap animation)
- **Hover glow** on clickable cells
- Marker rendering: `=` and `×` as inline SVG badges on cell borders
- **Win animation**: shimmer wave sweeps board on completion
- **Timer** styled as a monospace pill badge
- Responsive: works on mobile down to 360px wide

---

### [NEW] `src/generator.js`

#### Step 1 — Generate a valid complete solution

Uses a **backtracking fill** that respects all four rules:

```
function generateSolution():
  grid = 6×6 array of null
  fillCell(0, 0)   // recursive backtracking

function fillCell(row, col):
  try each symbol in shuffled [SUN, MOON]:
    if isValid(grid, row, col, symbol):
      grid[row][col] = symbol
      if last cell → return true
      if fillCell(next) → return true
  return false   // backtrack

isValid checks:
  • row balance so far (≤3 of each)
  • column balance so far
  • no 3 consecutive in row
  • no 3 consecutive in column
  • if row is complete → uniqueness against all prior complete rows
  • if column is complete → uniqueness against all prior complete columns
```

#### Step 2 — Place adjacency markers

After a valid grid exists, candidate adjacent pairs (horizontal + vertical) are collected and shuffled. Markers are added greedily:

- For each candidate pair, assign the **truthful** marker (`=` if same, `×` if different).
- Tentatively add the marker, run the solver (Step 3), check if the puzzle is now **fully solvable without guessing** using only constraint propagation on individual rows/columns.
- Keep adding markers until fully solvable or no more candidates.
- If the puzzle cannot be made solvable, regenerate the solution.

Target: **6–12 markers** (tunable per difficulty).

#### Step 3 — Solvability constraint (key requirement)

> "Considering at most one row/column at a time should lead to a unique solution."

This means **no bifurcation / trial-and-error is required**. The constraint-propagation solver must be able to deduce every cell purely from single-line (row or column) analysis combined with marker propagation.

---

### [NEW] `src/solver.js`

A **pure constraint-propagation solver** (no backtracking). It returns `SOLVED`, `STUCK` (ambiguous, needs more clues), or `INVALID`.

#### Domain representation

Each cell holds a domain: `{SUN, MOON}` initially, reduces to `{SUN}` or `{MOON}` when determined.

#### Inference rules applied iteratively until stable:

| Rule | Description |
|---|---|
| **Balance forcing** | If a row/column already has 3 suns → fill all remaining cells with moon (and vice-versa). |
| **Triplet prevention** | If two adjacent cells in a row/col are both `X`, the cell immediately before and after must be `¬X`. |
| **Marker propagation** | If cell A is determined and shares an `=` or `×` marker with cell B, determine B accordingly. Cascades transitively. |
| **Unique-row/col inference** | If a row has only one remaining valid pattern (given the uniqueness constraint vs already-complete rows), fill it. |
| **Constraint enumeration** | For a row/column, enumerate all valid candidate sequences consistent with current domains. Any symbol that is the **same across all valid candidates** for a cell is forced. |

The solver loop:

```
repeat:
  changed = false
  for each row: apply all inference rules → mark changed if domains shrink
  for each col: apply all inference rules → mark changed if domains shrink
until not changed

if all cells determined → SOLVED
else → STUCK
```

Only `SOLVED` boards pass the generation filter.

---

### [NEW] `src/game.js`

- **State**: `board` (current player fills), `solution`, `markers`, `timerStart`, `timerInterval`
- **`newGame()`**: calls generator → resets state → calls `ui.render()`
- **`toggleCell(row, col)`**: cycles `null → SUN → MOON → null` on click
- **`checkWin()`**: deep-equals `board` to `solution` → stops timer → triggers win animation
- **Timer**: `setInterval` every 1 000 ms → formats as `MM:SS` (or `HH:MM:SS` past 1 hour) truncated to whole seconds

---

### [NEW] `src/ui.js`

- Renders the 6×6 grid as a CSS Grid
- Each cell is a `<div class="cell">` with a data attribute for position
- Markers rendered as absolutely positioned `<span>` badges on shared cell edges
- Cell click delegates to `game.toggleCell()`
- On win: adds `.solved` class to board → triggers shimmer keyframe animation
- Difficulty selector (Easy / Medium / Hard) controls number of pre-filled clue cells and marker count

---

### [NEW] `main.js`

- Imports all modules
- On `DOMContentLoaded`: calls `newGame()`
- Wires `New Game` button, difficulty selector, `?` rules modal

---

## Solvability Guarantee

The critical constraint *"at most one row/column at a time leads to unique solution"* is enforced by requiring `solver.js` to return `SOLVED` (no `STUCK`) before a board is accepted. Because the solver uses only single-line inferences (plus marker propagation), any board it can solve is guaranteed to be solvable by a human using the same logic.

---

## Verification Plan

### Automated (in-browser console)

- Run `generateBoard()` 100 times → assert all return a valid, unique solution
- Run `solver(board, markers)` on generated boards → assert all return `SOLVED`
- Stress test: confirm timer accuracy (starts on first move, stops exactly on win)

### Manual Verification

- Play several generated boards from start to finish and confirm they are solvable by deduction only
- Verify win state triggers correctly when the board matches the solution
- Check responsive layout on both desktop and mobile viewports

---

## Open Questions

> [!IMPORTANT]
> **Grid size**: LinkedIn Tango is always 6×6. Should the trainer support other sizes (e.g. 8×8 for hard mode), or stay at 6×6 only?

> [!IMPORTANT]
> **Difficulty model**: Currently planned as controlling the number of markers (more markers = easier). Should difficulty also control the number of pre-revealed cells (cells shown with their solution value from the start)?

> [!NOTE]
> **Timer behaviour**: Should the timer start immediately when the board loads, or only on the first cell interaction? LinkedIn starts immediately — which do you prefer?

> [!NOTE]
> **Persistence**: Should the current board + timer state be saved to `localStorage` so that a page refresh resumes the same puzzle?
