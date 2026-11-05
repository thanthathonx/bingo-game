import { createContext, useContext } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English', speech: 'en-GB' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE' },
  { code: 'es', label: 'Español', speech: 'es-ES' },
  { code: 'pt-BR', label: 'Português (Brasil)', speech: 'pt-BR' },
  { code: 'pt-PT', label: 'Português (Portugal)', speech: 'pt-PT' },
  { code: 'zh-TW', label: '中文 ( 繁體 )', speech: 'zh-TW' },
];

const en = {
  tagline: 'Number bingo or your own event cards — complete a line to win.',
  players: '1-∞ players',
  partyGame: 'Party Game',
  startNew: 'Start a new game and invite friends',
  yourName: 'Your Name',
  streamer: 'Streamer Mode (hide room code)',
  bigScreen: 'Big Screen Mode (TV — players join on their phones)',
  createRoom: 'Create Room',
  gameAudio: 'Game audio',
  music: 'Music',
  soundEffects: 'Sound effects',
  muteAudio: 'Mute game audio',
  unmuteAudio: 'Unmute game audio',
  language: 'Language',
  menu: 'Menu',
  signIn: 'Sign in',
  createAccount: 'Create account',
  loginSignup: 'Log in / Sign up',
  helpSupport: 'Help & support',
  settings: 'Settings',
  howToPlay: 'How to play',
  report: 'Report a problem',
  account: 'Account',
  premium: 'Premium',
  redeem: 'Redeem code',
  close: 'Close',
  roomCode: 'Room code',
  lobby: 'Lobby',
  playersTitle: 'Players',
  addBuddy: 'Add buddy',
  host: 'Host',
  you: 'you',
  hostSettings: 'Host settings',
  mode: 'Mode',
  modeClassic: 'Number bingo',
  modeCustom: 'Event cards',
  cardSize: 'Card size',
  full: 'Full',
  quick: 'Quick',
  autoCall: 'Auto-call',
  callSpeed: 'Call speed',
  interactiveDaub: 'Tap to daub',
  buddySkill: 'Buddy speed',
  winPattern: 'Win pattern',
  anyLine: 'Any line (row, column or diagonal)',
  startGame: 'Start game',
  leave: 'Leave room',
  callNext: 'Call next',
  bingo: 'BINGO!',
  oneAway: '1 away!',
  called: 'Called',
  playAgain: 'Play again',
  backToLobby: 'Back to lobby',
  wins: 'wins',
  youWin: 'You got BINGO!',
  notCalled: 'Not called yet',
  falseBingo: 'Not a bingo yet — keep daubing!',
  buildCard: 'Build your card',
  ready: 'Ready!',
  shuffle: 'Shuffle',
  clear: 'Clear',
  items: 'Items',
  on: 'On',
  off: 'Off',
};

const de = {
  tagline: 'Zahlen-Bingo oder eigene Event-Karten — vervollständige eine Reihe zum Sieg.',
  players: '1-∞ Spieler', partyGame: 'Partyspiel', startNew: 'Starte ein neues Spiel und lade Freunde ein',
  yourName: 'Dein Name', streamer: 'Streamer-Modus (Raumcode verbergen)',
  bigScreen: 'Großbild-Modus (TV — Spieler treten am Handy bei)', createRoom: 'Raum erstellen',
  gameAudio: 'Spiel-Audio', music: 'Musik', soundEffects: 'Soundeffekte', muteAudio: 'Spiel-Audio stummschalten',
  unmuteAudio: 'Ton einschalten', language: 'Sprache', menu: 'Menü', signIn: 'Anmelden', createAccount: 'Konto erstellen',
  loginSignup: 'Anmelden / Registrieren', helpSupport: 'Hilfe & Support', settings: 'Einstellungen',
  howToPlay: 'So wird gespielt', report: 'Problem melden', account: 'Konto', premium: 'Premium', redeem: 'Code einlösen',
  close: 'Schließen', roomCode: 'Raumcode', lobby: 'Lobby', playersTitle: 'Spieler', addBuddy: 'Buddy hinzufügen',
  host: 'Host', you: 'du', hostSettings: 'Host-Einstellungen', mode: 'Modus', modeClassic: 'Zahlen-Bingo',
  modeCustom: 'Event-Karten', cardSize: 'Kartengröße', full: 'Voll', quick: 'Schnell', autoCall: 'Automatisch ziehen',
  callSpeed: 'Tempo', interactiveDaub: 'Selbst markieren', buddySkill: 'Buddy-Tempo', winPattern: 'Gewinnmuster',
  anyLine: 'Beliebige Reihe (Zeile, Spalte oder Diagonale)', startGame: 'Spiel starten', leave: 'Raum verlassen',
  callNext: 'Nächste ziehen', oneAway: 'Noch 1!', called: 'Gezogen', playAgain: 'Nochmal spielen',
  backToLobby: 'Zurück zur Lobby', wins: 'Siege', youWin: 'Du hast BINGO!', notCalled: 'Noch nicht gezogen',
  falseBingo: 'Noch kein Bingo — weiter markieren!', buildCard: 'Baue deine Karte', ready: 'Fertig!',
  shuffle: 'Mischen', clear: 'Leeren', items: 'Begriffe', on: 'An', off: 'Aus',
};

