import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/bingo.css';
import './styles/game.css';
import './styles/theme-bingo.css';
import BingoApp from './bingo/BingoApp.jsx';

document.body.classList.add('bingo-body');
createRoot(document.getElementById('root')).render(<BingoApp />);
