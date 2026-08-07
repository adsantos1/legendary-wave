import './styles/index.css';
import { Game } from './game/Game';

function initGame() {
  const game = new Game();
  game.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
