import { generateBoard } from './generator.js';
import { SUN, MOON, EMPTY } from './constants.js';
import { cloneGrid, mapGrid, everyCell } from './grid.js';

const CYCLE = { [EMPTY]: SUN, [SUN]: MOON, [MOON]: EMPTY };

function nextValue(val) {
  return CYCLE[val];
}

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.board = [];
    this.solution = [];
    this.markers = [];
    this.fixed = []; 
    this.timerStart = null;
    this.timerInterval = null;
    this.isFinished = false;
    this.elapsedSeconds = 0;
  }

  newGame(difficulty = 'medium') {
    this.ui.showLoading(true);
    // timeout to let UI update before heavy generation
    setTimeout(() => {
      try {
        const data = generateBoard(difficulty);
        this.board = cloneGrid(data.initialBoard);
        this.solution = data.solution;
        this.markers = data.markers;
        this.fixed = mapGrid(data.initialBoard, v => v !== EMPTY);
        this.isFinished = false;
        
        this.resetTimer();
        this.startTimer();
        
        this.ui.showLoading(false);
        this.ui.renderBoard(this);
      } catch (e) {
        console.error(e);
        this.ui.showLoading(false);
        alert("Failed to generate board. Please try again.");
      }
    }, 50);
  }

  toggleCell(r, c) {
    if (this.isFinished) return;
    if (this.fixed[r][c]) return;
    
    const val = nextValue(this.board[r][c]);
    
    this.board[r][c] = val;
    this.ui.updateCell(r, c, val);
    
    this.checkWin();
  }

  checkWin() {
    if (!everyCell((r, c) => this.board[r][c] === this.solution[r][c])) return;
    
    this.isFinished = true;
    this.stopTimer();
    this.ui.showWin();
  }

  resetTimer() {
    this.stopTimer();
    this.elapsedSeconds = 0;
    this.ui.updateTimer(0);
  }

  startTimer() {
    this.timerStart = Date.now();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds = Math.floor((Date.now() - this.timerStart) / 1000);
      this.ui.updateTimer(this.elapsedSeconds);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
