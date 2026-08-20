import { describe, expect, it, vi } from 'vitest';
import { generateBoard } from '../src/generator.js';
import { SOLVED, solve } from '../src/solver.js';
import { cloneBoard, markerViolations, violations } from './helpers.js';

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const PREFILLED = { easy: 4, medium: 2, hard: 1 };

describe('generateBoard', () => {
  it('defaults to medium difficulty', () => {
    const { initialBoard } = generateBoard();
    expect(initialBoard.flat().filter((v) => v !== null)).toHaveLength(PREFILLED.medium);
  });

  it('treats an unknown difficulty like hard', () => {
    const { initialBoard } = generateBoard('impossible');
    expect(initialBoard.flat().filter((v) => v !== null)).toHaveLength(PREFILLED.hard);
  });

  for (const difficulty of DIFFICULTIES) {
    describe(`difficulty "${difficulty}"`, () => {
      it('returns a 6x6 solution obeying every rule', () => {
        const { solution } = generateBoard(difficulty);
        expect(solution).toHaveLength(6);
        solution.forEach((row) => expect(row).toHaveLength(6));
        expect(violations(solution)).toEqual([]);
      });

      it('places the expected number of clues, all matching the solution', () => {
        const { initialBoard, solution } = generateBoard(difficulty);
        const clues = [];
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 6; c++) {
            if (initialBoard[r][c] !== null) clues.push([r, c]);
          }
        }
        expect(clues).toHaveLength(PREFILLED[difficulty]);
        clues.forEach(([r, c]) => expect(initialBoard[r][c]).toBe(solution[r][c]));
      });

      it('emits markers that are consistent with the solution and adjacent', () => {
        const { solution, markers } = generateBoard(difficulty);
        expect(markers.length).toBeGreaterThan(0);
        for (const m of markers) {
          expect(['=', 'x']).toContain(m.type);
          const distance = Math.abs(m.r1 - m.r2) + Math.abs(m.c1 - m.c2);
          expect(distance).toBe(1);
        }
        expect(markerViolations(solution, markers)).toEqual([]);
      });

      it('produces a puzzle the solver can finish by pure deduction', () => {
        const { initialBoard, solution, markers } = generateBoard(difficulty);
        const board = cloneBoard(initialBoard);
        expect(solve(board, markers)).toBe(SOLVED);
        expect(board).toEqual(solution);
      });

      it('keeps only markers that are needed (minimal marker set)', () => {
        const { initialBoard, markers } = generateBoard(difficulty);
        markers.forEach((_, i) => {
          const reduced = markers.filter((_, j) => j !== i);
          expect(solve(cloneBoard(initialBoard), reduced)).not.toBe(SOLVED);
        });
      });
    });
  }

  it('generates different puzzles across calls', () => {
    const boards = new Set();
    for (let i = 0; i < 5; i++) {
      boards.add(JSON.stringify(generateBoard('medium').solution));
    }
    expect(boards.size).toBeGreaterThan(1);
  });

  it('is reproducible for a fixed random sequence', () => {
    const seeded = () => {
      let state = 123456789;
      return () => {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
      };
    };

    const random = vi.spyOn(Math, 'random');
    try {
      random.mockImplementation(seeded());
      const first = generateBoard('medium');
      random.mockImplementation(seeded());
      const second = generateBoard('medium');
      expect(second).toEqual(first);
    } finally {
      random.mockRestore();
    }
  });
});
