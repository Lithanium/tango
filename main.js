import { UI } from './src/ui.js';
import { Game } from './src/game.js';

document.addEventListener('DOMContentLoaded', () => {
  const ui = new UI('board-container', 'timer-display');
  const game = new Game(ui);
  ui.setGame(game);
  
  const diffSelect = document.getElementById('difficulty-select');
  const newGameBtn = document.getElementById('new-game-btn');
  const rulesBtn = document.getElementById('rules-btn');
  const rulesModal = document.getElementById('rules-modal');
  const closeRulesBtn = document.getElementById('close-rules-btn');
  
  newGameBtn.addEventListener('click', () => {
    game.newGame(diffSelect.value);
  });
  
  rulesBtn.addEventListener('click', () => {
    rulesModal.classList.add('show');
  });
  
  closeRulesBtn.addEventListener('click', () => {
    rulesModal.classList.remove('show');
  });
  
  game.newGame(diffSelect.value);
});