const es = {
  tagline: 'Bingo de números o tus propias cartas de eventos — completa una línea para ganar.',
  players: '1-∞ jugadores', partyGame: 'Juego de fiesta', startNew: 'Empieza una partida e invita a tus amigos',
  yourName: 'Tu nombre', streamer: 'Modo streamer (ocultar código)', bigScreen: 'Pantalla grande (TV — los jugadores se unen con el móvil)',
  createRoom: 'Crear sala', gameAudio: 'Audio del juego', music: 'Música', soundEffects: 'Efectos de sonido',
  muteAudio: 'Silenciar el juego', unmuteAudio: 'Activar sonido', language: 'Idioma', menu: 'Menú', signIn: 'Entrar',
  createAccount: 'Crear cuenta', loginSignup: 'Entrar / Registrarse', helpSupport: 'Ayuda y soporte', settings: 'Ajustes',
  howToPlay: 'Cómo jugar', report: 'Informar de un problema', account: 'Cuenta', premium: 'Premium', redeem: 'Canjear código',
  close: 'Cerrar', roomCode: 'Código de sala', lobby: 'Sala', playersTitle: 'Jugadores', addBuddy: 'Añadir amigo',
  host: 'Anfitrión', you: 'tú', hostSettings: 'Ajustes del anfitrión', mode: 'Modo', modeClassic: 'Bingo de números',
  modeCustom: 'Cartas de eventos', cardSize: 'Tamaño', full: 'Completo', quick: 'Rápido', autoCall: 'Cantar automático',
  callSpeed: 'Velocidad', interactiveDaub: 'Marcar tocando', buddySkill: 'Velocidad de amigos', winPattern: 'Patrón ganador',
  anyLine: 'Cualquier línea (fila, columna o diagonal)', startGame: 'Empezar', leave: 'Salir de la sala',
  callNext: 'Cantar siguiente', oneAway: '¡Falta 1!', called: 'Cantados', playAgain: 'Jugar otra vez',
  backToLobby: 'Volver a la sala', wins: 'victorias', youWin: '¡Tienes BINGO!', notCalled: 'Aún no ha salido',
  falseBingo: 'Aún no es bingo — ¡sigue marcando!', buildCard: 'Crea tu cartón', ready: '¡Listo!', shuffle: 'Mezclar',
  clear: 'Borrar', items: 'Elementos', on: 'Sí', off: 'No',
};

