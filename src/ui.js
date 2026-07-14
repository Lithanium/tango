import { SUN, MOON } from './solver.js';

const SUN_SVG = `<svg viewBox="0 0 100 100" class="icon sun-icon"><circle cx="50" cy="50" r="32" fill="#fca11a" stroke="#d57018" stroke-width="6" /></svg>`;
const MOON_SVG = `<svg viewBox="0 0 28 28" class="icon moon-icon" xmlns="http://www.w3.org/2000/svg" fill="none" role="img" aria-label="Moon"><path d="M8.10583 19.9024C15.2282 18.6466 19.2619 11.9868 17.0757 5.09295C16.8785 4.47115 16.6376 3.86915 16.3574 3.28957C16.3507 3.27584 16.3467 3.26256 16.3446 3.24986C20.5748 4.17473 24.0337 7.5648 24.8316 12.0899C25.8865 18.0727 21.8917 23.778 15.9088 24.8329C11.4675 25.616 7.17692 23.6165 4.82974 20.0826C4.84051 20.0805 4.85231 20.0796 4.86526 20.0804C5.93904 20.1476 7.02621 20.0928 8.10583 19.9024Z" fill="#4a7feb" stroke="#1f5bb7" stroke-width="2" stroke-linejoin="round"/></svg>`;

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
