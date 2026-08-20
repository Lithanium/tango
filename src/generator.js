import { SIZE, HALF, SUN, MOON, MARKER_EQUAL, MARKER_OPPOSITE, SOLVED } from './constants.js';
import { solve } from './solver.js';
import { createGrid, cloneGrid, forEachCell, allCells, shuffle } from './grid.js';

const PREFILLED_BY_DIFFICULTY = {
  easy: 4,
  medium: 2,
  hard: 1, // must be >= 1, else sun/moon swap breaks uniqueness
};

export function generateBoard(difficulty = 'medium') {
  let solution;
  let maxRetries = 50;
  let markers;
  let initialBoard;

  while (maxRetries-- > 0) {
    solution = generateCompleteBoard();
    if (!solution) continue;
    
    const pairs = [];
    forEachCell((r, c) => {
      if (c < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r, c2: c + 1 });
      if (r < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r + 1, c2: c });
    });
    shuffle(pairs);
    
    markers = [];
    
    const targetPrefilled = PREFILLED_BY_DIFFICULTY[difficulty] ?? PREFILLED_BY_DIFFICULTY.hard;
    
    initialBoard = createGrid();
    
    const cells = shuffle(allCells());
    for (let i = 0; i < targetPrefilled; i++) {
      const { r, c } = cells[i];
      initialBoard[r][c] = solution[r][c];
    }
    
    let isSolvable = false;
    for (const pair of pairs) {
      const type = solution[pair.r1][pair.c1] === solution[pair.r2][pair.c2]
        ? MARKER_EQUAL
        : MARKER_OPPOSITE;
      markers.push({ ...pair, type });
      
      if (isSolvedBy(initialBoard, markers)) {
        isSolvable = true;
        break;
      }
    }
    
    if (isSolvable) {
      // Optimize markers: remove redundant ones.
      // A single greedy pass finds a local minimum that depends on order,
      // so for hard mode we run multiple shuffled passes and keep the
      // sparsest result to make the board harder.
      const minimizePasses = difficulty === 'hard' ? 8 : 1;
      let bestMarkers = minimizeMarkers(markers, initialBoard);
      for (let p = 1; p < minimizePasses; p++) {
        const candidate = minimizeMarkers(shuffle([...markers]), initialBoard);
        if (candidate.length < bestMarkers.length) {
          bestMarkers = candidate;
        }
      }
      markers = bestMarkers;
      return { initialBoard, solution, markers };
    }
  }
  
  throw new Error("Failed to generate a solvable board");
}

// solve() mutates the board it is given, so always probe on a copy.
function isSolvedBy(board, markers) {
  return solve(cloneGrid(board), markers) === SOLVED;
}

function minimizeMarkers(markers, initialBoard) {
  const result = [...markers];
  for (let i = result.length - 1; i >= 0; i--) {
    const temp = result[i];
    result.splice(i, 1);
    if (!isSolvedBy(initialBoard, result)) {
      result.splice(i, 0, temp); // put it back
    }
  }
  return result;
}

function generateCompleteBoard() {
  const grid = createGrid();
  
  function isValidPrefix(r, c, val) {
    grid[r][c] = val;
    
    const valid = isValidLinePrefix(i => grid[r][i], c) && isValidLinePrefix(i => grid[i][c], r);
    
    grid[r][c] = null;
    return valid;
  }
  
  function backtrack(idx) {
    if (idx === SIZE * SIZE) return true;
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    
    for (const val of shuffle([SUN, MOON])) {
      if (isValidPrefix(r, c, val)) {
        grid[r][c] = val;
        if (backtrack(idx + 1)) return true;
        grid[r][c] = null;
      }
    }
    return false;
  }
  
  if (backtrack(0)) return grid;
  return null;
}

// Checks balance and no-triplet rules over the filled prefix [0..last] of a line.
function isValidLinePrefix(read, last) {
  let suns = 0;
  let moons = 0;
  for (let i = 0; i <= last; i++) {
    if (read(i) === SUN) suns++;
    else moons++;
    if (i >= 2 && read(i) === read(i - 1) && read(i) === read(i - 2)) return false;
  }
  return suns <= HALF && moons <= HALF;
}
