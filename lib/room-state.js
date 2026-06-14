import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AVATARS } from '../public/js/avatars.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMPOSTER_WORDS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'game-data', 'imposter-words.json'), 'utf8')
);
const PICTIONARY_WORDS = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'game-data', 'pictionary-words.json'), 'utf8')
);

const AVATAR_KEYS = new Set(AVATARS.map((a) => a.key));
const DEFAULT_AVATAR = AVATARS[0].key;

export const MIN_IMPOSTER_PLAYERS = 3;
export const MIN_PICTIONARY_PLAYERS = 2;
export const PICTIONARY_ROUND_SECONDS = 60;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function createImposterState() {
  return {
    subPhase: null, // null | 'reveal' | 'voting' | 'results'
    category: null,
    word: null,
    imposterId: null,
    assignments: {}, // { [playerId]: 'WORD' | 'IMPOSTER' } -- server-only secret
    votes: {}, // { [voterId]: targetPlayerId }
  };
}

function createPictionaryState() {
  return {
    subPhase: null, // null | 'drawer-turn' | 'timer' | 'round-result' | 'recap'
    drawOrder: [],
    drawerIndex: 0,
    currentWord: null, // server-only; only the drawer's socket gets it
    usedWords: [],
    timerEndsAt: null,
    rounds: [], // [{ drawerId, drawerName, word, result }]
    timeoutHandle: null,
  };
}

function createRoom() {
  return {
    phase: 'idle', // 'idle' | 'lobby' | 'imposter' | 'pictionary'
    selectedGame: null, // null | 'imposter' | 'pictionary'
    players: {}, // [playerId]: { id, name, avatar, ready, connected, socketId }
    imposter: createImposterState(),
    pictionary: createPictionaryState(),
  };
}

let room = createRoom();

export function getRoom() {
  return room;
}

function getReadyPlayers() {
  return Object.values(room.players).filter((p) => p.ready);
}

// ----- Player lifecycle -----

export function upsertPlayer(playerId, { name, avatar, socketId } = {}) {
  const existing = room.players[playerId];
  const player = existing || {
    id: playerId,
    name: '',
    avatar: DEFAULT_AVATAR,
    ready: false,
    connected: true,
    socketId: null,
  };

  if (typeof name === 'string' && name.trim()) {
    player.name = name.trim().slice(0, 20);
  }
  if (typeof avatar === 'string' && AVATAR_KEYS.has(avatar)) {
    player.avatar = avatar;
  }
  if (socketId !== undefined) {
    player.socketId = socketId;
  }
  player.connected = true;
  room.players[playerId] = player;
  return player;
}

export function setPlayerConnected(playerId, connected, socketId) {
  const player = room.players[playerId];
  if (!player) return;
  player.connected = connected;
  if (socketId !== undefined) player.socketId = socketId;
}

export function setPlayerReady(playerId, ready) {
  const player = room.players[playerId];
  if (!player) return;
  player.ready = Boolean(ready);
}

// ----- Orchestrator actions -----

export function selectGame(gameId) {
  if (gameId !== null && gameId !== 'imposter' && gameId !== 'pictionary') {
    return { ok: false, error: 'Invalid game' };
  }
  room.selectedGame = gameId;
  room.phase = gameId ? 'lobby' : 'idle';
  for (const player of Object.values(room.players)) {
    player.ready = false;
  }
  clearPictionaryTimeout();
  room.imposter = createImposterState();
  room.pictionary = createPictionaryState();
  return { ok: true };
}

export function resetRoom() {
  clearPictionaryTimeout();
  for (const player of Object.values(room.players)) {
    player.ready = false;
  }
  room.phase = 'idle';
  room.selectedGame = null;
  room.imposter = createImposterState();
  room.pictionary = createPictionaryState();
  return { ok: true };
}

// ----- Imposter game -----

export function startImposterGame() {
  const readyPlayers = getReadyPlayers();
  if (readyPlayers.length < MIN_IMPOSTER_PLAYERS) {
    return { ok: false, error: `Need at least ${MIN_IMPOSTER_PLAYERS} ready players.` };
  }

  const categoryEntry = IMPOSTER_WORDS[randInt(0, IMPOSTER_WORDS.length - 1)];
  const word = categoryEntry.words[randInt(0, categoryEntry.words.length - 1)];
  const imposter = readyPlayers[randInt(0, readyPlayers.length - 1)];

  const assignments = {};
  for (const player of readyPlayers) {
    assignments[player.id] = player.id === imposter.id ? 'IMPOSTER' : 'WORD';
  }

  room.imposter = {
    subPhase: 'reveal',
    category: categoryEntry.category,
    word,
    imposterId: imposter.id,
    assignments,
    votes: {},
  };
  room.phase = 'imposter';
  return { ok: true };
}

export function startVoting() {
  if (room.phase !== 'imposter' || room.imposter.subPhase !== 'reveal') return { ok: false };
  room.imposter.subPhase = 'voting';
  return { ok: true };
}

export function castVote(voterId, targetPlayerId) {
  if (room.phase !== 'imposter' || room.imposter.subPhase !== 'voting') return { ok: false };
  if (!(voterId in room.imposter.assignments)) return { ok: false };
  if (!(targetPlayerId in room.imposter.assignments)) return { ok: false };
  room.imposter.votes[voterId] = targetPlayerId;
  return { ok: true };
}

export function endVoting() {
  if (room.phase !== 'imposter' || room.imposter.subPhase !== 'voting') return { ok: false };
  room.imposter.subPhase = 'results';
  return { ok: true };
}

export function playAgainImposter() {
  if (room.selectedGame !== 'imposter') return { ok: false };
  return startImposterGame();
}

// ----- Pictionary game -----

