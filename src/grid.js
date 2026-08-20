import { SIZE, EMPTY } from './constants.js';

export function createGrid(fill = EMPTY) {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => fill));
}

export function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

export function mapGrid(grid, fn) {
  return grid.map((row, r) => row.map((val, c) => fn(val, r, c)));
}

export function forEachCell(fn) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      fn(r, c);
    }
  }
}

export function allCells() {
  const cells = [];
  forEachCell((r, c) => cells.push({ r, c }));
  return cells;
}

export function everyCell(predicate) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!predicate(r, c)) return false;
    }
  }
  return true;
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