const ptBR = {
  tagline: 'Bingo de números ou suas próprias cartelas de eventos — complete uma linha para vencer.',
  players: '1-∞ jogadores', partyGame: 'Jogo de festa', startNew: 'Comece um novo jogo e convide amigos',
  yourName: 'Seu nome', streamer: 'Modo streamer (ocultar código)', bigScreen: 'Modo tela grande (TV — jogadores entram pelo celular)',
  createRoom: 'Criar sala', gameAudio: 'Áudio do jogo', music: 'Música', soundEffects: 'Efeitos sonoros',
  muteAudio: 'Silenciar o jogo', unmuteAudio: 'Ativar som', language: 'Idioma', menu: 'Menu', signIn: 'Entrar',
  createAccount: 'Criar conta', loginSignup: 'Entrar / Cadastrar', helpSupport: 'Ajuda e suporte', settings: 'Configurações',
  howToPlay: 'Como jogar', report: 'Relatar um problema', account: 'Conta', premium: 'Premium', redeem: 'Resgatar código',
  close: 'Fechar', roomCode: 'Código da sala', lobby: 'Sala', playersTitle: 'Jogadores', addBuddy: 'Adicionar amigo',
  host: 'Anfitrião', you: 'você', hostSettings: 'Configurações do anfitrião', mode: 'Modo', modeClassic: 'Bingo de números',
  modeCustom: 'Cartelas de eventos', cardSize: 'Tamanho', full: 'Completa', quick: 'Rápida', autoCall: 'Sorteio automático',
  callSpeed: 'Velocidade', interactiveDaub: 'Marcar tocando', buddySkill: 'Velocidade dos amigos', winPattern: 'Padrão de vitória',
  anyLine: 'Qualquer linha (linha, coluna ou diagonal)', startGame: 'Começar', leave: 'Sair da sala',
  callNext: 'Sortear próximo', oneAway: 'Falta 1!', called: 'Sorteados', playAgain: 'Jogar de novo',
  backToLobby: 'Voltar à sala', wins: 'vitórias', youWin: 'Você fez BINGO!', notCalled: 'Ainda não saiu',
  falseBingo: 'Ainda não é bingo — continue marcando!', buildCard: 'Monte sua cartela', ready: 'Pronto!',
  shuffle: 'Embaralhar', clear: 'Limpar', items: 'Itens', on: 'Sim', off: 'Não',
};

const ptPT = {
  ...ptBR,
  players: '1-∞ jogadores', yourName: 'O teu nome', bigScreen: 'Modo ecrã grande (TV — jogadores entram pelo telemóvel)',
  startNew: 'Começa um novo jogo e convida amigos', settings: 'Definições', report: 'Reportar um problema',
  you: 'tu', youWin: 'Fizeste BINGO!', buildCard: 'Monta o teu cartão', modeCustom: 'Cartões de eventos',
  falseBingo: 'Ainda não é bingo — continua a marcar!',
};

const zh = {
  tagline: '數字賓果或自訂事件卡 — 連成一線即可獲勝。',
  players: '1-∞ 名玩家', partyGame: '派對遊戲', startNew: '開始新遊戲並邀請朋友', yourName: '你的名字',
  streamer: '直播模式（隱藏房間代碼）', bigScreen: '大螢幕模式（電視 — 玩家用手機加入）', createRoom: '建立房間',
  gameAudio: '遊戲音效', music: '音樂', soundEffects: '音效', muteAudio: '將遊戲靜音', unmuteAudio: '取消靜音',
  language: '語言', menu: '選單', signIn: '登入', createAccount: '建立帳號', loginSignup: '登入 / 註冊',
  helpSupport: '幫助與支援', settings: '設定', howToPlay: '遊戲玩法', report: '回報問題', account: '帳號',
  premium: '進階版', redeem: '兌換代碼', close: '關閉', roomCode: '房間代碼', lobby: '大廳', playersTitle: '玩家',
  addBuddy: '加入夥伴', host: '主持人', you: '你', hostSettings: '主持人設定', mode: '模式', modeClassic: '數字賓果',
  modeCustom: '事件卡', cardSize: '卡片大小', full: '完整', quick: '快速', autoCall: '自動叫號', callSpeed: '叫號速度',
  interactiveDaub: '點擊標記', buddySkill: '夥伴速度', winPattern: '獲勝方式', anyLine: '任一直線（橫、直或斜）',
  startGame: '開始遊戲', leave: '離開房間', callNext: '叫下一個', oneAway: '差 1 格！', called: '已叫號',
  playAgain: '再玩一次', backToLobby: '回到大廳', wins: '勝', youWin: '你賓果了！', notCalled: '還沒叫到',
  falseBingo: '還沒有連線 — 繼續標記！', buildCard: '製作你的卡片', ready: '準備好了！', shuffle: '隨機', clear: '清除',
  items: '項目', on: '開', off: '關',
};

const TABLES = { en, de, es, 'pt-BR': ptBR, 'pt-PT': ptPT, 'zh-TW': zh };

export function translator(code) {
  const table = TABLES[code] ?? en;
  return (key) => table[key] ?? en[key] ?? key;
}

export function speechLang(code) {
  return LANGUAGES.find((l) => l.code === code)?.speech ?? 'en-GB';
}

export const LangContext = createContext({ lang: 'en', t: translator('en'), setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}
