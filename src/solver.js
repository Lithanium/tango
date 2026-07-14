export const SUN = 'S';
export const MOON = 'M';
export const EMPTY = null;

export const MARKER_EQUAL = '=';
export const MARKER_OPPOSITE = 'x';

export const SOLVED = 'SOLVED';
export const STUCK = 'STUCK';
export const INVALID = 'INVALID';

const SIZE = 6;

// returns 'SOLVED', 'STUCK', or 'INVALID'
// modifies initialBoard in place if it solves it
export function solve(initialBoard, markers) {
  let grid = [];
  for (let r = 0; r < SIZE; r++) {
    let row = [];
    for (let c = 0; c < SIZE; c++) {
      if (initialBoard[r][c] === SUN) row.push([SUN]);
      else if (initialBoard[r][c] === MOON) row.push([MOON]);
      else row.push([SUN, MOON]);
    }
    grid.push(row);
  }

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
  for (const m of markers) {
    const k1 = `${m.r1},${m.c1}`;
    const k2 = `${m.r2},${m.c2}`;
    if (!markerLookup[k1]) markerLookup[k1] = [];
    if (!markerLookup[k2]) markerLookup[k2] = [];
    markerLookup[k1].push({ r: m.r2, c: m.c2, type: m.type });
    markerLookup[k2].push({ r: m.r1, c: m.c1, type: m.type });
  }

  let changed = true;
  while (changed) {
    changed = false;
    
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const domain = grid[r][c];
        if (domain.length === 0) return INVALID;
        
        if (domain.length === 1) {
          const val = domain[0];
          const opp = val === SUN ? MOON : SUN;
          const k = `${r},${c}`;
          if (markerLookup[k]) {
            for (const neighbor of markerLookup[k]) {
              const res = removeValue(neighbor.r, neighbor.c, neighbor.type === '=' ? opp : val);
              if (res === INVALID) return INVALID;
              if (res) changed = true;
            }
          }
        }
      }
    }
    
    for (let i = 0; i < SIZE; i++) {
      let resRow = solveLine(
        [0,1,2,3,4,5].map(c => grid[i][c]),
        (c, newDomain) => setDomain(i, c, newDomain)
      );
      if (resRow === INVALID) return INVALID;
      if (resRow) changed = true;
      
      let resCol = solveLine(
        [0,1,2,3,4,5].map(r => grid[r][i]),
        (r, newDomain) => setDomain(r, i, newDomain)
      );
      if (resCol === INVALID) return INVALID;
      if (resCol) changed = true;
    }
  }

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].length !== 1) return STUCK;
    }
  }
  
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      initialBoard[r][c] = grid[r][c][0];
    }
  }
  
  return SOLVED;
}

function solveLine(domains, updateCb) {
  let changed = false;
  let suns = 0, moons = 0;
  for (const d of domains) {
    if (d.length === 1) {
      if (d[0] === SUN) suns++;
      else moons++;
    }
  }
  if (suns > 3 || moons > 3) return INVALID;
  if (suns === 3) {
    for (let i = 0; i < 6; i++) {
      if (domains[i].length === 2) {
        let res = updateCb(i, [MOON]);
        if (res === INVALID) return INVALID;
        if (res) changed = true;
      }
    }
  }
  if (moons === 3) {
    for (let i = 0; i < 6; i++) {
      if (domains[i].length === 2) {
        let res = updateCb(i, [SUN]);
        if (res === INVALID) return INVALID;
        if (res) changed = true;
      }
    }
  }
  
  for (let i = 0; i < 6; i++) {
    const d = domains[i];
    if (d.length === 1) {
      const val = d[0];
      if (i < 4 && domains[i+1].length === 1 && domains[i+1][0] === val) {
        if (domains[i+2].includes(val)) {
          let newD = domains[i+2].filter(x => x !== val);
          let res = updateCb(i+2, newD);
          if (res === INVALID) return INVALID;
          if (res) changed = true;
        }
      }
      if (i > 1 && domains[i-1].length === 1 && domains[i-1][0] === val) {
        if (domains[i-2].includes(val)) {
          let newD = domains[i-2].filter(x => x !== val);
          let res = updateCb(i-2, newD);
          if (res === INVALID) return INVALID;
          if (res) changed = true;
        }
      }
      if (i < 4 && domains[i+2].length === 1 && domains[i+2][0] === val) {
        if (domains[i+1].includes(val)) {
          let newD = domains[i+1].filter(x => x !== val);
          let res = updateCb(i+1, newD);
          if (res === INVALID) return INVALID;
          if (res) changed = true;
        }
      }
    }
  }
  return changed;
}
