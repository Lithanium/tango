import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UI } from '../src/ui.js';
import { MOON, SUN } from '../src/solver.js';
import { SOLUTION, emptyBoard } from './helpers.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="board-container"></div>
    <div id="timer-display"></div>
    <div id="status-banner"></div>
  `;
}

function fakeGame({ board = emptyBoard(), markers = [], fixed } = {}) {
  return {
    board,
    markers,
    fixed: fixed ?? board.map((row) => row.map(() => false)),
    toggleCell: vi.fn(),
  };
}

describe('UI', () => {
  let ui;

  beforeEach(() => {
    setupDom();
    ui = new UI('board-container', 'timer-display');
  });

  it('looks up its container and timer elements', () => {
    expect(ui.container).toBe(document.getElementById('board-container'));
    expect(ui.timerEl).toBe(document.getElementById('timer-display'));
    expect(ui.game).toBe(null);
  });

  it('stores the game passed to setGame', () => {
    const game = fakeGame();
    ui.setGame(game);
    expect(ui.game).toBe(game);
  });

  describe('showLoading', () => {
    it('renders a placeholder and hides the win banner', () => {
      document.getElementById('status-banner').classList.add('show');
      ui.showLoading(true);
      expect(ui.container.querySelector('.loading').textContent).toBe('Generating...');
      expect(document.getElementById('status-banner').classList.contains('show')).toBe(false);
    });

    it('leaves the container alone when loading finishes', () => {
      ui.container.innerHTML = '<div class="grid"></div>';
      ui.showLoading(false);
      expect(ui.container.querySelector('.grid')).not.toBe(null);
    });

    it('works when there is no status banner', () => {
      document.getElementById('status-banner').remove();
      expect(() => ui.showLoading(true)).not.toThrow();
    });
  });

  describe('renderBoard', () => {
    it('renders 36 cells with row/column metadata', () => {
      const game = fakeGame();
      ui.setGame(game);
      ui.renderBoard(game);

      const cells = ui.container.querySelectorAll('.cell');
      expect(cells).toHaveLength(36);
      expect(cells[0].id).toBe('cell-0-0');
      expect(cells[35].dataset.r).toBe('5');
      expect(cells[35].dataset.c).toBe('5');
    });

    it('clears any previous board and the solved state', () => {
      ui.container.innerHTML = '<div class="stale"></div>';
      ui.container.classList.add('solved');
      const game = fakeGame();
      ui.setGame(game);
      ui.renderBoard(game);

      expect(ui.container.querySelector('.stale')).toBe(null);
      expect(ui.container.classList.contains('solved')).toBe(false);
      expect(ui.container.querySelectorAll('.grid')).toHaveLength(1);
    });

    it('draws sun and moon icons for filled cells', () => {
      const board = emptyBoard();
      board[0][0] = SUN;
      board[1][1] = MOON;
      const game = fakeGame({ board });
      ui.setGame(game);
      ui.renderBoard(game);

      const sun = document.getElementById('cell-0-0');
      const moon = document.getElementById('cell-1-1');
      expect(sun.classList.contains('sun')).toBe(true);
      expect(sun.querySelector('svg.sun-icon')).not.toBe(null);
      expect(moon.classList.contains('moon')).toBe(true);
      expect(moon.querySelector('svg.moon-icon')).not.toBe(null);
      expect(document.getElementById('cell-2-2').innerHTML).toBe('');
    });

    it('marks fixed cells and makes them unclickable', () => {
      const board = emptyBoard();
      board[2][3] = SUN;
      const fixed = board.map((row) => row.map((v) => v !== null));
      const game = fakeGame({ board, fixed });
      ui.setGame(game);
      ui.renderBoard(game);

      const fixedCell = document.getElementById('cell-2-3');
      expect(fixedCell.classList.contains('fixed')).toBe(true);
      fixedCell.click();
      expect(game.toggleCell).not.toHaveBeenCalled();
    });

    it('forwards clicks on free cells to the game', () => {
      const game = fakeGame();
      ui.setGame(game);
      ui.renderBoard(game);

      document.getElementById('cell-4-1').click();
      expect(game.toggleCell).toHaveBeenCalledWith(4, 1);
    });

    it('uses the game registered with setGame for clicks, not the rendered one', () => {
      const rendered = fakeGame();
      const active = fakeGame();
      ui.setGame(active);
      ui.renderBoard(rendered);

      document.getElementById('cell-0-1').click();
      expect(active.toggleCell).toHaveBeenCalledWith(0, 1);
      expect(rendered.toggleCell).not.toHaveBeenCalled();
    });

    it('positions a horizontal "=" marker between its two cells', () => {
      const game = fakeGame({ markers: [{ r1: 1, c1: 2, r2: 1, c2: 3, type: '=' }] });
      ui.setGame(game);
      ui.renderBoard(game);

      const marker = ui.container.querySelector('.marker');
      expect(marker.classList.contains('equal')).toBe(true);
      expect(marker.textContent).toBe('=');
      expect(marker.style.top).toBe(`${(1.5 * 100) / 6}%`);
      expect(marker.style.left).toBe(`${(3 * 100) / 6}%`);
    });

    it('positions a vertical "x" marker and renders it as a cross', () => {
      const game = fakeGame({ markers: [{ r1: 1, c1: 2, r2: 2, c2: 2, type: 'x' }] });
      ui.setGame(game);
      ui.renderBoard(game);

      const marker = ui.container.querySelector('.marker');
      expect(marker.classList.contains('opposite')).toBe(true);
      expect(marker.textContent).toBe('×');
      expect(marker.style.top).toBe(`${(2 * 100) / 6}%`);
      expect(marker.style.left).toBe(`${(2.5 * 100) / 6}%`);
    });

    it('renders every marker it is given', () => {
      const markers = [
        { r1: 0, c1: 0, r2: 0, c2: 1, type: '=' },
        { r1: 0, c1: 0, r2: 1, c2: 0, type: 'x' },
        { r1: 3, c1: 3, r2: 3, c2: 4, type: 'x' },
      ];
      const game = fakeGame({ board: SOLUTION.map((row) => [...row]), markers });
      ui.setGame(game);
      ui.renderBoard(game);

      expect(ui.container.querySelectorAll('.marker')).toHaveLength(3);
    });
  });

  describe('updateCell', () => {
    beforeEach(() => {
      const game = fakeGame();
      ui.setGame(game);
      ui.renderBoard(game);
    });

    it('swaps a cell between sun, moon and empty', () => {
      const cell = document.getElementById('cell-0-0');

      ui.updateCell(0, 0, SUN);
      expect(cell.classList.contains('sun')).toBe(true);
      expect(cell.querySelector('svg.sun-icon')).not.toBe(null);

      ui.updateCell(0, 0, MOON);
      expect(cell.classList.contains('sun')).toBe(false);
      expect(cell.classList.contains('moon')).toBe(true);
      expect(cell.querySelector('svg.moon-icon')).not.toBe(null);

      ui.updateCell(0, 0, null);
      expect(cell.classList.contains('moon')).toBe(false);
      expect(cell.innerHTML).toBe('');
    });

    it('ignores updates for cells that are not rendered', () => {
      expect(() => ui.updateCell(9, 9, SUN)).not.toThrow();
    });
  });

  describe('updateTimer', () => {
    it.each([
      [0, '00:00'],
      [9, '00:09'],
      [65, '01:05'],
      [599, '09:59'],
      [3600, '01:00:00'],
      [3661, '01:01:01'],
      [36000, '10:00:00'],
    ])('formats %i seconds as %s', (seconds, expected) => {
      ui.updateTimer(seconds);
      expect(ui.timerEl.textContent).toBe(expected);
    });
  });

  describe('showWin', () => {
    it('marks the board solved and shows the banner', () => {
      ui.showWin();
      expect(ui.container.classList.contains('solved')).toBe(true);
      const banner = document.getElementById('status-banner');
      expect(banner.textContent).toBe('Solved! 🎉');
      expect(banner.classList.contains('show')).toBe(true);
    });

    it('works when there is no status banner', () => {
      document.getElementById('status-banner').remove();
      expect(() => ui.showWin()).not.toThrow();
      expect(ui.container.classList.contains('solved')).toBe(true);
    });
  });
});
