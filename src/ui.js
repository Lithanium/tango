import { SUN, MOON } from './solver.js';

const SUN_SVG = `<svg viewBox="0 0 100 100" class="icon sun-icon"><circle cx="50" cy="50" r="32" fill="#fca11a" stroke="#d57018" stroke-width="6" /></svg>`;
const MOON_SVG = `<svg viewBox="0 0 100 100" class="icon moon-icon"><path d="M 55 20 A 35 35 0 1 0 85 75 A 30 30 0 1 1 55 20 Z" fill="#2d73f5" /></svg>`;

export class UI {
  constructor(containerId, timerId) {
    this.container = document.getElementById(containerId);
    this.timerEl = document.getElementById(timerId);
    this.game = null;
  }

  setGame(game) {
    this.game = game;
  }

  showLoading(isLoading) {
    if (isLoading) {
      this.container.innerHTML = '<div class="loading">Generating...</div>';
      const banner = document.getElementById('status-banner');
      if (banner) {
        banner.classList.remove('show');
      }
    }
  }

  renderBoard(game) {
    this.container.innerHTML = '';
    this.container.classList.remove('solved');
    
    const grid = document.createElement('div');
    grid.className = 'grid';
    
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.id = `cell-${r}-${c}`;
        
        if (game.fixed[r][c]) {
          cell.classList.add('fixed');
        } else {
          cell.addEventListener('click', () => this.game.toggleCell(r, c));
        }
        
        const val = game.board[r][c];
        if (val === SUN) {
          cell.classList.add('sun');
          cell.innerHTML = SUN_SVG;
        } else if (val === MOON) {
          cell.classList.add('moon');
          cell.innerHTML = MOON_SVG;
        }
        
        grid.appendChild(cell);
      }
    }
    
    game.markers.forEach(m => {
      const marker = document.createElement('div');
      marker.className = `marker ${m.type === '=' ? 'equal' : 'opposite'}`;
      marker.textContent = m.type === '=' ? '=' : '×';
      
      if (m.r1 === m.r2) {
        marker.style.top = `${(m.r1 + 0.5) * 100 / 6}%`;
        marker.style.left = `${(m.c1 + 1) * 100 / 6}%`;
      } else {
        marker.style.top = `${(m.r1 + 1) * 100 / 6}%`;
        marker.style.left = `${(m.c1 + 0.5) * 100 / 6}%`;
      }
      
      grid.appendChild(marker);
    });
    
    this.container.appendChild(grid);
  }

  updateCell(r, c, val) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (!cell) return;
    
    cell.classList.remove('sun', 'moon');
    if (val === SUN) {
      cell.classList.add('sun');
      cell.innerHTML = SUN_SVG;
    } else if (val === MOON) {
      cell.classList.add('moon');
      cell.innerHTML = MOON_SVG;
    } else {
      cell.innerHTML = '';
    }
  }

  updateTimer(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    let text = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    if (h > 0) {
      text = `${h.toString().padStart(2, '0')}:${text}`;
    }
    this.timerEl.textContent = text;
  }

  showWin() {
    this.container.classList.add('solved');
    const banner = document.getElementById('status-banner');
    if (banner) {
      banner.textContent = 'Solved! 🎉';
      banner.classList.add('show');
    }
  }
}
