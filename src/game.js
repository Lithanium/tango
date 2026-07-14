import { generateBoard } from './generator.js';
import { SUN, MOON } from './solver.js';

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
    try {
      this.ui.showLoading(true);
      // timeout to let UI update before heavy generation
      setTimeout(() => {
        const data = generateBoard(difficulty);
        this.board = data.initialBoard.map(row => [...row]);
        this.solution = data.solution;
        this.markers = data.markers;
        this.fixed = data.initialBoard.map(row => row.map(v => v !== null));
        this.isFinished = false;
        
        this.resetTimer();
        this.startTimer();
        
        this.ui.showLoading(false);
        this.ui.renderBoard(this);
      }, 50);
    } catch (e) {
      console.error(e);
      alert("Failed to generate board. Please try again.");
      this.ui.showLoading(false);
    }
  }

  toggleCell(r, c) {
    if (this.isFinished) return;
    if (this.fixed[r][c]) return;
    
    let val = this.board[r][c];
    if (val === null) val = SUN;
    else if (val === SUN) val = MOON;
    else if (val === MOON) val = null;
    
    this.board[r][c] = val;
    this.ui.updateCell(r, c, val);
    
    this.checkWin();
  }

  checkWin() {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        if (this.board[r][c] !== this.solution[r][c]) return;
      }
    }
    
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
