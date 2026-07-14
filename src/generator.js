import { SUN, MOON, solve, SOLVED } from './solver.js';

const SIZE = 6;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function generateBoard(difficulty = 'medium') {
  let solution;
  let maxRetries = 50;
  let markers;
  let initialBoard;

  while (maxRetries-- > 0) {
    solution = generateCompleteBoard();
    if (!solution) continue;
    
    const pairs = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (c < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r, c2: c + 1 });
        if (r < SIZE - 1) pairs.push({ r1: r, c1: c, r2: r + 1, c2: c });
      }
    }
    shuffle(pairs);
    
    markers = [];
    
    let targetPrefilled = 0;
    if (difficulty === 'easy') targetPrefilled = 4;
    else if (difficulty === 'medium') targetPrefilled = 2;
    else targetPrefilled = 1; // hard — must be >= 1, else sun/moon swap breaks uniqueness
    
    initialBoard = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
    
    if (targetPrefilled > 0) {
      let cells = [];
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          cells.push({r, c});
        }
      }
      shuffle(cells);
      for (let i = 0; i < targetPrefilled; i++) {
        const {r, c} = cells[i];
        initialBoard[r][c] = solution[r][c];
      }
    }
    
    let isSolvable = false;
    for (const pair of pairs) {
      const type = solution[pair.r1][pair.c1] === solution[pair.r2][pair.c2] ? '=' : 'x';
      markers.push({ ...pair, type });
      
      let testBoard = initialBoard.map(row => [...row]);
      if (solve(testBoard, markers) === SOLVED) {
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
        const shuffled = [...markers];
        shuffle(shuffled);
        const candidate = minimizeMarkers(shuffled, initialBoard);
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

function minimizeMarkers(markers, initialBoard) {
  const result = [...markers];
  for (let i = result.length - 1; i >= 0; i--) {
    const temp = result[i];
    result.splice(i, 1);
    const testBoard = initialBoard.map(row => [...row]);
    if (solve(testBoard, result) !== SOLVED) {
      result.splice(i, 0, temp); // put it back
    }
  }
  return result;
}

function generateCompleteBoard() {
  const grid = Array(SIZE).fill(null).map(() => Array(SIZE).fill(null));
  
  function isValidPrefix(r, c, val) {
    grid[r][c] = val;
    
    let valid = true;
    
    let suns = 0, moons = 0;
    for (let i = 0; i <= c; i++) {
      if (grid[r][i] === SUN) suns++;
      else moons++;
      if (i >= 2 && grid[r][i] === grid[r][i-1] && grid[r][i] === grid[r][i-2]) valid = false;
    }
    if (suns > 3 || moons > 3) valid = false;
    
    suns = 0; moons = 0;
    for (let i = 0; i <= r; i++) {
      if (grid[i][c] === SUN) suns++;
      else moons++;
      if (i >= 2 && grid[i][c] === grid[i-1][c] && grid[i][c] === grid[i-2][c]) valid = false;
    }
    if (suns > 3 || moons > 3) valid = false;
    
    grid[r][c] = null;
    return valid;
  }
  
  function backtrack(idx) {
    if (idx === SIZE * SIZE) return true;
    const r = Math.floor(idx / SIZE);
    const c = idx % SIZE;
    
    const options = [SUN, MOON];
    shuffle(options);
    
    for (const val of options) {
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
