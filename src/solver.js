import {
  SIZE,
  HALF,
  SUN,
  MOON,
  MARKER_EQUAL,
  SOLVED,
  STUCK,
  INVALID,
  opposite,
} from './constants.js';
import { mapGrid, forEachCell, everyCell } from './grid.js';

export { SUN, MOON, EMPTY, MARKER_EQUAL, MARKER_OPPOSITE, SOLVED, STUCK, INVALID } from './constants.js';

const INDICES = [...Array(SIZE).keys()];

// [partner offset, target offset]: a singleton next to an identical partner
// forbids the same value on the third cell of the triplet.
const TRIPLET_RULES = [[1, 2], [-1, -2], [2, 1]];

const inLine = i => i >= 0 && i < SIZE;

// returns 'SOLVED', 'STUCK', or 'INVALID'
// modifies initialBoard in place if it solves it
export function solve(initialBoard, markers) {
  const grid = mapGrid(initialBoard, val => (val === SUN || val === MOON ? [val] : [SUN, MOON]));

  function setDomain(r, c, d) {
    if (d.length === 0) return INVALID;
    if (grid[r][c].length > d.length) {
      grid[r][c] = d;
      return true; // changed
    }
    return false; // not changed
  }

  function removeValue(r, c, val) {
    const d = grid[r][c];
    if (d.length === 2) {
      if (d[0] === val) return setDomain(r, c, [d[1]]);
      if (d[1] === val) return setDomain(r, c, [d[0]]);
    }
    if (d.length === 1 && d[0] === val) return setDomain(r, c, []); // invalid!
    return false;
  }

  const markerLookup = {};
  const link = (from, to, type) => {
    const key = `${from.r},${from.c}`;
    if (!markerLookup[key]) markerLookup[key] = [];
    markerLookup[key].push({ r: to.r, c: to.c, type });
  };
  for (const m of markers) {
    const a = { r: m.r1, c: m.c1 };
    const b = { r: m.r2, c: m.c2 };
    link(a, b, m.type);
    link(b, a, m.type);
  }

  // Row and column views over the same grid, so line rules run once per line.
  const lines = [];
  for (let i = 0; i < SIZE; i++) {
    lines.push({ read: c => grid[i][c], write: (c, d) => setDomain(i, c, d) });
    lines.push({ read: r => grid[r][i], write: (r, d) => setDomain(r, i, d) });
  }

  let changed = true;
  while (changed) {
    changed = false;
    const track = res => {
      if (res === INVALID) return true;
      if (res) changed = true;
      return false;
    };

    let invalid = false;
    forEachCell((r, c) => {
      if (invalid) return;
      const domain = grid[r][c];
      if (domain.length === 0) {
        invalid = true;
        return;
      }
      if (domain.length !== 1) return;

      const val = domain[0];
      for (const neighbor of markerLookup[`${r},${c}`] || []) {
        const forbidden = neighbor.type === MARKER_EQUAL ? opposite(val) : val;
        if (track(removeValue(neighbor.r, neighbor.c, forbidden))) {
          invalid = true;
          return;
        }
      }
    });
    if (invalid) return INVALID;

    for (const line of lines) {
      if (track(solveLine(INDICES.map(line.read), line.write))) return INVALID;
    }
  }

  if (!everyCell((r, c) => grid[r][c].length === 1)) return STUCK;

  forEachCell((r, c) => {
    initialBoard[r][c] = grid[r][c][0];
  });

  return SOLVED;
}

function solveLine(domains, updateCb) {
  let changed = false;
  const track = res => {
    if (res === INVALID) return true;
    if (res) changed = true;
    return false;
  };

  const counts = { [SUN]: 0, [MOON]: 0 };
  for (const d of domains) {
    if (d.length === 1) counts[d[0]]++;
  }
  if (counts[SUN] > HALF || counts[MOON] > HALF) return INVALID;

  for (const val of [SUN, MOON]) {
    if (counts[val] !== HALF) continue;
    for (let i = 0; i < SIZE; i++) {
      if (domains[i].length === 2 && track(updateCb(i, [opposite(val)]))) return INVALID;
    }
  }

  for (let i = 0; i < SIZE; i++) {
    if (domains[i].length !== 1) continue;
    const val = domains[i][0];

    for (const [partnerOffset, targetOffset] of TRIPLET_RULES) {
      const partner = i + partnerOffset;
      const target = i + targetOffset;
      if (!inLine(partner) || !inLine(target)) continue;
      if (domains[partner].length !== 1 || domains[partner][0] !== val) continue;
      if (!domains[target].includes(val)) continue;

      const pruned = domains[target].filter(x => x !== val);
      if (track(updateCb(target, pruned))) return INVALID;
    }
  }

  return changed;
}
