import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../src/game.js';
import { MOON, SUN } from '../src/solver.js';
import { SOLUTION, cloneBoard, createFakeUI, emptyBoard, markersFor } from './helpers.js';

vi.mock('../src/generator.js', () => ({
  generateBoard: vi.fn(),
}));

const { generateBoard } = await import('../src/generator.js');

function puzzle(clues = [[0, 0]]) {
  const initialBoard = emptyBoard();
  clues.forEach(([r, c]) => {
    initialBoard[r][c] = SOLUTION[r][c];
  });
  return { initialBoard, solution: cloneBoard(SOLUTION), markers: markersFor(SOLUTION) };
}

function fillAllBut(game, skip = []) {
  const skipped = new Set(skip.map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (game.fixed[r][c] || skipped.has(`${r},${c}`)) continue;
      game.board[r][c] = SOLUTION[r][c];
    }
  }
}

describe('Game', () => {
  let ui;
  let game;

  beforeEach(() => {
    vi.useFakeTimers();
    generateBoard.mockReset();
    generateBoard.mockImplementation(() => puzzle());
    ui = createFakeUI();
    game = new Game(ui);
  });

  afterEach(() => {
    game.stopTimer();
    vi.useRealTimers();
  });

  describe('newGame', () => {
    it('shows a loading state before generating', () => {
      game.newGame();
      expect(ui.calls[0]).toEqual(['showLoading', true]);
      expect(generateBoard).not.toHaveBeenCalled();
    });

    it('loads the generated puzzle and renders it', () => {
      game.newGame('hard');
      vi.advanceTimersByTime(50);

      expect(generateBoard).toHaveBeenCalledWith('hard');
      expect(game.board).toEqual(puzzle().initialBoard);
      expect(game.solution).toEqual(SOLUTION);
      expect(game.markers).toEqual(markersFor(SOLUTION));
      expect(game.isFinished).toBe(false);
      expect(ui.calls.at(-2)).toEqual(['showLoading', false]);
      expect(ui.calls.at(-1)).toEqual(['renderBoard', game]);
    });

    it('defaults to medium difficulty', () => {
      game.newGame();
      vi.advanceTimersByTime(50);
      expect(generateBoard).toHaveBeenCalledWith('medium');
    });

    it('marks pre-filled cells as fixed', () => {
      generateBoard.mockImplementation(() => puzzle([[1, 2], [3, 4]]));
      game.newGame();
      vi.advanceTimersByTime(50);

      expect(game.fixed[1][2]).toBe(true);
      expect(game.fixed[3][4]).toBe(true);
      expect(game.fixed[0][0]).toBe(false);
    });

    it('does not share array references with the generated board', () => {
      game.newGame();
      vi.advanceTimersByTime(50);
      game.board[5][5] = SUN;
      expect(game.solution[5][5]).toBe(SOLUTION[5][5]);
    });

    it('restarts the timer from zero', () => {
      game.newGame();
      vi.advanceTimersByTime(50);
      vi.advanceTimersByTime(3000);
      expect(game.elapsedSeconds).toBe(3);

      game.newGame();
      vi.advanceTimersByTime(50);
      expect(game.elapsedSeconds).toBe(0);
      expect(ui.namesOf('updateTimer').at(-1)).toEqual(['updateTimer', 0]);
    });
  });

  describe('toggleCell', () => {
    beforeEach(() => {
      generateBoard.mockImplementation(() => puzzle([[0, 0]]));
      game.newGame();
      vi.advanceTimersByTime(50);
      ui.calls.length = 0;
    });

    it('cycles empty -> sun -> moon -> empty', () => {
      game.toggleCell(1, 1);
      expect(game.board[1][1]).toBe(SUN);
      game.toggleCell(1, 1);
      expect(game.board[1][1]).toBe(MOON);
      game.toggleCell(1, 1);
      expect(game.board[1][1]).toBe(null);
      expect(ui.namesOf('updateCell')).toEqual([
        ['updateCell', 1, 1, SUN],
        ['updateCell', 1, 1, MOON],
        ['updateCell', 1, 1, null],
      ]);
    });

    it('ignores fixed cells', () => {
      game.toggleCell(0, 0);
      expect(game.board[0][0]).toBe(SOLUTION[0][0]);
      expect(ui.namesOf('updateCell')).toEqual([]);
    });

    it('ignores clicks once the puzzle is finished', () => {
      game.isFinished = true;
      game.toggleCell(2, 2);
      expect(game.board[2][2]).toBe(null);
      expect(ui.namesOf('updateCell')).toEqual([]);
    });

    it('wins when the last cell completes the solution', () => {
      fillAllBut(game, [[5, 5]]);
      const target = SOLUTION[5][5];
      while (game.board[5][5] !== target) game.toggleCell(5, 5);

      expect(game.isFinished).toBe(true);
      expect(game.timerInterval).toBe(null);
      expect(ui.namesOf('showWin')).toHaveLength(1);
    });

    it('does not win on a full but incorrect board', () => {
      fillAllBut(game);
      game.board[5][5] = SOLUTION[5][5] === SUN ? MOON : SUN;
      game.checkWin();

      expect(game.isFinished).toBe(false);
      expect(ui.namesOf('showWin')).toEqual([]);
    });
  });

  describe('timer', () => {
    it('reports elapsed whole seconds to the UI', () => {
      game.startTimer();
      vi.advanceTimersByTime(2500);
      expect(ui.namesOf('updateTimer')).toEqual([['updateTimer', 1], ['updateTimer', 2]]);
      expect(game.elapsedSeconds).toBe(2);
    });

    it('stops ticking after stopTimer', () => {
      game.startTimer();
      vi.advanceTimersByTime(1000);
      game.stopTimer();
      vi.advanceTimersByTime(5000);
      expect(game.elapsedSeconds).toBe(1);
      expect(game.timerInterval).toBe(null);
    });

    it('is safe to stop twice', () => {
      game.startTimer();
      game.stopTimer();
      expect(() => game.stopTimer()).not.toThrow();
    });

    it('resetTimer clears the elapsed time and notifies the UI', () => {
      game.startTimer();
      vi.advanceTimersByTime(4000);
      game.resetTimer();
      expect(game.elapsedSeconds).toBe(0);
      expect(game.timerInterval).toBe(null);
      expect(ui.namesOf('updateTimer').at(-1)).toEqual(['updateTimer', 0]);
    });
  });
});
