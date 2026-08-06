import './styles/index.css';
import { Game } from './game/Game';

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
