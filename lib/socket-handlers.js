import {
  getRoom,
  getPublicRoomState,
  getPrivateViewFor,
  upsertPlayer,
  setPlayerConnected,
  setPlayerReady,
  selectGame,
  resetRoom,
  startImposterGame,
  startPictionaryGame,
  castVote,
  startVoting,
  endVoting,
  playAgainImposter,
  endImposterGame,
  setImposterBroadcastCallback,
  requestWord,
  markRoundResult,
  nextDrawer,
  endPictionaryGame,
} from './room-state.js';

const ORCHESTRATOR_PIN = process.env.ORCHESTRATOR_PIN || '1234';

export function registerSocketHandlers(io) {
  function broadcastState() {
    io.emit('room:state', getPublicRoomState());
  }

  setImposterBroadcastCallback(broadcastState);

  function sendPrivateState(playerId) {
    const player = getRoom().players[playerId];
    if (!player || !player.socketId) return;
    io.to(player.socketId).emit('room:private', getPrivateViewFor(playerId));
  }

  function sendImposterSecrets() {
    for (const playerId of Object.keys(getRoom().imposter.assignments)) {
      sendPrivateState(playerId);
    }
  }

  io.on('connection', (socket) => {
    socket.emit('room:state', getPublicRoomState());

    socket.on('player:hello', ({ playerId, name, avatar } = {}) => {
      if (typeof playerId !== 'string' || !playerId) return;
      socket.data.playerId = playerId;

      if (typeof name === 'string' && name.trim()) {
        upsertPlayer(playerId, { name, avatar, socketId: socket.id });
        broadcastState();
      } else if (getRoom().players[playerId]) {
        setPlayerConnected(playerId, true, socket.id);
        broadcastState();
      }

      socket.emit('room:private', getPrivateViewFor(playerId));
    });

    socket.on('profile:set', ({ playerId, name, avatar } = {}) => {
      if (typeof playerId !== 'string' || !playerId) return;
      if (typeof name !== 'string' || !name.trim()) return;
      socket.data.playerId = playerId;
      upsertPlayer(playerId, { name, avatar, socketId: socket.id });
      broadcastState();
    });

    socket.on('ready:toggle', ({ playerId, ready } = {}) => {
      if (typeof playerId !== 'string' || !playerId) return;
      setPlayerReady(playerId, ready);
      broadcastState();
    });

    socket.on('orchestrator:auth', ({ pin } = {}) => {
      const ok = typeof pin === 'string' && pin === ORCHESTRATOR_PIN;
      socket.data.isOrchestrator = ok;
      socket.emit('orchestrator:auth-result', { ok });
    });

    socket.on('orchestrator:select-game', ({ gameId } = {}) => {
      if (!socket.data.isOrchestrator) return;
      selectGame(gameId);
      broadcastState();
    });

    socket.on('orchestrator:reset', () => {
      if (!socket.data.isOrchestrator) return;
      resetRoom();
      broadcastState();
    });

    socket.on('orchestrator:start-game', () => {
      if (!socket.data.isOrchestrator) return;
      const selectedGame = getRoom().selectedGame;

      if (selectedGame === 'imposter') {
        if (!startImposterGame().ok) return;
        broadcastState();
        sendImposterSecrets();
      } else if (selectedGame === 'pictionary') {
        if (!startPictionaryGame().ok) return;
        broadcastState();
      }
    });

    socket.on('imposter:vote', ({ voterId, targetPlayerId } = {}) => {
      if (typeof voterId !== 'string' || typeof targetPlayerId !== 'string') return;
      if (castVote(voterId, targetPlayerId).ok) broadcastState();
    });

    socket.on('orchestrator:start-voting', () => {
      if (!socket.data.isOrchestrator) return;
      if (startVoting().ok) broadcastState();
    });

    socket.on('orchestrator:end-voting', () => {
      if (!socket.data.isOrchestrator) return;
      if (endVoting().ok) broadcastState();
    });

    socket.on('orchestrator:imposter-play-again', () => {
      if (!socket.data.isOrchestrator) return;
      if (!playAgainImposter().ok) return;
      broadcastState();
      sendImposterSecrets();
    });

    socket.on('orchestrator:end-imposter-game', () => {
      if (!socket.data.isOrchestrator) return;
      if (endImposterGame().ok) broadcastState();
    });

    socket.on('pictionary:request-word', ({ playerId } = {}) => {
      if (typeof playerId !== 'string' || !playerId) return;
      const result = requestWord(playerId, () => broadcastState());
      if (!result.ok) return;
      broadcastState();
      sendPrivateState(playerId);
    });

    socket.on('orchestrator:pictionary-mark-result', ({ result } = {}) => {
      if (!socket.data.isOrchestrator) return;
      if (result !== 'guessed' && result !== 'timeout') return;
      if (markRoundResult(result).ok) broadcastState();
    });

    socket.on('orchestrator:pictionary-next-round', () => {
      if (!socket.data.isOrchestrator) return;
      if (nextDrawer().ok) broadcastState();
    });

    socket.on('orchestrator:end-pictionary-game', () => {
      if (!socket.data.isOrchestrator) return;
      if (endPictionaryGame().ok) broadcastState();
    });

    socket.on('disconnect', () => {
      const playerId = socket.data.playerId;
      if (playerId && getRoom().players[playerId]) {
        setPlayerConnected(playerId, false);
        broadcastState();
      }
    });
  });
}