function clearPictionaryTimeout() {
  if (room.pictionary.timeoutHandle) {
    clearTimeout(room.pictionary.timeoutHandle);
    room.pictionary.timeoutHandle = null;
  }
}

export function startPictionaryGame() {
  const readyPlayers = getReadyPlayers();
  if (readyPlayers.length < MIN_PICTIONARY_PLAYERS) {
    return { ok: false, error: `Need at least ${MIN_PICTIONARY_PLAYERS} ready players.` };
  }

  clearPictionaryTimeout();
  room.pictionary = createPictionaryState();
  room.pictionary.drawOrder = shuffle(readyPlayers.map((p) => p.id));
  room.pictionary.subPhase = 'drawer-turn';
  room.phase = 'pictionary';
  return { ok: true };
}

// onTimeout(): called if the 60s timer expires before markRoundResult is called.
export function requestWord(playerId, onTimeout) {
  if (room.phase !== 'pictionary' || room.pictionary.subPhase !== 'drawer-turn') {
    return { ok: false };
  }
  const currentDrawerId = room.pictionary.drawOrder[room.pictionary.drawerIndex];
  if (playerId !== currentDrawerId) return { ok: false };

  let pool = PICTIONARY_WORDS.filter((w) => !room.pictionary.usedWords.includes(w));
  if (pool.length === 0) {
    room.pictionary.usedWords = [];
    pool = PICTIONARY_WORDS;
  }
  const word = pool[randInt(0, pool.length - 1)];
  room.pictionary.usedWords.push(word);
  room.pictionary.currentWord = word;
  room.pictionary.timerEndsAt = Date.now() + PICTIONARY_ROUND_SECONDS * 1000;
  room.pictionary.subPhase = 'timer';

  clearPictionaryTimeout();
  room.pictionary.timeoutHandle = setTimeout(() => {
    room.pictionary.timeoutHandle = null;
    markRoundResult('timeout');
    if (onTimeout) onTimeout();
  }, PICTIONARY_ROUND_SECONDS * 1000);

  return { ok: true, word };
}

export function markRoundResult(result) {
  if (room.phase !== 'pictionary' || room.pictionary.subPhase !== 'timer') return { ok: false };
  clearPictionaryTimeout();

  const drawerId = room.pictionary.drawOrder[room.pictionary.drawerIndex];
  const drawer = room.players[drawerId];
  room.pictionary.rounds.push({
    drawerId,
    drawerName: drawer ? drawer.name : 'Player',
    word: room.pictionary.currentWord,
    result,
  });
  room.pictionary.currentWord = null;
  room.pictionary.timerEndsAt = null;
  room.pictionary.subPhase = 'round-result';
  return { ok: true };
}

export function nextDrawer() {
  if (room.phase !== 'pictionary' || room.pictionary.subPhase !== 'round-result') return { ok: false };
  room.pictionary.drawerIndex = (room.pictionary.drawerIndex + 1) % room.pictionary.drawOrder.length;
  room.pictionary.subPhase = 'drawer-turn';
  return { ok: true };
}

export function endPictionaryGame() {
  if (room.phase !== 'pictionary') return { ok: false };
  clearPictionaryTimeout();
  room.pictionary.subPhase = 'recap';
  return { ok: true };
}

// ----- State views -----

export function getPublicRoomState() {
  const state = {
    phase: room.phase,
    selectedGame: room.selectedGame,
    players: Object.values(room.players).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      ready: p.ready,
      connected: p.connected,
    })),
  };

  if (room.selectedGame === 'imposter') {
    const im = room.imposter;
    state.imposter = {
      subPhase: im.subPhase,
      minPlayers: MIN_IMPOSTER_PLAYERS,
      participantIds: Object.keys(im.assignments),
      voteCount: Object.keys(im.votes).length,
    };
    if (im.subPhase === 'results') {
      const tally = {};
      for (const targetId of Object.values(im.votes)) {
        tally[targetId] = (tally[targetId] || 0) + 1;
      }
      state.imposter.results = {
        imposterId: im.imposterId,
        category: im.category,
        word: im.word,
        tally,
      };
    }
  }

  if (room.selectedGame === 'pictionary') {
    const pic = room.pictionary;
    const drawerId = pic.drawOrder[pic.drawerIndex] ?? null;
    const drawer = drawerId ? room.players[drawerId] : null;
    state.pictionary = {
      subPhase: pic.subPhase,
      minPlayers: MIN_PICTIONARY_PLAYERS,
      drawOrder: pic.drawOrder,
      currentDrawerId: drawerId,
      currentDrawerName: drawer ? drawer.name : null,
      timerEndsAt: pic.timerEndsAt,
      roundSeconds: PICTIONARY_ROUND_SECONDS,
      rounds: pic.rounds,
      usedWordCount: pic.usedWords.length,
      totalWordCount: PICTIONARY_WORDS.length,
    };
  }

  return state;
}

// Secrets for a single player: their Imposter assignment, or the Pictionary
// word if they're the current drawer mid-timer. Re-sendable on reconnect.
export function getPrivateViewFor(playerId) {
  const payload = {};

  if (room.selectedGame === 'imposter' && room.imposter.subPhase) {
    const assignment = room.imposter.assignments[playerId];
    if (assignment) {
      payload.imposter =
        assignment === 'IMPOSTER'
          ? { assignment: 'IMPOSTER', category: null, word: null }
          : { assignment: 'WORD', category: room.imposter.category, word: room.imposter.word };
    }
  }

  if (room.selectedGame === 'pictionary' && room.pictionary.subPhase === 'timer') {
    const drawerId = room.pictionary.drawOrder[room.pictionary.drawerIndex];
    if (playerId === drawerId && room.pictionary.currentWord) {
      payload.pictionary = { word: room.pictionary.currentWord };
    }
  }

  return payload;
}
