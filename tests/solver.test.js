import { describe, expect, it } from 'vitest';
import { INVALID, MOON, SOLVED, STUCK, SUN, solve } from '../src/solver.js';
import {
  SOLUTION,
  boardFromRows,
  cloneBoard,
  emptyBoard,
  markersFor,
  markerViolations,
  violations,
} from './helpers.js';

describe('solve', () => {
  it('accepts an already complete valid board', () => {
    const board = cloneBoard(SOLUTION);
    expect(solve(board, [])).toBe(SOLVED);
    expect(board).toEqual(SOLUTION);
  });

  it('gets stuck on an empty board with no markers', () => {
    expect(solve(emptyBoard(), [])).toBe(STUCK);
  });

  it('leaves the board untouched when it cannot solve it', () => {
    const board = emptyBoard();
    expect(solve(board, [])).toBe(STUCK);
    expect(board).toEqual(emptyBoard());
  });

  it('writes the solution back into the board it was given', () => {
    const board = cloneBoard(SOLUTION);
    board[0][0] = null;
    board[0][4] = null;
    expect(solve(board, [])).toBe(SOLVED);
    expect(board).toEqual(SOLUTION);
  });

  it('fills a line once three suns are placed (balance rule)', () => {
    // Row 0 and column 0 are pinned; the rest follows from balance + triplets.
    const board = boardFromRows([
      'SSMMSM',
      'M.....',
      'M.....',
      'S.....',
      'M.....',
      'S.....',
    ]);
    expect(solve(board, markersFor(SOLUTION))).toBe(SOLVED);
    expect(board).toEqual(SOLUTION);
  });

  it('applies the no-triplet rule to reject a third identical symbol', () => {
    // (0,2) can only be a moon: two suns already sit to its left.
    const board = boardFromRows([
      'SS.MSM',
      'MMSSMS',
      'MSSMSM',
      'SMMSMS',
      'MSMSSM',
      'SMSMMS',
    ]);
    expect(solve(board, [])).toBe(SOLVED);
    expect(board[0][2]).toBe(MOON);
  });

  it('rejects a line with four suns', () => {
    const board = emptyBoard();
    // 4 suns in row 0 breaks the balance rule (and there is no triplet).
    board[0] = [SUN, SUN, MOON, SUN, SUN, MOON];
    expect(solve(board, [])).toBe(INVALID);
  });

  it('rejects a line containing a triplet', () => {
    const board = emptyBoard();
    board[0] = [SUN, SUN, SUN, MOON, MOON, MOON];
    expect(solve(board, [])).toBe(INVALID);
  });

  it('propagates an "=" marker to the neighbouring cell', () => {
    const board = emptyBoard();
    board[0][0] = SUN;
    const markers = [{ r1: 0, c1: 0, r2: 0, c2: 1, type: '=' }];
    // (0,1) must match (0,0), so a moon there is a contradiction.
    board[0][1] = MOON;
    expect(solve(board, markers)).toBe(INVALID);
  });

  it('propagates an "x" marker to the neighbouring cell', () => {
    const board = emptyBoard();
    board[0][0] = SUN;
    const markers = [{ r1: 0, c1: 0, r2: 1, c2: 0, type: 'x' }];
    board[1][0] = SUN;
    expect(solve(board, markers)).toBe(INVALID);
  });

  it('solves from a single clue when every marker is present', () => {
    const board = emptyBoard();
    board[0][0] = SOLUTION[0][0];
    expect(solve(board, markersFor(SOLUTION))).toBe(SOLVED);
    expect(board).toEqual(SOLUTION);
  });

  it('produces a board that satisfies every rule and marker', () => {
    const markers = markersFor(SOLUTION);
    const board = emptyBoard();
    board[0][0] = SOLUTION[0][0];
    expect(solve(board, markers)).toBe(SOLVED);
    expect(violations(board)).toEqual([]);
    expect(markerViolations(board, markers)).toEqual([]);
  });

  it('detects contradictory markers on the same pair', () => {
    const board = emptyBoard();
    board[0][0] = SUN;
    const markers = [
      { r1: 0, c1: 0, r2: 0, c2: 1, type: '=' },
      { r1: 0, c1: 0, r2: 0, c2: 1, type: 'x' },
    ];
    expect(solve(board, markers)).toBe(INVALID);
  });
});
