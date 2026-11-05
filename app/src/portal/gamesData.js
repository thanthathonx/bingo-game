// Placeholder catalogue. Only Bingo Friends is playable in this build.

export const FEATURED = {
  name: 'Bingo Friends',
  tagline: 'Number bingo or your own event cards. First full line wins!',
  players: '1+ players',
  type: 'Party',
  href: '/bingo/',
  prop: 'card',
  tint: '#2fd3e6',
};

export const GAMES = [
  { name: 'Doodle Dash', tagline: 'Draw fast, guess faster. Chaos guaranteed.', type: 'Creative', players: '2+ players', time: '5-30 min', accent: '#e056fd', prop: 'brush' },
  { name: 'Quiz Pop', tagline: 'Buzz in first or lose the point.', type: 'Trivia', players: '2+ players', time: '15-30 min', accent: '#a29bfe', prop: 'book' },
  { name: 'Word Sprint', tagline: 'One letter, five categories, no time.', type: 'Party', players: '2+ players', time: '10-20 min', accent: '#00d9ff', prop: 'pencil' },
  { name: 'Mask Party', tagline: 'Act it out before the timer pops.', type: 'Deduction', players: '3+ players', time: '20-40 min', accent: '#ff9800', prop: 'mic' },
  { name: 'Mind Sync', tagline: 'Two players, one word. Think alike.', type: 'Guessing', players: '2 players', time: '1-5 min', accent: '#55efc4', prop: 'none' },
  { name: 'Number Hunch', tagline: 'Guess the number closest to the truth.', type: 'Guessing', players: '2+ players', time: '15-25 min', accent: '#55efc4', prop: 'star' },
  { name: 'Last One Standing', tagline: 'Quiz rounds where the crowd decides.', type: 'Trivia', players: '2+ players', time: '20-40 min', accent: '#a29bfe', prop: 'book' },
  { name: 'Hot Potato', tagline: 'Pass it on before it pops.', type: 'Party', players: '1+ players', time: '3-10 min', accent: '#fd79a8', prop: 'star' },
  { name: 'Bingo Friends', tagline: 'Turn any event, stream or class into a live bingo game.', type: 'Party', players: '1+ players', time: '10+ min', accent: '#00d9ff', prop: 'card', href: '/bingo/' },
  { name: 'Suspect Sketch', tagline: 'Clue cards, one culprit, many theories.', type: 'Deduction', players: '1+ players', time: '10-25 min', accent: '#ff9800', prop: 'pencil' },
  { name: 'Sound Sketch', tagline: 'Hum it, beatbox it, guess it.', type: 'Party', players: '4+ players', time: '10-30 min', accent: '#fd79a8', prop: 'mic' },
  { name: 'Fib Finder', tagline: 'Write a fake answer. Spot the real one.', type: 'Party', players: '3+ players', time: '15-25 min', accent: '#fd79a8', prop: 'pencil' },
  { name: 'Emoji Decode', tagline: 'Describe a word in emoji. Race to crack it.', type: 'Party', players: '2+ players', time: '5-30 min', accent: '#fd79a8', prop: 'star' },
  { name: 'Rank It', tagline: 'Sort the list from best to worst — together.', type: 'Party', players: '1+ players', time: '10-25 min', accent: '#fd79a8', prop: 'controller' },
  { name: 'Spotlight', tagline: 'Everyone can see your word except you.', type: 'Party', players: '2+ players', time: '5-20 min', accent: '#fd79a8', prop: 'none' },
  { name: 'Maze Makers', tagline: 'Build a maze, send a monster, escape.', type: 'Strategy', players: '1+ players', time: '15-40 min', accent: '#55efc4', prop: 'controller' },
  { name: 'Table Kick', tagline: 'Tiny football for one to eight players.', type: 'Party', players: '1+ players', time: '3-8 min', accent: '#fd79a8', prop: 'controller' },
  { name: 'Joke Bombs', tagline: 'Light the fuse, steal the last laugh.', type: 'Party', players: '1+ players', time: '3-10 min', accent: '#fd79a8', prop: 'star' },
  { name: 'Light Trails', tagline: 'Leave a wall of light. Be the last one moving.', type: 'Arcade', players: '1+ players', time: '5-15 min', accent: '#6c5ce7', prop: 'controller' },
];

export const TYPES = ['All types', 'Quiz & Trivia', 'Word Games', 'Deduction', 'Creative', 'Arcade'];
export const PLAYER_FILTERS = ['Any', 'Solo', '2', '3', '4+'];

const TYPE_MATCH = {
  'Quiz & Trivia': ['Trivia', 'Guessing'],
  'Word Games': ['Party', 'Guessing'],
  Deduction: ['Deduction'],
  Creative: ['Creative'],
  Arcade: ['Arcade', 'Strategy'],
};

export function matchesType(game, type) {
  if (type === 'All types') return true;
  return (TYPE_MATCH[type] ?? []).includes(game.type);
}

export function matchesPlayers(game, filter) {
  if (filter === 'Any') return true;
  const min = parseInt(game.players, 10);
  const exact = /^\d+ players$/.test(game.players) && !game.players.includes('+');
  if (filter === 'Solo') return min <= 1;
  const n = filter === '4+' ? 4 : Number(filter);
  return exact ? min === n : min <= n;
}

export const FAQ = [
  { q: 'What is the best game for a big group?', a: 'Bingo Friends and Hot Potato scale to as many players as you like. Event-card bingo is great for parties and streams.' },
  { q: 'Do I need to install anything?', a: 'No. Everything runs in your browser on a phone, tablet or computer.' },
  { q: 'Is it really free?', a: 'Yes. This demo has no payments, ads or accounts.' },
  { q: 'Can we switch games without leaving?', a: 'Yes — come back to this list any time and pick another game.' },
  { q: 'Which game is best for people who just met?', a: 'Bingo Friends with a custom "get to know you" item list works well as an icebreaker.' },
  { q: 'Can I play on my phone during a call?', a: 'Yes. Open the game in your mobile browser and keep the call running in another app.' },
];
