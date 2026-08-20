import { SUN, MOON } from '../src/solver.js';

export const SIZE = 6;

// A valid 6x6 solution: rows come in complementary pairs, which guarantees
// 3 suns / 3 moons per column and no vertical triplets.
export const SOLUTION = [
  ['S', 'S', 'M', 'M', 'S', 'M'],
  ['M', 'M', 'S', 'S', 'M', 'S'],
  ['M', 'S', 'S', 'M', 'S', 'M'],
  ['S', 'M', 'M', 'S', 'M', 'S'],
  ['M', 'S', 'M', 'S', 'S', 'M'],
  ['S', 'M', 'S', 'M', 'M', 'S'],
];

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function emptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
}

export function boardFromRows(rows) {
  return rows.map((row) => [...row].map((ch) => (ch === '.' ? null : ch)));
}

export function adjacentPairs() {
  const pairs = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (c < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r, c2: c + 1 });
      if (r < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r + 1, c2: c });
    }
  }
  return pairs;
}

export function markersFor(solution) {
  return adjacentPairs().map((pair) => ({
    ...pair,
    type: solution[pair.r1][pair.c1] === solution[pair.r2][pair.c2] ? '=' : 'x',
  }));
}

// Checks the balance and no-triplet rules on a fully filled board.
export function violations(board) {
  const problems = [];
  const lines = [];
  for (let i = 0; i < SIZE; i++) {
    lines.push({ name: `row ${i}`, cells: board[i] });
    lines.push({ name: `col ${i}`, cells: board.map((row) => row[i]) });
  }
  for (const { name, cells } of lines) {
    const suns = cells.filter((v) => v === SUN).length;
    const moons = cells.filter((v) => v === MOON).length;
    if (suns !== 3 || moons !== 3) problems.push(`${name} unbalanced (${suns}S/${moons}M)`);
    for (let i = 0; i + 2 < SIZE; i++) {
      if (cells[i] !== null && cells[i] === cells[i + 1] && cells[i] === cells[i + 2]) {
        problems.push(`${name} has a triplet at ${i}`);
      }
    }
  }
  return problems;
}

export function markerViolations(board, markers) {
  return markers
    .filter((m) => {
      const same = board[m.r1][m.c1] === board[m.r2][m.c2];
      return m.type === '=' ? !same : same;
    })
    .map((m) => `marker ${m.type} between (${m.r1},${m.c1}) and (${m.r2},${m.c2})`);
}

export function createFakeUI() {
  return {
    calls: [],
    game: null,
    setGame(game) {
      this.game = game;
    },
    showLoading(isLoading) {
      this.calls.push(['showLoading', isLoading]);
    },
    renderBoard(game) {
      this.calls.push(['renderBoard', game]);
    },
    updateCell(r, c, val) {
      this.calls.push(['updateCell', r, c, val]);
    },
    updateTimer(seconds) {
      this.calls.push(['updateTimer', seconds]);
    },
    showWin() {
      this.calls.push(['showWin']);
    },
    namesOf(name) {
      return this.calls.filter((call) => call[0] === name);
    },
  };
}
